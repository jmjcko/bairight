import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentStorageService } from '@/lib/agent/agent-storage-service';
import { UniversalAgentDefinition } from '@/lib/agent/universal-agent-schema';
import { BuyMeACoffeeModal } from '../BuyMeACoffeeModal';
import { AgentCategoryLauncher } from '../AgentCategoryLauncher';
import { I18nProvider } from '@/lib/i18n/I18nContext';

describe('Purchased Agents & Buy Me a Coffee Celebration Flow (PRD & SDLC)', () => {
  const mockAgent: UniversalAgentDefinition = {
    id: 'agent_headphones_purchased_test',
    name: 'Specialist: True Wireless Headphones',
    category: 'True Wireless Headphones',
    icon: '',
    version: '1.0.0',
    description: 'Shopping agent tailored with test parameters.',
    createdAt: new Date().toISOString(),
    systemPrompt: 'You are a headphones specialist.',
    questions: [
      {
        id: 'fit_style',
        step: 1,
        title: 'Fit & Tip Style',
        component: 'chips',
        options: [{ label: 'In-Ear', value: 'in_ear' }],
        defaultValue: [],
      },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
    if (typeof document !== 'undefined') {
      document.cookie = 'bairight_locale=; path=/; max-age=0';
    }
  });

  describe('1. AgentStorageService purchased status management', () => {
    it('saves agent and toggles purchased state correctly', () => {
      AgentStorageService.saveAgent(mockAgent);
      expect(AgentStorageService.getActiveAgents().length).toBe(1);
      expect(AgentStorageService.getPurchasedAgents().length).toBe(0);

      // Mark as purchased
      const updated = AgentStorageService.markAgentAsPurchased(mockAgent.id, true);
      expect(updated?.isPurchased).toBe(true);
      expect(updated?.purchasedAt).toBeDefined();

      // Check split
      expect(AgentStorageService.getActiveAgents().length).toBe(0);
      expect(AgentStorageService.getPurchasedAgents().length).toBe(1);

      // Restore to active
      const restored = AgentStorageService.markAgentAsPurchased(mockAgent.id, false);
      expect(restored?.isPurchased).toBe(false);
      expect(restored?.purchasedAt).toBeUndefined();

      expect(AgentStorageService.getActiveAgents().length).toBe(1);
      expect(AgentStorageService.getPurchasedAgents().length).toBe(0);
    });
  });

  describe('2. BuyMeACoffeeModal component (Bilingual)', () => {
    it('renders celebration modal in English with correct links and typography', () => {
      const onClose = vi.fn();
      render(
        <BuyMeACoffeeModal
          isOpen={true}
          onClose={onClose}
          agent={mockAgent}
          locale="en"
        />
      );

      // Check dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('MISSION COMPLETED • PURCHASED')).toBeInTheDocument();
      expect(screen.getByText('Congratulations on your purchase!')).toBeInTheDocument();
      expect(screen.getByText(/Your shopping advisor for/i)).toBeInTheDocument();
      expect(screen.getByText(/Did bAIright help you save time and make the right choice\?/i)).toBeInTheDocument();

      // Buy me a coffee link
      const bmcLink = screen.getByRole('link', { name: /Support on Buy Me a Coffee/i });
      expect(bmcLink).toBeInTheDocument();
      expect(bmcLink).toHaveAttribute('href', 'https://buymeacoffee.com/bairight');
      expect(bmcLink).toHaveAttribute('target', '_blank');

      // Close button
      const closeBtn = screen.getByRole('button', { name: /Close & Continue/i });
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    });

    it('renders celebration modal in Czech when locale is cs', () => {
      const onClose = vi.fn();
      render(
        <BuyMeACoffeeModal
          isOpen={true}
          onClose={onClose}
          agent={mockAgent}
          locale="cs"
        />
      );

      expect(screen.getByText('MISE DOKONČENA • ZAKOUPENO')).toBeInTheDocument();
      expect(screen.getByText('Gratulujeme k nákupu!')).toBeInTheDocument();
      expect(screen.getByText(/Váš nákupní rádce pro/i)).toBeInTheDocument();
      expect(screen.getByText(/Pomohl vám bAIright ušetřit čas a vybrat ten správný produkt\?/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Pozvat na kávu \(Buy Me a Coffee\)/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Zavřít a pokračovat/i })).toBeInTheDocument();
    });
  });

  describe('3. AgentCategoryLauncher interaction (Mark as Purchased & Tabs)', () => {
    it('allows marking an active agent as purchased, moves it to history tab, and opens BMC modal', () => {
      AgentStorageService.saveAgent(mockAgent);
      const onSelectAgent = vi.fn();

      render(
        <I18nProvider>
          <AgentCategoryLauncher
            onSelectAgent={onSelectAgent}
            initialTab="active"
          />
        </I18nProvider>
      );

      // Active tab shows the agent
      expect(screen.getByText('Active Missions (1)')).toBeInTheDocument();
      expect(screen.getByText('Purchased & History (0)')).toBeInTheDocument();

      // Mark as purchased micro-button is visible on card (Variant A)
      const markBtn = screen.getByRole('button', { name: /Mark as purchased/i });
      expect(markBtn).toBeInTheDocument();

      // Click "Mark as purchased"
      fireEvent.click(markBtn);

      // Congratulatory Buy Me a Coffee modal opens!
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('MISSION COMPLETED • PURCHASED')).toBeInTheDocument();

      // Close the modal
      fireEvent.click(screen.getByRole('button', { name: /Close & Continue/i }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Counts updated: Active (0), Purchased & History (1)
      expect(screen.getByText('Active Missions (0)')).toBeInTheDocument();
      expect(screen.getByText('Purchased & History (1)')).toBeInTheDocument();

      // Switch to Purchased & History tab
      fireEvent.click(screen.getByText('Purchased & History (1)'));

      // The purchased agent is now here, with "Restore agent" micro-button!
      const restoreBtn = screen.getByRole('button', { name: /Restore agent/i });
      expect(restoreBtn).toBeInTheDocument();

      // Click restore
      fireEvent.click(restoreBtn);

      // Counts updated back: Active (1), Purchased & History (0)
      expect(screen.getByText('Active Missions (1)')).toBeInTheDocument();
      expect(screen.getByText('Purchased & History (0)')).toBeInTheDocument();
    });
  });
});
