
import React from 'react';
import { Icon } from '../constants';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onAction?: () => void;
  actionIcon?: string;
  showNotifications?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onAction, actionIcon, showNotifications = true }) => {
  return (
    <div className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center p-4 justify-between max-w-lg mx-auto w-full md:max-w-none md:px-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {showNotifications && (
            <button className="flex items-center justify-center rounded-full w-10 h-10 bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Icon name="notifications" />
            </button>
          )}
          {onAction && actionIcon && (
            <button
              onClick={onAction}
              className="flex items-center justify-center rounded-full w-10 h-10 bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <Icon name={actionIcon} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
