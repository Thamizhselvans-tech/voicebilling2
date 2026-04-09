import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Billing   from './pages/Billing';
import Invoices  from './pages/Invoices';
import Products  from './pages/Products';
import Employees from './pages/Employees';
import Layout    from './components/Layout';

function Private({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:16 }}>
      <div className="loader" />
      <div style={{ color:'var(--text3)', fontSize:13 }}>Loading…</div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Private><Layout /></Private>}>
            <Route index            element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="billing"   element={<Billing />} />
            <Route path="invoices"  element={<Invoices />} />
            <Route path="products"  element={<Products />} />
            <Route path="employees" element={<Private adminOnly><Employees /></Private>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
