import { createServer, type Server } from "http";
import type { AddressInfo } from "net";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { DEMO_CLINICIAN, DEMO_PATIENT } from "../../shared/demo";
import { createApp } from "../app";
import type { AppRouter } from "../routers";

delete process.env.DATABASE_URL;

let server: Server;
let port = 0;

function cookieFrom(response: Response) {
  const many = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  const all = many.length > 0 ? many : [response.headers.get("set-cookie") ?? ""];
  const line = all.find((value) => value.includes("app_session_id="));
  if (!line) throw new Error(`missing session cookie: ${all.join(" | ")}`);
  return line.split(";")[0]!;
}

function client(cookie = "") {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `http://127.0.0.1:${port}/api/trpc`,
        transformer: superjson,
        headers: cookie ? { cookie } : undefined,
      }),
    ],
  });
}

async function login(email: string, password: string) {
  let cookie = "";
  const api = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `http://127.0.0.1:${port}/api/trpc`,
        transformer: superjson,
        fetch: async (input, init) => {
          const response = await fetch(input, init);
          cookie = cookieFrom(response);
          return response;
        },
      }),
    ],
  });
  const result = await api.auth.login.mutate({ email, password });
  return { cookie, user: result.user };
}

beforeAll(async () => {
  const app = await createApp();
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.address() as AddressInfo).port;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

it("publishes a plan and the patient stream updates without a refresh", async () => {
  const patient = await login(DEMO_PATIENT.email, DEMO_PATIENT.password);
  const clinician = await login(DEMO_CLINICIAN.email, DEMO_CLINICIAN.password);
  expect(patient.user.role).toBe("user");
  expect(clinician.user.role).toBe("admin");

  const unauthenticated = await fetch(`http://127.0.0.1:${port}/api/events`);
  expect(unauthenticated.status).toBe(401);

  const stream = await fetch(`http://127.0.0.1:${port}/api/events`, {
    headers: { cookie: patient.cookie },
  });
  expect(stream.status).toBe(200);
  const reader = stream.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const waitFor = async (needle: string) => {
    const deadline = Date.now() + 4000;
    while (!buffer.includes(needle) && Date.now() < deadline) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
    }
  };
  await waitFor("event: connected");
  expect(buffer).toContain("event: connected");

  const before = await client(patient.cookie).portal.patient.home.query();
  expect(JSON.stringify(before)).not.toContain("evening glycine");

  const roster = await client(clinician.cookie).portal.clinic.roster.query();
  const morgan = roster.find((row) => row.firstName === "Morgan");
  await client(clinician.cookie).portal.clinic.addItem.mutate({
    patientId: morgan!.id,
    kind: "note",
    name: "Sample evening glycine note",
    instructions: "SAMPLE TEMPLATE — not medical guidance. Added during the live walkthrough.",
    status: "active",
    isSampleTemplate: true,
  });
  const hidden = await client(patient.cookie).portal.patient.home.query();
  expect(JSON.stringify(hidden)).not.toContain("evening glycine");

  const published = await client(clinician.cookie).portal.clinic.publish.mutate({ patientId: morgan!.id });
  expect(published.changed).toBe(true);
  await waitFor("event: plan");
  expect(buffer).toContain("event: plan");

  const after = await client(patient.cookie).portal.patient.home.query();
  expect(after.plan.version).toBe(published.version);
  expect(JSON.stringify(after)).toContain("evening glycine");
  await reader.cancel();
}, 20_000);
