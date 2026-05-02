import React, { useState, FormEvent, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { doc, getDoc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { Search, Loader2 } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

const TIMEFRAMES = ["Daily", "Weekly", "Monthly", "Quarterly", "Half-Yearly", "Yearly"];
const CANDLE_PATTERNS = ["Strong candles", "2-5 base candles"];
const STATUSES = ["Approaching", "In the zone", "Reacting from zone"];

export function CreateRecord() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetchingStock, setFetchingStock] = useState(false);
  const [error, setError] = useState("");

  const [symbol, setSymbol] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number | "">("");
  const [type, setType] = useState<"Demand" | "Supply">("Demand");
  const [status, setStatus] = useState(STATUSES[0]);
  const [timeframes, setTimeframes] = useState<string[]>([]);
  const [candlePatterns, setCandlePatterns] = useState<string[]>([]);
  const [recordCreatedAt, setRecordCreatedAt] = useState<number | null>(null);

  useEffect(() => {
    async function loadRecord() {
      if (!id) return;
      try {
        const docRef = doc(db, 'stockRecords', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSymbol(data.symbol.replace(".NS", ""));
          setCompanyName(data.companyName);
          setCurrentPrice(data.currentPrice);
          setType(data.type);
          setStatus(data.status);
          setTimeframes(data.timeframes || []);
          setCandlePatterns(data.candlePatterns || []);
          setRecordCreatedAt(data.createdAt);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `stockRecords/${id}`);
      }
    }
    loadRecord();
  }, [id]);

  const handleFetchStock = async () => {
    if (!symbol) return;
    setFetchingStock(true);
    setError("");
    try {
      const res = await fetch(`/api/stock/${symbol}`);
      if (!res.ok) {
        throw new Error("Failed to fetch stock or not found.");
      }
      const data = await res.json();
      setCompanyName(data.longName);
      setCurrentPrice(data.price);
    } catch (err: any) {
      setError(err.message);
      setCompanyName("");
      setCurrentPrice("");
    } finally {
      setFetchingStock(false);
    }
  };

  const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setter(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!companyName || currentPrice === "") {
      setError("Please fetch stock information first.");
      return;
    }
    if (timeframes.length === 0) {
      setError("Select at least one timeframe.");
      return;
    }
    
    setLoading(true);
    try {
      const recordId = id || doc(collection(db, "stockRecords")).id;
      const ref = doc(db, "stockRecords", recordId);
      const payload = {
        userId: user!.uid,
        symbol: symbol.toUpperCase() + (symbol.toUpperCase().endsWith('.NS') ? '' : '.NS'),
        companyName,
        currentPrice: Number(currentPrice),
        type,
        status,
        timeframes,
        candlePatterns,
        createdAt: recordCreatedAt || Date.now(),
        updatedAt: Date.now()
      };

      await setDoc(ref, payload);
      navigate("/");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `stockRecords`);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col mb-8">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{id ? 'Edit Research Record' : 'Add New Research Record'}</h3>
        </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && <div className="bg-rose-50 text-rose-600 p-4 rounded text-sm border border-rose-200 font-bold uppercase tracking-wide">{error}</div>}

        <div className="grid grid-cols-1 gap-6">
          {/* Stock Symbol */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Symbol (NSE)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Market Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as any)}
                className="w-full border-2 border-slate-200 rounded px-3 py-2 text-sm font-medium outline-none appearance-none bg-white focus:border-emerald-500 transition-colors"
              >
                <option value="Demand">Demand</option>
                <option value="Supply">Supply</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zone Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border-2 border-slate-200 rounded px-3 py-2 text-sm font-medium outline-none appearance-none bg-white focus:border-emerald-500 transition-colors"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Analysis Timeframes</label>
            <div className="grid grid-cols-3 gap-2">
              {TIMEFRAMES.map(tf => {
                const isSelected = timeframes.includes(tf);
                return (
                  <label key={tf} className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200 text-xs font-medium cursor-pointer hover:bg-slate-100 transition-colors">
                    <input 
                       type="checkbox"
                       checked={isSelected}
                       onChange={() => toggleArrayItem(setTimeframes, tf)}
                       className="rounded text-emerald-500"
                    />
                    {tf}
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Candle Structure</label>
            <div className="flex gap-4">
              {CANDLE_PATTERNS.map(pattern => {
                const isSelected = candlePatterns.includes(pattern);
                return (
                  <label key={pattern} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleArrayItem(setCandlePatterns, pattern)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 shadow-sm"
                    /> 
                    {pattern}
                  </label>
                )
              })}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-lg shadow-lg hover:bg-emerald-600 transition-all uppercase tracking-widest text-sm mt-4 flex justify-center items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {id ? 'Update Research Record' : 'Save Research Record'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
