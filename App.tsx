
import React, { useState, useEffect, useMemo } from 'react';
import { User, TransactionType } from './types';
import { storageService } from './services/storageService';
import { format } from 'date-fns';
import AuthPage from './components/AuthPage';
import DailyLedger from './components/DailyLedger';
import HistoryView from './components/HistoryView';

type NavigationTab = 'daily' | 'history';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('daily');
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const user = storageService.getCurrentUser();
    if (user) setCurrentUser(user);
    setLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    storageService.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    storageService.setCurrentUser(null);
    setCurrentUser(null);
    setActiveTab('daily');
  };

  const stats = useMemo(() => {
    if (!currentUser) return { net: 0, balance: 0 };
    const txs = storageService.getTransactions(currentUser.id);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    const balance = txs.reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);
    const dailyNet = txs
      .filter(t => t.date === todayStr)
      .reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);
    
    return { net: dailyNet, balance };
  }, [currentUser, refreshTrigger, activeTab]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {!currentUser ? (
        <AuthPage onLogin={handleLogin} />
      ) : (
        <div className="pb-32">
          <main>
            {activeTab === 'daily' && <DailyLedger user={currentUser} onLogout={handleLogout} onDataChange={() => setRefreshTrigger(t => t + 1)} />}
            {activeTab === 'history' && <HistoryView user={currentUser} />}
          </main>

          {/* Navigation Bar */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-[500]">
            <nav className="bg-slate-900/95 backdrop-blur-2xl rounded-[3rem] p-2 flex justify-between items-center shadow-2xl border border-white/10 ring-1 ring-slate-950/20">
              <NavButton active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} icon="M12 6v6m0 0v6m0-6h6m-6 0H6" label="Entries" />
              <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" label="Archive" />
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center py-3 rounded-[2.5rem] transition-all ${active ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}
  >
    <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icon} /></svg>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
