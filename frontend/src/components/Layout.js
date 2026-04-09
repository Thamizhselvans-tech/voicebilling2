import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: '◈', label: 'Dashboard' },
  { to: '/billing',   icon: '◎', label: 'New Bill'  },
  { to: '/invoices',  icon: '◧', label: 'Invoices'  },
  { to: '/products',  icon: '◫', label: 'Products'  },
  { to: '/employees', icon: '◉', label: 'Employees', adminOnly: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const visible = navItems.filter(n => !n.adminOnly || user?.role === 'admin');

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside style={{
        width: collapsed ? 64 : 224,
        background: 'rgba(4, 8, 20, 0.92)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderRight: '1px solid rgba(59,130,246,0.12)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
        flexShrink: 0, zIndex: 10,
        boxShadow: '2px 0 24px rgba(0,0,0,0.5)'
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '18px 14px' : '18px 18px',
          borderBottom: '1px solid rgba(59,130,246,0.1)',
          display:'flex', alignItems:'center', gap:10
        }}>
          <div style={{
            width:36, height:36, borderRadius:10, flexShrink:0,
            background:'linear-gradient(135deg,#3b82f6,#06b6d4)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:17, fontWeight:800, color:'#fff',
            boxShadow:'0 0 16px rgba(59,130,246,0.4)'
          }}>V</div>
          {!collapsed && (
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:15, color:'var(--text)', letterSpacing:-0.4, whiteSpace:'nowrap' }}>VoiceBill</div>
              <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:1.5, textTransform:'uppercase' }}>Smart Billing</div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
          {visible.map(({ to, icon, label }) => {
            const active = location.pathname.startsWith(to);
            return (
              <NavLink key={to} to={to} style={{
                display:'flex', alignItems:'center', gap:10,
                padding: collapsed ? '11px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius:10, marginBottom:3,
                color: active ? '#fff' : 'var(--text3)',
                background: active ? 'rgba(59,130,246,0.18)' : 'transparent',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                fontWeight: active ? 600 : 400, fontSize:14,
                transition:'all 0.18s ease',
                textDecoration:'none'
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background='rgba(59,130,246,0.07)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background='transparent'; }}
              >
                <span style={{ fontSize:17, flexShrink:0 }}>{icon}</span>
                {!collapsed && <span style={{ whiteSpace:'nowrap' }}>{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding:'10px 8px', borderTop:'1px solid rgba(59,130,246,0.08)' }}>
          {!collapsed && (
            <div style={{
              padding:'10px 12px', marginBottom:8, borderRadius:10,
              background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.12)'
            }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{user?.name}</div>
              <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.6, marginTop:1 }}>{user?.role}</div>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{
            width:'100%', padding:'9px', borderRadius:9,
            background:'rgba(255,255,255,0.03)', color:'var(--text3)',
            fontSize:14, marginBottom:4, transition:'all 0.15s',
            border:'1px solid transparent'
          }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
          >{collapsed ? '▶' : '◀ Collapse'}</button>
          <button onClick={handleLogout} style={{
            width:'100%', padding: collapsed ? '9px' : '9px 12px',
            borderRadius:9, background:'rgba(239,68,68,0.07)',
            color:'var(--danger)', fontSize: collapsed ? 16 : 13,
            display:'flex', alignItems:'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap:7, transition:'all 0.15s',
            border:'1px solid rgba(239,68,68,0.15)'
          }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.07)'}
          >
            <span>⏻</span>{!collapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <main style={{ flex:1, overflow:'auto', background:'transparent' }}>
        <Outlet />
      </main>
    </div>
  );
}
