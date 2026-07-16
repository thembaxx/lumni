import { PageContainer } from "@/components/layout/page-container";
import { SchoolBillingClient } from "./school-billing-client";

export default function SchoolBillingPage() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-6 py-8">
        <h1 className="text-2xl font-bold">Billing</h1>
        <SchoolBillingClient />
      </div>
    </PageContainer>
  );
}
