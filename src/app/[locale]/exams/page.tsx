import { redirect } from "next/navigation";

export default function ExamsRedirect() {
  redirect("/dashboard/exams");
}

export const instant = false;
