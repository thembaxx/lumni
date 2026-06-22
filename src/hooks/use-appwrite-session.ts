"use client";

import { useQuery } from "@tanstack/react-query";

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

export function useAppwriteSession(): UseAppwriteSessionReturn {
  const { data: user, isLoading } = useQuery({
    queryKey: ["appwrite-session"],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    user: user ?? { userId: null, name: null, email: null },
    isLoading,
    isLoggedIn: user?.userId !== null,
  };
}
