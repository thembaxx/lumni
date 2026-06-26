import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { BookmarksClient } from "./bookmarks-client";

export const metadata: Metadata = {
  title: "Bookmarks - Lumni",
  description: "View your bookmarked questions saved during quizzes",
};

export default async function BookmarksPage() {
  "use cache";
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BookmarksContent />
    </Suspense>
  );
}

async function BookmarksContent() {
  return <BookmarksClient />;
}
