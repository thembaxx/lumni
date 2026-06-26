import { redirect } from "next/navigation";

export const instant = false;

export default function SignInRedirect() {
  redirect("/auth/sign-in");
}
