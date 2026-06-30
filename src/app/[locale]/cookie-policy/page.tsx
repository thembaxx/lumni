import type { Metadata } from "next";
import { appConfig } from "../../../../app.config";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Lumni Cookie Policy — how we use cookies and similar technologies on our platform.",
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: "1. What Are Cookies",
    content: `Cookies are small text files stored on your device when you visit a website. They help us make the Platform work, improve your experience, and understand how you use our service.`,
  },
  {
    title: "2. Essential Cookies",
    content: `These cookies are necessary for the Platform to function:
- Session cookies: keep you logged in during your visit
- Security cookies: protect against fraud and abuse
- Preference cookies: remember your settings (theme, language)

Essential cookies cannot be disabled. They do not collect personal information for marketing purposes.`,
  },
  {
    title: "3. Analytics Cookies",
    content: `With your consent, we use analytics cookies to understand how you use the Platform:
- Page views and navigation patterns
- Feature usage and engagement
- Error rates and performance metrics

We use Sentry for error tracking and may use additional analytics tools. Data is anonymized where possible.`,
  },
  {
    title: "4. Third-Party Cookies",
    content: `Some third-party services we use may set their own cookies:
- Vercel (hosting analytics)
- Appwrite (authentication)
- Sentry (error monitoring)
- Ably (real-time features)

These cookies are governed by the respective third-party privacy policies.`,
  },
  {
    title: "5. Managing Cookies",
    content: `You can manage your cookie preferences:
- Click "Cookie Settings" on the cookie banner
- Adjust browser settings to block or delete cookies
- Use your browser's private/incognito mode

Blocking essential cookies may prevent the Platform from working properly.`,
  },
  {
    title: "6. Changes to This Policy",
    content: `We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated revision date.`,
  },
  {
    title: "7. Contact",
    content: `For questions about our use of cookies:
Email: ${appConfig.contact.email}`,
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-extrabold text-4xl tracking-tight mb-2">Cookie Policy</h1>
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
    </div>
  );
}
