import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { leaveGroup } from "@/lib/study-groups/service";

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "LeaveGroup",
	execute: async ({ userId, params }) => {
		const groupId = params?.groupId as string;
		const result = await leaveGroup(userId as string, groupId);

		if (!result.success) {
			throw new HttpError(400, result.error);
		}
		return { success: true };
	},
});
