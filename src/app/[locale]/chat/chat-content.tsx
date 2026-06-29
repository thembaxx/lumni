"use client";

import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import Chat01Icon from "@hugeicons/core-free-icons/Chat01Icon";
import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import StarsIcon from "@hugeicons/core-free-icons/StarsIcon";
import { HugeiconsIcon } from "@hugeicons/react";
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
    <div className="flex h-full flex-col bg-background/95">
      <div className="flex shrink-0 items-center justify-between border-border/30 border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-system-accent/10">
            <HugeiconsIcon icon={Chat01Icon} className="size-6 text-system-accent" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight">Study Assistant</span>
            {isEmpty && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <HugeiconsIcon icon={StarsIcon} className="size-3" />
                Personalized to your progress
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

      <MessageScrollerProvider autoScroll defaultScrollPosition="end">
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent>
              {isEmpty ? (
                <WelcomeState />
              ) : (
                grouped.map((group) => {
                  const isUser = group[0].role === "user";
                  return (
                    <MessageGroup key={`g-${group[0].id}`}>
                      {group.map((msg, msgIdx) => (
                        <Message key={msg.id} align={isUser ? "end" : "start"}>
                          {msgIdx === 0 && (
                            <MessageAvatar>
                              <div
                                className={cn(
                                  "flex size-8 items-center justify-center rounded-full text-xs font-bold",
                                  isUser
                                    ? "bg-system-accent text-white"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                {isUser ? "U" : "AI"}
                              </div>
                            </MessageAvatar>
                          )}
                          <MessageContent>
                            {msgIdx === 0 && group.length > 1 && (
                              <MessageHeader>{isUser ? "You" : "Study Assistant"}</MessageHeader>
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
                                  <AttachmentTitle>{msg.imageFileName || "Image"}</AttachmentTitle>
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
                      ))}
                    </MessageGroup>
                  );
                })
              )}
              {streaming.isActive && !streaming.content && (
                <Message align="start">
                  <MessageAvatar>
                    <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      AI
                    </div>
                  </MessageAvatar>
                  <MessageContent>
                    <Marker role="status" aria-busy="true" className="shimmer">
                      <MarkerIcon>
                        <div className="size-3 animate-pulse rounded-full bg-system-accent/50" />
                      </MarkerIcon>
                      <MarkerContent>Thinking...</MarkerContent>
                    </Marker>
                  </MessageContent>
                </Message>
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
