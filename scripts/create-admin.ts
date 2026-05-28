import { Client, Users, ID, Query } from "node-appwrite";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME;

const APPWRITE_ENDPOINT =
	process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
	"https://jnb.cloud.appwrite.io/v1";
const APPWRITE_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "";

async function main() {
	if (!APPWRITE_PROJECT) {
		console.error("Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID in environment");
		process.exit(1);
	}
	if (!APPWRITE_API_KEY) {
		console.error("Missing APPWRITE_API_KEY in environment");
		process.exit(1);
	}
	if (!ADMIN_EMAIL) {
		console.error("Missing ADMIN_EMAIL in .env.local");
		process.exit(1);
	}
	if (!ADMIN_PASSWORD) {
		console.error("Missing ADMIN_PASSWORD in .env.local");
		process.exit(1);
	}

	const client = new Client()
		.setEndpoint(APPWRITE_ENDPOINT)
		.setProject(APPWRITE_PROJECT)
		.setKey(APPWRITE_API_KEY);

	const users = new Users(client);
	const avatarUrl = `https://api.dicebear.com/9.x/adventurer/svg?seed=${ADMIN_EMAIL}&backgroundColor=ffdfbf,c0aede,d1d4f9`;

	try {
		const existing = await users.list({
			queries: [Query.equal("email", ADMIN_EMAIL)],
		});

		if (existing.users.length > 0) {
			const user = existing.users[0];

			await users.updatePrefs({ userId: user.$id, prefs: { ...user.prefs, avatarUrl } });
			console.log(`Updated avatar for existing user ${ADMIN_EMAIL}`);

			await users.updatePassword({ userId: user.$id, password: ADMIN_PASSWORD });
			console.log("Updated password from ADMIN_PASSWORD in .env.local");
		} else {
			const user = await users.create({
				userId: ID.unique(),
				email: ADMIN_EMAIL,
				password: ADMIN_PASSWORD,
				name: ADMIN_NAME,
			});
			console.log(`Created admin user ${ADMIN_EMAIL}`);

			await users.updatePrefs({ userId: user.$id, prefs: { avatarUrl } });
			console.log("Set anime avatar");
		}

		console.log("\nAdmin account ready.");
		console.log(`Email: ${ADMIN_EMAIL}`);
		console.log("Password: stored in ADMIN_PASSWORD in .env.local");
		console.log("\nLogin at /admin or /auth/sign-in");
	} catch (error) {
		console.error("Failed to create admin user:", error);
		process.exit(1);
	}
}

main();
