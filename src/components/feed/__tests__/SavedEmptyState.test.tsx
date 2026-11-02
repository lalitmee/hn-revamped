import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { SavedEmptyState } from '../SavedEmptyState';

describe('SavedEmptyState', () => {
  it.each([false, true])(
    'uses the real story card in a non-interactive illustration (compact=%s)',
    (compact) => {
      const { container } = render(<SavedEmptyState compact={compact} />);
      expect(
        screen.getByRole('heading', { name: 'Good stories can wait' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('figure', {
          name: 'Example: use the bookmark on a story card to save it for later.',
        })
      ).toBeInTheDocument();
      expect(
        screen.getByText('Example · Save a story for later')
      ).toBeInTheDocument();
      expect(screen.getByText('Saved for later')).toBeInTheDocument();
      const card = container.querySelector('article')!;
      expect(card.closest('[inert]')).toHaveAttribute('aria-hidden', 'true');
      expect(card).toHaveClass(compact ? 'rounded-xl' : 'rounded-2xl');
      const mobile = card.querySelector('.sm\\:hidden')!;
      expect(mobile.querySelector('h3')).toHaveClass(
        compact ? 'text-[15px]' : 'text-[17px]'
      );
      for (const icon of ['language', 'person', 'schedule']) {
        expect(screen.getAllByText(icon)).toHaveLength(2);
      }
      expect(screen.getAllByText('Your next interesting read')).toHaveLength(2);
      expect(
        card.querySelectorAll('button[aria-label="Remove bookmark"]')
      ).toHaveLength(2);
    }
  );
});
