import { unstable_noStore as noStore } from "next/cache";

export default function StudyGroupsLayout({ children }: { children: React.ReactNode }) {
  noStore();
  return children;
}
