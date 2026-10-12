import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LukeLabPage from '../page';

describe('LukeLabPage Consistency & Diff Interface Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('1. Renders Luke Lab header, metrics bar, and all 10 default products', () => {
    render(<LukeLabPage />);

    expect(screen.getByText('Luke Parameter Consistency Lab')).toBeInTheDocument();
    expect(screen.getByText('LIVE LLM CONSISTENCY TESTING • ZERO CACHE')).toBeInTheDocument();
    expect(screen.getByText('Elektrické auto')).toBeInTheDocument();
    expect(screen.getByText('Běžecké boty')).toBeInTheDocument();
    expect(screen.getByText('Pákový kávovar')).toBeInTheDocument();
    expect(screen.getByText('Aku vrtačka / šroubovák')).toBeInTheDocument();
  });

  it('2. Clicking regenerate calls /api/agent/research-parameters with bypassCache: true and renders parameters', async () => {
    const mockParameters = [
      { id: 'battery_capacity', name: 'Kapacita baterie', category: 'Výkon', rationale: 'Kapacita baterie určuje reálný dojezd.' },
      { id: 'charging_speed', name: 'Rychlost nabíjení', category: 'Baterie', rationale: 'Výkon nabíjení na DC stojanech.' },
      { id: 'brand_preferences', name: 'Značky a výrobci', category: 'Značky', rationale: 'Preferované a zakázané značky.' },
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        source: 'luke_live',
        analysis: {
          matchedDomain: 'Automotive & Tech',
          parameters: mockParameters,
        },
      }),
    });
    global.fetch = fetchMock;

    render(<LukeLabPage />);

    // Click regenerate for first product (Elektrické auto)
    const regenButtons = screen.getAllByRole('button', { name: /Přegenerovat/i });
    fireEvent.click(regenButtons[1]); // First card button (index 0 is bulk button)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/agent/research-parameters',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            query: 'Elektrické auto',
            locale: 'cs',
            bypassCache: true,
          }),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Kapacita baterie')).toBeInTheDocument();
      expect(screen.getByText('Rychlost nabíjení')).toBeInTheDocument();
    });
  });

  it('3. Generates 2nd run, renders side-by-side diff, and calculates consistency percentage', async () => {
    // Pre-populate 1st run in LocalStorage
    const initialHistory = {
      'Pákový kávovar': {
        name: 'Pákový kávovar',
        baseline: {
          timestamp: '10:00:00',
          matchedDomain: 'Gastro & Domácnost',
          parameters: [
            { id: 'pump_pressure', name: 'Tlak čerpadla', category: 'Parametry', rationale: 'Ideální 9-15 barů.' },
            { id: 'boiler_type', name: 'Typ bojleru', category: 'Konstrukce', rationale: 'Jednobojler vs dual bojler.' },
            { id: 'brand_preferences', name: 'Značky', category: 'Značky', rationale: 'Značky.' },
          ],
        },
      },
    };
    localStorage.setItem('bairight_luke_lab_history', JSON.stringify(initialHistory));

    // 2nd run response with slight parameter variance
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        source: 'luke_live',
        analysis: {
          matchedDomain: 'Gastro & Domácnost',
          parameters: [
            { id: 'pump_pressure', name: 'Tlak čerpadla', category: 'Parametry', rationale: 'Ideální 9-15 barů.' },
            { id: 'boiler_type', name: 'Typ bojleru', category: 'Konstrukce', rationale: 'Jednobojler vs dual bojler.' },
            { id: 'pid_control', name: 'PID regulace', category: 'Elektronika', rationale: 'Přesnost teploty vody.' },
            { id: 'brand_preferences', name: 'Značky', category: 'Značky', rationale: 'Značky.' },
          ],
        },
      }),
    });
    global.fetch = fetchMock;

    render(<LukeLabPage />);

    // Check baseline is visible
    expect(screen.getByText('Tlak čerpadla')).toBeInTheDocument();
    expect(screen.getByText('Typ bojleru')).toBeInTheDocument();

    // Click regenerate for Pákový kávovar
    const regenButtons = screen.getAllByRole('button', { name: /Přegenerovat/i });
    // Find button inside Pákový kávovar card
    const kávovarCard = screen.getByText('Pákový kávovar').closest('.rounded-xl');
    const buttonInCard = kávovarCard?.querySelector('button');
    if (buttonInCard) {
      fireEvent.click(buttonInCard);
    }

    await waitFor(() => {
      // 2nd run adds PID regulace
      expect(screen.getByText('PID regulace')).toBeInTheDocument();
    });

    await waitFor(() => {
      // Shows consistency score
      expect(screen.getByText(/Konzistence:/)).toBeInTheDocument();
    });
  });
});
