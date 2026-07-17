import { PageContainer } from "@/components/layout/page-container";
import { SchoolAdminClient } from "./school-admin-client";

export default function SchoolAdminPage() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-6 py-8">
        <h1 className="text-2xl font-bold">School Admin</h1>
        <SchoolAdminClient />
      </div>
    </PageContainer>
  );
}
