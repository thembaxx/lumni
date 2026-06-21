import type { Metadata } from "next";
import { StudyGroupsList } from "./study-groups-list";

export const metadata: Metadata = {
	title: "Study Groups - Lumni",
	description: "Collaborate and study together with your peers",
};

export default function StudyGroupsPage() {
	return <StudyGroupsList />;
}
