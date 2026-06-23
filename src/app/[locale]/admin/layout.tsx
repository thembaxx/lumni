import { unstable_noStore as noStore } from "next/cache";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  noStore();
  return <>{children}</>;
}
