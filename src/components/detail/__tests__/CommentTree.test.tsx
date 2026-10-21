import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CommentTree } from '../CommentTree';
import { HNComment } from '@/types/hn';

const sampleComments: HNComment[] = [
  {
    id: 901,
    user: 'tptacek',
    time: 1700000000,
    text: '<p>How does glyph caching work on Wayland?</p>',
    totalDescendants: 1,
    children: [
      {
        id: 902,
        user: 'nathansobo',
        time: 1700000200,
        text: '<p>We cache per-monitor DPI in blade.</p>',
        totalDescendants: 0,
        children: [],
      },
    ],
  },
];

describe('CommentTree & Color-Coded Collapse', () => {
  it('renders nested comments, highlights OP, and supports collapsing all replies', () => {
    render(<CommentTree comments={sampleComments} storyAuthor="nathansobo" />);

    expect(screen.getByText('tptacek')).toBeInTheDocument();
    expect(screen.getByText('nathansobo')).toBeInTheDocument();
    expect(screen.getByText('OP')).toBeInTheDocument();
    expect(screen.getByText(/We cache per-monitor DPI/)).toBeInTheDocument();

    // Click "Collapse Replies" button to view root comments only
    const collapseRepliesBtn = screen.getByRole('button', { name: /Collapse Replies/i });
    fireEvent.click(collapseRepliesBtn);

    expect(screen.queryByText(/We cache per-monitor DPI/)).not.toBeInTheDocument();
    expect(screen.getByText(/How does glyph caching work/)).toBeInTheDocument();
  });
});
