import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { dexieDataAccess } from "@/lib/db";
import { StudyBuddyService } from "@/lib/services/study-buddy-service";

const service = new StudyBuddyService({ db: dexieDataAccess });

export const DELETE = createRouteHandler({
  auth: "required",
  errorLabel: "StudyBuddyEnd",
  execute: async ({ userId, params }) => {
    const id = Number(params?.id);
    if (!id || Number.isNaN(id)) {
      throw new HttpError(400, "Valid commitment id is required");
    }

    await service.endCommitment(id, userId as string);
    return { success: true };
  },
});

export const PATCH = createRouteHandler({
  auth: "required",
  errorLabel: "StudyBuddyRespond",
  execute: async ({ userId, params, body }) => {
    const id = Number(params?.id);
    if (!id || Number.isNaN(id)) {
      throw new HttpError(400, "Valid commitment id is required");
    }

    const { action } = body as { action: "accept" | "decline" };

    if (action === "accept") {
      const commitment = await service.acceptCommitment(id, userId as string);
      return { commitment };
    }

    if (action === "decline") {
      await service.declineCommitment(id, userId as string);
      return { declined: true };
    }

    throw new HttpError(400, 'action must be "accept" or "decline"');
  },
});
