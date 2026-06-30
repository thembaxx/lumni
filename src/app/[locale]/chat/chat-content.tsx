"use client";

import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import Chat01Icon from "@hugeicons/core-free-icons/Chat01Icon";
import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { useState } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ImageViewer } from "@/components/chat/ImageViewer";
import { WelcomeState } from "@/components/chat/WelcomeState";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Button } from "@/components/ui/button";
import { useChatStream } from "@/hooks/use-chat-stream";
import { Link } from "@/i18n/navigation";
import { groupMessages } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <m.div
          key={i}
          initial={{ scale: 0.5, opacity: 0.3 }}
          animate={{
            scale: [0.5, 1, 0.5],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
          className="size-1.5 rounded-full bg-system-accent/60"
        />
      ))}
    </div>
  );
}

function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute top-1/4 right-0 size-[400px] animate-aurora rounded-full bg-primary/[0.04] blur-3xl" />
      <div
        className="absolute bottom-1/4 left-0 size-[350px] animate-aurora rounded-full bg-chart-4/[0.03] blur-3xl"
        style={{ animationDelay: "-4s" }}
      />
    </div>
  );
}

export function ChatContent() {
  const { messages, streaming, uploadState, sendMessage, sendImage, retryImage } = useChatStream();
  const [imageViewerState, setImageViewerState] = useState<{
    src: string;
    name: string;
  } | null>(null);

  const mergedMessages =
    streaming.isActive && streaming.messageId && streaming.content
      ? messages.map((m) =>
          m.id === streaming.messageId ? { ...m, content: streaming.content } : m,
        )
      : messages;

  const grouped = groupMessages(mergedMessages);
  const isEmpty = messages.length === 0 && !streaming.isActive;

  return (
    <div className="relative flex h-full flex-col bg-background/95">
      <AuroraBackground />

      <m.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-header flex shrink-0 items-center justify-between border-border/20 border-b bg-background/80 px-4 py-3 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <div
              className="absolute inset-0 animate-ping rounded-xl bg-primary/10"
              style={{ animationDuration: "3s" }}
            />
            <HugeiconsIcon icon={Chat01Icon} className="size-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-[-0.011em]">Study Assistant</span>
            <span className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-success" />
              </span>
              {streaming.isActive ? "Typing..." : "Online"}
            </span>
          </div>
        </div>
        <Link href="/dashboard">
          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 rounded-full transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
            aria-label="Back to dashboard"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-5 text-muted-foreground" />
          </Button>
        </Link>
      </m.div>

      <MessageScrollerProvider autoScroll defaultScrollPosition="end">
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent>
              {isEmpty ? (
                <WelcomeState />
              ) : (
                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {grouped.map((group, gi) => {
                    const isUser = group[0].role === "user";
                    return (
                      <MessageGroup key={`g-${gi}-${group[0].id}`}>
                        {group.map((msg, msgIdx) => (
                          <m.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                              duration: 0.25,
                              ease: [0.16, 1, 0.3, 1],
                              delay: msgIdx * 0.03,
                            }}
                          >
                            <Message align={isUser ? "end" : "start"}>
                              {msgIdx === 0 && (
                                <MessageAvatar>
                                  <div
                                    className={cn(
                                      "flex size-8 items-center justify-center rounded-xl text-xs font-bold transition-transform duration-200",
                                      isUser
                                        ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-level-1"
                                        : "bg-gradient-to-br from-muted to-muted/80 text-muted-foreground",
                                    )}
                                  >
                                    {isUser ? "U" : "AI"}
                                  </div>
                                </MessageAvatar>
                              )}
                              <MessageContent>
                                {msgIdx === 0 && group.length > 1 && (
                                  <MessageHeader>
                                    {isUser ? "You" : "Study Assistant"}
                                  </MessageHeader>
                                )}
                                {msg.type === "image" ? (
                                  <Attachment state={msg.uploadState ?? "done"} size="sm">
                                    <AttachmentMedia variant="image">
                                      {msg.imageUrl && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setImageViewerState({
                                              src: msg.imageUrl!,
                                              name: msg.imageFileName || "Image",
                                            });
                                          }}
                                          className="block size-full cursor-pointer"
                                          aria-label="View full image"
                                        >
                                          {/* oxlint-disable-next-line next/no-img-element -- blob URL */}
                                          <img
                                            src={msg.imageUrl}
                                            alt={msg.imageFileName || "Uploaded image"}
                                            className={cn(
                                              "size-full object-cover",
                                              msg.uploadState === "error" && "opacity-50 grayscale",
                                            )}
                                          />
                                        </button>
                                      )}
                                    </AttachmentMedia>
                                    <AttachmentContent>
                                      <AttachmentTitle>
                                        {msg.imageFileName || "Image"}
                                      </AttachmentTitle>
                                      <AttachmentDescription>
                                        {msg.uploadState === "error"
                                          ? msg.uploadError || "Upload failed"
                                          : msg.imageFileSize
                                            ? `${(msg.imageFileSize / 1024).toFixed(0)} KB`
                                            : "Ready"}
                                      </AttachmentDescription>
                                    </AttachmentContent>
                                    {msg.uploadState === "error" && (
                                      <AttachmentActions>
                                        <AttachmentAction
                                          onClick={() => retryImage(msg.id)}
                                          aria-label="Retry upload"
                                        >
                                          <HugeiconsIcon icon={RefreshIcon} />
                                        </AttachmentAction>
                                      </AttachmentActions>
                                    )}
                                  </Attachment>
                                ) : (
                                  <Bubble variant={isUser ? "default" : "tinted"} align="start">
                                    <BubbleContent>
                                      <div className="flex items-start gap-1.5">
                                        {msg.isVoice && (
                                          <HugeiconsIcon
                                            icon={Mic01Icon}
                                            className="mt-0.5 size-3.5 shrink-0 opacity-60"
                                          />
                                        )}
                                        <div className="min-w-0">
                                          <MarkdownRenderer content={msg.content} />
                                        </div>
                                      </div>
                                    </BubbleContent>
                                  </Bubble>
                                )}
                                {msgIdx === group.length - 1 && (
                                  <MessageFooter>
                                    {msg.timestamp.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </MessageFooter>
                                )}
                              </MessageContent>
                            </Message>
                          </m.div>
                        ))}
                      </MessageGroup>
                    );
                  })}
                </m.div>
              )}
              {streaming.isActive && !streaming.content && (
                <m.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Message align="start">
                    <MessageAvatar>
                      <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-muted to-muted/80 text-xs font-bold text-muted-foreground">
                        AI
                      </div>
                    </MessageAvatar>
                    <MessageContent>
                      <Marker role="status" aria-busy="true">
                        <MarkerIcon>
                          <TypingDots />
                        </MarkerIcon>
                        <MarkerContent className="text-muted-foreground text-xs">
                          Thinking
                        </MarkerContent>
                      </Marker>
                    </MessageContent>
                  </Message>
                </m.div>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>
      </MessageScrollerProvider>

      <ChatInput
        onSend={sendMessage}
        onSendImage={sendImage}
        isLoading={streaming.isActive}
        uploadState={uploadState}
      />

      {imageViewerState && (
        <ImageViewer
          src={imageViewerState.src}
          alt={imageViewerState.name}
          open={!!imageViewerState}
          onClose={() => setImageViewerState(null)}
        />
      )}
    </div>
  );
}
