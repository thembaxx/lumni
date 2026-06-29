import { createRouteHandler } from "@/lib/api/create-route-handler";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "SyncPull",
  execute: async ({ req }) => {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get("table");
    const _since = Number(searchParams.get("since")) || 0;

    if (!table) {
      return { records: [], version: "" };
    }

    return { records: [], version: String(Date.now()) };
  },
});
