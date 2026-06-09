import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function SignInRedirectPage() {
	const locale = await getLocale();
	redirect({ href: "/auth/sign-in", locale });
}
