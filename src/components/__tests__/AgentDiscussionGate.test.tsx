import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import Home from "@/app/page";
import { AgentStorageService } from "@/lib/agent/agent-storage-service";

describe("Agent Discussion Gating & Subscription Paywall (PRD v1)", () => {
  beforeEach(() => {
    localStorage.clear();
    AgentStorageService.saveAgent({
      id: "agent_shoes_test",
      name: "Běžecká obuv",
      category: "Sport",
      description: "Testovací agent",
      version: "1.0",
      questions: [{ id: "q1", title: "Otázka 1", question: "Otázka 1", type: "single_choice", options: ["A", "B"] }],
      systemPrompt: "Test prompt",
    } as any);
  });

  it("1. Hides top navigation tab on clean homepage, renders when agent is active", async () => {
    render(<Home />);
    // On clean homepage launcher, top discussion tab is hidden
    expect(screen.queryByRole("button", { name: /^Agent Discussion$|^Diskuse s agentem$/i })).not.toBeInTheDocument();

    // Select/launch an agent from the homepage cards via Launch / Spustit button or card
    const agentCard = await screen.findByText("Běžecká obuv");
    fireEvent.click(agentCard);

    // Now top discussion tab is rendered in the header
    const discussionTab = await screen.findByRole("button", { name: /Agent Discussion|Diskuse s agentem/i });
    expect(discussionTab).toBeDefined();
  });
});
