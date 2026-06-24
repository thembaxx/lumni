import { unstable_noStore as noStore } from "next/cache";

export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  noStore();
  return children;
}
