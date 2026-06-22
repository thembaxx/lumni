export function getReadableErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message.toLowerCase() : "Something went wrong";

  if (message.includes("already exists") || message.includes("already registered")) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (message.includes("invalid credentials")) {
    return "Incorrect email or password. Try again.";
  }
  if (message.includes("user with this email not found")) {
    return "No account found with this email. Create an account instead.";
  }
  if (message.includes("invalid email")) {
    return "Enter a valid email address.";
  }
  if (message.includes("missing") || message.includes("required")) {
    return "Please fill in all required fields.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "Couldn't connect. Check your internet connection and try again.";
  }
  if (message.includes("rate") || message.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (message.includes("password") && message.includes("length")) {
    return "Password must be at least 8 characters.";
  }
  if (message.includes("verification") && message.includes("invalid")) {
    return "This verification link has expired or is invalid. Request a new one.";
  }
  if (message.includes("session") && message.includes("expired")) {
    return "Your session expired. Please sign in again.";
  }

  return message.charAt(0).toUpperCase() + message.slice(1) || "Something went wrong. Try again.";
}
