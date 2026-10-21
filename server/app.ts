import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./_core/context";
import { sdk } from "./_core/sdk";
import { portalEventsHandler } from "./portal/events";
import { initStore } from "./portal/store";
import { appRouter } from "./routers";

export async function createApp() {
  await initStore();
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    next();
  });
  app.use(express.json({ limit: "1mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );
  app.get("/api/events", portalEventsHandler(async (req) => {
    const user = await sdk.authenticateRequest(req);
    return user ? { id: user.id } : null;
  }));
  return app;
}
