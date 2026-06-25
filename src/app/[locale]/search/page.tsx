import { SearchPageClient } from "./search-page-client";

export const metadata = {
  title: "Search",
  description: "Search across all your study materials",
};

export default function SearchPage() {
  return <SearchPageClient />;
}
