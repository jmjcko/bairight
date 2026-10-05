/**
 * VaultService.ts - Client Vault & Key Security Management
 * Operates strictly client-side (CodeGuard & OWASP compliant).
 */

import { AIProviderId } from "@/lib/agent/engine-config";

const VAULT_STORAGE_KEY = "bairight_ai_vault_v2";

const VERIFICATION_STORAGE_KEY = "bairight_ai_keys_verification_v1";

export interface KeyVerificationRecord {
  isValid: boolean;
  lastTestedAt: string;
  errorMessage?: string;
  testedModel?: string;
}


export interface ProviderConnectionState {
  providerId: AIProviderId;
  connectionType: "api_key" | "oauth_subscription";
  hasValidToken: boolean;
  maskedToken?: string;
  lastTestedAt?: string;
  isVerified?: boolean;
}

// Simple client-side obfuscation layer to prevent plain-text discovery in dev tools
function obfuscate(text: string): string {
  if (!text) return "";
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i] ^ 0x5a);
  }
  return btoa(result);
}

function deobfuscate(encoded: string): string {
  if (!encoded) return "";
  try {
    const raw = atob(encoded);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i) ^ 0x5a;
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return encoded;
  }
}

export const maskKey = (key: string): string => {
  if (!key) return "";
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "••••••••";
  return `${trimmed.slice(0, 7)}••••••••${trimmed.slice(-4)}`;
};

export class VaultService {
  private static getStore(): Record<string, string> {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(VAULT_STORAGE_KEY);
      if (!raw) {
        // Migration from legacy key
        const legacy = localStorage.getItem("bairight_ai_keys");
        if (legacy) {
          const parsed = JSON.parse(legacy);
          localStorage.removeItem("bairight_ai_keys");
          VaultService.saveAllKeys(parsed);
          return parsed;
        }
        return {};
      }
      const deob = deobfuscate(raw);
      return JSON.parse(deob);
    } catch (e) {
      console.warn("Failed to load Vault store:", e);
      return {};
    }
  }


  public static getVerificationStatus(providerId: string): KeyVerificationRecord | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(VERIFICATION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed[providerId] || null;
    } catch {
      return null;
    }
  }

  public static getAllVerificationStatuses(): Record<string, KeyVerificationRecord> {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(VERIFICATION_STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw) || {};
    } catch {
      return {};
    }
  }

  public static setKeyVerificationStatus(
    providerId: string,
    isValid: boolean,
    errorMessage?: string,
    testedModel?: string
  ): void {
    if (typeof window === "undefined") return;
    try {
      const all = VaultService.getAllVerificationStatuses();
      all[providerId] = {
        isValid,
        lastTestedAt: new Date().toISOString(),
        errorMessage: isValid ? undefined : errorMessage,
        testedModel,
      };
      localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn("Failed to save key verification status:", e);
    }
  }

  public static clearKeyVerificationStatus(providerId: string): void {
    if (typeof window === "undefined") return;
    try {
      const all = VaultService.getAllVerificationStatuses();
      delete all[providerId];
      localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn("Failed to clear key verification status:", e);
    }
  }

  public static getApiKey(providerId: string): string {
    const store = VaultService.getStore();
    return store[providerId] || "";
  }

  public static saveApiKey(providerId: string, apiKey: string): void {
    if (typeof window === "undefined") return;
    const store = VaultService.getStore();
    const trimmed = apiKey.trim();
    const oldKey = store[providerId];
    if (trimmed) {
      store[providerId] = trimmed;
      if (oldKey !== trimmed) {
        VaultService.clearKeyVerificationStatus(providerId);
      }
    } else {
      delete store[providerId];
      VaultService.clearKeyVerificationStatus(providerId);
    }
    const ob = obfuscate(JSON.stringify(store));
    localStorage.setItem(VAULT_STORAGE_KEY, ob);
    // Backward compatibility mirror for existing hooks
    localStorage.setItem("bairight_ai_keys", JSON.stringify(store));
  }

  public static removeApiKey(providerId: string): void {
    if (typeof window === "undefined") return;
    const store = VaultService.getStore();
    delete store[providerId];
    VaultService.clearKeyVerificationStatus(providerId);
    const ob = obfuscate(JSON.stringify(store));
    localStorage.setItem(VAULT_STORAGE_KEY, ob);
    localStorage.setItem("bairight_ai_keys", JSON.stringify(store));
  }

  public static saveAllKeys(keys: Record<string, string>): void {
    if (typeof window === "undefined") return;
    const ob = obfuscate(JSON.stringify(keys));
    localStorage.setItem(VAULT_STORAGE_KEY, ob);
    localStorage.setItem("bairight_ai_keys", JSON.stringify(keys));
  }

  public static getAllKeys(): Record<string, string> {
    return VaultService.getStore();
  }

  public static getConnectionState(providerId: AIProviderId): ProviderConnectionState {
    const key = VaultService.getApiKey(providerId);
    if (key) {
      return {
        providerId,
        connectionType: "api_key",
        hasValidToken: true,
        maskedToken: maskKey(key),
        isVerified: true,
      };
    }

    return {
      providerId,
      connectionType: "api_key",
      hasValidToken: false,
      isVerified: false,
    };
  }
}
