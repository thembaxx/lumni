import { Suspense } from "react";
import { SharedDeckClient } from "./deck-client";

export const instant = false;

export default function SharedDeckPage() {
  return (
    <Suspense>
      <SharedDeckClient />
    </Suspense>
  );
}
