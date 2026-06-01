import { Users } from "node-appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { serverClient } from "@/lib/appwrite";

const VALID_ROLES = ["teacher", "parent", "student"] as const;

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "UserRole",
	validate: (body) => {
		if (
			!body.role ||
			!VALID_ROLES.includes(body.role as (typeof VALID_ROLES)[number])
		) {
			return "Invalid role";
		}
		return null;
	},
	execute: async ({ userId, body }) => {
		const { role } = body as { role: string };

		const usersApi = new Users(serverClient);
		const user = await usersApi.get(userId as string);
		const existingLabels = user.labels.filter(
			(l) => !VALID_ROLES.includes(l as (typeof VALID_ROLES)[number]),
		);
		const updated = await usersApi.updateLabels(userId as string, [
			...existingLabels,
			role,
		]);
		return { labels: updated.labels };
	},
});
