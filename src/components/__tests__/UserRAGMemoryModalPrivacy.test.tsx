import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserRAGMemoryModal } from "../UserRAGMemoryModal";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { I18nProvider } from "@/lib/i18n/I18nContext";

vi.mock("@/lib/supabase", () => ({
  DEFAULT_SUPABASE_URL: "https://placeholder-domain-prefix.supabase.co",
  DEFAULT_SUPABASE_ANON_KEY: "placeholder-anon-key",
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

describe("UserRAGMemoryModal Privacy & Authentication Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("1. Does NOT display hardcoded user name when user is unauthenticated (guest)", () => {
    render(
      <I18nProvider>
        <AuthProvider>
          <UserRAGMemoryModal
            isOpen={true}
            onClose={vi.fn()}
            facts={[]}
            assessments={[]}
            onToggleFact={vi.fn()}
            onAddFact={vi.fn()}
            onDeleteFact={vi.fn()}
            onDeleteAssessment={vi.fn()}
          />
        </AuthProvider>
      </I18nProvider>
    );

    // Must never leak or display Jan Mynar for guest users
    expect(screen.queryByText("Jan Mynář")).not.toBeInTheDocument();

    // Must display Guest User and N/A under Name & User
    expect(screen.getByText("Guest User")).toBeInTheDocument();
    expect(screen.getByText("Local Browser Profile")).toBeInTheDocument();
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("2. Does NOT display hardcoded user name in Czech locale when user is unauthenticated", () => {
    localStorage.setItem("bairight_locale", "cs");
    render(
      <I18nProvider>
        <AuthProvider>
          <UserRAGMemoryModal
            isOpen={true}
            onClose={vi.fn()}
            facts={[]}
            assessments={[]}
            onToggleFact={vi.fn()}
            onAddFact={vi.fn()}
            onDeleteFact={vi.fn()}
            onDeleteAssessment={vi.fn()}
          />
        </AuthProvider>
      </I18nProvider>
    );

    // Must never leak or display Jan Mynar for guest users
    expect(screen.queryByText("Jan Mynář")).not.toBeInTheDocument();

    // Must display Nepřihlášený uživatel and N/A
    expect(screen.getByText("Nepřihlášený uživatel")).toBeInTheDocument();
    expect(screen.getByText("Lokální profil")).toBeInTheDocument();
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("3. Displays authenticated user name when user is logged in", () => {
    localStorage.setItem(
      "bairight_user_session",
      JSON.stringify({
        id: "usr_colleague",
        email: "eva.novakova@gmail.com",
        name: "Eva Nováková",
        provider: "google",
      })
    );

    render(
      <I18nProvider>
        <AuthProvider>
          <UserRAGMemoryModal
            isOpen={true}
            onClose={vi.fn()}
            facts={[]}
            assessments={[]}
            onToggleFact={vi.fn()}
            onAddFact={vi.fn()}
            onDeleteFact={vi.fn()}
            onDeleteAssessment={vi.fn()}
          />
        </AuthProvider>
      </I18nProvider>
    );

    // Should display Eva Novakova, NOT Jan Mynar
    expect(screen.queryByText("Jan Mynář")).not.toBeInTheDocument();
    expect(screen.getAllByText("Eva Nováková").length).toBeGreaterThan(0);
    expect(screen.getByText("Active Personal Profile")).toBeInTheDocument();
  });
});
