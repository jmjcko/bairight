import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserProfileCapsule } from "../UserProfileCapsule";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { I18nProvider } from "@/lib/i18n/I18nContext";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

describe("UserProfileCapsule", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders login button when user is logged out", () => {
    render(
      <I18nProvider>
        <AuthProvider>
          <UserProfileCapsule onOpenMemoryModal={vi.fn()} />
        </AuthProvider>
      </I18nProvider>
    );

    expect(screen.getByTitle("Přihlásit se přes Google")).toBeInTheDocument();
    expect(screen.getByText("Přihlásit se")).toBeInTheDocument();
  });

  it("opens login modal when login button is clicked", () => {
    render(
      <I18nProvider>
        <AuthProvider>
          <UserProfileCapsule onOpenMemoryModal={vi.fn()} />
        </AuthProvider>
      </I18nProvider>
    );

    fireEvent.click(screen.getByTitle("Přihlásit se přes Google"));
    expect(screen.getByText("Přihlášení do bAIright")).toBeInTheDocument();
  });

  it("renders user avatar and dropdown menu when user is logged in", async () => {
    // Pre-populate session in localStorage
    localStorage.setItem(
      "bairight_user_session",
      JSON.stringify({
        id: "usr_123",
        email: "jan.mynar@gmail.com",
        name: "Jan Mynář",
        provider: "google",
      })
    );

    render(
      <I18nProvider>
        <AuthProvider>
          <UserProfileCapsule onOpenMemoryModal={vi.fn()} />
        </AuthProvider>
      </I18nProvider>
    );

    expect(screen.getByText("Jan")).toBeInTheDocument();

    // Toggle dropdown
    fireEvent.click(screen.getByTitle("Profil: Jan Mynář"));
    expect(screen.getByText("jan.mynar@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("Odhlásit se")).toBeInTheDocument();

    // Trigger logout
    await act(async () => {
      fireEvent.click(screen.getByText("Odhlásit se"));
    });

    expect(screen.getByText("Přihlásit se")).toBeInTheDocument();
  });
});
