import type { Metadata } from "next";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { ProblemsClient } from "./problems-client";

export const metadata: Metadata = {
  title: "Problem Library - Lumni",
  description: "Browse curated practice problems with step-by-step solutions",
};

export default function ProblemsPage() {
  return (
    <div className="relative min-h-dvh bg-system-grouped">
      <AmbientGradient variant="study" />
      <NoiseOverlay opacity={0.015} />
      <ProblemsClient />
    </div>
  );
}

export const instant = false;
