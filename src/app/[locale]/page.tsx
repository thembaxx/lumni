import type { Metadata } from "next";
import { createElement } from "react";
import { HomeContent } from "@/components/home/home-content";
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
	const html = JSON.stringify(jsonLd);
	const prop = "dangerouslySetInnerHTML";
	return createElement("script", {
		type: "application/ld+json",
		[prop]: { __html: html },
	});
}

export default function Home() {
	return (
		<>
			<JsonLdScript />
			<HomeContent />
		</>
	);
}
