import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import GuidePage from "../page";
import { I18nProvider } from "@/lib/i18n/I18nContext";

describe("GuidePage Component", () => {
  const renderGuide = () => {
    return render(
      <I18nProvider>
        <GuidePage />
      </I18nProvider>
    );
  };

  it("renders hero headline and main value proposition", () => {
    renderGuide();
    expect(screen.getByText(/Konec nákupních kompromisů|The End of Shopping Compromises/)).toBeInTheDocument();
    expect(screen.getByText(/Prezentace & Produktový manifest|Product Showcase & Manifesto/)).toBeInTheDocument();
  });

  it("renders 4 technological pillars with correct titles", () => {
    renderGuide();
    expect(screen.getByText(/Parametrický Discovery Engine|Parametric Discovery Engine/)).toBeInTheDocument();
    expect(screen.getByText(/RAG Paměťové jádro|RAG Memory Core/)).toBeInTheDocument();
    expect(screen.getByText(/Multi-Model Orchestrace|Multi-Model Orchestration/)).toBeInTheDocument();
    expect(screen.getByText(/Zero-Knowledge Bezpečnost|Zero-Knowledge Security/)).toBeInTheDocument();
  });

  it("renders comparison matrix with bAIright advantages", () => {
    renderGuide();
    expect(screen.getByText(/Proč tradiční vyhledávače|Why Traditional Comparison Sites/)).toBeInTheDocument();
    expect(screen.getAllByText(/bAIright AI/).length).toBeGreaterThan(0);
  });

  it("renders primary CTA to launch shopping assistant", () => {
    renderGuide();
    const startButtons = screen.getAllByRole("link", { name: /Spustit nákupního asistenta|Launch Shopping Assistant/ });
    expect(startButtons.length).toBeGreaterThan(0);
    expect(startButtons[0]).toHaveAttribute("href", "/");
  });

  it("renders interactive 4-step storyboard showcase and switches steps", () => {
    renderGuide();

    // Verify all 4 tabs exist
    const step1Tab = screen.getByRole("button", { name: /01 Query & Category|01 Zadání a kategorie/ });
    const step2Tab = screen.getByRole("button", { name: /02 AI Parameters|02 AI Parametry/ });
    const step3Tab = screen.getByRole("button", { name: /03 Diagnostic Wizard|03 Diagnostický průvodce/ });
    const step4Tab = screen.getByRole("button", { name: /04 Result Hub & AI Delivery|04 Result Hub & Možnosti|04 Result Hub/ });

    expect(step1Tab).toBeInTheDocument();
    expect(step2Tab).toBeInTheDocument();
    expect(step3Tab).toBeInTheDocument();
    expect(step4Tab).toBeInTheDocument();

    // Default step 1 is active
    let activeImage = screen.getByRole("img", { name: /bAIright Step 1/ });
    expect(activeImage).toHaveAttribute("src", "/images/guide-steps/step1-query-selection.png");

    // Click step 2
    fireEvent.click(step2Tab);
    activeImage = screen.getByRole("img", { name: /bAIright Step 2/ });
    expect(activeImage).toHaveAttribute("src", "/images/guide-steps/step2-parameter-discovery.png");

    // Click step 3
    fireEvent.click(step3Tab);
    activeImage = screen.getByRole("img", { name: /bAIright Step 3/ });
    expect(activeImage).toHaveAttribute("src", "/images/guide-steps/step3-diagnostic-wizard.png");

    // Click step 4
    fireEvent.click(step4Tab);
    activeImage = screen.getByRole("img", { name: /bAIright Step 4/ });
    expect(activeImage).toHaveAttribute("src", "/images/guide-steps/step4-prompt-and-chat.png");

    // Click Next button to loop back to Step 1
    const nextBtn = screen.getByRole("button", { name: /Next →/ });
    fireEvent.click(nextBtn);
    activeImage = screen.getByRole("img", { name: /bAIright Step 1/ });
    expect(activeImage).toHaveAttribute("src", "/images/guide-steps/step1-query-selection.png");
  });
});
