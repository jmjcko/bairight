import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HowItWorksFloatingButton } from '../HowItWorksFloatingButton';

describe('HowItWorksFloatingButton', () => {
  it('renders in Czech locale and handles click', () => {
    const onClick = vi.fn();
    render(<HowItWorksFloatingButton onClick={onClick} locale="cs" />);

    const btn = screen.getByRole('button', { name: /Jak to funguje/ });
    expect(btn).toBeInTheDocument();
    expect(screen.getByText('Jak to funguje')).toBeInTheDocument();

    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders in English locale and handles click', () => {
    const onClick = vi.fn();
    render(<HowItWorksFloatingButton onClick={onClick} locale="en" />);

    const btn = screen.getByRole('button', { name: /How it works/ });
    expect(btn).toBeInTheDocument();
    expect(screen.getByText('How it works')).toBeInTheDocument();

    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
