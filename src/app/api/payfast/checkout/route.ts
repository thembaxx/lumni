import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";

const PF_HOST =
  process.env.PAYFAST_SANDBOX === "true"
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";

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
  auth: "required",
  errorLabel: "PayfastCheckout",
  execute: async ({ userId, req, body }) => {
    const merchantId = process.env.PAYFAST_MERCHANT_ID;
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY;

    if (!merchantId || !merchantKey) {
      throw new HttpError(503, "Payfast not configured");
    }

    const origin = new URL(req.url).origin;
    const { amount, item_name } = body as {
      amount?: string;
      item_name?: string;
    };

    const data: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${origin}/premium?success=true`,
      cancel_url: `${origin}/premium?canceled=true`,
      notify_url: `${origin}/api/payfast/notify`,
      name_first: "",
      name_last: "",
      email_address: "",
      m_payment_id: userId as string,
      amount: amount || "99.00",
      item_name: item_name || "Lumni Premium Yearly",
      custom_str1: userId as string,
    };

    const signature = await generateSignature(data);

    return {
      url: PF_HOST,
      data: { ...data, signature },
    };
  },
});
