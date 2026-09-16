"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: "google" | "supabase";
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  googleClientId: string;
  setGoogleClientId: (clientId: string) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isClientIdModalOpen: boolean;
  setIsClientIdModalOpen: (open: boolean) => void;
  handleGoogleCredentialResponse: (credentialToken: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "bairight_user_session";
const CLIENT_ID_KEY = "bairight_google_client_id";

// Helper to decode JWT token payload from Google GIS
export function decodeGoogleJwt(token: string): { email?: string; name?: string; picture?: string; sub?: string } | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("Failed to decode Google JWT token:", err);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isClientIdModalOpen, setIsClientIdModalOpen] = useState(false);
  const [googleClientId, setGoogleClientIdState] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    // 1. Load user session from localStorage
    try {
      const savedSession = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedSession) {
        setUser(JSON.parse(savedSession));
      }
    } catch {
      // Ignore
    }

    // 2. Load Google Client ID from API config, env, or localStorage
    fetch("/api/auth/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.clientId && isMounted) {
          setGoogleClientIdState(data.clientId);
        } else {
          const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
          const storedClientId = typeof window !== "undefined" ? localStorage.getItem(CLIENT_ID_KEY) || "" : "";
          const activeClientId = envClientId || storedClientId;
          if (activeClientId && isMounted) {
            setGoogleClientIdState(activeClientId);
          }
        }
      })
      .catch(() => {
        const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
        const storedClientId = typeof window !== "undefined" ? localStorage.getItem(CLIENT_ID_KEY) || "" : "";
        const activeClientId = envClientId || storedClientId;
        if (activeClientId && isMounted) {
          setGoogleClientIdState(activeClientId);
        }
      });

    // 3. Load GIS Script dynamically
    if (typeof window !== "undefined" && !document.getElementById("google-gis-script")) {
      const script = document.createElement("script");
      script.id = "google-gis-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const setGoogleClientId = (clientId: string) => {
    const trimmed = clientId.trim();
    setGoogleClientIdState(trimmed);
    if (typeof window !== "undefined") {
      localStorage.setItem(CLIENT_ID_KEY, trimmed);
    }
  };

  const handleGoogleCredentialResponse = (credentialToken: string) => {
    const payload = decodeGoogleJwt(credentialToken);
    if (!payload || !payload.email) {
      console.error("Invalid Google credential token payload");
      return;
    }

    const realGoogleProfile: UserProfile = {
      id: payload.sub || `usr_g_${Date.now()}`,
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      avatarUrl: payload.picture,
      provider: "google",
    };

    setUser(realGoogleProfile);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(realGoogleProfile));
    }
    setIsLoginModalOpen(false);
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const clientIdToUse = googleClientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || (typeof window !== "undefined" ? localStorage.getItem(CLIENT_ID_KEY) : "");

      if (!clientIdToUse) {
        // Prompt user for Client ID if not configured yet
        setIsClientIdModalOpen(true);
        setIsLoading(false);
        return;
      }

      // Initialize Google Identity Services (GIS)
      if (typeof window !== "undefined" && (window as any).google?.accounts) {
        const google = (window as any).google;
        if (google.accounts.id) {
          google.accounts.id.initialize({
            client_id: clientIdToUse,
            callback: (response: any) => {
              if (response.credential) {
                handleGoogleCredentialResponse(response.credential);
              }
            },
          });
        }

        // 1. Try OAuth2 token client popup directly for explicit button click action
        if (google.accounts.oauth2) {
          try {
            const tokenClient = google.accounts.oauth2.initTokenClient({
              client_id: clientIdToUse,
              scope: "email profile openid",
              callback: async (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                  try {
                    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                      headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                    });
                    const userInfo = await res.json();
                    if (userInfo && userInfo.email) {
                      const realGoogleProfile: UserProfile = {
                        id: userInfo.sub || `usr_g_${Date.now()}`,
                        email: userInfo.email,
                        name: userInfo.name || userInfo.email.split("@")[0],
                        avatarUrl: userInfo.picture,
                        provider: "google",
                      };
                      setUser(realGoogleProfile);
                      if (typeof window !== "undefined") {
                        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(realGoogleProfile));
                      }
                      setIsLoginModalOpen(false);
                      return;
                    }
                  } catch (fetchErr) {
                    console.error("Failed to fetch Google userinfo:", fetchErr);
                  }
                }
              },
            });
            tokenClient.requestAccessToken();
            return;
          } catch (oauthErr) {
            console.warn("OAuth2 token client error, attempting GIS prompt fallback:", oauthErr);
          }
        }

        // 2. Fallback to GIS prompt if OAuth2 token client fails
        if (google.accounts.id) {
          google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              console.log("GIS prompt skipped/not displayed, opening Client ID configuration modal");
              setIsClientIdModalOpen(true);
            }
          });
        }
      } else {
        // Fallback: If GIS script is loading or unavailable, open Client ID modal
        setIsClientIdModalOpen(true);
      }
    } catch (err) {
      console.error("Real Google login trigger error:", err);
      setIsClientIdModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // Ignore
    }
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        googleClientId,
        setGoogleClientId,
        loginWithGoogle,
        logout,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isClientIdModalOpen,
        setIsClientIdModalOpen,
        handleGoogleCredentialResponse,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      isLoading: false,
      googleClientId: "",
      setGoogleClientId: () => {},
      loginWithGoogle: async () => {},
      logout: async () => {},
      isLoginModalOpen: false,
      setIsLoginModalOpen: () => {},
      isClientIdModalOpen: false,
      setIsClientIdModalOpen: () => {},
      handleGoogleCredentialResponse: () => {},
    };
  }
  return context;
};
