import { useEffect, useState } from "react";
import { collection, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { ShieldAlert, Users, Database } from "lucide-react";
import { format } from "date-fns";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<"Records" | "Users">("Records");
  const [records, setRecords] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all stock records
    const qRecords = query(collection(db, "stockRecords"));
    const unsubRecords = onSnapshot(qRecords, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecords(docs.sort((a: any, b: any) => b.updatedAt - a.updatedAt));
    }, err => handleFirestoreError(err, OperationType.LIST, "stockRecords"));

    // Fetch all users
    const qUsers = query(collection(db, "users"));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(docs.sort((a: any, b: any) => b.createdAt - a.createdAt));
      setLoading(false);
    }, err => handleFirestoreError(err, OperationType.LIST, "users"));

    return () => {
      unsubRecords();
      unsubUsers();
    };
  }, []);

  const toggleSubscriber = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { isSubscriber: !currentStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-pulse w-8 h-8 rounded-full bg-zinc-200"></div></div>;
  }

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-xl font-bold tracking-widest uppercase text-slate-800 flex items-center gap-3">
          <ShieldAlert className="text-emerald-600" size={24} /> Admin Intelligence
        </h2>
      </header>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab("Records")}
            className={`py-4 flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-sm transition-colors ${
              activeTab === "Records" ? "bg-slate-50 text-slate-900 border-b-2 border-emerald-500 -mb-[1px]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Database size={16} /> Records ({records.length})
          </button>
          <button 
            onClick={() => setActiveTab("Users")}
            className={`py-4 flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-sm transition-colors ${
              activeTab === "Users" ? "bg-slate-50 text-slate-900 border-b-2 border-emerald-500 -mb-[1px]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Users size={16} /> Users ({users.length})
          </button>
        </div>

        <div className="">
          {activeTab === "Records" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Stock Symbol</th>
                    <th className="px-6 py-4">Zone Type</th>
                    <th className="px-6 py-4">System Status</th>
                    <th className="px-6 py-4 text-right">Author ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {records.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{record.symbol.replace('.NS', '')}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400">{format(record.updatedAt, 'MMM dd, HH:mm')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${record.type === 'Demand' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {record.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600 uppercase text-xs">
                        {record.status}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs text-right">
                        {record.userId}
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No analytical records exist in the database.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "Users" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">User Email Identity</th>
                    <th className="px-6 py-4">System Role</th>
                    <th className="px-6 py-4">Subscription</th>
                    <th className="px-6 py-4">Access Granted</th>
                    <th className="px-6 py-4 text-right">Unique ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">
                         {u.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded inline-block text-[10px] font-bold uppercase tracking-wider ${u.role === 'Admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleSubscriber(u.id, u.isSubscriber)}
                          className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${u.isSubscriber ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                          {u.isSubscriber ? 'Pro Active' : 'Make Pro'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {format(u.createdAt, 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs text-right">
                        {u.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
