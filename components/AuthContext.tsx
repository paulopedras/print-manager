
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string) => void;
  logout: () => void;
  getStorageKey: (baseKey: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('pm_active_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (username: string) => {
    const userData: User = {
      id: btoa(username.toLowerCase()).slice(0, 8),
      username,
    };
    setUser(userData);
    localStorage.setItem('pm_active_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pm_active_user');
  };

  const getStorageKey = (baseKey: string) => {
    if (!user) return baseKey;
    return `user_${user.id}_${baseKey}`;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, getStorageKey }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
