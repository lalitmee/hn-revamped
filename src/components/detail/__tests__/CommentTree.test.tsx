import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CommentTree, getAdaptiveThreadBudget } from '../CommentTree';
import { HNComment } from '@/types/hn';

const sampleComments: HNComment[] = [
  {
    id: 901,
    user: 'tptacek',
    time: 1700000000,
    text: '<p>How does glyph caching work on Wayland?</p>',
    totalDescendants: 3,
    children: [
      {
        id: 902,
        user: 'nathansobo',
        time: 1700000200,
        text: '<p>We cache per-monitor DPI in blade.</p>',
        totalDescendants: 2,
        children: [
          {
            id: 903,
            user: 'wayland_fan',
            time: 1700000300,
            text: '<p>Depth 2 reply visible initially.</p>',
            totalDescendants: 1,
            children: [
              {
                id: 904,
                user: 'deep_reply_user',
                time: 1700000400,
                text: '<p>Depth 3 reply gated behind on-demand load button.</p>',
                totalDescendants: 0,
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
];

describe('CommentTree & Progressive Depth-Gated Rendering', () => {
  it('defaults to Collapse Replies (root-only) for fast initial load, and expands nested replies on demand', () => {
    render(<CommentTree comments={sampleComments} storyAuthor="nathansobo" />);

    expect(screen.getByText('tptacek')).toBeInTheDocument();
    // Nested replies are collapsed initially behind "Show 3 replies"
    expect(
      screen.queryByText(/We cache per-monitor DPI/)
    ).not.toBeInTheDocument();

    const expandAllBtn = screen.getByRole('button', { name: /Expand All/i });
    fireEvent.click(expandAllBtn);

    expect(screen.getByText('nathansobo')).toBeInTheDocument();
    expect(screen.getByText('OP')).toBeInTheDocument();
    expect(
      screen.getByText(/Depth 2 reply visible initially/)
    ).toBeInTheDocument();

    // Depth 3 should be gated behind "Load 1 deeper reply"
    expect(
      screen.queryByText(/Depth 3 reply gated behind on-demand load button/)
    ).not.toBeInTheDocument();

    const loadDeeperBtn = screen.getByRole('button', {
      name: /Load 1 deeper reply/i,
    });
    fireEvent.click(loadDeeperBtn);

    expect(
      screen.getByText(/Depth 3 reply gated behind on-demand load button/)
    ).toBeInTheDocument();
  });

  it('supports collapsing all replies or collapsing all comments into single lines', () => {
    render(<CommentTree comments={sampleComments} storyAuthor="nathansobo" />);

    const collapseRepliesBtn = screen.getByRole('button', {
      name: /Collapse Replies/i,
    });
    fireEvent.click(collapseRepliesBtn);

    expect(
      screen.queryByText(/We cache per-monitor DPI/)
    ).not.toBeInTheDocument();
    expect(screen.getByText(/How does glyph caching work/)).toBeInTheDocument();

    const collapseAllBtn = screen.getByRole('button', {
      name: /Collapse All/i,
    });
    fireEvent.click(collapseAllBtn);

    // In Collapse All mode, the full paragraph is replaced by the single-line summary bar (+4)
    expect(screen.getByText('+4')).toBeInTheDocument();
  });

  it('calculates adaptive root, depth, and sibling budgets based on total comment count', () => {
    expect(getAdaptiveThreadBudget(20)).toEqual({
      rootBatch: 25,
      maxDepth: 2,
      siblingReplies: 10,
    });
    expect(getAdaptiveThreadBudget(90)).toEqual({
      rootBatch: 12,
      maxDepth: 2,
      siblingReplies: 5,
    });
    expect(getAdaptiveThreadBudget(240)).toEqual({
      rootBatch: 8,
      maxDepth: 2,
      siblingReplies: 3,
    });
    expect(getAdaptiveThreadBudget(650)).toEqual({
      rootBatch: 6,
      maxDepth: 1,
      siblingReplies: 2,
    });
  });
});
