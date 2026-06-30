import type { Metadata } from "next";
import { appConfig } from "../../../../app.config";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Lumni Terms of Service — rules and guidelines for using our AI-powered study platform.",
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using Lumni ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.

These terms apply to all users, including students, teachers, and parents.`,
  },
  {
    title: "2. Eligibility",
    content: `You must be at least 13 years old to use Lumni. If you are between 13 and 18, you must have parental or guardian consent.

By creating an account, you represent that you meet these requirements and that all information you provide is accurate.`,
  },
  {
    title: "3. Account Registration",
    content: `You are responsible for maintaining the confidentiality of your login credentials. You must notify us immediately of any unauthorized use of your account.

We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    title: "4. User Conduct",
    content: `You agree not to:
- Use the Platform for any illegal purpose
- Attempt to gain unauthorized access to our systems
- Upload malicious code or attempt to compromise the Platform
- Use automated tools (bots, scrapers) without permission
- Harass, abuse, or harm other users
- Submit false or misleading information`,
  },
  {
    title: "5. User-Generated Content",
    content: `You retain ownership of content you create on Lumni, including flashcards, study notes, and quiz responses.

By submitting content, you grant Lumni a non-exclusive, worldwide license to:
- Store and display your content on the Platform
- Use your content to improve our AI algorithms (anonymized)
- Share your content with other users if you choose to make it public

You represent that your content does not violate any third-party rights.`,
  },
  {
    title: "6. AI-Generated Content",
    content: `Lumni uses artificial intelligence to generate educational content. While we strive for accuracy:
- AI-generated content may contain errors or inaccuracies
- Always verify important information with your textbooks and teachers
- We are not liable for decisions based on AI-generated content
- Report inaccurate content using the feedback mechanism`,
  },
  {
    title: "7. Intellectual Property",
    content: `The Lumni platform, including its design, code, branding, and proprietary algorithms, is owned by Lumni and protected by South African and international intellectual property laws.

You may not copy, modify, distribute, or reverse-engineer any part of the Platform without our written consent.`,
  },
  {
    title: "8. Limitation of Liability",
    content: `Lumni is provided "as is" without warranties of any kind. To the maximum extent permitted by law:
- We are not liable for indirect, incidental, or consequential damages
- Our total liability is limited to the amount you have paid us in the past 12 months
- We do not guarantee that the Platform will be uninterrupted or error-free
- We are not responsible for content from third-party links`,
  },
  {
    title: "9. Termination",
    content: `We may suspend or terminate your access to the Platform at any time, with or without cause, including violation of these terms.

Upon termination:
- Your right to use the Platform ends immediately
- We may delete your data after 30 days
- Sections 5, 7, 8, and 11 survive termination`,
  },
  {
    title: "10. Changes to Terms",
    content: `We may modify these terms at any time. Material changes will be notified via email or in-app notification. Continued use after changes constitutes acceptance of the new terms.`,
  },
  {
    title: "11. Governing Law",
    content: `These terms are governed by the laws of the Republic of South Africa. Any disputes shall be resolved in the courts of South Africa.

If any provision is found unenforceable, the remaining provisions remain in effect.`,
  },
  {
    title: "12. Contact",
    content: `For questions about these terms:
Email: ${appConfig.contact.email}
Support: ${appConfig.contact.supportEmail}`,
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-extrabold text-4xl tracking-tight mb-2">Terms of Service</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Last updated: June 2026 | Version {appConfig.legal.tosVersion}
      </p>
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
    </div>
  );
}
