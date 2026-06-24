"use client";

import { ChatClientProvider } from "@ably/chat/react";
import { useAblyChat } from "@/hooks/use-ably-chat";

export function AblyProvider({ children }: { children: React.ReactNode }) {
  const chatClient = useAblyChat();

  if (!chatClient) return children;

  return <ChatClientProvider client={chatClient}>{children}</ChatClientProvider>;
}
