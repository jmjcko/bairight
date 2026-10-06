import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import Home from "@/app/page";
import { VaultService } from "@/lib/auth/VaultService";
import { AgentStorageService } from "@/lib/agent/agent-storage-service";

describe("Mobile Navigation Bar & Chat Drawer Responsiveness Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    VaultService.saveApiKey("google_gemini", "AIzaSyTestValidKey12345678901234567890123");
  });

  it("1. Renders the Cyber-glass mobile bottom navigation bar with wizard, chat and memory buttons", () => {
    render(<Home />);

    const mobileNav = screen.getByRole("navigation", { name: "Mobile Navigation" });
    expect(mobileNav).toBeInTheDocument();

    const wizardBtn = screen.getByTestId("mobile-nav-wizard");
    const chatBtn = screen.getByTestId("mobile-nav-chat");
    const memoryBtn = screen.getByTestId("mobile-nav-memory");

    expect(wizardBtn).toBeInTheDocument();
    expect(chatBtn).toBeInTheDocument();
    expect(memoryBtn).toBeInTheDocument();
  });

  it("2. Mobile chat button switches to chat tab and renders the mobile top banner with drawer toggle", () => {
    render(<Home />);

    // Click mobile chat navigation button
    const chatBtn = screen.getByTestId("mobile-nav-chat");
    fireEvent.click(chatBtn);

    // Verify mobile chat top bar is rendered with toggle button
    const toggleBtn = screen.getByRole("button", { name: /Parametry & Top 3|Parameters & Top 3/i });
    expect(toggleBtn).toBeInTheDocument();

    // Verify dialog drawer is closed initially
    expect(screen.queryByRole("dialog", { name: /Parametry agenta & Žebříček|Agent Parameters & Leaderboard/i })).not.toBeInTheDocument();
  });

  it("3. Clicking the mobile toggle button opens the parameters & leaderboard drawer sheet", () => {
    render(<Home />);

    // Switch to chat
    fireEvent.click(screen.getByTestId("mobile-nav-chat"));

    // Open mobile drawer
    const toggleBtn = screen.getByRole("button", { name: /Parametry & Top 3|Parameters & Top 3/i });
    fireEvent.click(toggleBtn);

    // Verify drawer dialog is open
    const drawer = screen.getByRole("dialog");
    expect(drawer).toBeInTheDocument();
    expect(screen.getByText(/Parametry agenta & Žebříček|Agent Parameters & Leaderboard/i)).toBeInTheDocument();

    // Verify close button closes the drawer
    const closeBtn = screen.getByRole("button", { name: /Zavřít ✕|Close ✕/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("4. Mobile wizard button switches back to the Shopping Wizard launcher", () => {
    render(<Home />);

    // Go to chat then back to wizard via mobile nav
    fireEvent.click(screen.getByTestId("mobile-nav-chat"));
    fireEvent.click(screen.getByTestId("mobile-nav-wizard"));

    // Verify wizard launcher is active
    expect(screen.getByPlaceholderText(/Ergonomic office chair|Kancelářská ergonomická židle/i)).toBeInTheDocument();
  });
});
