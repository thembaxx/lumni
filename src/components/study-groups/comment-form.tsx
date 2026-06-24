"use client";

import { useCallback, useRef, useState } from "react";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  placeholder?: string;
  onSubmit: (content: string, parentId?: string) => void;
}

export function CommentForm({
  postId: _postId,
  parentId,
  placeholder = "Write a comment...",
  onSubmit,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSubmit(trimmed, parentId);
    setContent("");
    textareaRef.current?.focus();
  }, [content, parentId, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="flex items-start gap-2">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Comment"
        rows={2}
        className="min-h-10 flex-1 resize-none rounded-lg border border-[--system-border] bg-[--system-surface] px-3 py-2 text-[--system-text-primary] text-base placeholder:text-[--system-text-tertiary] focus:border-[--system-accent] focus:outline-none"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!content.trim()}
        className="shrink-0 rounded-lg bg-[--system-accent] px-3 py-2 font-medium text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        Post
      </button>
    </div>
  );
}
