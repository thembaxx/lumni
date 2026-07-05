import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { ChatContent } from "./chat-content";

export default function ChatPage() {
  return (
    <AppErrorBoundary>
      <div className="relative min-h-dvh bg-system-grouped">
        <AmbientGradient variant="default" />
        <NoiseOverlay opacity={0.015} />
        <ChatContent />
      </div>
    </AppErrorBoundary>
  );
}
