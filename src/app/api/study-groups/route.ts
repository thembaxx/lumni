import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { createGroup, getGroupsForUser } from "@/lib/study-groups/service";

export const GET = createRouteHandler({
	auth: "required",
	errorLabel: "StudyGroups",
	execute: async ({ userId }) => {
		const result = await getGroupsForUser(userId as string);
		if (!result.success) {
			throw new HttpError(500, result.error);
		}
		return { groups: result.data };
	},
});

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "StudyGroups",
	validate: (body) => {
		if (!body.name) return "Name is required";
		return null;
	},
	execute: async ({ userId, body }) => {
		const { name, description, subjectId } = body as {
			name: string;
			description?: string;
			subjectId?: string;
		};

		const result = await createGroup(userId as string, {
			name,
			description,
			subjectId,
		});

		if (!result.success) {
			throw new HttpError(400, result.error);
		}
		return { group: result.data };
	},
});
