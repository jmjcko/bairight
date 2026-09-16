"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: "google" | "demo";
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginDemoUser: (customName?: string, customEmail?: string) => void;
  logout: () => Promise<void>;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "bairight_user_session";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    try {
      const savedSession = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedSession) {
        setUser(JSON.parse(savedSession));
      }
    } catch {
      // Ignore JSON parse errors
    }

    const initSupabaseAuth = async () => {
      try {
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (isMounted && data?.session?.user) {
            const supaUser = data.session.user;
            const profile: UserProfile = {
              id: supaUser.id,
              email: supaUser.email || "user@google.com",
              name: supaUser.user_metadata?.full_name || supaUser.email?.split("@")[0] || "Uživatel",
              avatarUrl: supaUser.user_metadata?.avatar_url,
              provider: "google",
            };
            setUser(profile);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
          }
        }
      } catch {
        // Fall back gracefully
      }
    };

    initSupabaseAuth();

    let authListener: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          const supaUser = session.user;
          const profile: UserProfile = {
            id: supaUser.id,
            email: supaUser.email || "user@google.com",
            name: supaUser.user_metadata?.full_name || supaUser.email?.split("@")[0] || "Uživatel",
            avatarUrl: supaUser.user_metadata?.avatar_url,
            provider: "google",
          };
          setUser(profile);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
        } else if (_event === "SIGNED_OUT") {
          setUser(null);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      });
      authListener = data?.subscription;
    }

    return () => {
      isMounted = false;
      authListener?.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://db.tydjbkdzghkbyeidyoxw.supabase.co"
      ) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        return;
      }

      // Dev mode Google Auth Fallback
      const demoGoogleProfile: UserProfile = {
        id: "usr_google_demo_" + Date.now(),
        email: "jan.mynar@gmail.com",
        name: "Jan Mynář",
        avatarUrl: "https://lh3.googleusercontent.com/a/ACg8ocK1-demo-avatar=s96-c",
        provider: "google",
      };
      setUser(demoGoogleProfile);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demoGoogleProfile));
      setIsLoginModalOpen(false);
    } catch (err) {
      console.error("Google login failed:", err);
      loginDemoUser("Jan Mynář", "jan.mynar@gmail.com");
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemoUser = (name = "Jan Mynář", email = "jan.mynar@gmail.com") => {
    const profile: UserProfile = {
      id: "usr_demo_" + Date.now(),
      email,
      name,
      provider: "demo",
    };
    setUser(profile);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
    setIsLoginModalOpen(false);
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
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithGoogle,
        loginDemoUser,
        logout,
        isLoginModalOpen,
        setIsLoginModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    // Graceful fallback for components tested in isolation
    return {
      user: null,
      isLoading: false,
      loginWithGoogle: async () => {},
      loginDemoUser: () => {},
      logout: async () => {},
      isLoginModalOpen: false,
      setIsLoginModalOpen: () => {},
    };
  }
  return context;
};
