import { createHash } from "node:crypto";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { logError } from "@/lib/shared/logger";

async function parseFormData(req: Request): Promise<Record<string, string>> {
  const text = await req.text();
  const params = new URLSearchParams(text);
  const result: Record<string, string> = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

function verifyPayfastSignature(payload: Record<string, string>, signature: string): boolean {
  const passphrase = process.env.PAYFAST_PASSPHRASE;
  if (!passphrase) {
    logError("PayfastItn.missingPassphrase", new Error("PAYFAST_PASSPHRASE not configured"));
    return false;
  }

  const excludedKeys = new Set(["signature"]);
  const sortedKeys = Object.keys(payload)
    .filter((k) => !excludedKeys.has(k))
    .toSorted();

  const queryString = sortedKeys
    .map((key) => {
      const val = payload[key];
      if (val === "" || val === undefined) return null;
      return `${key}=${encodeURIComponent(val).replace(/%20/g, "+")}`;
    })
    .filter(Boolean)
    .join("&");

  const checkString = `${queryString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`;

  const expected = createHash("md5").update(checkString).digest("hex").toLowerCase();
  return expected === signature.toLowerCase();
}

export const POST = createRouteHandler({
  auth: "none",
  errorLabel: "PayfastItn",
  useRateLimit: true,

  parseBody: async (req) => {
    return parseFormData(req);
  },

  execute: async ({ body }) => {
    const payload = body as Record<string, string>;
    const signature = payload.signature ?? "";
    const isValid = verifyPayfastSignature(payload, signature);

    if (!isValid) {
      logError("PayfastItn.invalidSignature", null, {
        pf_payment_id: payload.pf_payment_id,
      });
      return { status: "invalid_signature" };
    }

    if (payload.payment_status === "COMPLETE") {
      const schoolId = payload.custom_int1 ?? payload.m_payment_id;

      logError("PayfastItn.paymentComplete", null, {
        schoolId,
        pf_payment_id: payload.pf_payment_id,
        amount_gross: payload.amount_gross,
      });
    }

    return { status: "ok" };
  },
});
