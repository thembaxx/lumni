import { z } from "zod";

export const APPWRITE_ADMIN_EMAIL =
	process.env.APPWRITE_ADMIN_EMAIL || "mndebele.themba@gmail.com";

export const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000;
export const OTP_EXPIRY_MS = 15 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 2 * 60 * 1000;
export const MAX_FAILED_ATTEMPTS = 3;
export const LOCK_DURATION_MS = 15 * 60 * 1000;
export const OTP_LENGTH = 6;

export function isAdminEmail(email: string): boolean {
	return email.toLowerCase() === APPWRITE_ADMIN_EMAIL.toLowerCase();
}

export function generateOTP(): string {
	const digits = "0123456789";
	let otp = "";
	for (let i = 0; i < OTP_LENGTH; i++) {
		otp += digits[Math.floor(Math.random() * digits.length)];
	}
	return otp;
}

export function generateMagicToken(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 15)}${Math.random().toString(36).slice(2, 15)}`;
}

export function formatCountdown(ms: number): string {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export const magicLinkSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

export const otpSendSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

export const otpVerifySchema = z.object({
	otpId: z.string().min(1, " OTP ID is required"),
	code: z.string().length(OTP_LENGTH, `Code must be ${OTP_LENGTH} digits`),
});

export const resendSchema = z.object({
	type: z.enum(["magic-link", "otp"]),
	email: z.string().email("Please enter a valid email address"),
});

export interface AuthAttempt {
	email: string;
	otp?: string;
	magicToken?: string;
	tokenExpiry: number;
	failedAttempts: number;
	lockedUntil?: number;
	lastSentAt: number;
	verified: boolean;
}

const authStore = new Map<string, AuthAttempt>();

export function getAuthAttempt(email: string): AuthAttempt | undefined {
	return authStore.get(email.toLowerCase());
}

export function setAuthAttempt(email: string, attempt: AuthAttempt): void {
	authStore.set(email.toLowerCase(), attempt);
}

export function deleteAuthAttempt(email: string): void {
	authStore.delete(email.toLowerCase());
}

export function createAuthAttempt(
	email: string,
	type: "otp" | "magic-link",
): AuthAttempt {
	const isOtp = type === "otp";
	return {
		email: email.toLowerCase(),
		otp: isOtp ? generateOTP() : undefined,
		magicToken: isOtp ? undefined : generateMagicToken(),
		tokenExpiry: Date.now() + (isOtp ? OTP_EXPIRY_MS : MAGIC_LINK_EXPIRY_MS),
		failedAttempts: 0,
		lockedUntil: undefined,
		lastSentAt: Date.now(),
		verified: false,
	};
}

export function canResend(email: string): boolean {
	const attempt = authStore.get(email.toLowerCase());
	if (!attempt) return true;
	return Date.now() >= attempt.lastSentAt + RESEND_COOLDOWN_MS;
}

export function getResendCountdown(email: string): number {
	const attempt = authStore.get(email.toLowerCase());
	if (!attempt) return 0;
	const remaining = attempt.lastSentAt + RESEND_COOLDOWN_MS - Date.now();
	return remaining > 0 ? remaining : 0;
}

export function isLocked(email: string): boolean {
	const attempt = authStore.get(email.toLowerCase());
	if (!attempt?.lockedUntil) return false;
	const isLocked = Date.now() < attempt.lockedUntil;
	if (!isLocked) {
		attempt.failedAttempts = 0;
		attempt.lockedUntil = undefined;
	}
	return isLocked;
}

export function getLockRemaining(email: string): number {
	const attempt = authStore.get(email.toLowerCase());
	if (!attempt?.lockedUntil) return 0;
	const remaining = attempt.lockedUntil - Date.now();
	return remaining > 0 ? remaining : 0;
}

export function incrementFailedAttempts(email: string): number {
	const attempt = authStore.get(email.toLowerCase());
	if (!attempt) return 1;
	attempt.failedAttempts += 1;
	if (attempt.failedAttempts >= MAX_FAILED_ATTEMPTS) {
		attempt.lockedUntil = Date.now() + LOCK_DURATION_MS;
	}
	return attempt.failedAttempts;
}

export function getRemainingAttempts(email: string): number {
	const attempt = authStore.get(email.toLowerCase());
	return Math.max(0, MAX_FAILED_ATTEMPTS - (attempt?.failedAttempts ?? 0));
}
