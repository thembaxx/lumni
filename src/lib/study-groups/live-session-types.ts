export interface LiveSession {
  $id: string;
  groupId: string;
  startedBy: string;
  startedByName?: string;
  subject?: string;
  status: "active" | "ended";
  startedAt: string;
  endedAt?: string;
}
