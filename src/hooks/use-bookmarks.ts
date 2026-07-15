import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookmarkService } from "@/lib/services/bookmark-service";

export interface Bookmark {
  id: string;
  questionText: string;
  subject: string;
  topic: string;
  savedAt: number;
  note?: string;
}

function mapRecord(r: {
  id?: number;
  questionId: string;
  questionText: string;
  subject: string;
  topic: string;
  savedAt: number;
  note?: string;
}): Bookmark {
  return {
    id: r.questionId,
    questionText: r.questionText,
    subject: r.subject,
    topic: r.topic,
    savedAt: r.savedAt,
    note: r.note,
  };
}

export function useBookmarks() {
  const queryClient = useQueryClient();
  const queryKey = ["bookmarks"];

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const records = await bookmarkService.getAll();
      return records.map(mapRecord);
    },
    staleTime: 30_000,
  });

  const addBookmark = useMutation({
    mutationFn: async (bookmark: Omit<Bookmark, "savedAt">) => {
      await bookmarkService.add({
        questionId: bookmark.id,
        questionText: bookmark.questionText,
        subject: bookmark.subject,
        topic: bookmark.topic,
        note: bookmark.note,
        savedAt: Date.now(),
      });
    },
    onMutate: async (bookmark) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Bookmark[]>(queryKey);
      queryClient.setQueryData<Bookmark[]>(queryKey, (old) => {
        const entry: Bookmark = { ...bookmark, savedAt: Date.now() };
        if (old?.some((b) => b.id === entry.id)) return old;
        return [entry, ...(old ?? [])];
      });
      return { prev };
    },
    onError: (_, __, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const removeBookmark = useMutation({
    mutationFn: (id: string) => bookmarkService.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Bookmark[]>(queryKey);
      queryClient.setQueryData<Bookmark[]>(
        queryKey,
        (old) => old?.filter((b) => b.id !== id) ?? [],
      );
      return { prev };
    },
    onError: (_, __, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const toggleBookmark = useMutation({
    mutationFn: async (questionId: string) => {
      const wasBookmarked = bookmarks.some((b) => b.id === questionId);
      if (wasBookmarked) {
        await bookmarkService.remove(questionId);
      } else {
        await bookmarkService.add({
          questionId,
          questionText: "",
          subject: "",
          topic: "",
          savedAt: Date.now(),
        });
      }
    },
    onMutate: async (questionId) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Bookmark[]>(queryKey);
      const wasBookmarked = prev?.some((b) => b.id === questionId);
      queryClient.setQueryData<Bookmark[]>(queryKey, (old) => {
        if (wasBookmarked) return old?.filter((b) => b.id !== questionId) ?? [];
        const entry: Bookmark = {
          id: questionId,
          questionText: "",
          subject: "",
          topic: "",
          savedAt: Date.now(),
        };
        return [entry, ...(old ?? [])];
      });
      return { prev };
    },
    onError: (_, __, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateNote = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      bookmarkService.updateNote(id, note),
    onMutate: async ({ id, note }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Bookmark[]>(queryKey);
      queryClient.setQueryData<Bookmark[]>(
        queryKey,
        (old) => old?.map((b) => (b.id === id ? { ...b, note } : b)) ?? [],
      );
      return { prev };
    },
    onError: (_, __, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const isBookmarked = (id: string) => bookmarks.some((b) => b.id === id);

  return {
    bookmarks,
    isLoading,
    addBookmark: (bookmark: Omit<Bookmark, "savedAt">) => addBookmark.mutate(bookmark),
    removeBookmark: (id: string) => removeBookmark.mutate(id),
    toggleBookmark: (questionId: string) => toggleBookmark.mutate(questionId),
    updateNote: (id: string, note: string) => updateNote.mutate({ id, note }),
    isBookmarked,
  };
}
