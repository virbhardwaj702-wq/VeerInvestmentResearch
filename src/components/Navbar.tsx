import { logout } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, FilePlus, Shield, Activity } from 'lucide-react';
import { Link, useLocation } from 'react-router';

export function Navbar() {
  const { profile } = useAuth();
  const location = useLocation();

  return (
    <>
      <div className="bg-slate-900 text-slate-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-center py-2 px-4 shadow-sm">
        ⚠️ Disclaimer: We are not SEBI registered. All information is for educational purposes only. Do not consider this as investment advice.
      </div>
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-sm flex items-center justify-center font-bold text-slate-900 text-xs">ST</div>
              <span className="text-lg font-bold tracking-tight uppercase text-slate-900 hover:text-emerald-600 transition-colors hidden sm:block">Stock Track</span>
            </Link>
            <nav className="flex items-center gap-1">
              <Link 
                to="/" 
                className={`px-3 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2 ${location.pathname === '/' ? 'bg-emerald-500 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <LayoutDashboard size={16} /> <span className="hidden md:inline">Dashboard</span>
              </Link>
              <Link 
                to="/add" 
                className={`px-3 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2 ${location.pathname === '/add' ? 'bg-emerald-500 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <FilePlus size={16} /> <span className="hidden md:inline">Add Record</span>
              </Link>
              <Link 
                to="/trades" 
                className={`px-3 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2 ${location.pathname.startsWith('/trades') ? 'bg-emerald-500 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <Activity size={16} /> <span className="hidden md:inline">Trades</span>
              </Link>
              {profile?.role === 'Admin' && (
                 <Link 
                 to="/admin" 
                 className={`px-3 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2 ${location.pathname === '/admin' ? 'bg-emerald-500 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
               >
                 <Shield size={16} /> <span className="hidden md:inline">Admin Panel</span>
               </Link>
              )}
            </nav>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-sm text-right hidden sm:block">
              <p className="font-bold text-slate-900">{profile?.email.split('@')[0]}</p>
              <div className="flex items-center justify-end gap-1">
                <p className="text-[10px] text-emerald-500 font-mono font-bold uppercase">
                  {profile?.role}
                </p>
                {profile?.isSubscriber && (
                  <span className="px-1 bg-amber-100 text-amber-700 text-[9px] font-bold uppercase rounded">Pro</span>
                )}
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 overflow-hidden ml-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </div>
            <button 
              onClick={logout}
              className="ml-1 sm:ml-2 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
