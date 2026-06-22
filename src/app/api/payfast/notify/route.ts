import { Client, Databases, ID } from "appwrite";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID } from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";

const PF_SANDBOX = process.env.PAYFAST_SANDBOX === "true";
const PF_VALIDATE_HOST = PF_SANDBOX
  ? "https://sandbox.payfast.co.za/eng/query/validate"
  : "https://www.payfast.co.za/eng/query/validate";

async function generateSignature(data: Record<string, string>): Promise<string> {
  const passphrase = process.env.PAYFAST_PASSPHRASE || "";
  const sortedKeys = Object.keys(data).sort();
  const paramString = sortedKeys
    .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`)
    .join("&");
  const sigString = passphrase
    ? `${paramString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`
    : paramString;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("MD5", encoder.encode(sigString));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const POST = createRouteHandler({
  auth: "none",
  errorLabel: "PayfastNotify",
  parseBody: async (req) => {
    const formData = await req.formData();
    const pfData: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      pfData[key] = value.toString();
    }
    return pfData;
  },
  execute: async ({ body }) => {
    const pfData = body as Record<string, string>;

    if (!pfData.signature) {
      throw new HttpError(400, "Missing signature");
    }

    const receivedSignature = pfData.signature;
    delete pfData.signature;

    const expectedSignature = await generateSignature(pfData);
    if (receivedSignature !== expectedSignature) {
      logError("PayfastNotify", new Error("Invalid signature"));
      throw new HttpError(403, "Invalid signature");
    }

    const urlParams = new URLSearchParams(pfData);

    let pfValid = false;
    try {
      const validateRes = await fetch(PF_VALIDATE_HOST, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: urlParams.toString(),
        cache: "no-store",
      });
      const text = await validateRes.text();
      pfValid = text === "VALID";
    } catch (e) {
      logError("PayfastNotify", e);
    }

    if (!pfValid) {
      logError("PayfastNotify", new Error("IPN validation failed"));
      throw new HttpError(403, "Invalid");
    }

    const paymentStatus = pfData.payment_status;
    const userId = pfData.custom_str1 || pfData.m_payment_id;

    if (paymentStatus === "COMPLETE" && userId) {
      try {
        const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT);
        const db = new Databases(client);

        await db.createDocument(APPWRITE_DATABASE_ID, "premium_subscriptions", ID.unique(), {
          userId,
          provider: "payfast",
          status: "active",
          amount: pfData.amount,
          itemName: pfData.item_name,
          pfPaymentId: pfData.pf_payment_id,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } catch (dbErr) {
        logError("PayfastNotify", dbErr);
      }
    }

    return { ok: true };
  },
});
