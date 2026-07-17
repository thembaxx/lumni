import SimplePeer from "simple-peer";

export interface VoicePeer {
  userId: string;
  peer: SimplePeer.Instance;
  stream?: MediaStream;
  isMuted: boolean;
  isDeafened: boolean;
  volume: number;
}

export interface VoiceState {
  userId: string;
  userName: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  volume: number;
}

export interface VoiceConfig {
  roomName: string;
  userId: string;
  userName: string;
  maxPeers: number;
  iceServers?: RTCIceServer[];
  publishSignal?: (targetUserId: string, signal: unknown) => void;
}

export class VoiceError extends Error {
  constructor(
    message: string,
    public readonly code: "MIC_DENIED" | "PEER_LIMIT" | "SIGNAL_FAILED",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "VoiceError";
  }
}

export class VoiceService {
  private config: VoiceConfig;
  private localStream: MediaStream | null = null;
  private peers: Map<string, VoicePeer> = new Map();
  private voiceStates: Map<string, VoiceState> = new Map();
  private onStateChangeCallbacks: Set<(states: VoiceState[]) => void> = new Set();
  private onPeerConnectedCallbacks: Set<(userId: string) => void> = new Set();
  private onPeerDisconnectedCallbacks: Set<(userId: string) => void> = new Set();
  private localAudioEnabled = true;
  private connectedRoomId: string | null = null;
  private initialized = false;

