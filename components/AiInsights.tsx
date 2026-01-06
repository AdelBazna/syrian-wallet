
import React, { useState, useEffect, useMemo } from 'react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { User, Transaction, TransactionType } from '../types';
import { storageService } from '../services/storageService';
import { GoogleGenAI } from "@google/genai";
import Button from './Button';

const AiInsights: React.FC<{ user: User }> = ({ user }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const transactions = storageService.getTransactions(user.id);
  
  // Local Stats Calculation
  const stats = useMemo(() => {
    if (transactions.length === 0) return null;
    
    const dailyTotals: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === TransactionType.EXPENSE) {
        dailyTotals[t.date] = (dailyTotals[t.date] || 0) + t.amount;
      }
    });

    const dates = Object.keys(dailyTotals);
    if (dates.length === 0) return null;

    let peakDay = dates[0];
    let leastDay = dates[0];
    
    dates.forEach(date => {
      if (dailyTotals[date] > dailyTotals[peakDay]) peakDay = date;
      if (dailyTotals[date] < dailyTotals[leastDay]) leastDay = date;
    });

    return { peakDay, peakVal: dailyTotals[peakDay], leastDay, leastVal: dailyTotals[leastDay], dailyTotals };
  }, [transactions]);

  // Chart Data Preparation (Last 10 Days)
  const chartData = useMemo(() => {
    if (!stats) return [];
    const windowSize = 10;
    const lastWindowDays = Array.from({ length: windowSize }).map((_, i) => format(subDays(new Date(), (windowSize - 1) - i), 'yyyy-MM-dd'));
    return lastWindowDays.map(date => ({
      date,
      label: format(new Date(date), 'dd/MM'),
      value: stats.dailyTotals[date] || 0
    }));
  }, [stats]);

  const runAiAnalysis = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
      const prompt = `
        Context: Personal expense tracking for a user in the Syrian market.
        Currency: Syrian Pounds (SYP).
        Data History: ${JSON.stringify(transactions.slice(-30))}
        
        Tasks:
        1. Summarize spending health in 2 powerful sentences.
        2. Identify the biggest spending category based on descriptions.
        3. Provide one HIGHLY SPECIFIC "AI Planner" strategy to reduce expenses next week.
        4. Rate current financial discipline out of 10.
        
        Tone: Professional, expert financial advisor, high-end fintech.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      setAnalysis(response.text || "Unable to generate insights at this time.");
    } catch (e) {
      setAnalysis("AI Analysis requires a valid Gemini API configuration.");
    } finally {
      setLoading(false);
    }
  };

  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  return (
    <div className="max-w-xl mx-auto px-4 py-12 animate-reveal">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tightest">Intelligence</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Patterns & AI Planning</p>
        </div>
        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200">
           <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
      </header>

      {/* Chart Section */}
      <section className="premium-card p-8 rounded-[2.5rem] bg-white mb-8 border-slate-100">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Expense Flow (Last 10 Days)</h3>
        <div className="h-44 flex items-end justify-between gap-1.5 px-1">
           {chartData.map((d, i) => (
             <div key={i} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full flex items-end justify-center h-32">
                  <div className="w-full max-w-[8px] bg-slate-50 rounded-full h-full" />
                  <div 
                    className={`absolute bottom-0 w-full max-w-[8px] rounded-full transition-all duration-1000 ${d.value === maxValue ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-200 group-hover:bg-indigo-300'}`}
                    style={{ height: `${(d.value / maxValue) * 100}%` }}
                  />
                </div>
                <span className="text-[7px] font-black text-slate-300 mt-4 tabular-nums group-hover:text-slate-900 transition-colors">{d.label}</span>
             </div>
           ))}
        </div>
      </section>

      {/* Extreme Days Highlight */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="premium-card p-6 rounded-3xl bg-white border-rose-100/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
              <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Peak Spending</span>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase mb-1">{format(new Date(stats.peakDay), 'EEEE, dd MMM')}</p>
            <p className="text-xl font-black text-slate-900 tabular-nums">{new Intl.NumberFormat('en-US').format(stats.peakVal)} <span className="text-xs text-slate-300">SYP</span></p>
          </div>
          <div className="premium-card p-6 rounded-3xl bg-white border-emerald-100/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Lowest Spending</span>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase mb-1">{format(new Date(stats.leastDay), 'EEEE, dd MMM')}</p>
            <p className="text-xl font-black text-slate-900 tabular-nums">{new Intl.NumberFormat('en-US').format(stats.leastVal)} <span className="text-xs text-slate-300">SYP</span></p>
          </div>
        </div>
      )}

      {/* Gemini Analysis */}
      <section className="premium-card p-10 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20 border-none">
        <div className="absolute top-0 right-0 w-60 h-60 bg-indigo-500 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">AI Intelligence</span>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>
          
          {!analysis ? (
            <div className="space-y-6">
               <h2 className="text-2xl font-black tracking-tightest leading-tight">Your Financial Assistant is ready.</h2>
               <p className="text-slate-400 text-sm leading-relaxed font-medium">Get a personalized strategy for next week based on your unique Syrian market patterns.</p>
               <Button variant="primary" className="!bg-indigo-600 !text-white w-full py-5 shadow-2xl shadow-indigo-500/30 text-xs uppercase tracking-[0.2em] font-black" onClick={runAiAnalysis} disabled={loading}>
                 {loading ? (
                   <div className="flex items-center gap-3">
                     <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                     <span>Analyzing Patterns...</span>
                   </div>
                 ) : 'Generate My AI Plan'}
               </Button>
            </div>
          ) : (
            <div className="space-y-6 animate-reveal">
               <div className="prose prose-invert prose-sm">
                  <p className="text-indigo-50 text-base leading-relaxed font-semibold italic">"{analysis}"</p>
               </div>
               <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                  <button onClick={() => setAnalysis(null)} className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Regenerate Insight</button>
                  <div className="flex items-center gap-3">
                     <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Optimized for SYP</span>
                  </div>
               </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AiInsights;
