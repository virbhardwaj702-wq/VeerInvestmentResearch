import React, { useState, FormEvent, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { doc, getDoc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { Search, Loader2 } from "lucide-react";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";

const DURATIONS = ["Short Term", "Long Term"];
const STATUSES = ["Open", "Won", "Lost", "Breakeven", "Closed"];

export function CreateTrade() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingStock, setFetchingStock] = useState(false);
  const [error, setError] = useState("");

  const [symbol, setSymbol] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number | "">("");
  
  const [side, setSide] = useState<"Buy" | "Sell">("Buy");
  const [entryPrice, setEntryPrice] = useState<string>("");
  const [stopLoss, setStopLoss] = useState<string>("");
  const [target, setTarget] = useState<string>("");
  const [duration, setDuration] = useState<string>("Short Term");
  const [status, setStatus] = useState<string>("Open");
  const [exitPrice, setExitPrice] = useState<string>("");

  useEffect(() => {
    if (id) {
      fetchTrade();
    }
  }, [id]);

  const fetchTrade = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, "tradeRecords", id!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSymbol(data.symbol);
        setCompanyName(data.companyName);
        setCurrentPrice(data.currentPrice);
        setSide(data.side);
        setEntryPrice(data.entryPrice?.toString() || "");
        setStopLoss(data.stopLoss?.toString() || "");
        setTarget(data.target?.toString() || "");
        setDuration(data.duration || "Short Term");
        setStatus(data.status || "Open");
        setExitPrice(data.exitPrice?.toString() || "");
      }
    } catch (err: any) {
      handleFirestoreError(err, OperationType.GET, "tradeRecords");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchStock = async () => {
    if (!symbol) return;
    setFetchingStock(true);
    setError("");
    try {
      const res = await fetch(`/api/stock/${symbol}`);
      if (!res.ok) throw new Error("Stock not found or error fetching");
      const data = await res.json();
      setCompanyName(data.companyName);
      setCurrentPrice(data.currentPrice);
      if (!entryPrice) setEntryPrice(data.currentPrice.toString());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetchingStock(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!companyName || !currentPrice) {
      setError("Please fetch stock info first.");
      return;
    }
    
    setError("");
    setLoading(true);

    try {
      const tradeId = id || doc(collection(db, "tradeRecords")).id;
      const ref = doc(db, "tradeRecords", tradeId);

      const payload: any = {
        userId: auth.currentUser.uid,
        symbol: symbol.toUpperCase(),
        companyName,
        currentPrice: Number(currentPrice),
        side,
        entryPrice: Number(entryPrice),
        stopLoss: Number(stopLoss),
        target: Number(target),
        duration,
        status,
        updatedAt: serverTimestamp(),
      };

      if (!id) {
        payload.createdAt = serverTimestamp();
      }
      
      if (exitPrice) {
        payload.exitPrice = Number(exitPrice);
      }

      await setDoc(ref, payload, { merge: true });
      navigate("/trades");
    } catch (err: any) {
      handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, "tradeRecords");
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col mb-8">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{id ? 'Edit Trade Record' : 'Execute New Trade Log'}</h3>
          <button type="button" onClick={() => navigate(-1)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Back</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && <div className="bg-rose-50 text-rose-600 p-4 rounded text-sm border border-rose-200 font-bold uppercase tracking-wide">{error}</div>}

          {/* Stock Info Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">1. Asset Selection</h4>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Stock Symbol (NSE)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. RELIANCE"
                  className="flex-1 border-2 border-slate-200 rounded px-3 py-2 text-lg font-mono focus:border-emerald-500 outline-none transition-colors uppercase"
                  required
                />
                {companyName && (
                  <div className="bg-slate-50 px-3 py-2 border-2 border-slate-200 rounded text-right min-w-[120px]">
                    <p className="text-[10px] text-slate-400 font-bold leading-none">CMP (INR)</p>
                    <p className="text-lg font-bold text-slate-700">{currentPrice}</p>
                  </div>
                )}
                <button 
                  type="button" 
                  onClick={handleFetchStock}
                  disabled={fetchingStock || !symbol}
                  className="bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-700 border-2 border-slate-200 hover:border-emerald-600 px-6 py-2 rounded font-bold transition-colors flex items-center gap-2 disabled:opacity-50 text-sm uppercase tracking-wider"
                >
                  {fetchingStock ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                  Fetch
                </button>
              </div>
              {companyName && (
                <p className="text-xs text-emerald-600 font-bold tracking-widest uppercase mt-2">{companyName}</p>
              )}
            </div>
          </div>

          {/* Trade Setup Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">2. Trade Parameters</h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Side</label>
                <div className="flex bg-slate-100 p-1 rounded border border-slate-200">
                  <button type="button" onClick={() => setSide("Buy")} className={`flex-1 text-xs font-bold uppercase py-2 rounded transition-all ${side === 'Buy' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Buy</button>
                  <button type="button" onClick={() => setSide("Sell")} className={`flex-1 text-xs font-bold uppercase py-2 rounded transition-all ${side === 'Sell' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sell</button>
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Duration</label>
                <select 
                  value={duration} 
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded px-3 py-2 text-sm font-medium outline-none appearance-none bg-white focus:border-emerald-500 transition-colors"
                >
                  {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded px-3 py-2 text-sm font-medium outline-none appearance-none bg-white focus:border-emerald-500 transition-colors"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Entry Price</label>
                <input 
                  type="number" step="any" required
                  value={entryPrice} onChange={e => setEntryPrice(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded px-3 py-2 text-lg font-mono focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-rose-500 uppercase mb-2">Stop Loss</label>
                <input 
                  type="number" step="any" required
                  value={stopLoss} onChange={e => setStopLoss(e.target.value)}
                  className="w-full border-2 border-rose-200 rounded px-3 py-2 text-lg font-mono text-rose-600 focus:border-rose-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-500 uppercase mb-2">Target Price</label>
                <input 
                  type="number" step="any" required
                  value={target} onChange={e => setTarget(e.target.value)}
                  className="w-full border-2 border-emerald-200 rounded px-3 py-2 text-lg font-mono text-emerald-600 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
            </div>
            
            {status !== 'Open' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 p-4 bg-slate-50 border border-slate-200 rounded">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Actual Exit Price</label>
                  <input 
                    type="number" step="any"
                    value={exitPrice} onChange={e => setExitPrice(e.target.value)}
                    className="w-full border-2 border-slate-300 rounded px-3 py-2 text-lg font-mono focus:border-slate-500 outline-none transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-lg shadow-lg hover:bg-emerald-600 transition-all uppercase tracking-widest text-sm mt-8 flex justify-center items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {id ? 'Update Trade Record' : 'Log Trade'}
          </button>
        </form>
      </div>
    </div>
  );
}
