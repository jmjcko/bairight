import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider, getSavedLocale, persistLocale } from '@/lib/i18n/I18nContext';
import { LanguageSwitcher } from '../LanguageSwitcher';

describe('Language Switch Notification & Multi-Layer Persistence (Cookie & Account)', () => {
  beforeEach(() => {
    localStorage.clear();
    // Clear cookies
    document.cookie = 'bairight_locale=; path=/; max-age=0';
  });

  it('1. Default language is English when no cookie, localStorage, or user profile exists', () => {
    expect(getSavedLocale()).toBe('en');
  });

  it('2. Persisting locale writes to localStorage, document.cookie, and user account session', () => {
    // Simulate active logged-in user profile
    localStorage.setItem('bairight_user_session', JSON.stringify({
      id: 'usr_123',
      email: 'jan@bairight.cz',
      name: 'Jan Mynář',
      provider: 'google',
    }));

    persistLocale('cs');

    // Check localStorage
    expect(localStorage.getItem('bairight_locale')).toBe('cs');

    // Check cookie
    expect(document.cookie).toContain('bairight_locale=cs');

    // Check user account session
    const updatedSession = JSON.parse(localStorage.getItem('bairight_user_session') || '{}');
    expect(updatedSession.preferredLocale).toBe('cs');

    // getSavedLocale resolves 'cs'
    expect(getSavedLocale()).toBe('cs');
  });

  it('3. Restores locale from cookie if localStorage was cleared', () => {
    document.cookie = 'bairight_locale=cs; path=/';
    localStorage.removeItem('bairight_locale');

    expect(getSavedLocale()).toBe('cs');
  });

  it('4. Restores locale from logged-in user session if cookie and localStorage were empty', () => {
    localStorage.setItem('bairight_user_session', JSON.stringify({
      id: 'usr_456',
      email: 'user@example.com',
      name: 'Test User',
      provider: 'google',
      preferredLocale: 'cs',
    }));

    expect(getSavedLocale()).toBe('cs');
  });

  it('5. Clicking CZ in LanguageSwitcher triggers Cyber-glass system notice explaining Luke, UI, and active agent protection', () => {
    render(
      <I18nProvider>
        <LanguageSwitcher />
      </I18nProvider>
    );

    const czButton = screen.getByRole('button', { name: /Přepnout do češtiny/i });
    fireEvent.click(czButton);

    // Dialog is displayed
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Jazyk přepnut: 100% Český režim')).toBeInTheDocument();

    // Verifies all 3 key pillars of user explanation
    expect(screen.getByText(/1\. Rozhraní aplikace & Navigace/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Nový výzkum \(Agent Luke\) & Stažení \(\.md\)/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Ochrana rozpracovaného agenta/i)).toBeInTheDocument();
    expect(screen.getByText(/Trvalé uložení: Vaše volba byla zapsána do cookies/i)).toBeInTheDocument();

    // Dismiss notice
    const dismissBtn = screen.getByRole('button', { name: /Rozumím/i });
    fireEvent.click(dismissBtn);

    // Dialog is dismissed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('6. Switching back to EN explains English generation and dismisses via close X button', () => {
    // Start in Czech
    localStorage.setItem('bairight_locale', 'cs');

    render(
      <I18nProvider>
        <LanguageSwitcher />
      </I18nProvider>
    );

    const enButton = screen.getByRole('button', { name: /Switch to English/i });
    fireEvent.click(enButton);

    // EN notice appears
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Language Switched: 100% English Mode')).toBeInTheDocument();
    expect(screen.getByText(/1\. Application UI & Navigation/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. New Research \(Agent Luke\) & Downloads \(\.md\)/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Active Agent Protection/i)).toBeInTheDocument();

    // Close with X
    const closeBtn = screen.getByRole('button', { name: /Close notification/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('7. Clicking already active language does NOT open notice', () => {
    render(
      <I18nProvider>
        <LanguageSwitcher />
      </I18nProvider>
    );

    // Initial language is EN. Clicking EN again should do nothing.
    const enButton = screen.getByRole('button', { name: /Switch to English/i });
    fireEvent.click(enButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
