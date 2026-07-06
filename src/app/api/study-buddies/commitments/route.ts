import { createRouteHandler } from "@/lib/api/create-route-handler";
import { dexieDataAccess } from "@/lib/db";
import { StudyBuddyService } from "@/lib/services/study-buddy-service";

const service = new StudyBuddyService({ db: dexieDataAccess });

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "StudyBuddyList",
  execute: async ({ userId }) => {
    const commitments = await service.getCommitments(userId as string);
    return { commitments };
  },
});
