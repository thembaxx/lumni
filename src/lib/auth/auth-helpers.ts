import { type Models } from "appwrite";
import { account } from "@/lib/appwrite";
import { logError } from "@/lib/shared/logger";

export const ANONYMOUS_ATTEMPTED_KEY = "lumni_anonymous_attempted";

export async function syncGoogleAvatar(user: Models.User<Models.Preferences>): Promise<void> {
  try {
    const prefs = user.prefs as Record<string, unknown>;
    if (prefs?.avatarUrl) return;

    const session = await account.getSession("current");
    if (session.provider !== "google" || !session.providerAccessToken) return;

    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${session.providerAccessToken}` },
    });
    if (!res.ok) return;

    const data = (await res.json()) as { picture?: string };
    if (!data.picture) return;

    const freshUser = await account.get();
    const freshPrefs = freshUser.prefs as Record<string, unknown>;
    await account.updatePrefs({ ...freshPrefs, avatarUrl: data.picture });
  } catch (err) {
    logError("sync-google-avatar", err);
  }
}
