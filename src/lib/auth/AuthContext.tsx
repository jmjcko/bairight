"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSavedLocale, persistLocale } from "@/lib/i18n/I18nContext";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: "google" | "supabase";
  preferredLocale?: "cs" | "en";
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
export function decodeGoogleJwt(token: string): {
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
  user_metadata?: {
    email?: string;
    full_name?: string;
    name?: string;
    picture?: string;
    avatar_url?: string;
    sub?: string;
    provider_id?: string;
  };
} | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
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


export const syncUserProfileToDatabase = async (profile: UserProfile): Promise<string> => {
  if (!profile?.id || !profile.email || !supabase) return profile?.id || "";
  try {
    if (typeof (supabase as any).from === "function") {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", profile.email)
        .maybeSingle();

      const canonicalId = existingUser?.id || profile.id;

      await supabase.from("users").upsert(
        {
          id: canonicalId,
          email: profile.email,
          name: profile.name || profile.email.split("@")[0],
          avatar_url: profile.avatarUrl || null,
          preferred_locale: profile.preferredLocale || "cs",
          last_active_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      return canonicalId;
    }
  } catch (err) {
    console.warn("Could not sync user profile to database:", err);
  }
  return profile.id;
};

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
        const parsed = JSON.parse(savedSession);
        setUser(parsed);
        if (parsed && (parsed.preferredLocale === 'cs' || parsed.preferredLocale === 'en')) {
          persistLocale(parsed.preferredLocale);
        }
        void (async () => {
          const canonicalId = await syncUserProfileToDatabase(parsed);
          if (canonicalId && canonicalId !== parsed.id) {
            const updated = { ...parsed, id: canonicalId };
            setUser(updated);
            if (typeof window !== "undefined") {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
            }
          }
        })();
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

    // 0. Extract and establish session from URL hash if returning from OAuth redirect
    const processOAuthHash = () => {
      if (typeof window === "undefined" || !window.location.hash || !window.location.hash.includes("access_token=")) {
        return;
      }
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken) {
          // 0a. Instantly decode user profile from access_token JWT for 0ms lag UI update
          const decoded = decodeGoogleJwt(accessToken);
          if (decoded && isMounted) {
            const meta = decoded.user_metadata || {};
            const email = decoded.email || meta.email || "";
            const userId = meta.sub || meta.provider_id || decoded.sub || email;
            if (email) {
              const immediateProfile: UserProfile = {
                id: userId,
                email,
                name: meta.full_name || meta.name || decoded.name || email.split("@")[0] || "User",
                avatarUrl: meta.avatar_url || meta.picture || decoded.picture,
                provider: "google",
                preferredLocale: getSavedLocale(),
              };

              setUser(immediateProfile);
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(immediateProfile));
              window.history.replaceState(null, "", window.location.pathname);
              void syncUserProfileToDatabase(immediateProfile);
            }
          }

          // 0b. Establish native Supabase authenticated session in background (enables strict RLS)
          if (refreshToken && supabase && typeof supabase.auth?.setSession === "function") {
            void supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            }).then(async ({ data, error }) => {
              const authUser = data?.session?.user || data?.user;
              if (!error && authUser && isMounted) {
                const userId = authUser.user_metadata?.sub || authUser.user_metadata?.provider_id || authUser.id;
                const profile: UserProfile = {
                  id: userId,
                  email: authUser.email || "",
                  name:
                    authUser.user_metadata?.name ||
                    authUser.user_metadata?.full_name ||
                    authUser.email?.split("@")[0] ||
                    "User",
                  avatarUrl:
                    authUser.user_metadata?.avatar_url ||
                    authUser.user_metadata?.picture,
                  provider: "google",
                  preferredLocale: getSavedLocale(),
                };

                setUser(profile);
                if (typeof window !== "undefined") {
                  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
                  window.history.replaceState(null, "", window.location.pathname);
                }
                void syncUserProfileToDatabase(profile);
              }
            });
          }
        }
      } catch (err) {
        console.warn("Could not process OAuth hash redirect:", err);
      }
    };

    processOAuthHash();
    if (typeof window !== "undefined") {
      window.addEventListener("hashchange", processOAuthHash);
    }

    // Native Supabase Auth Session Synchronization (Path A: Strict RLS)
    let authSubscription: any = null;
    if (supabase && typeof supabase.auth?.onAuthStateChange === "function") {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user && isMounted) {
          const authUser = session.user;
          const userId = authUser.user_metadata?.sub || authUser.user_metadata?.provider_id || authUser.id;
          const profile: UserProfile = {
            id: userId,
            email: authUser.email || "",
            name:
              authUser.user_metadata?.name ||
              authUser.user_metadata?.full_name ||
              authUser.email?.split("@")[0] ||
              "User",
            avatarUrl:
              authUser.user_metadata?.avatar_url ||
              authUser.user_metadata?.picture,
            provider: "google",
            preferredLocale: getSavedLocale(),
          };

          setUser(profile);
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
          }
          void syncUserProfileToDatabase(profile);
        } else if (event === "SIGNED_OUT" && isMounted) {
          setUser(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        }
      });
      authSubscription = data?.subscription;

      // Check existing active session on load
      void supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user && isMounted) {
          const authUser = session.user;
          const userId = authUser.user_metadata?.sub || authUser.user_metadata?.provider_id || authUser.id;
          const profile: UserProfile = {
            id: userId,
            email: authUser.email || "",
            name:
              authUser.user_metadata?.name ||
              authUser.user_metadata?.full_name ||
              authUser.email?.split("@")[0] ||
              "User",
            avatarUrl:
              authUser.user_metadata?.avatar_url ||
              authUser.user_metadata?.picture,
            provider: "google",
            preferredLocale: getSavedLocale(),
          };
          setUser(profile);
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
          }
          void syncUserProfileToDatabase(profile);
        }
      });
    }

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
      if (typeof window !== "undefined") {
        window.removeEventListener("hashchange", processOAuthHash);
      }
      if (authSubscription?.unsubscribe) authSubscription.unsubscribe();
    };
  }, []);

  const setGoogleClientId = (clientId: string) => {
    const trimmed = clientId.trim();
    setGoogleClientIdState(trimmed);
    if (typeof window !== "undefined") {
      localStorage.setItem(CLIENT_ID_KEY, trimmed);
    }
  };

  const handleGoogleCredentialResponse = async (credentialToken: string) => {
    const payload = decodeGoogleJwt(credentialToken);
    if (!payload || !payload.email) {
      console.error("Invalid Google credential token payload");
      return;
    }

    // 1. Establish native Supabase authenticated session via Google ID token
    // This issues an authenticated Supabase JWT with auth.uid() matching the user,
    // enabling strict Row-Level Security (RLS) enforcement on all database tables.
    let supabaseAuthUserId: string | null = null;
    if (supabase && typeof (supabase.auth as any)?.signInWithIdToken === "function") {
      try {
        const { data: authData, error: authError } = await (supabase.auth as any).signInWithIdToken({
          provider: "google",
          token: credentialToken,
        });
        if (authError) {
          console.warn("Supabase signInWithIdToken notice (enable Google Provider in Supabase dashboard to enforce RLS via native session):", authError.message);
        } else if (authData?.user) {
          supabaseAuthUserId = authData.user.id;
        }
      } catch (authErr) {
        console.warn("Supabase signInWithIdToken exception:", authErr);
      }
    }

    const realGoogleProfile: UserProfile = {
      id: supabaseAuthUserId || payload.sub || `usr_g_${Date.now()}`,
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      avatarUrl: payload.picture,
      provider: "google",
      preferredLocale: getSavedLocale(),
    };

    const canonicalId = await syncUserProfileToDatabase(realGoogleProfile);
    if (canonicalId) {
      realGoogleProfile.id = canonicalId;
    }

    setUser(realGoogleProfile);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(realGoogleProfile));
    }
    setIsLoginModalOpen(false);
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      // 1. Primary Path (Path A): Native Supabase OAuth (Issues genuine auth.uid() session for strict RLS)
      if (supabase && typeof supabase.auth?.signInWithOAuth === "function") {
        const redirectUrl = typeof window !== "undefined" ? window.location.origin : undefined;
        const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
          },
        });

        if (!oauthError && oauthData?.url) {
          if (typeof window !== "undefined") {
            window.location.href = oauthData.url;
          }
          return;
        }

        if (oauthError) {
          console.warn("Supabase signInWithOAuth fallback notice:", oauthError.message);
        }
      }

      // 2. Fallback Path: Google GIS Client ID & Token Client (if Supabase OAuth not configured)
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
                        preferredLocale: getSavedLocale(),
                      };
                      const canonicalId = await syncUserProfileToDatabase(realGoogleProfile);
                      if (canonicalId) {
                        realGoogleProfile.id = canonicalId;
                      }
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
