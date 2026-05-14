import type { Metadata } from "next";
import { appConfig } from "../../app.config";
import { HomeContent } from "@/components/home/home-content";

export const metadata: Metadata = {
	title: "Pass your Matric with confidence",
	description: appConfig.description,
};

export default function Home() {
	return <HomeContent />;
}
