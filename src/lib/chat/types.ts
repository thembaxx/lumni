export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type: "text" | "image" | "voice";
  imageUrl?: string;
  imageFileName?: string;
  imageFileSize?: number;
  isVoice?: boolean;
  uploadState?: "idle" | "uploading" | "processing" | "error" | "done";
  uploadError?: string;
  isStreaming?: boolean;
}

export interface DexieMessageRecord {
  id?: number;
  messageId: string;
  role: "user" | "assistant";
  content: string;
  type?: string;
  timestamp: number;
  imageUrl?: string;
  imageFileName?: string;
  imageFileSize?: number;
  isVoice?: boolean;
}

export function fromDexieRecord(record: DexieMessageRecord): ChatMessage {
  return {
    id: record.messageId,
    role: record.role,
    content: record.content,
    type: (record.type as ChatMessage["type"]) || "text",
    timestamp: new Date(record.timestamp),
    imageUrl: record.imageUrl,
    imageFileName: record.imageFileName,
    imageFileSize: record.imageFileSize,
    isVoice: record.isVoice,
  };
}

export function toDexieRecord(message: ChatMessage): DexieMessageRecord {
  return {
    messageId: message.id,
    role: message.role,
    content: message.content,
    type: message.type,
    timestamp: message.timestamp.getTime(),
    imageUrl: message.imageUrl,
    imageFileName: message.imageFileName,
    imageFileSize: message.imageFileSize,
    isVoice: message.isVoice,
  };
}

export function groupMessages(messages: ChatMessage[]): ChatMessage[][] {
  return messages.reduce<ChatMessage[][]>((groups, msg) => {
    const last = groups[groups.length - 1];
    if (last && last[0].role === msg.role && last[0].type === msg.type) {
      last.push(msg);
    } else {
      groups.push([msg]);
    }
    return groups;
  }, []);
}
