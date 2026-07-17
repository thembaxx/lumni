export interface CollaborativeSession {
  id: string;
  groupId: string;
  hostId: string;
  hostName: string;
  subject: string;
  topic?: string;
  status: "waiting" | "active" | "ended";
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  maxParticipants: number;
  currentParticipants: number;
  recordingEnabled: boolean;
  recordingId?: string;
}

export interface SessionParticipant {
  userId: string;
  userName: string;
  avatarUrl?: string;
  role: "host" | "co-host" | "participant";
  joinedAt: number;
  isMuted: boolean;
  isVideoEnabled: boolean;
  currentTool?: string;
  cursor?: { x: number; y: number };
  color?: string;
}

export interface WhiteboardStroke {
  id: string;
  userId: string;
  points: number[];
  color: string;
  width: number;
  tool: "pen" | "eraser" | "highlighter" | "shape";
  shapeType?: "rectangle" | "circle" | "line" | "arrow";
  timestamp: number;
}

export interface WhiteboardObject {
  id: string;
  type: "stroke" | "text" | "image" | "shape" | "sticky";
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  data: Record<string, unknown>;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface SessionMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  type: "chat" | "system" | "voice" | "whiteboard";
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface SessionRecording {
  id: string;
  sessionId: string;
  hostId: string;
  startedAt: number;
  endedAt?: number;
  duration: number;
  size: number;
  chunks: RecordingChunk[];
  status: "recording" | "processing" | "ready" | "failed";
  playbackUrl?: string;
  thumbnailUrl?: string;
}

export interface RecordingChunk {
  id: string;
  recordingId: string;
  startTime: number;
  endTime: number;
  blobUrl: string;
  index: number;
}

export interface VoiceState {
  userId: string;
  isSpeaking: boolean;
  volume: number;
  isMuted: boolean;
  isDeafened: boolean;
}

export interface CollaborativeSessionConfig {
  subject: string;
  topic?: string;
  maxParticipants?: number;
  recordingEnabled?: boolean;
  voiceEnabled?: boolean;
  whiteboardEnabled?: boolean;
  inviteCode?: string;
}

export interface SessionInvite {
  code: string;
  sessionId: string;
  groupId: string;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  maxUses: number;
  usedCount: number;
}
