import { loginWithGoogle } from '../lib/firebase';
import { AreaChart } from 'lucide-react';
import { useState } from 'react';

export function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
        <div className="w-16 h-16 bg-emerald-500 rounded flex items-center justify-center mx-auto mb-6 text-slate-900 font-bold">
          <AreaChart size={32} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2 uppercase">
          Stock Research Tracker
        </h1>
        <p className="text-slate-500 text-sm mb-8 font-medium">
          Sign in to access your dashboard and analyze stock zones.
        </p>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded text-sm mb-6 font-medium border border-rose-200">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-slate-900 text-white font-bold py-4 rounded-lg shadow-lg hover:bg-emerald-600 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
}
