
import React, { useState } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';
import Button from './Button';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      const users = storageService.getUsers();
      const user = users.find(u => u.username === username && u.password === password);
      if (user) onLogin(user); else setError('Invalid credentials');
    } else {
      const users = storageService.getUsers();
      if (users.some(u => u.username === username)) { setError('Taken'); return; }
      const newUser: User = { id: Math.random().toString(36).substr(2, 9), username, password };
      storageService.saveUser(newUser);
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12 animate-reveal">
           <div className="w-20 h-20 bg-slate-900 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl rotate-3">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Syrian Wallet</h1>
           <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Private Ledger System</p>
        </div>

        <div className="premium-card p-10 rounded-[3rem] animate-reveal stagger-1 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Name</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 focus:border-slate-900 outline-none font-bold transition-all" placeholder="Enter username" required />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Key</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 focus:border-slate-900 outline-none font-bold transition-all" placeholder="••••••••" required />
             </div>
             {error && <p className="text-rose-600 text-[10px] font-black uppercase text-center">{error}</p>}
             <Button fullWidth className="py-5 !rounded-2xl">{isLogin ? 'Enter Ledger' : 'Create Account'}</Button>
          </form>
          <div className="mt-8 text-center">
             <button onClick={() => setIsLogin(!isLogin)} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors tracking-widest">
                {isLogin ? "Need access? Join" : "Have access? Enter"}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;