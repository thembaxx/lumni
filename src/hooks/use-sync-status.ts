"use client";

import { useCallback, useState } from "react";
import { dexieDataAccess, type SyncDataAccess } from "@/lib/db";
import { logError } from "@/lib/shared/logger";
import { useInterval } from "./use-interval";

let _deps: { db: SyncDataAccess } = Object.freeze({ db: dexieDataAccess });
function __setDepsForTesting(deps: { db: SyncDataAccess }) {
  _deps = Object.freeze({ ...deps });
}

import { useOnlineStatus } from "./useOnlineStatus";

export function useSyncStatus() {
  const { isOnline } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);

  const checkPending = useCallback(async () => {
    try {
      const items = await _deps.db.jobs.where("status").equals("pending").count();
      setPendingCount(items);
    } catch (err) {
      logError("UseSyncStatus", err);
      setPendingCount(0);
    }
  }, []);

  useInterval(checkPending, 10000);

  return { isOnline, pendingCount };
}
