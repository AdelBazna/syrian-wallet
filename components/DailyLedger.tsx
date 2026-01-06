
import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { Transaction, TransactionType, User, Currency } from '../types';
import { storageService } from '../services/storageService';
import TransactionForm from './TransactionForm';
import Button from './Button';

interface DailyLedgerProps {
  user: User;
  onLogout: () => void;
  onDataChange?: () => void;
}

const DailyLedger: React.FC<DailyLedgerProps> = ({ user, onLogout, onDataChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('NEW_SYP');
  const [globalRate, setGlobalRate] = useState(storageService.getGlobalUsdRate());
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);

  const today = new Date();
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const isViewingToday = format(currentDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = () => {
    const all = storageService.getTransactions(user.id);
    setTransactions([...all]);
    if (onDataChange) onDataChange();
  };

  const startingBalance = useMemo(() => {
    return transactions
      .filter(t => t.userId === user.id && t.date < dateStr)
      .reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);
  }, [user.id, dateStr, transactions]);

  const dailyTransactions = useMemo(() => transactions.filter(t => t.date === dateStr), [transactions, dateStr]);
  const dailyStats = useMemo(() => {
    return dailyTransactions.reduce((acc, t) => {
      if (t.type === TransactionType.INCOME) acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [dailyTransactions]);

  const dailyNetChange = dailyStats.income - dailyStats.expense;
  const dailyEndingBalance = startingBalance + dailyNetChange;

  const formatCurrency = (val: number, curr: Currency) => {
    let displayVal = val;
    let label = curr === 'NEW_SYP' ? 'N.SYP' : curr === 'OLD_SYP' ? 'O.SYP' : '$';
    if (curr === 'OLD_SYP') displayVal = val * 100;
    if (curr === 'USD') displayVal = val / globalRate;
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: curr === 'USD' ? 2 : 0 }).format(displayVal) + ' ' + label;
  };

  const handleAdd = (data: any) => {
    const newTx: Transaction = { id: `tx_${Date.now()}`, userId: user.id, ...data, date: dateStr, createdAt: Date.now() };
    storageService.addTransaction(newTx);
    loadData();
    setIsAdding(false);
  };

  const syncUrl = useMemo(() => storageService.generateSyncUrl(), [transactions, globalRate]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(syncUrl);
    alert("Cloud Sync Link copied! Open this on your other device to restore your data.");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (storageService.importData(content)) {
        window.location.reload();
      } else {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-14 animate-reveal">
      <header className="flex justify-between items-center mb-12">
        <div className="animate-reveal stagger-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tightest">Today's Ledger</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Sync Active
          </p>
        </div>
        <div className="flex items-center gap-2.5 animate-reveal stagger-2">
          <button 
            onClick={() => setIsEditingRate(!isEditingRate)} 
            className={`p-3.5 rounded-2xl transition-all duration-300 ${isEditingRate ? 'bg-indigo-600 text-white shadow-2xl rotate-12 scale-110' : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600 hover:rotate-3'}`}
            title="Update Market Rate"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-3.5 rounded-2xl text-slate-400 hover:bg-slate-100 transition-all duration-300 ${showSettings ? 'rotate-90 text-indigo-600 bg-indigo-50' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </button>
            {showSettings && (
              <div className="absolute right-0 mt-4 w-64 bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-[120] animate-reveal">
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cloud & Access</p>
                </div>
                <button onClick={() => { setShowSyncModal(true); setShowSettings(false); }} className="w-full text-left px-7 py-5 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-between group">
                  Cloud Sync (QR)
                  <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                </button>
                <button onClick={() => { storageService.downloadBackup(); setShowSettings(false); }} className="w-full text-left px-7 py-5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors border-b border-slate-100">Download Backup</button>
                <label className="w-full text-left px-7 py-5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 block">
                  Restore from File
                  <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                </label>
                <button onClick={onLogout} className="w-full text-left px-7 py-5 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-colors">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Cloud Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-2xl animate-reveal" onClick={() => setShowSyncModal(false)}>
          <div className="bg-white rounded-[4rem] w-full max-w-sm p-12 text-center shadow-3xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-3xl font-black text-slate-900 tracking-tightest uppercase mb-4">Cloud Beam</h3>
            <p className="text-xs text-slate-500 font-medium mb-8 leading-relaxed">Scan this QR code with your phone to instantly sync all your financial records without a database.</p>
            
            <div className="bg-slate-50 p-6 rounded-[3rem] mb-8 flex justify-center border-2 border-slate-100">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(syncUrl)}`} 
                alt="Sync QR Code"
                className="w-48 h-48 rounded-2xl shadow-lg mix-blend-multiply"
              />
            </div>

            <Button fullWidth variant="primary" onClick={handleCopyLink} className="!py-5 !rounded-2xl mb-4">Copy Cloud Link</Button>
            <Button fullWidth variant="ghost" onClick={() => setShowSyncModal(false)}>Close</Button>
            
            <p className="mt-8 text-[9px] font-black text-indigo-400 uppercase tracking-widest">Powered by LocalSync 1.0</p>
          </div>
        </div>
      )}

      {/* Exchange Rate Editor Overlay */}
      {isEditingRate && (
        <div className="mb-12 p-8 bg-white rounded-[3rem] border border-indigo-100 shadow-2xl shadow-indigo-100 animate-reveal">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Global Market Rate</label>
          </div>
          <div className="flex gap-4">
            <div className="relative flex-1">
               <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$1 = </span>
               <input 
                type="number" 
                defaultValue={globalRate} 
                onBlur={(e) => {
                  const val = parseFloat(e.target.value);
                  if (val > 0) { storageService.setGlobalUsdRate(val); setGlobalRate(val); if (onDataChange) onDataChange(); }
                  setIsEditingRate(false);
                }}
                className="w-full bg-slate-50 pl-14 pr-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none font-black text-xl tabular-nums transition-all"
                autoFocus 
              />
            </div>
            <Button onClick={() => setIsEditingRate(false)} className="px-8 shadow-indigo-100">Save</Button>
          </div>
        </div>
      )}

      <div className="space-y-12">
        {/* Main Date Display */}
        <div className="premium-card rounded-[3.5rem] p-10 text-center bg-white flex items-center justify-between border-slate-100/50 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -z-10 group-hover:bg-indigo-100 transition-colors"></div>
          <button onClick={() => setCurrentDate(addDays(currentDate, -1))} className="p-5 text-slate-300 hover:text-indigo-600 transition-all hover:scale-125 hover:rotate-[-8deg] active:scale-90">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="transition-all group-hover:scale-110">
            <p className="text-indigo-600 font-black text-[11px] uppercase tracking-[0.5em] mb-2">{format(currentDate, 'EEEE')}</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tightest">{format(currentDate, 'dd MMM yyyy')}</h2>
          </div>
          <button disabled={isViewingToday} onClick={() => setCurrentDate(addDays(currentDate, 1))} className={`p-5 transition-all hover:scale-125 hover:rotate-[8deg] active:scale-90 ${isViewingToday ? 'opacity-0' : 'text-slate-300 hover:text-indigo-600'}`}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>

        {/* Currency Perspective Select */}
        <div className="flex justify-center p-2 bg-slate-200/40 backdrop-blur-md rounded-[2.5rem] w-fit mx-auto border border-slate-200/20">
          {(['NEW_SYP', 'OLD_SYP', 'USD'] as Currency[]).map(c => (
            <button key={c} onClick={() => setDisplayCurrency(c)} className={`px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${displayCurrency === c ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}>{c.replace('_', ' ')}</button>
          ))}
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="premium-card p-10 rounded-[3rem] bg-white flex flex-col justify-between h-40 border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Net Flow</span>
            <p className={`text-3xl font-black tabular-nums tracking-tighter ${dailyNetChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{dailyNetChange > 0 ? '+' : ''}{formatCurrency(dailyNetChange, displayCurrency)}</p>
          </div>
          <div className="premium-card p-10 rounded-[3rem] bg-slate-900 text-white border-none shadow-3xl shadow-indigo-900/10 flex flex-col justify-between h-40">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Final Assets</span>
            <p className="text-3xl font-black tabular-nums tracking-tighter">{formatCurrency(dailyEndingBalance, displayCurrency)}</p>
          </div>
        </div>

        {/* Entries List */}
        <div className="space-y-8 pb-10">
          <div className="flex justify-between items-center px-6">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em]">Transactions</h3>
            <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-7 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-500/20 hover:scale-110 hover:-rotate-2 transition-all active:scale-95">Add Record</button>
          </div>
          
          {isAdding && <div className="animate-reveal"><TransactionForm onSubmit={handleAdd} onCancel={() => setIsAdding(false)} /></div>}
          
          <div className="space-y-5">
            {dailyTransactions.map(tx => (
              <div key={tx.id} onClick={() => setViewingTx(tx)} className="premium-card p-7 rounded-[2.5rem] flex items-center justify-between cursor-pointer hover:bg-slate-50/50 group active:scale-[0.97] border-slate-100/50">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 ${tx.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <span className="text-2xl font-black">{tx.type === TransactionType.INCOME ? '↓' : '↑'}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight truncate max-w-[180px] mb-1.5">{tx.description}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tx.originalAmount.toLocaleString()} {tx.inputCurrency === 'USD' ? '$' : 'SYP'}</p>
                  </div>
                </div>
                <p className={`text-2xl font-black tabular-nums tracking-tighter ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>{tx.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(tx.amount, displayCurrency)}</p>
              </div>
            ))}
            {dailyTransactions.length === 0 && (
              <div className="py-28 text-center border-4 border-dashed border-slate-200/40 rounded-[4rem] opacity-20 group">
                <p className="text-[11px] font-black uppercase tracking-[0.8em] group-hover:tracking-[1em] transition-all">Pure Ledger</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Inspector Modal */}
      {viewingTx && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-slate-950/70 backdrop-blur-xl animate-reveal" onClick={() => setViewingTx(null)}>
          <div className="bg-white rounded-[4rem] w-full max-w-sm p-14 text-center shadow-3xl ring-1 ring-white/20" onClick={e => e.stopPropagation()}>
            <div className={`w-28 h-28 rounded-[2.8rem] mx-auto flex items-center justify-center mb-10 text-white shadow-2xl ${viewingTx.type === TransactionType.INCOME ? 'bg-emerald-600 shadow-emerald-200' : 'bg-rose-600 shadow-rose-200'}`}>
               <span className="text-5xl font-black">{viewingTx.type === TransactionType.INCOME ? '↓' : '↑'}</span>
            </div>
            <h3 className="text-4xl font-black text-slate-900 tracking-tightest uppercase mb-4">{viewingTx.description}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-10">TS: {format(viewingTx.createdAt, 'HH:mm:ss')}</p>
            
            <div className="space-y-4 mb-12">
               <div className="bg-slate-50 p-7 rounded-[2rem] flex justify-between items-center border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Input</span>
                  <span className="font-black text-slate-900 text-xl">{viewingTx.originalAmount.toLocaleString()} {viewingTx.inputCurrency}</span>
               </div>
               <div className="bg-indigo-50/30 p-7 rounded-[2rem] flex justify-between items-center border border-indigo-100/50">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Base SYP</span>
                  <span className="font-black text-indigo-900 text-xl">{viewingTx.amount.toLocaleString()} <span className="text-xs">N.SYP</span></span>
               </div>
            </div>

            <Button fullWidth variant="primary" onClick={() => setViewingTx(null)} className="!py-6 !rounded-[2rem] text-sm uppercase tracking-widest">Dismiss</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyLedger;
