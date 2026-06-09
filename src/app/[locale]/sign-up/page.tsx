import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function SignUpRedirectPage() {
	const locale = await getLocale();
	redirect({ href: "/auth/sign-up", locale });
}
