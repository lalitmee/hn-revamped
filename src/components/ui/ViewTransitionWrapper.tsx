'use client';

import React from 'react';

export const SafeViewTransition: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};
