'use client';

import React from 'react';

type AnyReactWithVT = typeof React & {
  ViewTransition?: React.ComponentType<{ children: React.ReactNode }>;
  unstable_ViewTransition?: React.ComponentType<{ children: React.ReactNode }>;
};

const NativeViewTransition =
  (React as AnyReactWithVT).ViewTransition ??
  (React as AnyReactWithVT).unstable_ViewTransition ??
  React.Fragment;

export const SafeViewTransition: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <NativeViewTransition>{children}</NativeViewTransition>;
};
