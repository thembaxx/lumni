import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

const mockGetAll = vi.hoisted(() => vi.fn());

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const t: Record<string, string> = {
      "flashcards.browseTitle": "Browse",
      "flashcards.searchPlaceholder": "Search cards...",
      "flashcards.allSubjects": "All Subjects",
      "flashcards.refresh": "Refresh",
      "flashcards.exportCsv": "Export CSV",
      "flashcards.importCsv": "Import CSV",
      "flashcards.importing": "Importing...",
      "flashcards.importCsvAria": "Import CSV",
      "flashcards.noMatchFilters": "No matching cards",
      "flashcards.browseEmpty": "No cards yet",
      "flashcards.cardCount": "{count} cards",
      "flashcards.deleteCard": "Delete card",
      "flashcards.previous": "Previous",
      "flashcards.next": "Next",
      "flashcards.pageInfo": "Page {page} of {totalPages}",
      "flashcards.ease": "Ease",
      "flashcards.interval": "Interval",
      "flashcards.dueLabel": "Due",
      "flashcards.overdue": "Overdue",
    };
    let msg = t[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        msg = msg.replace(`{${k}}`, String(v));
      }
    }
    return msg;
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/flashcards/browse",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/flashcard-engine", () => ({
  flashcardEngine: {
    getAll: mockGetAll,
    delete: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("motion/react", () => ({
  useReducedMotion: () => false,
}));

vi.mock("motion/react-m", () => ({
  div: ({ children, ...props }: Record<string, unknown>) => {
    const { initial: _initial, animate: _animate, transition: _transition, ...rest } = props;
    return <div {...rest}>{children}</div>;
  },
}));

import { FlashcardBrowseClient } from "../flashcard-browse-client";

const sampleCards = [
  {
    id: "1",
    front: "What is 2+2?",
    back: "4",
    subject: "Mathematics",
    topic: "Arithmetic",
    easeFactor: 2.5,
    interval: 10,
    nextReview: Date.now() + 86400000,
  },
  {
    id: "2",
    front: "Capital of France",
    back: "Paris",
    subject: "Geography",
    topic: "Europe",
    easeFactor: 2.0,
    interval: 5,
    nextReview: Date.now() - 86400000,
  },
];

describe("FlashcardBrowseClient", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test("loads all cards once on mount and filters in memory on keystroke", async () => {
    mockGetAll.mockResolvedValue(sampleCards);

    render(<FlashcardBrowseClient />);

    // Wait for the async load to complete — card count text appears
    await waitFor(() => {
      expect(screen.getByText("2 cards")).not.toBeNull();
    });

    // getAll should have been called at least once (React StrictMode may double-invoke effects)
    const callsAfterMount = mockGetAll.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThanOrEqual(1);
    expect(mockGetAll).toHaveBeenCalledWith(undefined);

    // Type first keystroke
    const searchInput = screen.getByRole("textbox");
    fireEvent.change(searchInput, { target: { value: "f" } });

    // Wait for debounce (200ms) to take effect
    await new Promise((r) => setTimeout(r, 300));

    // getAll should NOT have been called again after mount — no new Dexie reads per keystroke
    expect(mockGetAll).toHaveBeenCalledTimes(callsAfterMount);

    // Type second keystroke
    fireEvent.change(searchInput, { target: { value: "fr" } });

    // Wait for debounce again
    await new Promise((r) => setTimeout(r, 300));

    // Still no additional getAll calls
    expect(mockGetAll).toHaveBeenCalledTimes(callsAfterMount);

    // Filtered results should show only "Capital of France" (matches "fr")
    await waitFor(() => {
      expect(screen.getByText("1 cards")).not.toBeNull();
    });
  });
});
