import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductTourModal } from "../ProductTourModal";
import { I18nProvider } from "@/lib/i18n/I18nContext";

describe("ProductTourModal Component", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const renderComponent = (props: {
    isOpen: boolean;
    onClose: () => void;
    onOpenGuidePage?: () => void;
  }) => {
    return render(
      <I18nProvider>
        <ProductTourModal {...props} />
      </I18nProvider>
    );
  };

  it("does not render when isOpen is false", () => {
    const onClose = vi.fn();
    renderComponent({ isOpen: false, onClose });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders step 1 when isOpen is true", () => {
    const onClose = vi.fn();
    renderComponent({ isOpen: true, onClose });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("1 / 4")).toBeInTheDocument();
  });

  it("navigates forward through steps and updates step counter", () => {
    const onClose = vi.fn();
    renderComponent({ isOpen: true, onClose });

    // Step 1 -> Next
    const nextBtn = screen.getByText(/Další|Next/);
    fireEvent.click(nextBtn);
    expect(screen.getByText("2 / 4")).toBeInTheDocument();

    // Step 2 -> Next
    fireEvent.click(screen.getByText(/Další|Next/));
    expect(screen.getByText("3 / 4")).toBeInTheDocument();

    // Step 3 -> Next
    fireEvent.click(screen.getByText(/Další|Next/));
    expect(screen.getByText("4 / 4")).toBeInTheDocument();

    // On step 4, the button becomes start/launch
    expect(screen.getByText(/Spustit asistenta|Launch Consultant/)).toBeInTheDocument();
  });

  it("closes modal and saves tour seen flag in localStorage on finish", () => {
    const onClose = vi.fn();
    renderComponent({ isOpen: true, onClose });

    const closeBtn = screen.getByRole("button", { name: /Zavřít|Close/ });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
    expect(localStorage.getItem("bairight_tour_seen")).toBe("true");
  });

  it("triggers onOpenGuidePage callback when clicking landing page link", () => {
    const onClose = vi.fn();
    const onOpenGuidePage = vi.fn();
    renderComponent({ isOpen: true, onClose, onOpenGuidePage });

    const guideLink = screen.getByText(/Kompletní prezentace produktu|View Complete Product Showcase/);
    fireEvent.click(guideLink);

    expect(onClose).toHaveBeenCalled();
    expect(onOpenGuidePage).toHaveBeenCalled();
  });
});
