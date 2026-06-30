import { Suspense } from "react";
import { SharedAssignmentClient } from "./assignment-client";

export default function SharedAssignmentPage() {
  return (
    <Suspense>
      <SharedAssignmentClient />
    </Suspense>
  );
}
