import type { Metadata } from "next";
import { StudyGroupsList } from "./study-groups-list";

export const metadata: Metadata = {
	title: "Study Groups",
};

export default function StudyGroupsPage() {
	return <StudyGroupsList />;
}
