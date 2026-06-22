import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import {
  getParentConsentStatus,
  grantParentConsent,
  revokeParentConsent,
} from "@/lib/server/parent-service";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "ParentConsent",
  execute: async ({ userId, req }) => {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    if (!studentId) {
      throw new HttpError(400, "studentId query param required");
    }
    const status = await getParentConsentStatus(userId as string, studentId);
    return { status };
  },
});

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "ParentConsent",
  validate: (body) => {
    if (!body.studentId) return "studentId required";
    return null;
  },
  execute: async ({ userId, body }) => {
    const { studentId, canViewProgress, canViewScores } = body as {
      studentId: string;
      canViewProgress?: boolean;
      canViewScores?: boolean;
    };

    await grantParentConsent(
      userId as string,
      studentId,
      canViewProgress ?? true,
      canViewScores ?? true,
    );
    return { success: true };
  },
});

export const DELETE = createRouteHandler({
  auth: "required",
  errorLabel: "ParentConsent",
  validate: (body) => {
    if (!body.studentId) return "studentId required";
    return null;
  },
  execute: async ({ userId, body }) => {
    const { studentId } = body as { studentId: string };
    await revokeParentConsent(userId as string, studentId);
    return { success: true };
  },
});
