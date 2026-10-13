import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BuyMeACoffeeFloatingButton } from '../BuyMeACoffeeFloatingButton';
import { BuyMeACoffeeModal } from '../BuyMeACoffeeModal';

describe('BuyMeACoffee Floating Capsule & Modal Flow', () => {
  it('renders floating capsule button with correct label and vector SVG in Czech', () => {
    const onClick = vi.fn();
    render(<BuyMeACoffeeFloatingButton onClick={onClick} locale="cs" />);

    const button = screen.getByRole('button', { name: /Pozvat Luka na kávu/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Pozvat Luka na kávu')).toBeInTheDocument();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders floating capsule button in English', () => {
    const onClick = vi.fn();
    render(<BuyMeACoffeeFloatingButton onClick={onClick} locale="en" />);

    const button = screen.getByRole('button', { name: /Support Luke/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Buy Luke a coffee')).toBeInTheDocument();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('opens general support modal when agent is null (Czech)', () => {
    const onClose = vi.fn();
    render(
      <BuyMeACoffeeModal
        isOpen={true}
        onClose={onClose}
        agent={null}
        locale="cs"
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('NEZÁVISLÝ VÝVOJ • PODPORA')).toBeInTheDocument();
    expect(screen.getByText('Podpořte vývoj bAIright')).toBeInTheDocument();
    expect(screen.getByText(/100% nezávislého/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Pozvat Luka na kávu/i })).toHaveAttribute(
      'href',
      'https://buy.stripe.com/9B6dRa2iv75R4EP2T49sk01'
    );

    fireEvent.click(screen.getByRole('button', { name: /Zavřít a pokračovat/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('opens general support modal when agent is null (English)', () => {
    const onClose = vi.fn();
    render(
      <BuyMeACoffeeModal
        isOpen={true}
        onClose={onClose}
        agent={null}
        locale="en"
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('INDEPENDENT PROJECT • SUPPORT')).toBeInTheDocument();
    expect(screen.getByText('Support bAIright Development')).toBeInTheDocument();
    expect(screen.getByText(/100% independent/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Support Luke on Stripe/i })).toHaveAttribute(
      'href',
      'https://buy.stripe.com/9B6dRa2iv75R4EP2T49sk01'
    );
  });
});
