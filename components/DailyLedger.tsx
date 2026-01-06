
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
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('NEW_SYP');
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [globalRate, setGlobalRate] = useState(storageService.getGlobalUsdRate());

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const isViewingToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadData();
  }, [user.id, currentDate]);

  const loadData = () => {
    const all = storageService.getTransactions(user.id);
    setTransactions(all);
    if (onDataChange) onDataChange();
  };

  const startingBalance = useMemo(() => {
    return transactions
      .filter(t => t.date < dateStr)
      .reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);
  }, [dateStr, transactions]);

  const dailyTransactions = useMemo(() => transactions.filter(t => t.date === dateStr), [transactions, dateStr]);
  
  const dailyStats = useMemo(() => {
    return dailyTransactions.reduce((acc, t) => {
      if (t.type === TransactionType.INCOME) acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [dailyTransactions]);

  const formatCurrency = (val: number, curr: Currency) => {
    let displayVal = val;
    let label = curr === 'NEW_SYP' ? 'N.SYP' : curr === 'OLD_SYP' ? 'O.SYP' : '$';
    if (curr === 'OLD_SYP') displayVal = val * 100;
    if (curr === 'USD') displayVal = val / globalRate;
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: curr === 'USD' ? 2 : 0 }).format(displayVal) + ' ' + label;
  };

  const handleAdd = (data: any) => {
    const newTx: Transaction = { 
      id: `tx_${Date.now()}`, 
      userId: user.id, 
      ...data, 
      date: dateStr, 
      createdAt: Date.now() 
    };
    storageService.addTransaction(newTx);
    loadData();
    setIsAdding(false);
  };

  const handleUpdate = (data: any) => {
    if (!editingTx) return;
    const updatedTx: Transaction = {
      ...editingTx,
      ...data
    };
    storageService.updateTransaction(updatedTx);
    loadData();
    setEditingTx(null);
  };

  const handleDelete = (id: string) => {
    storageService.deleteTransaction(id);
    loadData();
    setViewingTx(null);
    setIsConfirmingDelete(false);
  };

  const closeModals = () => {
    setViewingTx(null);
    setIsConfirmingDelete(false);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 pb-40 animate-reveal">
      <header className="relative z-[200] flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Daily Ledger</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Syrian Market Mode</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-3 rounded-2xl transition-all ${showSettings ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
          </button>

          {showSettings && (
            <div className="absolute right-0 top-14 w-56 bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden z-[9999] animate-reveal">
              <div className="p-3 bg-slate-50 border-b border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Settings</p>
              </div>
              <button onClick={() => setIsEditingRate(true)} className="w-full text-left px-5 py-4 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Exchange Rate</button>
              <button onClick={onLogout} className="w-full text-left px-5 py-4 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors">Sign Out</button>
            </div>
          )}
        </div>
      </header>

      <div className="premium-card rounded-[2.5rem] p-6 mb-8 flex items-center justify-between border-slate-100">
        <button onClick={() => setCurrentDate(addDays(currentDate, -1))} className="p-3 text-slate-400 hover:text-indigo-600 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg></button>
        <div className="text-center">
          <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">{format(currentDate, 'EEEE')}</p>
          <h2 className="text-xl font-black text-slate-900">{format(currentDate, 'dd MMM yyyy')}</h2>
        </div>
        <button disabled={isViewingToday} onClick={() => setCurrentDate(addDays(currentDate, 1))} className={`p-3 ${isViewingToday ? 'opacity-0' : 'text-slate-400 hover:text-indigo-600'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg></button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="premium-card p-6 rounded-[2.5rem] bg-indigo-600 text-white border-none shadow-xl shadow-indigo-100">
          <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Assets</p>
          <p className="text-lg font-black tabular-nums truncate">{formatCurrency(startingBalance + (dailyStats.income - dailyStats.expense), displayCurrency)}</p>
        </div>
        <div className="premium-card p-6 rounded-[2.5rem] bg-white border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Today Net</p>
          <p className={`text-lg font-black tabular-nums truncate ${dailyStats.income - dailyStats.expense >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {dailyStats.income - dailyStats.expense >= 0 ? '+' : ''}{formatCurrency(dailyStats.income - dailyStats.expense, displayCurrency)}
          </p>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
        {(['NEW_SYP', 'OLD_SYP', 'USD'] as Currency[]).map(c => (
          <button key={c} onClick={() => setDisplayCurrency(c)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${displayCurrency === c ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
            {c.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Entries</h3>
          <Button onClick={() => { setIsAdding(true); setEditingTx(null); }} className="!py-2 !px-4 !text-[10px] uppercase tracking-widest !rounded-xl">Add Record</Button>
        </div>

        {isAdding && (
          <div className="animate-reveal">
            <TransactionForm onSubmit={handleAdd} onCancel={() => setIsAdding(false)} />
          </div>
        )}

        {editingTx && (
          <div className="animate-reveal">
            <TransactionForm initialData={editingTx} onSubmit={handleUpdate} onCancel={() => setEditingTx(null)} />
          </div>
        )}

        <div className="space-y-3">
          {dailyTransactions.map(tx => (
            <div 
              key={tx.id} 
              onClick={() => setViewingTx(tx)}
              className="premium-card p-5 rounded-3xl flex items-center justify-between border-slate-100 hover:border-indigo-100 transition-all cursor-pointer group active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${tx.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {tx.type === TransactionType.INCOME ? '↓' : '↑'}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm truncate max-w-[140px]">{tx.description}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{tx.originalAmount.toLocaleString()} {tx.inputCurrency}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-black text-base tabular-nums ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {tx.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(tx.amount, displayCurrency)}
                </p>
                <div className="flex justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-[8px] font-bold text-slate-300 uppercase">View Details</span>
                </div>
              </div>
            </div>
          ))}
          {dailyTransactions.length === 0 && !isAdding && !editingTx && (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem] opacity-40">
              <p className="text-[10px] font-black uppercase tracking-widest">No entries for this day</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {viewingTx && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-reveal">
            <div className={`p-8 ${viewingTx.type === TransactionType.INCOME ? 'bg-emerald-600' : 'bg-slate-900'} text-white`}>
               <div className="flex justify-between items-start mb-6">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Record Details</span>
                  <button onClick={closeModals} className="text-white/60 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
               </div>
               <h2 className="text-3xl font-black mb-1 leading-tight">{viewingTx.description}</h2>
               <p className="text-white/60 font-bold text-xs uppercase tracking-widest">{format(new Date(viewingTx.date), 'dd MMMM yyyy')}</p>
            </div>
            <div className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Input Value</p>
                    <p className="font-black text-slate-900 text-lg tabular-nums">{viewingTx.originalAmount.toLocaleString()} <span className="text-[10px] text-slate-400">{viewingTx.inputCurrency}</span></p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Normalized</p>
                    <p className="font-black text-slate-900 text-lg tabular-nums">{viewingTx.amount.toLocaleString()} <span className="text-[10px] text-slate-400">N.SYP</span></p>
                  </div>
               </div>
               
               {viewingTx.notes && (
                 <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase ml-1">Notes & Details</p>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{viewingTx.notes}</p>
                    </div>
                 </div>
               )}

               {!isConfirmingDelete ? (
                 <div className="flex gap-3 pt-4">
                    <Button variant="danger" className="flex-1 !rounded-2xl !py-4" onClick={() => setIsConfirmingDelete(true)}>Delete</Button>
                    <Button variant="primary" className="flex-[2] !rounded-2xl !py-4" onClick={() => { setEditingTx(viewingTx); setViewingTx(null); }}>Edit Record</Button>
                 </div>
               ) : (
                 <div className="pt-4 space-y-3 animate-reveal">
                    <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 mb-4">
                       <p className="text-rose-600 text-[10px] font-black uppercase text-center tracking-widest">Are you absolutely sure?</p>
                    </div>
                    <div className="flex gap-3">
                       <Button variant="ghost" className="flex-1 !rounded-2xl !py-4" onClick={() => setIsConfirmingDelete(false)}>Cancel</Button>
                       <Button variant="danger" className="flex-1 !rounded-2xl !py-4" onClick={() => handleDelete(viewingTx.id)}>Confirm Delete</Button>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Exchange Rate Modal */}
      {isEditingRate && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-reveal">
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Market Rate</h3>
            <p className="text-xs text-slate-400 font-bold mb-6">Current Value of $1 USD in New SYP</p>
            <input 
              type="number" 
              defaultValue={globalRate}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                if (val > 0) {
                  storageService.setGlobalUsdRate(val);
                  setGlobalRate(val);
                  loadData();
                }
                setIsEditingRate(false);
              }}
              className="w-full bg-slate-50 p-5 rounded-2xl border-2 border-indigo-100 focus:border-indigo-600 outline-none font-black text-2xl tabular-nums mb-6"
              autoFocus
            />
            <Button fullWidth onClick={() => setIsEditingRate(false)}>Close Editor</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyLedger;
