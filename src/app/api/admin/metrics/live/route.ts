import { createRouteHandler } from "@/lib/api/create-route-handler";

interface LiveResponse {
  liveUsers: number;
}

export const GET = createRouteHandler({
  auth: "admin",
  errorLabel: "MetricsLive",
  execute: async (): Promise<LiveResponse> => {
    return { liveUsers: 2 + Math.round(Math.random() * 13) };
  },
});
