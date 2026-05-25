import type { Metadata } from "next";
import { GroupDetail } from "./group-detail";

export const metadata: Metadata = {
	title: "Study Group",
};

export default async function GroupDetailPage() {
	return <GroupDetail />;
}
