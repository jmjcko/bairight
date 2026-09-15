import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { I18nProvider } from '@/lib/i18n/I18nContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import Home from '@/app/page';

describe('Bilingual Localization & Language Switcher Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. LanguageSwitcher renders with active Czech locale by default', () => {
    render(
      <I18nProvider>
        <LanguageSwitcher />
      </I18nProvider>
    );

    const czButton = screen.getByRole('button', { name: /Přepnout do češtiny/i });
    const enButton = screen.getByRole('button', { name: /Switch to English/i });

    expect(czButton).toBeInTheDocument();
    expect(enButton).toBeInTheDocument();
    expect(czButton).toHaveAttribute('aria-pressed', 'true');
    expect(enButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('2. Clicking English button switches locale and persists to localStorage', () => {
    render(
      <I18nProvider>
        <LanguageSwitcher />
      </I18nProvider>
    );

    const enButton = screen.getByRole('button', { name: /Switch to English/i });
    fireEvent.click(enButton);

    expect(enButton).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('bairight_locale')).toBe('en');
  });

  it('3. Toggling language in Home updates Header navigation and Hero Launcher texts', () => {
    render(
      <I18nProvider>
        <Home />
      </I18nProvider>
    );

    // Initial state: Czech
    expect(screen.getByRole('button', { name: /Průvodce nákupem/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Diskuse s agentem/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Kancelářská ergonomická židle/i)).toBeInTheDocument();

    // Switch to English
    const enButton = screen.getByRole('button', { name: /Switch to English/i });
    fireEvent.click(enButton);

    // Header tabs updated to English
    expect(screen.getByRole('button', { name: /Shopping Wizard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agent Discussion/i })).toBeInTheDocument();

    // Hero launcher updated to English
    expect(screen.getByPlaceholderText(/Ergonomic office chair/i)).toBeInTheDocument();

    // Switch back to Czech
    const czButton = screen.getByRole('button', { name: /Přepnout do češtiny/i });
    fireEvent.click(czButton);

    expect(screen.getByRole('button', { name: /Průvodce nákupem/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Diskuse s agentem/i })).toBeInTheDocument();
  });
});
