import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { dexieDataAccess } from "@/lib/db";
import { StudyBuddyService } from "@/lib/services";

const service = new StudyBuddyService({ db: dexieDataAccess });

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "StudyBuddyCommit",
  execute: async ({ userId, body }) => {
    const { buddyUserId, subject, targetDailyMinutes } = body as {
      buddyUserId: string;
      subject: string;
      targetDailyMinutes?: number;
    };

    if (!buddyUserId || !subject) {
      throw new HttpError(400, "buddyUserId and subject are required");
    }

    if (buddyUserId === userId) {
      throw new HttpError(400, "Cannot create a commitment with yourself");
    }

    const commitment = await service.createCommitment(
      userId as string,
      buddyUserId,
      subject,
      targetDailyMinutes,
    );

    return { commitment };
  },
});
