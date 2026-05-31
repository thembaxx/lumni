import * as Sentry from "@sentry/nextjs";
import { analyticsConsent } from "@/lib/consent/sentry-gate";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	tracesSampleRate: 0.1,
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
	integrations: [Sentry.replayIntegration()],
	beforeSend: (event) => (analyticsConsent ? event : null),
	beforeSendTransaction: (event) => (analyticsConsent ? event : null),
});
