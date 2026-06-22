// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { getAnalyticsConsent } from "@/lib/consent/sentry-gate";

Sentry.init({
  dsn: "https://9863412a95109b4e994c4d30aaac7266@o4510925914963968.ingest.us.sentry.io/4511435431215104",

  integrations: [Sentry.replayIntegration()],

  tracesSampleRate: 1,
  enableLogs: true,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  sendDefaultPii: true,

  beforeSend: (event) => (getAnalyticsConsent() ? event : null),
  beforeSendTransaction: (event) => (getAnalyticsConsent() ? event : null),
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
