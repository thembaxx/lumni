import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeletons";
import { AdminPageClient } from "./admin-page-client";

export default function AdminPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  return <AdminPageClient />;
}
