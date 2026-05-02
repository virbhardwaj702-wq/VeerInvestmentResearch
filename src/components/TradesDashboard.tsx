import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Lock, TrendingUp, Target, ShieldCheck, Activity } from 'lucide-react';

export function TradesDashboard() {
  const { user, profile } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (!profile?.isSubscriber && profile?.role !== 'Admin')) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "tradeRecords"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTrades(docs.sort((a: any, b: any) => b.createdAt - a.createdAt));
      setLoading(false);
    }, err => handleFirestoreError(err, OperationType.LIST, "tradeRecords"));

    return () => unsubscribe();
  }, [user, profile]);

  if (!profile?.isSubscriber && profile?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <Lock className="text-amber-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Pro Access Required</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
          The Trade Performance & Analytics suite is an exclusive feature for Pro subscribers. 
          Upgrade your account to track your trades and access industry-standard performance metrics.
        </p>
        <button className="bg-amber-500 text-slate-900 font-bold px-8 py-3 rounded shadow hover:bg-amber-400 transition-colors uppercase tracking-widest text-sm">
          Upgrade to Pro
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-pulse w-8 h-8 rounded-full bg-slate-200"></div></div>;
  }

  // Calculate Metrics
  const closedTrades = trades.filter(t => t.status === 'Won' || t.status === 'Lost' || t.status === 'Breakeven');
  const winCount = closedTrades.filter(t => t.status === 'Won').length;
  const lossCount = closedTrades.filter(t => t.status === 'Lost').length;
  const winRate = closedTrades.length > 0 ? ((winCount / closedTrades.length) * 100).toFixed(1) : "0.0";
  
  let totalPnL = 0;
  closedTrades.forEach(t => {
    if (t.exitPrice && t.entryPrice) {
      if (t.side === 'Buy') {
        totalPnL += ((t.exitPrice - t.entryPrice) / t.entryPrice) * 100;
      } else {
        totalPnL += ((t.entryPrice - t.exitPrice) / t.entryPrice) * 100;
      }
    }
  });

  return (
    <div>
      <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-widest uppercase text-slate-800 flex items-center gap-3">
          <Activity className="text-emerald-600" size={24} /> Trade terminal
        </h2>
        <Link to="/trades/add" className="px-6 py-2 bg-slate-900 text-white font-bold rounded text-sm hover:bg-emerald-600 transition-colors shadow-sm uppercase tracking-widest">
          + Log Trade
        </Link>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><Target size={14}/> Win Rate</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-slate-800">{winRate}%</p>
            <p className="text-xs font-bold text-slate-400 mb-1">{winCount}W - {lossCount}L</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><TrendingUp size={14}/> Avg Return</p>
          <div className="flex items-end gap-2">
            <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {totalPnL > 0 ? '+' : ''}{(closedTrades.length > 0 ? totalPnL / closedTrades.length : 0).toFixed(2)}%
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><ShieldCheck size={14}/> Open Positions</p>
          <p className="text-3xl font-bold text-slate-800">{trades.filter(t => t.status === 'Open').length}</p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm opacity-50 relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white px-2 py-1 rounded shadow-sm">Coming Soon</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Risk/Reward</p>
          <p className="text-3xl font-bold text-slate-300">1:2.5</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Trade Log</h3>
        </div>
        {trades.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">No trades logged yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 truncate">Symbol</th>
                  <th className="px-6 py-4 truncate">Type</th>
                  <th className="px-6 py-4 truncate">Entry</th>
                  <th className="px-6 py-4 truncate text-rose-500">Stop Loss</th>
                  <th className="px-6 py-4 truncate text-emerald-500">Target</th>
                  <th className="px-6 py-4 text-center truncate">Duration</th>
                  <th className="px-6 py-4 text-right truncate">Status</th>
                  <th className="px-4 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {trades.map(trade => (
                  <tr key={trade.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{trade.symbol.replace('.NS', '')}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[120px]">{trade.companyName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${trade.side === 'Buy' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-600">{trade.entryPrice}</td>
                    <td className="px-6 py-4 font-mono font-bold text-rose-500">{trade.stopLoss}</td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-600">{trade.target}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200 px-2 py-1 rounded bg-white">
                        {trade.duration}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {trade.status === 'Open' && <span className="text-blue-600 font-bold text-xs uppercase tracking-widest">Open</span>}
                      {trade.status === 'Won' && <span className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Won</span>}
                      {trade.status === 'Lost' && <span className="text-rose-600 font-bold text-xs uppercase tracking-widest">Lost</span>}
                      {trade.status === 'Breakeven' && <span className="text-slate-600 font-bold text-xs uppercase tracking-widest">Breakeven</span>}
                      {trade.status === 'Closed' && <span className="text-slate-600 font-bold text-xs uppercase tracking-widest">Closed</span>}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link to={`/trades/edit/${trade.id}`} className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 uppercase transition-colors">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
