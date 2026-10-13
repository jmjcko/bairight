import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminFeedbackPage from "../page";
import * as AuthContextModule from "@/lib/auth/AuthContext";
import { FeedbackService } from "@/lib/feedback/feedback-service";

describe("AdminFeedbackPage Authorization & Management Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Blocks non-admin users and displays access denied banner", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: "usr_stranger",
        email: "stranger@random.com",
        name: "Stranger",
        provider: "google",
      },
      isLoading: false,
      googleClientId: "",
      setGoogleClientId: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      isLoginModalOpen: false,
      setIsLoginModalOpen: vi.fn(),
      isClientIdModalOpen: false,
      setIsClientIdModalOpen: vi.fn(),
      handleGoogleCredentialResponse: vi.fn(),
    });

    render(<AdminFeedbackPage />);
    expect(screen.getByText("Nemáte administrátorská oprávnění")).toBeInTheDocument();
    expect(screen.getByText("Zpět na hlavní stránku")).toBeInTheDocument();
  });

  it("2. Grants full access to authorized admin and lists incoming feedback", async () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: "usr_admin",
        email: "jmjcko@gmail.com",
        name: "Jan Mynar",
        provider: "google",
      },
      isLoading: false,
      googleClientId: "",
      setGoogleClientId: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      isLoginModalOpen: false,
      setIsLoginModalOpen: vi.fn(),
      isClientIdModalOpen: false,
      setIsClientIdModalOpen: vi.fn(),
      handleGoogleCredentialResponse: vi.fn(),
    });

    vi.spyOn(FeedbackService, "fetchFeedback").mockResolvedValue([
      {
        id: "fb_101",
        email: "customer@domain.cz",
        name: "Petr Novák",
        category: "feature",
        message: "Přidejte prosím filtry pro široká chodidla.",
        status: "new",
        created_at: new Date().toISOString(),
      },
    ]);

    render(<AdminFeedbackPage />);

    await waitFor(() => {
      expect(screen.getByText("Správa zpětné vazby & námětů")).toBeInTheDocument();
      expect(screen.getByText("Petr Novák")).toBeInTheDocument();
      expect(screen.getByText("customer@domain.cz")).toBeInTheDocument();
      expect(screen.getByText("Přidejte prosím filtry pro široká chodidla.")).toBeInTheDocument();
      expect(screen.getByText("Odpovědět e-mailem")).toBeInTheDocument();
    });

    const replyLink = screen.getByRole("link", { name: /Odpovědět e-mailem/i });
    expect(replyLink).toHaveAttribute("href", expect.stringContaining("mailto:customer@domain.cz"));
  });
});
