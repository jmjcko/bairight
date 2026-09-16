import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GoogleLoginModal } from "../GoogleLoginModal";
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

describe("GoogleLoginModal", () => {
  it("does not render when isOpen is false", () => {
    render(
      <I18nProvider>
        <AuthProvider>
          <GoogleLoginModal isOpen={false} onClose={vi.fn()} />
        </AuthProvider>
      </I18nProvider>
    );

    expect(screen.queryByText("Přihlášení do bAIright")).toBeNull();
  });

  it("renders login options and Google button when isOpen is true", () => {
    render(
      <I18nProvider>
        <AuthProvider>
          <GoogleLoginModal isOpen={true} onClose={vi.fn()} />
        </AuthProvider>
      </I18nProvider>
    );

    expect(screen.getByText("Přihlášení do bAIright")).toBeInTheDocument();
    expect(screen.getByText(/Nastavit Google Client ID|Spustit Google Sign-In/)).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <I18nProvider>
        <AuthProvider>
          <GoogleLoginModal isOpen={true} onClose={handleClose} />
        </AuthProvider>
      </I18nProvider>
    );

    fireEvent.click(screen.getByTitle("Zavřít"));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
