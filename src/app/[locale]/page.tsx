import type { Metadata } from "next";
import { createElement } from "react";
import { HomeContent } from "@/components/home/home-content";
import { SiteFooter } from "@/components/home/site-footer";
import { appConfig } from "../../../app.config";


export const metadata: Metadata = {
  title: "Pass your Matric with confidence",
  description: appConfig.description,
  alternates: {
    canonical: appConfig.siteUrl,
  },
  openGraph: {
    title: `${appConfig.name} — ${appConfig.descriptionShort}`,
    description: appConfig.description,
    type: "website",
    siteName: appConfig.name,
    url: appConfig.siteUrl,
    locale: "en_ZA",
    images: [
      {
        url: "/og-image.webp",
        width: 1200,
        height: 630,
        alt: `${appConfig.name} - AI Study Companion`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${appConfig.name} — ${appConfig.descriptionShort}`,
    description: appConfig.description,
    images: ["/og-image.webp"],
  },
};

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: appConfig.name,
  url: appConfig.siteUrl,
  logo: `${appConfig.siteUrl}/favicon.ico`,
  description: appConfig.descriptionShort,
  contactPoint: {
    "@type": "ContactPoint",
    email: appConfig.contact.email,
    contactType: "customer support",
  },
};

const jsonLdWebApp = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: appConfig.name,
  description: appConfig.description,
  url: appConfig.siteUrl,
  applicationCategory: "EducationalApplication",
  educationalUse: ["Practice", "Assessment", "Homework"],
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "Student",
  },
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "ZAR",
  },
  author: {
    "@type": "Organization",
    name: appConfig.name,
    url: appConfig.siteUrl,
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.5",
    bestRating: "5",
    ratingCount: "150",
  },
};

function JsonLdScript({ data }: { data: object }) {
  return createElement("script", {
    type: "application/ld+json",
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data for SEO, safe static object
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  });
}

export default function Home() {
  return (
    <>
      <JsonLdScript data={jsonLdOrganization} />
      <JsonLdScript data={jsonLdWebApp} />
      <HomeContent />
      <SiteFooter />
    </>
  );
}
