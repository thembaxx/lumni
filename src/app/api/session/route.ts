import { createRouteHandler } from "@/lib/api/create-route-handler";
import { account } from "@/lib/appwrite";

export const GET = createRouteHandler({
	auth: "optional",
	errorLabel: "Session",
	execute: async ({ userId: _userId }) => {
		try {
			const user = await account.get();
			return {
				userId: user.$id,
				name: user.name,
				email: user.email,
				emailVerification: user.emailVerification,
				labels: user.labels,
				prefs: user.prefs,
				isAnonymous: user.labels?.includes("anonymous") ?? false,
			};
		} catch (err) {
			console.error("Session fetch error:", err);
			return {
				userId: null,
				name: null,
				email: null,
				emailVerification: false,
				labels: [],
				prefs: {},
				isAnonymous: false,
			};
		}
	},
});
