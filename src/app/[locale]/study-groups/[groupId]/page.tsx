import type { Metadata } from "next";
import { GroupDetail } from "./group-detail";

export const metadata: Metadata = {
  title: "Study Group",
};

export const instant = false;

export default function GroupDetailPage() {
  return <GroupDetail />;
}
