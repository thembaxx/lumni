import * as SimplePeer from "simple-peer";

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

  constructor(config: VoiceConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
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

      this.notifyStateChange();
    } catch (err) {
      console.error("Failed to get user media:", err);
      throw new Error("Microphone access denied");
    }
  }

  connect(roomId: string): void {
    // In a real implementation, this would connect to a signaling server
    // For now, we'll use the simple-peer mesh with a signaling mechanism
    console.log("Voice connecting to room:", roomId);
  }

  async createOffer(targetUserId: string): Promise<RTCSessionDescriptionInit> {
    const peer = this.createPeer(targetUserId, true);
    const offer = await peer._pc.createOffer();
    await peer._pc.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(targetUserId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const peer = this.createPeer(targetUserId, false);
    await peer._pc.setRemoteDescription(offer);
    const answer = await peer._pc.createAnswer();
    await peer._pc.setLocalDescription(answer);
    return answer;
  }

  async addIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(targetUserId);
    if (peer) {
      await peer._pc.addIceCandidate(candidate);
    }
  }

  private createPeer(targetUserId: string, initiator: boolean): SimplePeer.Instance {
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

    peer.on("signal", (signal) => {
      // Send signal to target user via signaling server
      this.sendSignal(targetUserId, signal);
    });

    peer.on("stream", (stream) => {
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

    peer.on("error", (err) => {
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

  private sendSignal(targetUserId: string, signal: any): void {
    // In a real implementation, send via Ably or signaling server
    console.log("Sending signal to", targetUserId, signal.type);
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
      peer.stream.getAudioTracks().forEach((track) => {
        // Web Audio API would be needed for actual volume control
        // This is a placeholder
      });
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
  }
}

export function createVoiceService(config: VoiceConfig): VoiceService {
  return new VoiceService(config);
}