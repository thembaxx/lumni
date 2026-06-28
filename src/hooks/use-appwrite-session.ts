"use client";

import { createApiQuery } from "@/hooks/use-hook-factories";

interface SessionUser {
  userId: string | null;
  name: string | null;
  email: string | null;
}

interface UseAppwriteSessionReturn {
  user: SessionUser;
  isLoading: boolean;
  isLoggedIn: boolean;
}

async function fetchSession(): Promise<SessionUser> {
  const res = await fetch("/api/session");
  return res.json();
}

const useSession = createApiQuery<SessionUser, void>({
  queryKey: ["appwrite-session"],
  fetchFn: fetchSession,
  staleTime: 5 * 60 * 1000,
  retry: 0,
});

export function useAppwriteSession(): UseAppwriteSessionReturn {
  const { data: user, isLoading } = useSession(undefined);
  return {
    user: user ?? { userId: null, name: null, email: null },
    isLoading,
    isLoggedIn: user?.userId !== null,
  };
}
