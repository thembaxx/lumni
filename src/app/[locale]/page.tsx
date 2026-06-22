import type { Metadata } from "next";
import { createElement } from "react";
import { HomeContent } from "@/components/home/home-content";
import { SiteFooter } from "@/components/home/site-footer";
import { appConfig } from "../../../app.config";

export const metadata: Metadata = {
  title: "Pass your Matric with confidence",
  description: appConfig.description,
  openGraph: {
    title: `${appConfig.name} — ${appConfig.descriptionShort}`,
    description: appConfig.description,
    type: "website",
    siteName: appConfig.name,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: appConfig.name,
  description: appConfig.description,
  url: appConfig.links.website,
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
    url: appConfig.links.website,
  },
};

function JsonLdScript() {
  return createElement("script", {
    type: "application/ld+json",
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data for SEO, static constant
    dangerouslySetInnerHTML: { __html: JSON.stringify(jsonLd) },
  });
}

export default function Home() {
  return (
    <>
      <JsonLdScript />
      <HomeContent />
      <SiteFooter />
    </>
  );
}
