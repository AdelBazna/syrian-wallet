
import React, { useState } from 'react';
import { TransactionType, Currency } from '../types';
import { storageService } from '../services/storageService';
import Button from './Button';

interface TransactionFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [originalAmount, setOriginalAmount] = useState(initialData?.originalAmount.toString() || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState<TransactionType>(initialData?.type || TransactionType.EXPENSE);
  const [currency, setCurrency] = useState<Currency>(initialData?.inputCurrency || 'NEW_SYP');
  const [usdRate, setUsdRate] = useState(storageService.getGlobalUsdRate().toString());

  const calculateNormalized = (amt: number, curr: Currency, rate: number): number => {
    if (curr === 'NEW_SYP') return amt;
    if (curr === 'OLD_SYP') return amt / 100;
    if (curr === 'USD') return amt * rate;
    return amt;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(originalAmount);
    const rate = parseFloat(usdRate) || 0;
    if (isNaN(amt) || !description) return;
    const normalized = calculateNormalized(amt, currency, rate);
    onSubmit({ amount: normalized, originalAmount: amt, inputCurrency: currency, usdRate: currency === 'USD' ? rate : undefined, description, type });
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 premium-card rounded-[2.5rem] bg-white space-y-8 animate-reveal">
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
        <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === TransactionType.EXPENSE ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Expense</button>
        <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Income</button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Currency Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(['NEW_SYP', 'OLD_SYP', 'USD'] as Currency[]).map((c) => (
              <button key={c} type="button" onClick={() => setCurrency(c)} className={`py-3 rounded-xl text-[9px] font-black transition-all border ${currency === c ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>{c.replace('_', ' ')}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Amount</label>
            <input type="number" step="any" value={originalAmount} onChange={(e) => setOriginalAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 focus:border-indigo-500 outline-none font-bold text-lg tabular-nums transition-all" required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Payment for..." className="w-full bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 focus:border-indigo-500 outline-none font-bold text-lg transition-all" required />
          </div>
        </div>

        {currency === 'USD' && (
          <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 animate-reveal">
            <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest block mb-2">Market Rate for this entry</label>
            <input type="number" value={usdRate} onChange={(e) => setUsdRate(e.target.value)} className="w-full bg-white px-5 py-3 rounded-xl border-2 border-indigo-200 outline-none font-bold tabular-nums" required />
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant={type === TransactionType.INCOME ? 'secondary' : 'primary'} className="flex-[2]">Save Record</Button>
      </div>
    </form>
  );
};

export default TransactionForm;