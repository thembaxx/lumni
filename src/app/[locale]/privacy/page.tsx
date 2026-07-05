import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { appConfig } from "../../../../app.config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Lumni Privacy Policy — how we collect, use, and protect your data in compliance with POPIA.",
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: "1. Introduction",
    content: `Lumni ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform at ${appConfig.links.website}.

We comply with the Protection of Personal Information Act (POPIA) of South Africa. Please read this policy carefully.`,
  },
  {
    title: "2. Information We Collect",
    content: `We collect information you provide directly:
- Account information: name, email address, password
- Profile information: subjects, grade, school
- Usage data: quiz answers, flashcard reviews, study time, progress data
- Communications: support requests, feedback

We automatically collect:
- Device information: browser type, operating system
- Usage data: pages visited, features used, time spent
- Analytics data: page views, click patterns (with consent)`,
  },
  {
    title: "3. How We Use Your Information",
    content: `We use your information to:
- Provide and improve our AI-powered study platform
- Personalize quiz content and study recommendations
- Track your academic progress and generate insights
- Communicate with you about your account and updates
- Improve our AI models and question generation
- Detect and prevent abuse of our platform`,
  },
  {
    title: "4. AI Data Processing",
    content: `Lumni uses artificial intelligence to generate quiz questions, grade answers, provide hints, and create study plans.

When you submit questions or answers:
- Your data is sent to our AI providers (Google Gemini, NVIDIA NIM, Groq)
- AI providers do NOT use your data for training their models
- Generated content is stored in our secure database
- You can request deletion of your AI-generated content data at any time`,
  },
  {
    title: "5. Third-Party Services",
    content: `We use the following third-party services:
- Appwrite (authentication and database — EU/Swiss hosting)
- Vercel (hosting — global CDN)
- Sentry (error monitoring)
- UploadThing (file uploads)
- Ably (real-time study groups)
- Deepgram (speech-to-text for pronunciation)

Each service has its own privacy practices. We ensure data processing agreements are in place where required by POPIA.`,
  },
  {
    title: "6. Data Retention",
    content: `We retain your data for as long as your account is active. When you delete your account:
- Personal information is deleted within 30 days
- Anonymized usage statistics may be retained for analytics
- Backup copies are deleted within 90 days

Quiz and study data is retained to provide you with progress tracking. You can request deletion of specific data at any time.`,
  },
  {
    title: "7. Your Rights (POPIA)",
    content: `Under POPIA, you have the right to:
- Access your personal data
- Correct inaccurate data
- Delete your data and account
- Object to processing of your data
- Withdraw consent for analytics and marketing
- Lodge a complaint with the Information Regulator

To exercise these rights, email us at ${appConfig.contact.email}.`,
  },
  {
    title: "8. Security",
    content: `We implement appropriate technical and organizational measures to protect your data:
- Encryption in transit (TLS 1.3)
- Encrypted database storage
- Regular security audits
- Access controls and authentication
- Secure API endpoints

However, no electronic transmission or storage is 100% secure.`,
  },
  {
    title: "9. Children's Privacy",
    content: `Lumni is designed for South African Matric students, typically ages 15-19. Users under 13 must have parental consent to use the platform. We do not knowingly collect data from children under 13 without verified parental consent.`,
  },
  {
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-app notification. Continued use of the platform after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: "11. Contact Us",
    content: `For privacy-related inquiries:
Email: ${appConfig.contact.email}
Support: ${appConfig.contact.supportEmail}

Information Regulator (South Africa):
Website: https://inforegulator.org.za
Email: enquiries@inforegulator.org.za`,
  },
];

export default function PrivacyPage() {
  return (
    <PageContainer className="py-12">
      <h1 className="font-extrabold text-4xl tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground text-sm mb-8">Last updated: June 2026</p>
      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-semibold text-xl mb-2">{section.title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
              {section.content}
            </p>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}

export const instant = false;
