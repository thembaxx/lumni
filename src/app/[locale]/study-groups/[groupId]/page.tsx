import type { Metadata } from "next";
import { GroupDetail } from "./group-detail";

export const metadata: Metadata = {
  title: "Study Group",
};

export default function GroupDetailPage() {
  return <GroupDetail />;
}

export const instant = false;
