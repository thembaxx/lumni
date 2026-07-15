import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";

export interface WhiteboardState {
  objects: Map<string, WhiteboardObject>;
  awareness: Map<number, UserAwareness>;
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

export interface UserAwareness {
  userId: string;
  userName: string;
  color: string;
  cursor?: { x: number; y: number };
  currentTool?: string;
  selection?: string[];
}

export class WhiteboardService {
  private doc: Y.Doc;
  private provider: WebrtcProvider | null = null;
  private objectsMap: Y.Map<WhiteboardObject>;
  private awareness: any;
  private roomName: string;
  private userId: string;
  private userName: string;
  private userColor: string;

  constructor(roomName: string, userId: string, userName: string, userColor: string) {
    this.roomName = roomName;
    this.userId = userId;
    this.userName = userName;
    this.userColor = userColor;
    this.doc = new Y.Doc();
    this.objectsMap = this.doc.getMap("whiteboard-objects");
  }

  connect(): void {
    if (this.provider) return;

    this.provider = new WebrtcProvider(this.roomName, this.doc, {
      signaling: ["wss://signaling.yjs.dev"],
    });

    this.awareness = this.provider.awareness;
    this.awareness.setLocalStateField("user", {
      id: this.userId,
      name: this.userName,
      color: this.userColor,
    });

    this.provider.on("status", (event: { connected: boolean }) => {
      console.log("Whiteboard connection status:", event.connected ? "connected" : "disconnected");
    });

    this.provider.on("synced", (isSynced: boolean) => {
      console.log("Whiteboard synced:", isSynced);
    });
  }

  disconnect(): void {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }
    this.doc.destroy();
  }

  addObject(object: Omit<WhiteboardObject, "id" | "createdAt" | "updatedAt">): string {
    const id = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const fullObject: WhiteboardObject = {
      ...object,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.objectsMap.set(id, fullObject);
    return id;
  }

  updateObject(id: string, updates: Partial<WhiteboardObject>): void {
    const existing = this.objectsMap.get(id);
    if (existing) {
      this.objectsMap.set(id, { ...existing, ...updates, updatedAt: Date.now() });
    }
  }

  deleteObject(id: string): void {
    this.objectsMap.delete(id);
  }

  getObjects(): WhiteboardObject[] {
    const objects: WhiteboardObject[] = [];
    this.objectsMap.forEach((value) => objects.push(value));
    return objects;
  }

  setAwareness(state: Partial<UserAwareness>): void {
    this.awareness.setLocalStateField("user", {
      ...this.awareness.getLocalState()?.user,
      ...state,
    });
  }

  getAwarenessStates(): Map<number, UserAwareness> {
    const states = new Map<number, UserAwareness>();
    this.awareness.getStates().forEach((state: any, clientId: number) => {
      if (state.user) {
        states.set(clientId, state.user);
      }
    });
    return states;
  }

  onObjectsChange(callback: (objects: WhiteboardObject[]) => void): () => void {
    const observer = () => callback(this.getObjects());
    this.objectsMap.observe(observer);
    return () => this.objectsMap.unobserve(observer);
  }

  onAwarenessChange(callback: (states: Map<number, UserAwareness>) => void): () => void {
    const observer = () => callback(this.getAwarenessStates());
    this.awareness.on("change", observer);
    return () => this.awareness.off("change", observer);
  }

  onSync(callback: (isSynced: boolean) => void): () => void {
    if (!this.provider) return () => {};
    const observer = (isSynced: boolean) => callback(isSynced);
    this.provider.on("synced", observer);
    return () => this.provider?.off("synced", observer);
  }

  exportState(): string {
    return JSON.stringify(this.getObjects());
  }

  importState(json: string): void {
    try {
      const objects = JSON.parse(json);
      this.doc.transact(() => {
        this.objectsMap.clear();
        for (const obj of objects) {
          this.objectsMap.set(obj.id, obj);
        }
      });
    } catch (err) {
      console.error("Failed to import whiteboard state:", err);
    }
  }
}

export function generateUserColor(userId: string): string {
  const colors = [
    "#EF4444", "#F97316", "#F59E0B", "#EAB308",
    "#84CC16", "#22C55E", "#10B981", "#14B8A6",
    "#06B6D4", "#0EA5E9", "#3B82F6", "#6366F1",
    "#8B5CF6", "#A855F7", "#D946EF", "#EC4899",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}