
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
    const cleanUsername = username.trim().toLowerCase();
    
    if (isLogin) {
      const users = storageService.getUsers();
      const user = users.find(u => u.username.toLowerCase() === cleanUsername && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError('Incorrect Access Key or Username');
      }
    } else {
      const users = storageService.getUsers();
      if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
        setError('Username already taken');
        return;
      }
      const newUser: User = { 
        id: `u_${Math.random().toString(36).substr(2, 9)}`, 
        username: cleanUsername, 
        password 
      };
      storageService.saveUser(newUser);
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10 animate-reveal">
           <div className="w-16 h-16 bg-slate-900 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl rotate-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter">MyWallet</h1>
           <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Private Syrian Ledger</p>
        </div>

        <div className="premium-card p-10 rounded-[3rem] bg-white animate-reveal stagger-1">
          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Name</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => { setUsername(e.target.value); setError(''); }} 
                  className="w-full bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 focus:border-indigo-600 outline-none font-bold transition-all" 
                  placeholder="Username" 
                  required 
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Key</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => { setPassword(e.target.value); setError(''); }} 
                  className="w-full bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 focus:border-indigo-600 outline-none font-bold transition-all" 
                  placeholder="Key" 
                  required 
                />
             </div>
             {error && (
               <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl">
                  <p className="text-rose-600 text-[9px] font-black uppercase text-center">{error}</p>
               </div>
             )}
             <Button fullWidth className="py-5 !rounded-2xl">{isLogin ? 'Open Vault' : 'Initialize Account'}</Button>
          </form>
          <div className="mt-8 text-center">
             <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-[9px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors tracking-widest">
                {isLogin ? "New user? Create Ledger" : "Existing user? Login"}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
