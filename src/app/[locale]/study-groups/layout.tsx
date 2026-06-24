import { unstable_noStore as noStore } from "next/cache";
import { AblyProvider } from "@/components/study-groups/ably-provider";

export default function StudyGroupsLayout({ children }: { children: React.ReactNode }) {
  noStore();
  return <AblyProvider>{children}</AblyProvider>;
}
