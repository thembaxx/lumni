import Camera01Icon from "@hugeicons/core-free-icons/Camera01Icon";
import MailSend01Icon from "@hugeicons/core-free-icons/MailSend01Icon";
import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon";
import Upload01Icon from "@hugeicons/core-free-icons/Upload01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState } from "react";
import { AnimatedDialogContent } from "@/components/ui/animated-dialog-content";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import {
  DropdownList,
  DropdownListContent,
  DropdownListItem,
  DropdownListTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string) => void;
  onSendImage: (file: File) => void;
  isLoading?: boolean;
  uploadState: { status: string; progress: number; error: string | null };
}

export function ChatInput({ onSend, onSendImage, isLoading, uploadState }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput("");
    }
  };

  const handleVoiceRecording = (audioBlob: Blob | null) => {
    if (!audioBlob) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onSend(reader.result as string);
    };
    reader.readAsDataURL(audioBlob);
    setVoiceDialogOpen(false);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    onSendImage(file);
    (document.activeElement as HTMLElement)?.blur();
  };

  const isUploading = uploadState.status !== "idle";

  return (
    <div className="border-border/50 border-t bg-system-background/95 p-4">
      <AnimatedDialogContent
        open={voiceDialogOpen}
        onOpenChange={setVoiceDialogOpen}
        onRecordingComplete={handleVoiceRecording}
        title="Got a question?"
        description="Record your question and I'll help you find the answer."
      />

      {uploadState.status !== "idle" && (
        <Attachment
          state={uploadState.status as "idle" | "uploading" | "processing" | "error" | "done"}
          size="sm"
          className="mx-auto mb-2"
        >
          <AttachmentMedia variant="icon">
            <HugeiconsIcon icon={Upload01Icon} />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>
              {uploadState.status === "reading"
                ? "Reading file..."
                : uploadState.status === "uploading" || uploadState.status === "processing"
                  ? "Sending to AI..."
                  : uploadState.status === "error"
                    ? "Upload failed"
                    : "Upload complete"}
            </AttachmentTitle>
            <AttachmentDescription>
              {uploadState.status === "error" ? uploadState.error : `${uploadState.progress}%`}
            </AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      )}

      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            "rounded-lg border bg-secondary/60 p-4 transition-[border-color,box-shadow,transform,background-color] duration-300",
            isFocused
              ? "border-system-accent/40 bg-background ring-2 ring-system-accent/20"
              : "border-border/30",
            isLoading && "opacity-60",
          )}
        >
          <div className="mb-3">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Ask me a question about your studies…"
              aria-label="Ask me a question"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isLoading || isUploading}
              className="border-0 bg-transparent p-0 text-foreground shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-system-accent/30"
            />
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = "";
            }}
            disabled={isLoading || isUploading}
            aria-label="Take a photo"
          />
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = "";
            }}
            disabled={isLoading || isUploading}
            aria-label="Upload an image"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DropdownList open={attachOpen} onOpenChange={setAttachOpen}>
                <DropdownListTrigger
                  className={cn(
                    "inline-flex size-10 shrink-0 items-center justify-center rounded-md",
                    "cursor-pointer border border-border/30 text-muted-foreground shadow-sm hover:bg-secondary",
                    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-system-accent/50",
                    (isLoading || isUploading) && "pointer-events-none opacity-50",
                  )}
                  aria-label="Add image"
                >
                  <HugeiconsIcon icon={Camera01Icon} data-icon />
                </DropdownListTrigger>
                <DropdownListContent side="top" align="start" className="w-48">
                  <DropdownListItem
                    onClick={() => {
                      setAttachOpen(false);
                      cameraInputRef.current?.click();
                    }}
                    disabled={isLoading || isUploading}
                    className="gap-2 font-extrabold text-xs uppercase tracking-tight"
                  >
                    <HugeiconsIcon icon={Camera01Icon} data-icon="inline-start" />
                    Take a photo
                  </DropdownListItem>
                  <DropdownListItem
                    onClick={() => {
                      setAttachOpen(false);
                      uploadInputRef.current?.click();
                    }}
                    disabled={isLoading || isUploading}
                    className="gap-2 font-extrabold text-xs uppercase tracking-tight"
                  >
                    <HugeiconsIcon icon={Upload01Icon} data-icon="inline-start" />
                    Upload a photo
                  </DropdownListItem>
                </DropdownListContent>
              </DropdownList>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVoiceDialogOpen(true)}
                className="size-10 rounded-md border border-border/40 hover:bg-secondary"
                disabled={isLoading || isUploading}
                aria-label="Voice input"
              >
                <HugeiconsIcon icon={Mic01Icon} data-icon className="text-muted-foreground" />
              </Button>
              <Button
                type="submit"
                disabled={!input.trim() || isLoading || isUploading}
                className="size-10 rounded-md bg-system-accent text-white shadow-level-2 hover:bg-system-accent/90"
                aria-label="Send message"
              >
                <HugeiconsIcon icon={MailSend01Icon} data-icon />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
