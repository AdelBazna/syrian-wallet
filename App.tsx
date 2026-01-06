
import React, { useState, useEffect, useMemo } from 'react';
import { User, Transaction, TransactionType } from './types';
import { storageService } from './services/storageService';
import { format } from 'date-fns';
import AuthPage from './components/AuthPage';
import DailyLedger from './components/DailyLedger';
import HistoryView from './components/HistoryView';
import AiInsights from './components/AiInsights';

type NavigationTab = 'daily' | 'history' | 'ai';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('daily');
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Check if we arrived via a Sync Link
    const wasSynced = storageService.loadFromUrl();
    if (wasSynced) {
      alert("Cloud Data Restored Successfully!");
    }

    const user = storageService.getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    storageService.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    storageService.setCurrentUser(null);
    setCurrentUser(null);
  };

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const stats = useMemo(() => {
    if (!currentUser) return { net: 0, balance: 0 };
    const txs = storageService.getTransactions(currentUser.id);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    const balance = txs.reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);
    const dailyNet = txs
      .filter(t => t.date === todayStr)
      .reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);
    
    return { net: dailyNet, balance };
  }, [currentUser, refreshTrigger]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-indigo-100 pb-48">
      {!currentUser ? (
        <AuthPage onLogin={handleLogin} />
      ) : (
        <>
          <main className="animate-reveal relative z-0">
            {activeTab === 'daily' && <DailyLedger user={currentUser} onLogout={handleLogout} onDataChange={triggerRefresh} />}
            {activeTab === 'history' && <HistoryView user={currentUser} />}
            {activeTab === 'ai' && <AiInsights user={currentUser} />}
          </main>

          {/* Persistent Floating Command Center */}
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-[460px] px-6 z-50">
            <div className="flex flex-col gap-4">
              {/* Mini Status Dashboard */}
              <div className="bg-slate-900/95 backdrop-blur-3xl rounded-[2.5rem] p-6 flex justify-between items-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] border border-white/10 animate-reveal stagger-1">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-1">Total Assets</span>
                  <span className="text-xl font-black text-white tabular-nums tracking-tighter">
                    {new Intl.NumberFormat('en-US').format(stats.balance)} <span className="text-[10px] text-indigo-400 font-bold ml-1">SYP</span>
                  </span>
                </div>
                <div className="h-10 w-px bg-white/10 mx-2"></div>
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-1">Today's Flow</span>
                  <span className={`text-xl font-black tabular-nums tracking-tighter ${stats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {stats.net > 0 ? '+' : ''}{new Intl.NumberFormat('en-US').format(stats.net)} <span className="text-[10px] opacity-60 font-bold ml-1">SYP</span>
                  </span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="bg-white/90 backdrop-blur-2xl rounded-[3rem] p-2 flex justify-between items-center shadow-2xl border border-slate-200/60 ring-1 ring-slate-900/5">
                <NavButton active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} icon="M12 6v6m0 0v6m0-6h6m-6 0H6" label="Today" />
                <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" label="History" />
                <NavButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon="M13 10V3L4 14h7v7l9-11h-7z" label="AI Insight" />
              </nav>
            </div>
          </div>
        </>
      )}
      
      {/* Dynamic Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-indigo-500/5 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-emerald-500/5 rounded-full blur-[140px]"></div>
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center py-4 transition-all duration-500 rounded-[2.5rem] relative group ${active ? 'bg-slate-900 text-white shadow-2xl translate-y-[-2px]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
  >
    <svg className={`w-5 h-5 mb-1.5 transition-transform duration-500 ${active ? 'scale-110' : 'scale-100 opacity-60 group-hover:opacity-100 group-hover:scale-110'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon} />
    </svg>
    <span className="text-[8px] font-black uppercase tracking-[0.3em]">{label}</span>
    {active && <span className="absolute bottom-2 w-1 h-1 bg-indigo-400 rounded-full animate-ping"></span>}
  </button>
);

export default App;
