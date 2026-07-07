import { describe, expect, it, vi, beforeEach } from "vitest";

const mockListDocuments = vi.fn();
const mockUpdateDocument = vi.fn();

vi.mock("@/lib/appwrite.server", () => ({
  databases: {
    listDocuments: mockListDocuments,
    updateDocument: mockUpdateDocument,
  },
}));

vi.mock("appwrite", () => ({
  Query: {
    equal: (field: string, value: unknown) => ({ field, value, method: "equal" }),
    orderDesc: (field: string) => ({ field, method: "orderDesc" }),
    limit: (n: number) => ({ limit: n, method: "limit" }),
  },
}));

process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
process.env.STRIPE_SECRET_KEY = "sk_test";

const { POST } = await import("../route");

function makeDeps(event: { type: string; data: { object: Record<string, unknown> } }) {
  return {
    constructEvent: vi.fn().mockReturnValue(event),
  };
}

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    mockListDocuments.mockReset();
    mockUpdateDocument.mockReset();
    mockListDocuments.mockResolvedValue({ total: 0, documents: [] });
  });

  it("returns 400 when signature is missing", async () => {
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    const deps = {
      constructEvent: vi.fn().mockImplementation(() => {
        throw new Error("Invalid signature");
      }),
    };
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
      headers: { "stripe-signature": "invalid" },
    });
    const res = await POST(req, deps);
    expect(res.status).toBe(400);
  });

  it("activates license on checkout.session.completed", async () => {
    const deps = makeDeps({
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: "school-123",
          subscription: "sub_abc",
        },
      },
    });
    mockListDocuments.mockResolvedValue({
      total: 1,
      documents: [{ $id: "license-1", schoolId: "school-123", status: "pending" }],
    });

    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
      headers: { "stripe-signature": "valid" },
    });
    const res = await POST(req, deps);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockUpdateDocument).toHaveBeenCalledWith(
      expect.any(String),
      "licenses",
      "license-1",
      expect.objectContaining({ status: "active" }),
    );
  });

  it("deactivates license on subscription.deleted", async () => {
    const deps = makeDeps({
      type: "customer.subscription.deleted",
      data: {
        object: { id: "sub_abc" },
      },
    });
    mockListDocuments.mockResolvedValue({
      total: 1,
      documents: [{ $id: "license-2", status: "active" }],
    });

    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
      headers: { "stripe-signature": "valid" },
    });
    const res = await POST(req, deps);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockUpdateDocument).toHaveBeenCalledWith(
      expect.any(String),
      "licenses",
      "license-2",
      expect.objectContaining({ status: "cancelled" }),
    );
  });

  it("marks payment failed on invoice.payment_failed", async () => {
    const deps = makeDeps({
      type: "invoice.payment_failed",
      data: {
        object: { subscription: "sub_abc" },
      },
    });
    mockListDocuments.mockResolvedValue({
      total: 1,
      documents: [{ $id: "license-3", status: "active" }],
    });

    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
      headers: { "stripe-signature": "valid" },
    });
    const res = await POST(req, deps);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockUpdateDocument).toHaveBeenCalledWith(
      expect.any(String),
      "licenses",
      "license-3",
      expect.objectContaining({ paymentStatus: "failed" }),
    );
  });

  it("returns 500 when webhook secret is not configured", async () => {
    const original = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
      headers: { "stripe-signature": "valid" },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    process.env.STRIPE_WEBHOOK_SECRET = original;
  });
});
