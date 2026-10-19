/**
 * Chat Quota Service
 * Manages zero-friction free chat tiers backed by platform Google Gemini API key:
 * - Guest (anonymous): 5 queries per shopping session
 * - Authenticated (Google sign-in): 15 queries per calendar day
 * - BYOK (custom key in vault): Unlimited (bypasses quota completely)
 */

export interface ChatQuotaStatus {
  tier: "guest" | "authenticated" | "unlimited";
  totalAllowed: number;
  used: number;
  remaining: number;
  isExhausted: boolean;
  resetsAt?: string;
}

export const GUEST_QUOTA_LIMIT = 5;
export const LOGGED_IN_DAILY_QUOTA_LIMIT = 15;

export class ChatQuotaService {
  private static getTodayKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  private static getMidnightResetIso(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  /**
   * Retrieves current quota status without incrementing
   */
  static getQuotaStatus(params: {
    sessionId?: string;
    userId?: string;
    hasCustomKey?: boolean;
  }): ChatQuotaStatus {
    const { sessionId = "default-session", userId, hasCustomKey = false } = params;

    // 1. If user provided their own BYOK key, they have unlimited access
    if (hasCustomKey) {
      return {
        tier: "unlimited",
        totalAllowed: Infinity,
        used: 0,
        remaining: Infinity,
        isExhausted: false,
      };
    }

    if (typeof window === "undefined") {
      // Server-side fallback default
      return {
        tier: userId ? "authenticated" : "guest",
        totalAllowed: userId ? LOGGED_IN_DAILY_QUOTA_LIMIT : GUEST_QUOTA_LIMIT,
        used: 0,
        remaining: userId ? LOGGED_IN_DAILY_QUOTA_LIMIT : GUEST_QUOTA_LIMIT,
        isExhausted: false,
      };
    }

    try {
      // 2. Authenticated user with daily limit
      if (userId) {
        const today = this.getTodayKey();
        const key = `bairight_daily_chat_quota_${userId}_${today}`;
        const raw = localStorage.getItem(key);
        const used = raw ? parseInt(raw, 10) || 0 : 0;
        const remaining = Math.max(0, LOGGED_IN_DAILY_QUOTA_LIMIT - used);
        return {
          tier: "authenticated",
          totalAllowed: LOGGED_IN_DAILY_QUOTA_LIMIT,
          used,
          remaining,
          isExhausted: remaining <= 0,
          resetsAt: this.getMidnightResetIso(),
        };
      }

      // 3. Anonymous guest with per-session limit
      const guestKey = `bairight_free_chat_quota_${sessionId}`;
      const raw = localStorage.getItem(guestKey);
      const used = raw ? parseInt(raw, 10) || 0 : 0;
      const remaining = Math.max(0, GUEST_QUOTA_LIMIT - used);
      return {
        tier: "guest",
        totalAllowed: GUEST_QUOTA_LIMIT,
        used,
        remaining,
        isExhausted: remaining <= 0,
      };
    } catch (e) {
      console.warn("Could not read quota from localStorage:", e);
      return {
        tier: userId ? "authenticated" : "guest",
        totalAllowed: userId ? LOGGED_IN_DAILY_QUOTA_LIMIT : GUEST_QUOTA_LIMIT,
        used: 0,
        remaining: userId ? LOGGED_IN_DAILY_QUOTA_LIMIT : GUEST_QUOTA_LIMIT,
        isExhausted: false,
      };
    }
  }

  /**
   * Consumes one query and returns the updated status
   */
  static consumeQuery(params: {
    sessionId?: string;
    userId?: string;
    hasCustomKey?: boolean;
  }): ChatQuotaStatus {
    const { sessionId = "default-session", userId, hasCustomKey = false } = params;

    if (hasCustomKey) {
      return {
        tier: "unlimited",
        totalAllowed: Infinity,
        used: 0,
        remaining: Infinity,
        isExhausted: false,
      };
    }

    if (typeof window === "undefined") {
      return this.getQuotaStatus(params);
    }

    try {
      if (userId) {
        const today = this.getTodayKey();
        const key = `bairight_daily_chat_quota_${userId}_${today}`;
        const currentRaw = localStorage.getItem(key);
        const current = currentRaw ? parseInt(currentRaw, 10) || 0 : 0;
        const nextUsed = current + 1;
        localStorage.setItem(key, String(nextUsed));
        const remaining = Math.max(0, LOGGED_IN_DAILY_QUOTA_LIMIT - nextUsed);
        return {
          tier: "authenticated",
          totalAllowed: LOGGED_IN_DAILY_QUOTA_LIMIT,
          used: nextUsed,
          remaining,
          isExhausted: remaining <= 0,
          resetsAt: this.getMidnightResetIso(),
        };
      }

      const guestKey = `bairight_free_chat_quota_${sessionId}`;
      const currentRaw = localStorage.getItem(guestKey);
      const current = currentRaw ? parseInt(currentRaw, 10) || 0 : 0;
      const nextUsed = current + 1;
      localStorage.setItem(guestKey, String(nextUsed));
      const remaining = Math.max(0, GUEST_QUOTA_LIMIT - nextUsed);
      return {
        tier: "guest",
        totalAllowed: GUEST_QUOTA_LIMIT,
        used: nextUsed,
        remaining,
        isExhausted: remaining <= 0,
      };
    } catch (e) {
      console.warn("Could not consume quota in localStorage:", e);
      return this.getQuotaStatus(params);
    }
  }
}
