'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FeedType } from '@/types/hn';
import styles from './FeedTransition.module.css';

const FEEDS: { id: FeedType; label: string; icon: string }[] = [
  { id: 'top', label: 'Top', icon: 'local_fire_department' },
  { id: 'new', label: 'New', icon: 'bolt' },
  { id: 'best', label: 'Best', icon: 'workspace_premium' },
  { id: 'ask', label: 'Ask', icon: 'help' },
  { id: 'show', label: 'Show', icon: 'rocket_launch' },
  { id: 'jobs', label: 'Jobs', icon: 'work' },
  { id: 'saved', label: 'Saved', icon: 'bookmark' },
];

type Phase = 'idle' | 'exit' | 'middle' | 'enter';

export function FeedTransition({
  feed,
  loading,
  children,
}: {
  feed: FeedType;
  loading: boolean;
  children: React.ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const previousFeed = useRef(feed);
  const lastContent = useRef(children);
  const [outgoing, setOutgoing] = useState<React.ReactNode>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const [settled, setSettled] = useState(false);
  const destination = FEEDS.find((item) => item.id === feed)!;

  useLayoutEffect(() => {
    if (previousFeed.current !== feed) {
      const from = FEEDS.findIndex((item) => item.id === previousFeed.current);
      const to = FEEDS.findIndex((item) => item.id === feed);
      const forward = (to - from + FEEDS.length) % FEEDS.length;
      setDirection(forward <= FEEDS.length / 2 ? 'left' : 'right');
      previousFeed.current = feed;
      setOutgoing(lastContent.current);
      setSettled(false);
      setPhase('exit');
    } else if (phase === 'idle') {
      lastContent.current = children;
    }
  }, [feed, children, phase]);

  useEffect(() => {
    if (phase === 'idle') return;
    const timer = setTimeout(
      () => {
        if (phase === 'exit') {
          // Reset only after the outgoing viewport has finished moving away.
          if (root.current?.parentElement)
            root.current.parentElement.scrollTop = 0;
          setPhase('middle');
        } else if (phase === 'middle') {
          setSettled(true);
        } else {
          setOutgoing(null);
          setPhase('idle');
        }
      },
      phase === 'enter' ? 200 : phase === 'exit' ? 140 : 160
    );
    return () => clearTimeout(timer);
  }, [feed, phase]);

  useEffect(() => {
    if (phase === 'middle' && settled && !loading) setPhase('enter');
  }, [phase, settled, loading]);

  return (
    <div
      ref={root}
      className={styles.viewport}
      data-phase={phase}
      data-direction={direction}
    >
      {phase === 'middle' ? (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={styles.destination}
        >
          <span
            aria-hidden="true"
            className={`material-symbols-rounded ${styles.icon}`}
          >
            {destination.icon}
          </span>
          <span className={styles.label}>{destination.label}</span>
          <span className={styles.caption}>
            {loading ? 'Loading stories…' : 'Opening feed'}
          </span>
          {loading && (
            <span
              aria-hidden="true"
              className={`material-symbols-rounded ${styles.loader}`}
            >
              progress_activity
            </span>
          )}
        </div>
      ) : (
        <div
          key={feed}
          className={
            phase === 'exit'
              ? styles.exit
              : phase === 'enter'
                ? styles.enter
                : undefined
          }
          inert={phase === 'exit' ? true : undefined}
          aria-hidden={phase === 'exit' ? true : undefined}
        >
          {phase === 'exit' ? outgoing : children}
        </div>
      )}
    </div>
  );
}
