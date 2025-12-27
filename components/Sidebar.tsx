
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../constants';
import { useAuth } from './AuthContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Filaments', path: '/' },
    { id: 'materials', icon: 'inventory_2', label: 'Components', path: '/materials' },
    { id: 'sales', icon: 'receipt_long', label: 'Sales History', path: '/sales' },
    { id: 'calculator', icon: 'calculate', label: 'Price Calculator', path: '/calculator' },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3 text-primary mb-8">
          <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Icon name="precision_manufacturing" className="text-2xl" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">PrintManager</span>
        </div>
        
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon name={item.icon} fill={isActive} />
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
        <div className="p-3 mb-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center gap-3 border border-slate-100 dark:border-slate-800">
           <div className="size-9 bg-primary/20 text-primary rounded-xl flex items-center justify-center font-black">
              {user?.username.charAt(0).toUpperCase()}
           </div>
           <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase">{user?.username}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Operator</p>
           </div>
        </div>

        <Link
          to="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            location.pathname === '/settings'
              ? 'bg-slate-100 dark:bg-slate-800 text-primary shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Icon name="settings" fill={location.pathname === '/settings'} />
          <span className="font-semibold">Settings</span>
        </Link>
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
        >
          <Icon name="logout" />
          <span className="font-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
