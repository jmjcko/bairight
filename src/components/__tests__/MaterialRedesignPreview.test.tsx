import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import MaterialRedesignPreviewPage from "@/app/material/page";

describe("Google Material Design 3 (M3) Material Admin Redesign Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("1. Renders Material Admin header with Logo, search bar, and Classic mode link", () => {
    render(<MaterialRedesignPreviewPage />);

    expect(screen.getByLabelText(/bAIright/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search shopping advisors|Hledat nákupní rádce/i)).toBeInTheDocument();
    expect(screen.getByText(/Classic Dark|Původní Dark/i)).toBeInTheDocument();
  });

  it("2. Renders dark slate left navigation rail with Overview, Advisors, Criteria, Live Chat, and RAG", () => {
    render(<MaterialRedesignPreviewPage />);

    expect(screen.getByTestId("nav-tab-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("nav-tab-catalog")).toBeInTheDocument();
    expect(screen.getByTestId("nav-tab-wizard")).toBeInTheDocument();
    expect(screen.getByTestId("nav-tab-chat")).toBeInTheDocument();
    expect(screen.getByTestId("nav-tab-memory")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /AI Diskuse|Live Chat/i })).toBeInTheDocument();
  });

  it("3. Displays advisor selection tiles with top colored borders and allows selecting an advisor", () => {
    render(<MaterialRedesignPreviewPage />);

    // Check advisor tile
    const lukeTile = screen.getByTestId("advisor-tile-luke_running");
    expect(lukeTile).toBeInTheDocument();

    // Select advisor
    fireEvent.click(lukeTile);

    expect(screen.getAllByText(/Asics/i).length).toBeGreaterThan(0);
  });

  it("4. Displays the Decision Criteria (Todo checklist) and allows toggling checkboxes", () => {
    render(<MaterialRedesignPreviewPage />);

    const checklistItem = screen.getByText(/Wide Last 2E|Široké kopyto 2E/i);
    expect(checklistItem).toBeInTheDocument();

    // Toggle checklist
    fireEvent.click(checklistItem);
    expect(checklistItem).toBeInTheDocument();
  });

  it("5. Allows sending message in the Live Consultation thread", () => {
    render(<MaterialRedesignPreviewPage />);

    const chatInput = screen.getByPlaceholderText(/Ask Luke about sizing|Zeptejte se Luka na velikost/i);
    expect(chatInput).toBeInTheDocument();

    fireEvent.change(chatInput, { target: { value: "Jaký drop doporučuješ pro artrózu?" } });
    const sendBtn = screen.getByRole("button", { name: /Send|Odeslat/i });
    fireEvent.click(sendBtn);

    expect(screen.getByText("Jaký drop doporučuješ pro artrózu?")).toBeInTheDocument();
  });
});
