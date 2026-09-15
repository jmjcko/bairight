import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import Home from '@/app/page';

describe('Auto Category Custom Wizard Flow', () => {
  it('1. Entering a custom category launches wizard at Step 1 and does not skip to results', async () => {
    render(<Home />);

    // Find input and type "auto"
    const input = screen.getByPlaceholderText(/Kancelářská ergonomická židle/i);
    fireEvent.change(input, { target: { value: 'auto' } });

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /Začít/i });
    fireEvent.click(submitBtn);

    // Wait for parameter research to display the CTA button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nastavit cílové hodnoty/i })).toBeInTheDocument();
    });

    const ctaBtn = screen.getByRole('button', { name: /Nastavit cílové hodnoty/i });
    fireEvent.click(ctaBtn);

    // Verify wizard is at Step 1 and NO results card is shown
    await waitFor(() => {
      expect(screen.getByText(/Krok 1/i)).toBeInTheDocument();
      expect(screen.queryByText(/Agent Delivery Hub/i)).not.toBeInTheDocument();
    });
  });
});
