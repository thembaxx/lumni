"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/chat/types";
import { fromDexieRecord, toDexieRecord } from "@/lib/chat/types";
import { sendChatStream } from "@/lib/chat/stream-adapter";
import { dexieDataAccess, type SyncDataAccess } from "@/lib/db";
import { logError } from "@/lib/shared/logger";

let _deps: { db: SyncDataAccess } = Object.freeze({ db: dexieDataAccess });

export function __setDepsForTesting(deps: { db: SyncDataAccess }) {
  _deps = Object.freeze({ ...deps });
}

export interface StreamingState {
  messageId: string | null;
  content: string;
  isActive: boolean;
}

interface UploadState {
  status: "idle" | "reading" | "uploading" | "processing" | "error" | "done";
  progress: number;
  error: string | null;
}

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState<StreamingState>({
    messageId: null,
    content: "",
    isActive: false,
  });
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    progress: 0,
    error: null,
  });
  const loadedRef = useRef(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const lastCountRef = useRef(0);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    _deps.db.chatMessages
      .toArray()
      .then((records) => {
        if (records.length > 0) {
          setMessages(records.map(fromDexieRecord));
        }
      })
      .catch((err) => logError("useChatStreamLoad", err));
  }, []);

  useEffect(() => {
    const currentCount = messages.length;
    if (currentCount === lastCountRef.current) return;
    lastCountRef.current = currentCount;
    const last = messages[currentCount - 1];
    if (!last || last.isStreaming) return;
    _deps.db.chatMessages.put(toDexieRecord(last)).catch((err) => {
      logError("useChatStreamPersist", err);
    });
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const isVoice = content.startsWith("data:audio/");
    const textContent = isVoice ? "" : content.trim();

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: textContent || "[Voice]",
      timestamp: new Date(),
      type: isVoice ? "voice" : "text",
      isVoice,
    };

    if (isVoice) {
      try {
        const transcribed = await transcribeAudio(content);
        userMessage.content = transcribed || "I said: [unrecognized]";
      } catch (err) {
        logError("VoiceTranscribe", err);
        userMessage.content = "[Voice message]";
      }
    }

    setMessages((prev) => [...prev, userMessage]);

    const assistantId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      type: "text",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setStreaming({ messageId: assistantId, content: "", isActive: true });

    const history = messagesRef.current
      .filter((m) => m.role !== "assistant" || !m.isStreaming)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const fullContent = await sendChatStream(
        { message: userMessage.content, history },
        {
          onToken: (token) => {
            setStreaming((prev) => ({
              ...prev,
              content: prev.content + token,
            }));
          },
          onDone: (content) => {
            setStreaming((prev) => ({ ...prev, content, isActive: false }));
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content, isStreaming: false, timestamp: new Date() }
                  : m,
              ),
            );
          },
          onError: (error) => {
            setStreaming((prev) => ({ ...prev, isActive: false }));
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: "Sorry, I hit a problem. Give me another try.",
                      isStreaming: false,
                    }
                  : m,
              ),
            );
          },
        },
      );

      if (fullContent) {
        setStreaming((prev) => ({ ...prev, content: fullContent, isActive: false }));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: fullContent, isStreaming: false, timestamp: new Date() }
              : m,
          ),
        );
      }
    } catch (err) {
      logError("useChatStreamSend", err);
      setStreaming((prev) => ({ ...prev, isActive: false }));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: "Sorry, I hit a problem. Give me another try.",
                isStreaming: false,
              }
            : m,
        ),
      );
    }
  }, []);

  const readFileAsDataUrl = useCallback(
    (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setUploadState((prev) => ({ ...prev, progress: pct }));
          }
        };
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      }),
    [],
  );

  const sendImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/") || file.size === 0) return;

      setUploadState({ status: "reading", progress: 0, error: null });

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: "[Image]",
        timestamp: new Date(),
        type: "image",
        imageFileName: file.name,
        imageFileSize: file.size,
        uploadState: "uploading",
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        const dataUrl = await readFileAsDataUrl(file);
        setUploadState({ status: "processing", progress: 50, error: null });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMessage.id ? { ...m, imageUrl: dataUrl, uploadState: "processing" } : m,
          ),
        );

        const response = await fetch("/api/chat/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: dataUrl, imageName: file.name }),
        });

        if (!response.ok) {
          throw new Error(`Upload failed (${response.status})`);
        }

        const result = await response.json();
        if (result.error) throw new Error(result.error);

        setMessages((prev) =>
          prev.map((m) => (m.id === userMessage.id ? { ...m, uploadState: "done" } : m)),
        );

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.content || "I can see your image. How can I help you with it?",
          timestamp: new Date(),
          type: "text",
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setUploadState({ status: "idle", progress: 0, error: null });
      } catch (err) {
        logError("useChatStreamImage", err);
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMessage.id ? { ...m, uploadState: "error", uploadError: msg } : m,
          ),
        );
        setUploadState({ status: "error", progress: 0, error: msg });
      }
    },
    [readFileAsDataUrl],
  );

  const retryImage = useCallback(async (messageId: string) => {
    const msg = messagesRef.current.find((m) => m.id === messageId);
    if (!msg?.imageUrl || !msg?.imageFileName) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, uploadState: "processing", uploadError: undefined } : m,
      ),
    );

    try {
      const response = await fetch("/api/chat/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: msg.imageUrl, imageName: msg.imageFileName }),
      });

      if (!response.ok) throw new Error(`Upload failed (${response.status})`);

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, uploadState: "done" } : m)),
      );

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.content || "I can see your image. How can I help you with it?",
        timestamp: new Date(),
        type: "text",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      logError("RetryImage", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, uploadState: "error", uploadError: "Retry failed" } : m,
        ),
      );
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setStreaming({ messageId: null, content: "", isActive: false });
  }, []);

  return {
    messages,
    streaming,
    uploadState,
    sendMessage,
    sendImage,
    retryImage,
    clearChat,
  };
}

async function transcribeAudio(dataUrl: string): Promise<string> {
  const response = await fetch("/api/engine/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio: dataUrl }),
  });

  if (!response.ok) throw new Error("Transcription failed");

  const result = await response.json();
  return result.text || "";
}
