
import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths } from 'date-fns';
import { User, Transaction, TransactionType } from '../types';
import { storageService } from '../services/storageService';

const HistoryView: React.FC<{ user: User }> = ({ user }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const transactions = storageService.getTransactions(user.id);
  const globalRate = storageService.getGlobalUsdRate();

  const monthlyDayBreakdown = useMemo(() => {
    const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
    return days.map(day => {
      const dStr = format(day, 'yyyy-MM-dd');
      const dayTxs = transactions.filter(t => t.date === dStr);
      const income = dayTxs.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
      return { date: dStr, net: income - expense, count: dayTxs.length };
    }).filter(d => d.count > 0);
  }, [transactions, currentMonth]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US').format(val) + ' N.SYP';
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 animate-reveal">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tightest">Archive</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Monthly Ledger</p>
      </header>

      <div className="premium-card p-8 rounded-[2.5rem] bg-white flex items-center justify-between mb-8 shadow-xl">
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-4 text-slate-300 hover:text-slate-900 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h2 className="text-2xl font-black text-slate-900 tracking-tightest uppercase">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button 
          disabled={isSameMonth(currentMonth, new Date())} 
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
          className={`p-4 ${isSameMonth(currentMonth, new Date()) ? 'opacity-0' : 'text-slate-300 hover:text-slate-900'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>

      <div className="space-y-3">
        {monthlyDayBreakdown.sort((a,b) => b.date.localeCompare(a.date)).map((day, i) => (
          <div 
            key={day.date} 
            className="premium-card p-6 rounded-3xl flex justify-between items-center stagger-item"
            style={{ animationDelay: `${0.05 * i}s` }}
          >
            <div>
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{format(new Date(day.date), 'EEEE')}</span>
              <h4 className="text-lg font-black text-slate-900">{format(new Date(day.date), 'dd MMM yyyy')}</h4>
            </div>
            <div className="text-right">
               <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-1">Subtotal</span>
               <p className={`text-xl font-black tabular-nums ${day.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {day.net > 0 ? '+' : ''}{formatCurrency(day.net)}
               </p>
            </div>
          </div>
        ))}
        {monthlyDayBreakdown.length === 0 && (
          <div className="py-32 text-center opacity-30 text-[10px] font-black uppercase tracking-[0.4em] border-4 border-dashed border-slate-100 rounded-[3rem]">
            No records for this month
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;
