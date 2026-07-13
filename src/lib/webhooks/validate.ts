interface ValidationResult {
  valid: boolean;
  reason?: string;
}

const PRIVATE_CHECKS: Array<{
  label: string;
  test: (o: number[]) => boolean;
}> = [
  { label: "127.0.0.0/8", test: (o) => o[0] === 127 },
  { label: "10.0.0.0/8", test: (o) => o[0] === 10 },
  { label: "192.168.0.0/16", test: (o) => o[0] === 192 && o[1] === 168 },
  { label: "172.16.0.0/12", test: (o) => o[0] === 172 && o[1] >= 16 && o[1] <= 31 },
  { label: "169.254.0.0/16", test: (o) => o[0] === 169 && o[1] === 254 },
  { label: "0.0.0.0/8", test: (o) => o[0] === 0 },
];

const BLOCKED_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

export function isValidWebhookUrl(url: string): ValidationResult {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: "Invalid URL" };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, reason: "URL must use HTTPS protocol" };
  }

  let hostname = parsed.hostname.toLowerCase();
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    hostname = hostname.slice(1, -1);
  }

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { valid: false, reason: "Loopback addresses are not allowed" };
  }

  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octets = [
      parseInt(ipv4Match[1], 10),
      parseInt(ipv4Match[2], 10),
      parseInt(ipv4Match[3], 10),
      parseInt(ipv4Match[4], 10),
    ];
    if (octets.some((o) => o > 255)) {
      return { valid: false, reason: "Invalid IP address" };
    }
    for (const check of PRIVATE_CHECKS) {
      if (check.test(octets)) {
        return { valid: false, reason: `Private IP range ${check.label} is not allowed` };
      }
    }
  }

  return { valid: true };
}
