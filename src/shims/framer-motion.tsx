'use client';

import React from 'react';

type WrapperProps = React.PropsWithChildren<{
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
  className?: string;
}>;

function MotionDiv({ children, className }: WrapperProps) {
  return <div className={className}>{children}</div>;
}

export const motion = {
  div: MotionDiv,
};

export function AnimatePresence({ children }: React.PropsWithChildren<{ mode?: 'wait' | 'sync' | 'popLayout' }>) {
  return <>{children}</>;
}
