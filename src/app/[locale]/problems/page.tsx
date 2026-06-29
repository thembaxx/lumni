import type { Metadata } from "next";
import { ProblemsClient } from "./problems-client";

export const metadata: Metadata = {
  title: "Problem Library - Lumni",
  description: "Browse curated practice problems with step-by-step solutions",
};


export default function ProblemsPage() {
  return <ProblemsClient />;
}
