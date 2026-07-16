import { PageContainer } from "@/components/layout/page-container";
import { SchoolOnboardingWizard } from "@/components/school/onboarding-wizard";

export default function SchoolOnboardingPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl py-8">
        <SchoolOnboardingWizard />
      </div>
    </PageContainer>
  );
}
