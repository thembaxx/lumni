import { unstable_noStore as noStore } from "next/cache";

export default function GhostLayout({ children }: { children: React.ReactNode }) {
  noStore();
  return children;
}
