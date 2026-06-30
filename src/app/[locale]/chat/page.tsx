import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { ChatContent } from "./chat-content";

export default function ChatPage() {
  return (
    <AppErrorBoundary>
      <ChatContent />
    </AppErrorBoundary>
  );
}