  constructor(config: VoiceConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
        video: false,
      });

      this.voiceStates.set(this.config.userId, {
        userId: this.config.userId,
        userName: this.config.userName,
        isSpeaking: false,
        isMuted: false,
        isDeafened: false,
        volume: 1.0,
      });

      this.initialized = true;
      this.notifyStateChange();
    } catch (err) {
      this.initialized = false;
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        throw new VoiceError(
          "Microphone permission denied. Please allow microphone access in your browser settings.",
          "MIC_DENIED",
          { cause: err },
        );
      }
      if (err instanceof DOMException && err.name === "NotFoundError") {
        throw new VoiceError(
          "No microphone found. Please connect a microphone and try again.",
          "MIC_DENIED",
          { cause: err },
        );
      }
      throw new VoiceError("Failed to access microphone", "MIC_DENIED", { cause: err });
    }
  }

  async connect(roomId: string): Promise<MediaStream> {
    await this.initialize();
    this.connectedRoomId = roomId;

    return this.localStream!;
  }

  async createOffer(targetUserId: string): Promise<RTCSessionDescriptionInit> {
    if (!this.localStream) throw new Error("Local stream not available");
    const peer = this.createPeer(targetUserId, true);
    return new Promise<RTCSessionDescriptionInit>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Offer generation timed out"));
      }, 10000);
      peer.once("signal", (signal: unknown) => {
        clearTimeout(timeout);
        resolve(signal as RTCSessionDescriptionInit);
      });
    });
  }

  async createAnswer(
    targetUserId: string,
    offer: RTCSessionDescriptionInit,
  ): Promise<RTCSessionDescriptionInit> {
    if (!this.localStream) throw new Error("Local stream not available");
    const peer = this.createPeer(targetUserId, false);
    peer.signal(offer);
    return new Promise<RTCSessionDescriptionInit>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Answer generation timed out"));
      }, 10000);
      peer.once("signal", (signal: unknown) => {
        clearTimeout(timeout);
        resolve(signal as RTCSessionDescriptionInit);
      });
    });
  }

  async addIceCandidate(_targetUserId: string, _candidate: RTCIceCandidateInit): Promise<void> {
    // No-op: SimplePeer handles ICE via built-in signaling
  }

  handleSignal(userId: string, signal: unknown): void {
    const existing = this.peers.get(userId);
    if (existing) {
      existing.peer.signal(signal as string | SimplePeer.SignalData);
    } else if (
      signal &&
      typeof signal === "object" &&
      "type" in (signal as object) &&
      (signal as { type: string }).type === "offer"
    ) {
      const peer = this.createPeer(userId, false);
      peer.signal(signal as string | SimplePeer.SignalData);
    }
  }

  private createPeer(targetUserId: string, initiator: boolean): any {
    const peer = new SimplePeer({
      initiator,
      trickle: true,
      stream: this.localStream!,
      config: {
        iceServers: this.config.iceServers || [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    peer.on("signal", (signal: unknown) => {
      // Send signal to target user via signaling server
      this.sendSignal(targetUserId, signal);
    });

    peer.on("stream", (stream: MediaStream) => {
      this.handleRemoteStream(targetUserId, stream);
    });

    peer.on("connect", () => {
      console.log("Voice peer connected:", targetUserId);
      this.onPeerConnectedCallbacks.forEach((cb) => cb(targetUserId));
    });

    peer.on("close", () => {
      console.log("Voice peer disconnected:", targetUserId);
      this.peers.delete(targetUserId);
      this.voiceStates.delete(targetUserId);
      this.notifyStateChange();
      this.onPeerDisconnectedCallbacks.forEach((cb) => cb(targetUserId));
    });

    peer.on("error", (err: Error) => {
      console.error("Voice peer error:", err);
    });

    this.peers.set(targetUserId, {
      userId: targetUserId,
      peer,
      isMuted: false,
      isDeafened: false,
      volume: 1.0,
    });

    return peer;
  }

  private handleRemoteStream(userId: string, stream: MediaStream): void {
    const peer = this.peers.get(userId);
    if (peer) {
      peer.stream = stream;
      this.voiceStates.set(userId, {
        userId,
        userName: userId, // Would be passed from signaling
        isSpeaking: false,
        isMuted: false,
        isDeafened: false,
        volume: 1.0,
      });
      this.notifyStateChange();
    }
  }

  private sendSignal(targetUserId: string, signal: unknown): void {
    if (this.config.publishSignal) {
      try {
        this.config.publishSignal(targetUserId, signal);
      } catch (err) {
        console.error("Voice signal publish failed:", err);
      }
    } else {
      console.warn("Voice: no publishSignal callback configured — signal not sent");
    }
  }

  setMuted(muted: boolean): void {
    this.localAudioEnabled = !muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    const state = this.voiceStates.get(this.config.userId);
    if (state) {
      state.isMuted = muted;
      this.notifyStateChange();
    }
  }

  setDeafened(deafened: boolean): void {
    const state = this.voiceStates.get(this.config.userId);
    if (state) {
      state.isDeafened = deafened;
      this.notifyStateChange();
    }
    // Mute all remote audio
    this.peers.forEach((peer) => {
      if (peer.stream) {
        peer.stream.getAudioTracks().forEach((track) => {
          track.enabled = !deafened;
        });
      }
    });
  }

  setVolume(userId: string, volume: number): void {
    const peer = this.peers.get(userId);
    if (peer && peer.stream) {
      // Web Audio API would be needed for actual volume control
    }
    const state = this.voiceStates.get(userId);
    if (state) {
      state.volume = volume;
      this.notifyStateChange();
    }
  }

  setSpeaking(userId: string, isSpeaking: boolean): void {
    const state = this.voiceStates.get(userId);
    if (state) {
      state.isSpeaking = isSpeaking;
      this.notifyStateChange();
    }
  }

  getVoiceStates(): VoiceState[] {
    return Array.from(this.voiceStates.values());
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  onStateChange(callback: (states: VoiceState[]) => void): () => void {
    this.onStateChangeCallbacks.add(callback);
    return () => this.onStateChangeCallbacks.delete(callback);
  }

  onPeerConnected(callback: (userId: string) => void): () => void {
    this.onPeerConnectedCallbacks.add(callback);
    return () => this.onPeerConnectedCallbacks.delete(callback);
  }

  onPeerDisconnected(callback: (userId: string) => void): () => void {
    this.onPeerDisconnectedCallbacks.add(callback);
    return () => this.onPeerDisconnectedCallbacks.delete(callback);
  }

  private notifyStateChange(): void {
    const states = this.getVoiceStates();
    this.onStateChangeCallbacks.forEach((cb) => cb(states));
  }

  destroy(): void {
    this.peers.forEach((peer) => {
      peer.peer.destroy();
    });
    this.peers.clear();
    this.voiceStates.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    this.onStateChangeCallbacks.clear();
    this.onPeerConnectedCallbacks.clear();
    this.onPeerDisconnectedCallbacks.clear();
    this.initialized = false;
    this.connectedRoomId = null;
  }
}

export function createVoiceService(config: VoiceConfig): VoiceService {
  return new VoiceService(config);
}
