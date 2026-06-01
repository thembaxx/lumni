import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { removeMember } from "@/lib/study-groups/service";

export const DELETE = createRouteHandler({
	auth: "required",
	errorLabel: "RemoveMember",
	execute: async ({ userId, params }) => {
		const groupId = params?.groupId as string;
		const memberId = params?.memberId as string;
		const result = await removeMember(userId as string, groupId, memberId);

		if (!result.success) {
			throw new HttpError(400, result.error);
		}
		return { success: true };
	},
});
