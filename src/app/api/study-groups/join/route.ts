import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { joinGroup } from "@/lib/study-groups/service";

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "JoinGroup",
	validate: (body) => {
		if (!body.inviteCode || typeof body.inviteCode !== "string")
			return "Invite code is required";
		return null;
	},
	execute: async ({ userId, body }) => {
		const { inviteCode } = body as { inviteCode: string };

		const result = await joinGroup(userId as string, inviteCode.toUpperCase());
		if (!result.success) {
			throw new HttpError(400, result.error);
		}
		return { group: result.data };
	},
});
