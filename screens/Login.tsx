
import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { Icon } from '../constants';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const { login } = useAuth();

  const handleEnter = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login(username.trim());
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background-dark relative overflow-hidden font-display">
      {/* Dynamic background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-md px-6 z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="size-20 bg-primary/10 text-primary rounded-[2.5rem] flex items-center justify-center mb-6 border border-primary/20 shadow-2xl shadow-primary/20">
            <Icon name="precision_manufacturing" className="text-4xl" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2 uppercase">PrintManager</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Industrial Management OS</p>
        </div>

        <div className="bg-surface-dark/40 backdrop-blur-2xl border border-white/5 rounded-[3.5rem] p-10 shadow-2xl ring-1 ring-white/10">
          <h2 className="text-xl font-bold text-white mb-8 text-center">Establish Connection</h2>
          
          <form onSubmit={handleEnter} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Operator Identity</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                  <Icon name="fingerprint" className="text-xl" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-slate-900/50 border border-slate-800/50 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-16 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
              <span className="uppercase tracking-widest text-xs">Login to Terminal</span>
              <Icon name="login" className="text-xl group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">
              Localized Storage Protocol Enabled<br/>
              Data encrypted on this device
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
