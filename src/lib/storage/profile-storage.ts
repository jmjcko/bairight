import { BiomechanicalProfile, AgentChatMessage } from '../agent/types';
import { INITIAL_BIOMECHANICAL_PROFILE } from '../agent/state-machine';

interface SessionState {
  sessionId: string;
  profile: BiomechanicalProfile;
  messages: AgentChatMessage[];
  lastActive: Date;
}

// Global in-memory cache to maintain session state across hot reloads & requests
const sessionStore = new Map<string, SessionState>();

export class ProfileStorageManager {
  static getOrCreateSession(sessionId: string): SessionState {
    let session = sessionStore.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        profile: { ...INITIAL_BIOMECHANICAL_PROFILE },
        messages: [],
        lastActive: new Date(),
      };
      sessionStore.set(sessionId, session);
    }
    return session;
  }

  static getProfile(sessionId: string): BiomechanicalProfile {
    return this.getOrCreateSession(sessionId).profile;
  }

  static updateProfile(sessionId: string, updates: Partial<BiomechanicalProfile>): BiomechanicalProfile {
    const session = this.getOrCreateSession(sessionId);
    session.profile = {
      ...session.profile,
      ...updates,
    };
    session.lastActive = new Date();
    return session.profile;
  }

  static getMessages(sessionId: string): AgentChatMessage[] {
    return this.getOrCreateSession(sessionId).messages;
  }

  static addMessage(sessionId: string, message: AgentChatMessage): void {
    const session = this.getOrCreateSession(sessionId);
    session.messages.push(message);
    session.lastActive = new Date();
  }
}
