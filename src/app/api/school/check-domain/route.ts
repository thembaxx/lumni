import { createRouteHandler } from "@/lib/api/create-route-handler";
import { checkDomain } from "@/lib/school/service";
import { z } from "zod";

const schema = z.object({
  domain: z.string().min(3).max(200),
});

export const POST = createRouteHandler({
  auth: "none",
  errorLabel: "SchoolCheckDomain",
  execute: async ({ body }) => {
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return { registered: false };
    }

    return checkDomain(parsed.data.domain);
  },
});
