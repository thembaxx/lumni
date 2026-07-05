"use client";

import { memo, useMemo } from "react";

interface WordHighlightTextProps {
  text: string;
  currentWordIndex: number;
}

export const WordHighlightText = memo(function WordHighlightText({
  text,
  currentWordIndex,
}: WordHighlightTextProps) {
  const paragraphs = useMemo(() => text.split(/\n\n+/), [text]);

  return (
    <div className="flex flex-col gap-4">
      {paragraphs.map((para, pi) => {
        const words = para.split(/\s+/);
        let wordOffset = 0;
        for (let i = 0; i < pi; i++) {
          wordOffset += paragraphs[i].split(/\s+/).length;
        }

        return (
          <p key={pi} className="leading-relaxed text-sm">
            {words.map((word, wi) => {
              const globalIndex = wordOffset + wi;
              const isCurrent = globalIndex === currentWordIndex;
              return (
                <span
                  key={`${pi}-${wi}`}
                  data-word-index={globalIndex}
                  className={`transition-colors duration-150 ${
                    isCurrent
                      ? "rounded-sm bg-(--system-accent)/20 font-semibold text-(--system-accent) shadow-[0_0_0_2px_var(--system-accent-alpha-20)]"
                      : currentWordIndex >= 0 && globalIndex < currentWordIndex
                        ? "text-foreground/40"
                        : ""
                  }`}
                >
                  {word}
                  {wi < words.length - 1 ? " " : ""}
                </span>
              );
            })}
          </p>
        );
      })}
    </div>
  );
});
