import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router";
import { PencilLine, Trash2, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { format } from "date-fns";

export function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"Demand" | "Supply">("Demand");
  const [activeStatusTab, setActiveStatusTab] = useState<string>("In the zone");
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const STATUSES = ["Approaching", "In the zone", "Reacting from zone"];
  const TIMEFRAMES = ["Daily", "Weekly", "Monthly", "Quarterly", "Half-Yearly", "Yearly"];

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "stockRecords"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecords(docs.sort((a: any, b: any) => b.updatedAt - a.updatedAt));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "stockRecords");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredRecords = records.filter(r => r.type === activeTab);
  const statusFilteredRecords = filteredRecords.filter(r => r.status === activeStatusTab);

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-pulse w-8 h-8 rounded-full bg-zinc-200"></div></div>;
  }

  const demandCount = records.filter(r => r.type === "Demand").length;
  const supplyCount = records.filter(r => r.type === "Supply").length;
  const inZoneCount = records.filter(r => r.status === "In the zone").length;

  return (
    <div>
      <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-widest uppercase text-slate-800">Research Intelligence</h2>
        <div className="flex gap-4 items-center">
          <div className="flex rounded overflow-hidden border border-slate-200 shadow-sm">
            <button 
              onClick={() => setActiveTab("Demand")}
              className={`px-6 py-1.5 text-sm font-bold border-r border-slate-200 transition-colors ${activeTab === 'Demand' ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              DEMAND
            </button>
            <button 
              onClick={() => setActiveTab("Supply")}
              className={`px-6 py-1.5 text-sm font-bold transition-colors ${activeTab === 'Supply' ? 'bg-rose-100 text-rose-800' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              SUPPLY
            </button>
          </div>
          <Link to="/add" className="px-6 py-1.5 bg-slate-900 text-white font-bold rounded text-sm hover:bg-emerald-600 transition-colors shadow-sm uppercase tracking-widest">
            + Add Research
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Active Demand</p>
          <p className="text-2xl font-bold text-emerald-600">{demandCount.toString().padStart(2, '0')} <span className="text-xs text-slate-400 font-normal ml-1">Stocks</span></p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Active Supply</p>
          <p className="text-2xl font-bold text-rose-600">{supplyCount.toString().padStart(2, '0')} <span className="text-xs text-slate-400 font-normal ml-1">Stocks</span></p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">In Zone Today</p>
          <p className="text-2xl font-bold text-slate-800">{inZoneCount.toString().padStart(2, '0')} <span className="text-xs text-slate-400 font-normal ml-1">Alerts</span></p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50">
          {STATUSES.map(status => (
            <button
              key={status}
              onClick={() => setActiveStatusTab(status)}
              className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-widest transition-all ${
                activeStatusTab === status ? "bg-white text-slate-800 border-b-2 border-emerald-500 shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-700 uppercase">
             {activeStatusTab} Watchlist
          </h3>
        </div>

        <div className="overflow-hidden">
          {statusFilteredRecords.length === 0 ? (
            <div className="text-center py-16 bg-white">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === "Demand" ? <ArrowUpRight className="text-slate-400" /> : <ArrowDownRight className="text-slate-400" />}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 uppercase tracking-widest">No Records</h3>
              <p className="text-slate-500 text-xs font-medium max-w-sm mx-auto uppercase">You haven't added any {activeTab.toLowerCase()} zone research for this status yet.</p>
            </div>
          ) : (
            <table className="w-full text-left bg-white">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 w-48">Timeframes</th>
                  <th className="px-6 py-4 w-32 border-x border-slate-100 text-center">Stock Count</th>
                  <th className="px-6 py-4">Stock Symbols</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {TIMEFRAMES.map(tf => {
                  const recordsInTf = statusFilteredRecords.filter(r => r.timeframes?.includes(tf));
                  return (
                    <tr key={tf} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700 uppercase text-xs">{tf}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-600 text-center border-x border-slate-100 bg-slate-50/50">
                        {recordsInTf.length.toString().padStart(2, '0')}
                      </td>
                      <td className="px-6 py-4 flex flex-wrap gap-2">
                        {recordsInTf.length > 0 ? recordsInTf.map(r => (
                          <Link to={`/edit/${r.id}`} key={r.id} className="px-2 py-1 bg-white border border-slate-200 shadow-sm rounded text-[10px] font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors">
                            {r.symbol.replace('.NS', '')}
                          </Link>
                        )) : <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-1">N/A</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-4 border-t border-slate-100 text-center bg-slate-50">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
              {records.length} TOTAL RECORDS LOGGED
            </p>
        </div>
      </div>
    </div>
  );
}
