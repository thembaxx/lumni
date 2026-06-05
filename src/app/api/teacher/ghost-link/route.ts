import { createRouteHandler } from "@/lib/api/create-route-handler";

export const POST = createRouteHandler({
	auth: "none",
	execute: async () => {
		const token = crypto.randomUUID();
		const link = {
			token,
			teacherId: "ghost",
			createdAt: Date.now(),
			expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
			revoked: false,
		};
		localStorage.setItem(`lumni_ghost_${token}`, JSON.stringify(link));
		return {
			token,
			url: `/ghost/${token}`,
			expiresAt: link.expiresAt,
		};
	},
	errorLabel: "GhostLink",
});

export const DELETE = createRouteHandler({
	auth: "none",
	execute: async ({ body }: { body: { token?: string } }) => {
		if (body.token) {
			localStorage.removeItem(`lumni_ghost_${body.token}`);
		}
		return { success: true };
	},
	errorLabel: "GhostLink",
});
