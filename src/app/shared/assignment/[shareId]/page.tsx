import { Suspense } from "react";
import { SharedAssignmentClient } from "./assignment-client";

export const instant = false;

export default function SharedAssignmentPage() {
  return (
    <Suspense>
      <SharedAssignmentClient />
    </Suspense>
  );
}
