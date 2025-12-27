
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './screens/Dashboard';
import Materials from './screens/Materials';
import Sales from './screens/Sales';
import Calculator from './screens/Calculator';
import Settings from './screens/Settings';
import Sidebar from './components/Sidebar';
import Login from './screens/Login';
import { AuthProvider, useAuth } from './components/AuthContext';

const AppContent: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen transition-all">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
