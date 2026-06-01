import { createRouteHandler } from "@/lib/api/create-route-handler";
import { userConsentService } from "@/lib/services/user-consent-service";

export const GET = createRouteHandler({
	auth: "required",
	errorLabel: "UserConsent",
	execute: async ({ userId }) => {
		const consent = await userConsentService.get(userId as string);
		return { consent };
	},
});

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "UserConsent",
	execute: async ({ userId, body }) => {
		const { analytics, marketing, dataSharing, tosVersion, privacyVersion } =
			body as {
				analytics?: boolean;
				marketing?: boolean;
				dataSharing?: boolean;
				tosVersion?: string;
				privacyVersion?: string;
			};

		const consent = await userConsentService.save(userId as string, {
			analytics,
			marketing,
			dataSharing,
			tosVersion,
			privacyVersion,
		});
		return { consent };
	},
});
