import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmModal } from "../ConfirmModal";

describe("ConfirmModal Component", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: "Smazat agenta",
    message: "Opravdu chcete smazat tohoto agenta z knihovny?",
    locale: "cs" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders correctly in Czech (cs) with default labels", () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Smazat agenta")).toBeInTheDocument();
    expect(
      screen.getByText("Opravdu chcete smazat tohoto agenta z knihovny?")
    ).toBeInTheDocument();
    expect(screen.getByText("Zrušit")).toBeInTheDocument();
    expect(screen.getByText("Smazat")).toBeInTheDocument();
    expect(screen.getByText("POTVRZENÍ AKCE")).toBeInTheDocument();
  });

  it("renders correctly in English (en) with bilingual labels", () => {
    render(
      <ConfirmModal
        {...defaultProps}
        locale="en"
        title="Delete Agent"
        message="Are you sure you want to delete this agent from your library?"
      />
    );

    expect(screen.getByText("Delete Agent")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Are you sure you want to delete this agent from your library?"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("ACTION REQUIRED • CONFIRMATION")).toBeInTheDocument();
  });

  it("calls onConfirm and onClose when confirm button is clicked", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmModal
        {...defaultProps}
        onConfirm={onConfirm}
        onClose={onClose}
        confirmLabel="Smazat agenta"
      />
    );

    const confirmBtn = screen.getByRole("button", { name: "Smazat agenta" });
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when cancel button is clicked", () => {
    const onClose = vi.fn();
    render(<ConfirmModal {...defaultProps} onClose={onClose} />);

    const cancelBtn = screen.getByText("Zrušit");
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when close icon (X) button is clicked", () => {
    const onClose = vi.fn();
    render(<ConfirmModal {...defaultProps} onClose={onClose} />);

    const closeBtn = screen.getByLabelText("Zavřít");
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(<ConfirmModal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders custom badge and non-destructive styling when specified", () => {
    render(
      <ConfirmModal
        {...defaultProps}
        badge="CUSTOM BADGE"
        isDestructive={false}
        confirmLabel="Pokračovat"
      />
    );

    expect(screen.getByText("CUSTOM BADGE")).toBeInTheDocument();
    expect(screen.getByText("Pokračovat")).toBeInTheDocument();
  });
});
