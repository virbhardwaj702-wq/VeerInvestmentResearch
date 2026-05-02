import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CreateRecord } from './components/CreateRecord';
import { AdminPanel } from './components/AdminPanel';
import { TradesDashboard } from './components/TradesDashboard';
import { CreateTrade } from './components/CreateTrade';

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requireAdmin && profile?.role !== 'Admin') return <Navigate to="/" />;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/add" element={<ProtectedRoute><CreateRecord /></ProtectedRoute>} />
      <Route path="/edit/:id" element={<ProtectedRoute><CreateRecord /></ProtectedRoute>} />
      <Route path="/trades" element={<ProtectedRoute><TradesDashboard /></ProtectedRoute>} />
      <Route path="/trades/add" element={<ProtectedRoute><CreateTrade /></ProtectedRoute>} />
      <Route path="/trades/edit/:id" element={<ProtectedRoute><CreateTrade /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

