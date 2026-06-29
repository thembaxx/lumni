export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullContent: string) => void;
  onError: (error: string) => void;
}

export interface ChatStreamRequest {
  message: string;
  history?: { role: string; content: string }[];
}

export async function sendChatStream(
  body: ChatStreamRequest,
  callbacks: StreamCallbacks,
  abortSignal?: AbortSignal,
): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(body),
    signal: abortSignal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const msg =
      response.status === 429
        ? "Too many requests. Please wait a moment and try again."
        : response.status >= 500
          ? "AI service is temporarily unavailable. Please try again."
          : text || `Request failed (${response.status})`;
    callbacks.onError(msg);
    throw new Error(msg);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const msg = "Stream not available";
    callbacks.onError(msg);
    throw new Error(msg);
  }

  return parseSSEStream(reader, callbacks);
}

export function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  callbacks: StreamCallbacks,
): Promise<string> {
  const decoder = new TextDecoder();
  let buffer = "";
  let fullContent = "";

  return new Promise<string>((resolve, reject) => {
    function processLines(lines: string[]) {
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed === "data: [DONE]") {
          callbacks.onDone(fullContent);
          resolve(fullContent);
          return;
        }
        if (trimmed.startsWith("data: ")) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.error) {
              callbacks.onError(data.error);
              reject(new Error(data.error));
              return;
            }
            if (data.token) {
              fullContent += data.token;
              callbacks.onToken(data.token);
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    }

    function pump(): void {
      reader
        .read()
        .then(({ done, value }) => {
          if (done) {
            if (!fullContent) {
              callbacks.onDone(fullContent);
              resolve(fullContent);
            }
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          processLines(lines);
          pump();
        })
        .catch((err) => {
          const msg = err instanceof Error ? err.message : "Stream read error";
          callbacks.onError(msg);
          reject(err);
        });
    }

    pump();
  });
}
