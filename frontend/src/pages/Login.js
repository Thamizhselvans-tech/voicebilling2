import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]       = useState({ email:'', password:'' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) { setError(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
      /* Restaurant/food background for login too */
      backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80&auto=format&fit=crop')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* Dark overlay */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(4,8,20,0.92) 0%, rgba(6,10,26,0.88) 50%, rgba(8,14,32,0.92) 100%)', zIndex:0 }} />
      {/* Blue mesh overlay */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(59,130,246,0.08) 0%, transparent 65%)', zIndex:0 }} />

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:420, padding:'0 20px' }}>
        {/* Animated entrance */}
        <div className="anim-fade-up">

          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <div style={{
              width:64, height:64, borderRadius:18, margin:'0 auto 16px',
              background: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:28, fontWeight:800, color:'#fff',
              boxShadow: '0 0 32px rgba(59,130,246,0.45)',
              animation: 'glowPulse 3s ease-in-out infinite',
            }}>V</div>
            <h1 style={{ fontFamily:'var(--font-head)', fontSize:30, fontWeight:800, letterSpacing:-1, background:'linear-gradient(135deg,#f1f5f9,#94a3b8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              VoiceBill
            </h1>
            <p style={{ color:'var(--text3)', fontSize:14, marginTop:4, letterSpacing:0.5 }}>Smart Billing System</p>
          </div>

          {/* Card */}
          <div style={{
            background: 'rgba(8,14,28,0.82)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(59,130,246,0.22)',
            borderRadius: 'var(--r3)',
            padding: '32px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
          }}>
            <h2 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700, marginBottom:24 }}>Sign in</h2>

            {error && (
              <div style={{
                background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.28)',
                borderRadius:10, padding:'11px 15px', color:'var(--danger)', fontSize:13, marginBottom:18,
                animation: 'fadeUp 0.3s ease',
              }}>⚠️ {error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, color:'var(--text3)', marginBottom:7, letterSpacing:0.6, textTransform:'uppercase', fontWeight:600 }}>Email</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@billing.com"
                  className="inp"
                />
              </div>
              <div style={{ marginBottom:26 }}>
                <label style={{ display:'block', fontSize:11, color:'var(--text3)', marginBottom:7, letterSpacing:0.6, textTransform:'uppercase', fontWeight:600 }}>Password</label>
                <input type="password" required value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="inp"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary"
                style={{ width:'100%', padding:'13px', fontSize:15, justifyContent:'center' }}>
                {loading ? (
                  <span style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
                    <span className="loader" style={{ width:16, height:16, borderWidth:2 }} />
                    Signing in…
                  </span>
                ) : 'Sign in →'}
              </button>
            </form>

            {/* Demo credentials */}
            <div style={{ marginTop:22, padding:'14px 16px', background:'rgba(59,130,246,0.06)', borderRadius:10, border:'1px solid rgba(59,130,246,0.12)' }}>
              <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.6, marginBottom:8 }}>Demo credentials</div>
              {[['Admin', 'admin@billing.com', 'admin123'], ['Operator', 'operator@billing.com', 'operator123']].map(([role, email, pass]) => (
                <div key={role} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <span style={{ fontSize:12, color:'var(--text3)' }}>{role}:</span>
                  <button onClick={() => setForm({ email, password: pass })} style={{
                    fontSize:11, color:'var(--accent)', background:'none', padding:'2px 8px',
                    borderRadius:4, border:'1px solid rgba(59,130,246,0.20)',
                    transition:'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(59,130,246,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}
                  >Use →</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
