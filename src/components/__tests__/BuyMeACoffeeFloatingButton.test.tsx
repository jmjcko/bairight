import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BuyMeACoffeeFloatingButton } from '../BuyMeACoffeeFloatingButton';
import { BuyMeACoffeeModal } from '../BuyMeACoffeeModal';

describe('BuyMeACoffee Floating Capsule & Modal Flow', () => {
  it('renders floating capsule button with correct label and vector SVG in Czech', () => {
    const onClick = vi.fn();
    render(<BuyMeACoffeeFloatingButton onClick={onClick} locale="cs" />);

    const button = screen.getByRole('button', { name: /Pozvat bAIright na kávu/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Pozvat na kávu')).toBeInTheDocument();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders floating capsule button in English', () => {
    const onClick = vi.fn();
    render(<BuyMeACoffeeFloatingButton onClick={onClick} locale="en" />);

    const button = screen.getByRole('button', { name: /Support bAIright on Buy Me a Coffee/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Buy Me a Coffee')).toBeInTheDocument();

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
    expect(screen.getByRole('link', { name: /Pozvat na kávu/i })).toHaveAttribute(
      'href',
      'https://buymeacoffee.com/bairight'
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
    expect(screen.getByRole('link', { name: /Support on Buy Me a Coffee/i })).toHaveAttribute(
      'href',
      'https://buymeacoffee.com/bairight'
    );
  });
});
