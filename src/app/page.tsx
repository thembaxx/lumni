import type { Metadata } from "next";
import { HomeContent } from "@/components/home/home-content";
import { appConfig } from "../../app.config";

export const metadata: Metadata = {
	title: "Pass your Matric with confidence",
	description: appConfig.description,
};

export default function Home() {
	return <HomeContent />;
}
