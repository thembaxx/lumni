"use client";

import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import Chat01Icon from "@hugeicons/core-free-icons/Chat01Icon";
import StarsIcon from "@hugeicons/core-free-icons/StarsIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence } from "motion/react";
import { useEffect, useRef } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { LoadingIndicator } from "@/components/chat/LoadingIndicator";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { WelcomeState } from "@/components/chat/WelcomeState";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/use-chat";
import { useImageChatWithSend } from "@/hooks/use-image-chat";
import { Link } from "@/i18n/navigation";

export const instant = false;

function ChatContent() {
  const chat = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { imageProcessing, sendImage, retryLastImage, resetState } = useImageChatWithSend(chat);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="flex h-full flex-col bg-background/95">
      <div className="flex shrink-0 items-center justify-between border-border/30 border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-system-accent/10">
            <HugeiconsIcon icon={Chat01Icon} className="size-6 text-system-accent" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight">Study Assistant</span>
            {chat.messages.length === 0 && chat.hasContext && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <HugeiconsIcon icon={StarsIcon} className="size-3" />
                Personalised to your progress
              </span>
            )}
          </div>
        </div>
        <Link href="/dashboard">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Back to dashboard"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-5 text-muted-foreground" />
          </Button>
        </Link>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {chat.messages.length === 0 ? (
          <WelcomeState />
        ) : (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {chat.messages.map((message) => (
                <MessageBubble key={message.id} message={message} onRetry={retryLastImage} />
              ))}
              {chat.isLoading && <LoadingIndicator />}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput
        onPaperPlane={chat.sendMessage}
        isLoading={chat.isLoading}
        onPaperPlaneImage={sendImage}
        imageProcessing={imageProcessing}
        onDismissImageProcessing={() => resetState()}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <AppErrorBoundary>
      <ChatContent />
    </AppErrorBoundary>
  );
}
