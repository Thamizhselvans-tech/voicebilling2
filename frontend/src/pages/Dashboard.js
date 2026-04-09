import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, sub, accentColor, icon, onClick, delay = 0 }) {
  return (
    <div
      className="stat-card anim-card-in"
      onClick={onClick}
      style={{
        borderLeft: `3px solid ${accentColor}`,
        cursor: onClick ? 'pointer' : 'default',
        animationDelay: `${delay}s`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
          {label}
        </div>
        {icon && (
          <span style={{
            fontSize: 26, opacity: 0.75, lineHeight: 1,
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.15))'
          }}>{icon}</span>
        )}
      </div>
      <div style={{
        fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800,
        color: 'var(--text)', lineHeight: 1, marginBottom: 6,
      }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{sub}</div>}
      {/* Subtle colour tint bar at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accentColor}55, transparent)`,
        borderRadius: '0 0 var(--r2) var(--r2)',
      }} />
    </div>
  );
}

const ROLE_COLORS = {
  Worker: '#f59e0b', Staff: '#06b6d4', Manager: '#a78bfa',
  Cashier: '#10b981', Supervisor: '#3b82f6',
};

export default function Dashboard() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const t = setTimeout(() => setVisible(true), 50);
    api.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => clearTimeout(t);
  }, []);

  const fmt = n => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    /* bg-dashboard applies the restaurant background image + dark overlay */
    <div className="page-bg bg-dashboard" style={{ padding: '32px' }}>

      {/* ── Page header ─────────────────────────────────────────── */}
      <div
        className="page-header anim-fade-down"
        style={{ marginBottom: 32 }}
      >
        <h1>Good {greet()}, {user?.name?.split(' ')[0]} 👋</h1>
        <p>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {loading ? (
        /* Skeleton loaders while fetching */
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--r2)' }} />
          ))}
        </div>
      ) : (
        <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}>

          {/* ── Stat cards ─────────────────────────────────────── */}
          <div style={{
            fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase',
            letterSpacing: 1, fontWeight: 600, marginBottom: 12,
          }}>Revenue Overview</div>

          <div className="stats-grid stagger" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
            gap: 14, marginBottom: 28,
          }}>
            <StatCard label="Today's Revenue"  value={fmt(stats?.todayRevenue)}  accentColor="var(--accent)"  icon="💰" sub={`${stats?.todayInvoices||0} bills today`}    delay={0.05} />
            <StatCard label="Month Revenue"    value={fmt(stats?.monthRevenue)}  accentColor="var(--accent2)" icon="📈" sub={`${stats?.monthInvoices||0} this month`}      delay={0.10} />
            <StatCard label="Total Invoices"   value={stats?.totalInvoices||0}   accentColor="var(--success)" icon="🧾" sub="All time"                                    delay={0.15} />
            <StatCard label="Total Employees"  value={stats?.totalEmployees||0}  accentColor="var(--accent3)" icon="👥" sub="Active staff"
              delay={0.20} onClick={() => user?.role === 'admin' && navigate('/employees')} />
          </div>

          {/* ── Staff breakdown ────────────────────────────────── */}
          {stats?.employeesByRole?.length > 0 && (
            <div style={{ marginBottom: 28 }} className="anim-fade-up" style={{ animationDelay: '0.25s' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 12 }}>
                Staff by Role
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {stats.employeesByRole.map(({ _id: role, count }) => {
                  const c = ROLE_COLORS[role] || '#94a3b8';
                  return (
                    <div key={role} style={{
                      padding: '8px 18px', borderRadius: 20,
                      background: `${c}18`, border: `1px solid ${c}45`,
                      display: 'flex', alignItems: 'center', gap: 8,
                      backdropFilter: 'blur(8px)',
                      transition: 'transform 0.2s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0, boxShadow: `0 0 6px ${c}` }} />
                      <span style={{ fontSize: 13, color: c, fontWeight: 700 }}>{count}</span>
                      <span style={{ fontSize: 13, color: 'var(--text3)' }}>{role}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Recent invoices table ───────────────────────────── */}
          <div
            className="glass-bright anim-card-in"
            style={{ overflow: 'hidden', animationDelay: '0.28s' }}
          >
            <div style={{
              padding: '16px 22px', borderBottom: '1px solid rgba(59,130,246,0.10)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15 }}>
                Recent Invoices
              </div>
              <button
                onClick={() => navigate('/invoices')}
                style={{ background: 'none', color: 'var(--accent)', fontSize: 13, padding: 0, transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >View all →</button>
            </div>

            {!stats?.recentInvoices?.length ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>🧾</div>
                No invoices yet.{' '}
                <a href="/billing" style={{ color: 'var(--accent)' }}>Create your first bill</a>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.025)' }}>
                    {['Invoice #', 'Customer', 'Amount', 'Date'].map(h => (
                      <th key={h} style={{
                        padding: '10px 20px', textAlign: 'left',
                        fontSize: 11, color: 'var(--text3)',
                        textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600,
                        borderBottom: '1px solid rgba(59,130,246,0.08)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentInvoices.map((inv, i) => (
                    <tr
                      key={inv._id}
                      className="anim-slide-in"
                      style={{
                        borderBottom: '1px solid rgba(59,130,246,0.05)',
                        animationDelay: `${0.3 + i * 0.06}s`,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)' }}>{inv.invoiceNumber}</td>
                      <td style={{ padding: '12px 20px', fontSize: 13 }}>{inv.customer?.name || 'Walk-in'}</td>
                      <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>{fmt(inv.grandTotal)}</td>
                      <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text3)' }}>{new Date(inv.confirmedAt).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function greet() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}
