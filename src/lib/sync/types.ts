export interface SyncOutboxEntry {
  id?: number;
  table: string;
  recordId: string;
  operation: "create" | "update" | "delete";
  data: string;
  createdAt: number;
  retries: number;
}

export interface SyncCheckpoint {
  table: string;
  lastPulledAt: number;
  lastPulledVersion: string;
}

export interface SyncStatus {
  state: "idle" | "syncing" | "error" | "offline";
  pendingWrites: number;
  lastSyncAt: number | null;
  lastError: string | null;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}

export interface SyncService {
  start(): void;
  stop(): void;
  status(): SyncStatus;
  trigger(): Promise<SyncResult>;
  onStatusChange(cb: (status: SyncStatus) => void): () => void;
}
