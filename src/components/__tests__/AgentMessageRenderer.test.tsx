import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AgentMessageRenderer } from '../AgentMessageRenderer';

describe('AgentMessageRenderer Unit Test Suite', () => {
  it('1. Renders top-level title and section headers with clean typographic structure', () => {
    const markdown = `# Expertní nákupní doporučení: Basketbalový míč
## Souhrnné hodnocení a strategie výběru
Testovací souhrn výběru míče na halový parket.`;

    render(<AgentMessageRenderer content={markdown} isEn={false} />);

    expect(screen.getByText(/Expertní nákupní doporučení: Basketbalový míč/i)).toBeDefined();
    expect(screen.getByText(/Souhrnné hodnocení a strategie výběru/i)).toBeDefined();
    expect(screen.getByText(/Testovací souhrn výběru míče na halový parket/i)).toBeDefined();
  });

  it('2. Formats product recommendation items into Cyber-glass model cards with match score badge', () => {
    const markdown = `## Top 3 Doporučené Modely

### 1. Wilson Evolution Game Basketball (Match: 100%)
- **Why this model fits:** Signature composite leather provides exceptional soft feel right out of the box.
- **Key Pros & Advantages:**
  - Industry-leading Microfiber Composite Leather cover
  - Deep channel construction for superior control
- **Potential Trade-offs & Cons:**
  - Can sometimes be at the top end of budget`;

    render(<AgentMessageRenderer content={markdown} isEn={true} />);

    expect(screen.getByText(/Wilson Evolution Game Basketball/i)).toBeDefined();
    expect(screen.getByText(/Match: 100%/i)).toBeDefined();
    expect(screen.getByText(/Signature composite leather provides exceptional soft feel/i)).toBeDefined();
    expect(screen.getByText(/Industry-leading Microfiber Composite Leather cover/i)).toBeDefined();
    expect(screen.getByText(/Can sometimes be at the top end of budget/i)).toBeDefined();
  });

  it('3. Auto-expands collapsed single-line model text into structured pros/cons sections', () => {
    const collapsedMarkdown = `1. Molten BG4500 (Match: 95%) - **Why Recommended:** Excellent grip for indoor games. - **Key Pros:** - 12 panel design - Premium synthetic leather - **Trade-offs & Cons:** - Slightly stiffer initial feel`;

    render(<AgentMessageRenderer content={collapsedMarkdown} isEn={true} />);

    expect(screen.getByText(/Molten BG4500/i)).toBeDefined();
    expect(screen.getByText(/Match: 95%/i)).toBeDefined();
    expect(screen.getByText(/Excellent grip for indoor games/i)).toBeDefined();
    expect(screen.getByText(/12 panel design/i)).toBeDefined();
    expect(screen.getByText(/Slightly stiffer initial feel/i)).toBeDefined();
  });
});
