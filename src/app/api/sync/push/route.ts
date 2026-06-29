import { createRouteHandler } from "@/lib/api/create-route-handler";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "SyncPush",
  parseBody: async (req) => {
    const body: {
      table: string;
      recordId: string;
      operation: "create" | "update" | "delete";
      data: string;
      createdAt: number;
    } = await req.json();
    return body;
  },
  validate: (body) => {
    if (!body.table || !body.recordId) return "table and recordId are required";
    return null;
  },
  execute: async () => {
    return { accepted: true };
  },
});
