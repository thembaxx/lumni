import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { ChatContent } from "./chat-content";

export const instant = false;

export default function ChatPage() {
  return (
    <AppErrorBoundary>
      <ChatContent />
    </AppErrorBoundary>
  );
}
