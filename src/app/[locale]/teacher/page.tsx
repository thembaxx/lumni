import type { Metadata } from "next";
import { TeacherDashboardClient } from "./teacher-dashboard-client";

export const metadata: Metadata = {
  title: "Teacher Dashboard - Lumni",
  description: "Manage your class, track student progress, and create assignments",
};

export default function TeacherDashboardPage() {
  return <TeacherDashboardClient />;
}

export const instant = false;
