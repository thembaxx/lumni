export const REFERRAL_DOMAIN = "https://lumni-psi.vercel.app";

export const REFERRAL_REWARD_DAYS = 7;

export const REFERRAL_MONTHLY_LIMIT = 10;

export function buildReferralLink(code: string): string {
	return `${REFERRAL_DOMAIN}/auth/sign-up?ref=${encodeURIComponent(code)}`;
}

export function generateReferralCode(name: string): string {
	const sanitized = name
		.replace(/[^a-zA-Z0-9]/g, "")
		.slice(0, 8)
		.toUpperCase();
	const suffix = Math.floor(Math.random() * 100)
		.toString()
		.padStart(2, "0");
	return `LUMNI-${sanitized}${suffix}`;
}
