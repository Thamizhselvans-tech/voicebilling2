import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [selected, setSelected] = useState(null);
  const [visible, setVisible]   = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 40); }, []);

  const fetchInvoices = async (pg = 1, q = '') => {
    setLoading(true);
    try {
      const { data } = await api.get(`/invoice?page=${pg}&limit=15${q ? `&search=${q}` : ''}`);
      setInvoices(data.invoices);
      setTotal(data.total);
      setPages(data.pages);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(page, search); }, [page]);

  const handleSearch = e => { e.preventDefault(); setPage(1); fetchInvoices(1, search); };

  const fmt = n => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    /* bg-invoices — clean office/business background */
    <div className="page-bg bg-invoices" style={{ padding: '32px' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        className="page-header anim-fade-down"
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}
      >
        <div>
          <h1>Invoices</h1>
          <p>{total} confirmed invoice{total !== 1 ? 's' : ''}</p>
        </div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice #…"
            className="inp" style={{ width: 200 }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '9px 18px' }}>
            Search
          </button>
        </form>
      </div>

      {/* ── Table card ─────────────────────────────────────────── */}
      <div
        className="glass-bright anim-card-in"
        style={{
          overflow: 'hidden',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      >
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div className="loader" />
            <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 14 }}>Loading invoices…</div>
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: 70, textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 14, opacity: 0.45 }}>🧾</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>
              No invoices found
            </div>
            <div style={{ color: 'var(--text3)', fontSize: 14 }}>Try a different search term.</div>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.025)' }}>
                  {['Invoice #', 'Customer', 'Items', 'Amount', 'Payment', 'Date', 'PDF'].map(h => (
                    <th key={h} style={{
                      padding: '11px 20px', textAlign: 'left',
                      fontSize: 11, color: 'var(--text3)',
                      textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600,
                      borderBottom: '1px solid rgba(59,130,246,0.09)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr
                    key={inv._id}
                    className="anim-slide-in"
                    style={{
                      borderBottom: '1px solid rgba(59,130,246,0.05)',
                      cursor: 'pointer',
                      animationDelay: `${i * 0.045}s`,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => setSelected(inv)}
                  >
                    <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)' }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '12px 20px', fontSize: 13 }}>{inv.customer?.name || 'Walk-in'}</td>
                    <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text2)' }}>{inv.items?.length || 0} items</td>
                    <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>{fmt(inv.grandTotal)}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{
                        padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: 0.4,
                        background: 'rgba(59,130,246,0.12)', color: 'var(--accent)',
                        border: '1px solid rgba(59,130,246,0.25)',
                      }}>{inv.paymentMethod}</span>
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text3)' }}>{new Date(inv.confirmedAt).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 20px' }}>
                      {inv.pdfPath && (
                        <a
                         href={`http://localhost:5000/invoices/${inv.pdfPath}`} target="_blank" rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{
                            fontSize: 18, display: 'inline-block',
                            transition: 'transform 0.2s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >📄</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px', borderTop: '1px solid rgba(59,130,246,0.08)',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text3)' }}>Page {page} of {pages} · {total} total</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['← Prev', page - 1, page <= 1], ['Next →', page + 1, page >= pages]].map(([label, target, disabled]) => (
                  <button key={label} onClick={() => !disabled && setPage(target)}
                    className="btn-ghost"
                    style={{ fontSize: 13, opacity: disabled ? 0.35 : 1, cursor: disabled ? 'default' : 'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Detail modal ───────────────────────────────────────── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid rgba(59,130,246,0.12)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>
                  {selected.invoiceNumber}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                  {new Date(selected.confirmedAt).toLocaleString('en-IN')}
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', width: 32, height: 32, borderRadius: 8, color: 'var(--text2)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {/* Customer */}
              <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(59,130,246,0.06)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.12)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Customer</div>
                <div style={{ fontWeight: 500 }}>{selected.customer?.name || 'Walk-in Customer'}</div>
                {selected.customer?.phone && <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{selected.customer.phone}</div>}
              </div>

              {/* Items */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 14 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {['Item', 'Qty', 'Rate', 'Total'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.items?.map((it, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(59,130,246,0.07)' }}>
                      <td style={{ padding: '9px 10px' }}>{it.name}</td>
                      <td style={{ padding: '9px 10px', color: 'var(--text2)' }}>{it.qty}</td>
                      <td style={{ padding: '9px 10px', fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>{fmt(it.unitPrice)}</td>
                      <td style={{ padding: '9px 10px', fontFamily: 'var(--font-mono)', color: 'var(--success)', fontWeight: 600 }}>{fmt(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ borderTop: '1px solid rgba(59,130,246,0.10)', paddingTop: 12 }}>
                {[['Subtotal', fmt(selected.subtotal)], ...(selected.isInterState ? [['IGST', fmt(selected.igst)]] : [['CGST', fmt(selected.cgst)], ['SGST', fmt(selected.sgst)]])].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', padding: '3px 0' }}>
                    <span>{k}</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 17, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(59,130,246,0.15)' }}>
                  <span>Grand Total</span>
                  <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{fmt(selected.grandTotal)}</span>
                </div>
              </div>

              {selected.pdfPath && (
                <a
                  href={`http://localhost:5000/invoices/${selected.pdfPath}`} target="_blank" rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    marginTop: 18, padding: '11px', borderRadius: 10,
                    background: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
                    color: '#fff', fontWeight: 600, fontSize: 14,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  📄 Download PDF Invoice
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
