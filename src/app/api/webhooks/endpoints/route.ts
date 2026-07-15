import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { dexieDataAccess } from "@/lib/db";
import { createRegistry } from "@/lib/webhooks";
import { z } from "zod";

const endpointSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  description: z.string().optional(),
});

const registry = createRegistry(dexieDataAccess);

export const GET = createRouteHandler({
  auth: "admin",
  errorLabel: "WebhookList",
  execute: async () => {
    const endpoints = await registry.listEndpoints();
    return { endpoints };
  },
});

export const POST = createRouteHandler({
  auth: "admin",
  errorLabel: "WebhookCreate",
  execute: async ({ body }) => {
    const parsed = endpointSchema.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "Invalid endpoint data");
    const id = await registry.createEndpoint(parsed.data);
    return { id };
  },
});

export const DELETE = createRouteHandler({
  auth: "admin",
  errorLabel: "WebhookDelete",
  execute: async ({ body }) => {
    const { id } = body as { id: string };
    if (!id) throw new HttpError(400, "id is required");
    await registry.deleteEndpoint(id);
    return { success: true };
  },
});
