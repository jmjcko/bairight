import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FeedbackFloatingButton } from "../FeedbackFloatingButton";
import { FeedbackModal } from "../FeedbackModal";
import * as AuthContextModule from "@/lib/auth/AuthContext";
import { FeedbackService } from "@/lib/feedback/feedback-service";

describe("Feedback Floating Button & Modal Bilingual Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
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
  });

  it("1. Renders FeedbackFloatingButton in Czech and responds to click", () => {
    const onClick = vi.fn();
    render(<FeedbackFloatingButton onClick={onClick} locale="cs" />);

    const btn = screen.getByRole("button", { name: /Zpětná vazba/i });
    expect(btn).toBeInTheDocument();
    expect(screen.getByText("Zpětná vazba")).toBeInTheDocument();

    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("2. Renders FeedbackFloatingButton in English and responds to click", () => {
    const onClick = vi.fn();
    render(<FeedbackFloatingButton onClick={onClick} locale="en" />);

    const btn = screen.getByRole("button", { name: /Feedback/i });
    expect(btn).toBeInTheDocument();
    expect(screen.getByText("Feedback")).toBeInTheDocument();

    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("3. FeedbackModal displays form in Czech, validates inputs and submits", async () => {
    const onClose = vi.fn();
    vi.spyOn(FeedbackService, "submitFeedback").mockResolvedValue({ success: true, id: "test_1" });

    render(<FeedbackModal isOpen={true} onClose={onClose} locale="cs" />);

    expect(screen.getByText("Náměty a zpětná vazba")).toBeInTheDocument();
    expect(screen.getByText("Nápad na vylepšení")).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/Váš e-mail/i);
    const messageInput = screen.getByLabelText(/Zpráva/i);
    const submitBtn = screen.getByRole("button", { name: /Odeslat námět/i });

    fireEvent.change(emailInput, { target: { value: "tester@example.com" } });
    fireEvent.change(messageInput, { target: { value: "Super aplikace, přidejte ještě filtry značek!" } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(FeedbackService.submitFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "tester@example.com",
          message: "Super aplikace, přidejte ještě filtry značek!",
          category: "feature",
        })
      );
      expect(screen.getByText("Děkujeme za váš námět!")).toBeInTheDocument();
    });
  });

  it("4. FeedbackModal pre-fills email and name for authenticated Google users", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: "usr_123",
        email: "jan.mynar@gmail.com",
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

    render(<FeedbackModal isOpen={true} onClose={vi.fn()} locale="en" />);

    expect(screen.getByText("Send Feedback or Ideas")).toBeInTheDocument();
    const emailInput = screen.getByLabelText(/Your Email/i) as HTMLInputElement;
    const nameInput = screen.getByLabelText(/Your Name/i) as HTMLInputElement;

    expect(emailInput.value).toBe("jan.mynar@gmail.com");
    expect(nameInput.value).toBe("Jan Mynar");
  });
});
