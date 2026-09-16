import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Badge, Button, Card, Toast } from '../index';

describe('UI Primitive Components Library', () => {
  describe('Badge component', () => {
    it('renders label correctly', () => {
      render(<Badge label="Fotoaparát" />);
      expect(screen.getByText('Fotoaparát')).toBeInTheDocument();
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      render(<Badge label="Baterie" onClick={handleClick} />);
      fireEvent.click(screen.getByText('Baterie'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button component', () => {
    it('renders children and handles click', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Kopírovat prompt</Button>);
      const btn = screen.getByRole('button', { name: /Kopírovat prompt/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('respects disabled state', () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const btn = screen.getByRole('button', { name: /Disabled/i });
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Card component', () => {
    it('renders children content', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('handles click when interactive', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Clickable Card</Card>);
      fireEvent.click(screen.getByText('Clickable Card'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Toast component', () => {
    it('renders toast message', () => {
      render(<Toast message="Copied to clipboard!" type="success" />);
      expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument();
    });
  });
});
