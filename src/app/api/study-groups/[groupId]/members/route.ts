import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { getGroupMembers } from "@/lib/study-groups/service";

export const GET = createRouteHandler({
	auth: "required",
	errorLabel: "GroupMembers",
	execute: async ({ params }) => {
		const groupId = params?.groupId as string;
		const result = await getGroupMembers(groupId);

		if (!result.success) {
			throw new HttpError(500, result.error);
		}
		return { members: result.data };
	},
});
