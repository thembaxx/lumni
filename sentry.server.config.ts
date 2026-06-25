// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    "https://9863412a95109b4e994c4d30aaac7266@o4510925914963968.ingest.us.sentry.io/4511435431215104",

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.25 : 0.1,

  enableLogs: process.env.NODE_ENV !== "production",

  sendDefaultPii: false,
});
