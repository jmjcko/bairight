import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeModeSwitcher } from '../ThemeModeSwitcher';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { I18nProvider } from '@/lib/i18n/I18nContext';

describe('ThemeModeSwitcher Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-color-mode');
    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderSwitcher = () => {
    return render(
      <I18nProvider>
        <ThemeProvider>
          <ThemeModeSwitcher />
        </ThemeProvider>
      </I18nProvider>
    );
  };

  it('1. Vykreslí přepínač témat se třemi volbami bez ikon (Světlý / Tmavý / Auto)', () => {
    renderSwitcher();
    expect(screen.getByRole('group', { name: /Režim zobrazení|Color mode/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Světlý|Light/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tmavý|Dark/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Auto/i })).toBeInTheDocument();
  });

  it('2. Kliknutí na Tmavý nastaví data-color-mode="dark" a uloží do localStorage', () => {
    renderSwitcher();
    const darkBtn = screen.getByRole('button', { name: /Tmavý|Dark/i });
    fireEvent.click(darkBtn);

    expect(localStorage.getItem('bairight_color_mode')).toBe('dark');
    expect(document.documentElement.getAttribute('data-color-mode')).toBe('dark');
    expect(darkBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('3. Kliknutí na Světlý nastaví data-color-mode="light"', () => {
    renderSwitcher();
    const lightBtn = screen.getByRole('button', { name: /Světlý|Light/i });
    fireEvent.click(lightBtn);

    expect(localStorage.getItem('bairight_color_mode')).toBe('light');
    expect(document.documentElement.getAttribute('data-color-mode')).toBe('light');
    expect(lightBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('4. Kliknutí na Auto respektuje matchMedia nastavení systému', () => {
    renderSwitcher();
    const autoBtn = screen.getByRole('button', { name: /Auto/i });
    fireEvent.click(autoBtn);

    expect(localStorage.getItem('bairight_color_mode')).toBe('system');
    expect(autoBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
