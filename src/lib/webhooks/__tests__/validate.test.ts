import { describe, it, expect } from "vitest";
import { isValidWebhookUrl } from "../validate";

describe("isValidWebhookUrl", () => {
  it("accepts a normal HTTPS URL", () => {
    expect(isValidWebhookUrl("https://hooks.example.com/callback")).toEqual({ valid: true });
  });

  it("accepts HTTPS with a non-private IP", () => {
    expect(isValidWebhookUrl("https://93.184.216.34/hook")).toEqual({ valid: true });
  });

  it("rejects HTTP (non-HTTPS)", () => {
    const r = isValidWebhookUrl("http://hooks.example.com/callback");
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/HTTPS/i);
  });

  it("rejects http://169.254.169.254/latest/meta-data/", () => {
    const r = isValidWebhookUrl("http://169.254.169.254/latest/meta-data/");
    expect(r.valid).toBe(false);
  });

  it("rejects https://169.254.169.254/latest/meta-data/", () => {
    const r = isValidWebhookUrl("https://169.254.169.254/latest/meta-data/");
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/169\.254/i);
  });

  it("rejects http://localhost:8080/webhook", () => {
    const r = isValidWebhookUrl("http://localhost:8080/webhook");
    expect(r.valid).toBe(false);
  });

  it("rejects https://localhost/webhook", () => {
    const r = isValidWebhookUrl("https://localhost/webhook");
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/loopback/i);
  });

  it("rejects http://127.0.0.1/webhook", () => {
    const r = isValidWebhookUrl("http://127.0.0.1/webhook");
    expect(r.valid).toBe(false);
  });

  it("rejects https://127.0.0.1/webhook", () => {
    const r = isValidWebhookUrl("https://127.0.0.1/webhook");
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/loopback/i);
  });

  it("rejects https://127.99.99.99/webhook (127.0.0.0/8)", () => {
    const r = isValidWebhookUrl("https://127.99.99.99/webhook");
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/127\.0\.0\.0\/8/i);
  });

  it("rejects http://10.0.0.5/webhook", () => {
    const r = isValidWebhookUrl("http://10.0.0.5/webhook");
    expect(r.valid).toBe(false);
  });

  it("rejects https://10.0.0.5/webhook", () => {
    const r = isValidWebhookUrl("https://10.0.0.5/webhook");
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/10\.0\.0\.0\/8/i);
  });

  it("rejects https://192.168.1.1/webhook", () => {
    const r = isValidWebhookUrl("https://192.168.1.1/webhook");
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/192\.168\.0\.0\/16/i);
  });

  it("rejects https://172.16.0.1/webhook", () => {
    const r = isValidWebhookUrl("https://172.16.0.1/webhook");
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/172\.16\.0\.0\/12/i);
  });

  it("rejects https://172.31.255.255/webhook (172.16.0.0/12 upper bound)", () => {
    const r = isValidWebhookUrl("https://172.31.255.255/webhook");
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/172\.16\.0\.0\/12/i);
  });

  it("accepts https://172.32.0.1/webhook (outside 172.16.0.0/12)", () => {
    expect(isValidWebhookUrl("https://172.32.0.1/webhook")).toEqual({ valid: true });
  });

  it("rejects http://0.0.0.0/webhook", () => {
    const r = isValidWebhookUrl("http://0.0.0.0/webhook");
    expect(r.valid).toBe(false);
  });

  it("rejects a malformed URL", () => {
    const r = isValidWebhookUrl("not-a-url");
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/invalid url/i);
  });

  it("rejects https://[::1]/webhook (IPv6 loopback)", () => {
    const r = isValidWebhookUrl("https://[::1]/webhook");
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/loopback/i);
  });
});
