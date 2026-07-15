import { PageContainer } from "@/components/layout/page-container";
import { SchoolOnboardingWizard } from "@/components/school/onboarding-wizard";

export default function SchoolOnboardingPage() {
  return (
    <PageContainer>
      <div className="py-12">
        <SchoolOnboardingWizard />
      </div>
    </PageContainer>
  );
}
