import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sseNotificationHandler } from "../sse";
import { sdk } from "./sdk";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // ─── SSE NOTIFICATION STREAM ─────────────────
  app.get(
    "/api/sse/notifications",
    sseNotificationHandler(async (req) => {
      const user = await sdk.authenticateRequest(req);
      return user ? { id: user.id } : null;
    })
  );

  // ─── MESSAGE ATTACHMENT UPLOAD ──────────────
  app.post("/api/upload/attachment", async (req, res) => {
    try {
      const ctx = await createContext({ req, res } as any);
      if (!ctx.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { fileName, mimeType, fileData } = req.body;
      if (!fileName || !mimeType || !fileData) {
        res.status(400).json({ error: "Missing required fields: fileName, mimeType, fileData" });
        return;
      }

      // Validate file size (10MB limit for message attachments)
      const buffer = Buffer.from(fileData, "base64");
      const MAX_SIZE = 10 * 1024 * 1024;
      if (buffer.length > MAX_SIZE) {
        res.status(400).json({ error: "File too large. Maximum size is 10MB." });
        return;
      }

      // Validate mime type
      const allowedTypes = [
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(mimeType)) {
        res.status(400).json({ error: "File type not allowed. Supported: images (JPEG, PNG, GIF, WebP), PDF, DOC/DOCX" });
        return;
      }

      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileKey = `message-attachments/${ctx.user.id}/${Date.now()}-${randomSuffix}-${sanitizedName}`;

      const { storagePut } = await import("../storage");
      const { url } = await storagePut(fileKey, buffer, mimeType);

      const isImage = mimeType.startsWith("image/");
      res.json({ url, fileName, mimeType, isImage, fileSize: buffer.length });
    } catch (error: any) {
      console.error("[Attachment Upload] Failed:", error);
      res.status(500).json({ error: error.message || "Upload failed" });
    }
  });

  // ─── FILE UPLOAD ENDPOINT (Documents) ──────────
  app.post("/api/upload", async (req, res) => {
    try {
      // Verify auth via session cookie
      const ctx = await createContext({ req, res } as any);
      if (!ctx.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { fileName, mimeType, fileSize, patientId, category, description, fileData } = req.body;
      if (!fileName || !mimeType || !fileData || !patientId) {
        res.status(400).json({ error: "Missing required fields: fileName, mimeType, fileData, patientId" });
        return;
      }

      // Validate file size (16MB limit)
      const MAX_FILE_SIZE = 16 * 1024 * 1024;
      if (fileSize && fileSize > MAX_FILE_SIZE) {
        res.status(400).json({ error: "File too large. Maximum size is 16MB." });
        return;
      }

      // Decode base64 file data
      const buffer = Buffer.from(fileData, "base64");

      // Generate unique S3 key
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileKey = `documents/patient-${patientId}/${Date.now()}-${randomSuffix}-${sanitizedName}`;

      // Upload to S3
      const { storagePut } = await import("../storage");
      const { url } = await storagePut(fileKey, buffer, mimeType);

      // Save metadata to database
      const { createDocument, logAudit } = await import("../db");
      const result = await createDocument({
        patientId: Number(patientId),
        uploadedBy: ctx.user.id,
        fileName,
        mimeType,
        fileSize: buffer.length,
        fileKey,
        url,
        category: category || "other",
        description: description || null,
      });

      await logAudit({
        userId: ctx.user.id,
        action: "document.upload",
        entityType: "document",
        entityId: result.id,
        details: { fileName, mimeType, fileSize: buffer.length, patientId: Number(patientId) },
      });

      res.json({ id: result.id, url, fileName, fileKey });
    } catch (error: any) {
      console.error("[Upload] Failed:", error);
      res.status(500).json({ error: error.message || "Upload failed" });
    }
  });

  // ─── TWILIO INCOMING SMS WEBHOOK ──────────
  const { incomingSmsHandler } = await import("../twilioWebhook");
  app.post("/api/twilio/incoming-sms", incomingSmsHandler);

  // ─── GOOGLE CALENDAR OAUTH CALLBACK ──────────
  app.get("/api/google/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code || !state) {
        res.status(400).send("Missing code or state");
        return;
      }
      const { handleGoogleCallback } = await import("../googleCalendar");
      await handleGoogleCallback(code as string, state as string);
      // Parse origin from state to redirect back
      const parsed = JSON.parse(state as string);
      const origin = parsed.redirectUri?.replace("/api/google/callback", "") || "";
      res.redirect(`${origin}/provider/settings?gcal=connected`);
    } catch (error: any) {
      console.error("[GoogleCalendar] Callback error:", error);
      res.status(500).send(`Google Calendar connection failed: ${error.message}`);
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
