
import React from 'react';

export const COLORS = {
  primary: '#13a4ec',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

export const Icon: React.FC<{ name: string; className?: string; fill?: boolean }> = ({ name, className = '', fill = false }) => (
  <span className={`material-symbols-outlined ${fill ? 'fill-current' : ''} ${className}`}>
    {name}
  </span>
);
