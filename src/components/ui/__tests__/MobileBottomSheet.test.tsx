import React from 'react';
import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MobileBottomSheet } from '../MobileBottomSheet';

it('keeps the header outside the scrolling content and allows header drag dismissal', () => {
  const onClose = vi.fn();
  const { unmount } = render(
    <MobileBottomSheet
      isOpen
      onClose={onClose}
      title="Voices"
      ariaLabel="Voices"
      triggerRef={{ current: null }}
    >
      <button type="button">A voice</button>
    </MobileBottomSheet>
  );
  const dialog = screen.getByRole('dialog', { name: 'Voices' });
  const content = screen.getByRole('button', {
    name: 'A voice',
  }).parentElement!;
  expect(dialog).toHaveClass('flex-col', 'overflow-hidden');
  expect(content).toHaveClass('overflow-y-auto', 'min-h-0');
  expect(content).not.toContainElement(
    screen.getByRole('heading', { name: 'Voices' })
  );
  expect(content).not.toContainElement(
    screen.getByRole('button', { name: 'Close voices' })
  );

  content.scrollTop = 100;
  fireEvent.touchStart(content, { touches: [{ clientX: 20, clientY: 20 }] });
  fireEvent.touchEnd(content, {
    changedTouches: [{ clientX: 20, clientY: 120 }],
  });
  expect(onClose).not.toHaveBeenCalled();

  const heading = screen.getByRole('heading', { name: 'Voices' });
  fireEvent.touchStart(heading, { touches: [{ clientX: 20, clientY: 20 }] });
  fireEvent.touchEnd(heading, {
    changedTouches: [{ clientX: 20, clientY: 120 }],
  });
  expect(onClose).toHaveBeenCalledOnce();
  unmount();
});
