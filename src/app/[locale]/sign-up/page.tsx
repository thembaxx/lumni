import { redirect } from "next/navigation";

export const instant = false;

export default function SignUpRedirect() {
  redirect("/auth/sign-up");
}
