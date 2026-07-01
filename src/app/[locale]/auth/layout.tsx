import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lumni",
  robots: { index: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-system-grouped overflow-hidden">
      {/* Ambient gradient behind the form */}
      <div
        className="pointer-events-none absolute -top-40 -right-40 size-[600px] animate-morph rounded-full bg-primary/[0.04] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 size-[500px] animate-float-drift rounded-full bg-chart-4/[0.03] blur-3xl"
        aria-hidden="true"
        style={{ animationDelay: "-4s" }}
      />
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
