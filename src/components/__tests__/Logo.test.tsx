import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Logo } from '../Logo';

describe('Logo Component Unit Tests', () => {
  it('1. Vykreslí logo s přístupným labelem a alt textem', () => {
    render(<Logo size="md" />);
    expect(screen.getByAltText('bAIright')).toBeInTheDocument();
  });

  it('2. Kliknutí na logo spustí předaný onClick handler pro návrat na homepage', () => {
    const mockOnClick = vi.fn();
    render(<Logo size="md" onClick={mockOnClick} />);

    const logoButton = screen.getByRole('button', { name: /bAIright — Návrat na hlavní stránku/i });
    expect(logoButton).toBeInTheDocument();

    fireEvent.click(logoButton);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('3. Podporuje aktivaci klávesnicí (Enter / Mezerovník)', () => {
    const mockOnClick = vi.fn();
    render(<Logo size="md" onClick={mockOnClick} />);

    const logoButton = screen.getByRole('button', { name: /bAIright — Návrat na hlavní stránku/i });
    fireEvent.keyDown(logoButton, { key: 'Enter' });
    expect(mockOnClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(logoButton, { key: ' ' });
    expect(mockOnClick).toHaveBeenCalledTimes(2);
  });
});
