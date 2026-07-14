import * as m from "motion/react-m";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import type { FlashcardSM2 } from "@/lib/flashcard-engine";
import { iOSEase } from "@/lib/utils/animation";

interface FlashcardCardProps {
  card: FlashcardSM2;
  onEdit: (card: FlashcardSM2) => void;
  onDelete: (id: string) => void;
}

export function FlashcardCard({ card, onEdit, onDelete }: FlashcardCardProps) {
  return (
    <m.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2, ease: iOSEase }}
      className="cursor-pointer rounded-3xl border p-4 transition-colors hover:bg-accent/5"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <MarkdownRenderer
            content={card.front}
            subject={card.subject}
            className="mb-2 font-medium"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          {card.subject && (
            <span className="rounded bg-secondary/50 px-2 py-0.5 text-xs">{card.subject}</span>
          )}
          {card.topic && (
            <span className="rounded bg-secondary/50 px-2 py-0.5 text-xs">{card.topic}</span>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(card)}
          aria-label="Edit flashcard"
        >
          <div>
            <svg
              data-icon
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>Edit flashcard</title>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4-1 1-4 9.5-9.5z" />
            </svg>
          </div>
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => onDelete(card.id)}
          aria-label="Delete flashcard"
        >
          <div>
            <svg
              data-icon
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>Delete flashcard</title>
              <path d="M3 6h18" />
              <path d="M19 9v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9" />
              <path d="M8 6v.01" />
              <path d="M16 6v.01" />
            </svg>
          </div>
        </Button>
      </div>
    </m.div>
  );
}
