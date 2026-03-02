import React from 'react';

export default function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-14 border border-dashed border-white/10 rounded-2xl space-y-3 bg-white/[0.01]">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-primary/80" aria-hidden="true">{icon}</span>
      </div>
      <h3 className="text-sm font-bold">{title}</h3>
      <p className="text-muted text-sm max-w-md mx-auto">{description}</p>
      {action}
    </div>
  );
}
