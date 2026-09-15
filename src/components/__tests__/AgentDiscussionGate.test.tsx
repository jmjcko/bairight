import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Home from '@/app/page';

describe('Agent Discussion Gating & Subscription Paywall (PRD v1)', () => {
  it('1. Renders top navigation tab as "Diskuse s agentem"', () => {
    render(<Home />);
    const discussionTab = screen.getByRole('button', { name: /Diskuse s agentem/i });
    expect(discussionTab).toBeDefined();
  });
});
