import { Suspense } from "react";
import { SharedDeckClient } from "./deck-client";


export default function SharedDeckPage() {
  return (
    <Suspense>
      <SharedDeckClient />
    </Suspense>
  );
}
