import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const empty = { name:'', shortcut:'', price:'', category:'', gstRate:'0.05', hsnCode:'', unit:'piece' };

export default function Products() {
  const { user }      = useAuth();
  const isAdmin       = user?.role === 'admin';
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(empty);
  const [editing, setEditing]   = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products);
    } catch (err) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async e => {
    e.preventDefault(); setError('');
    try {
      if (editing) {
        await api.put(`/products/${editing}`, form);
      } else {
        await api.post('/products', form);
      }
      setForm(empty); setEditing(null); setShowForm(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (p) => {
    setForm({ name:p.name, shortcut:p.shortcut, price:p.price, category:p.category, gstRate:p.gstRate, hsnCode:p.hsnCode||'', unit:p.unit||'piece' });
    setEditing(p._id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    await api.delete(`/products/${id}`);
    fetchProducts();
  };

  const categories = [...new Set(products.map(p => p.category))].sort();
  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.shortcut.includes(search.toLowerCase())
  );

  return (
    <div className="page-bg bg-products" style={{ padding:32 }}>
      <div className="anim-fade-down" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div className="page-header" style={{ marginBottom:0 }}>
          <h1>Products</h1>
          <p>{products.length} active products</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ padding:'9px 14px', borderRadius:8, background:'var(--card)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, width:180 }} />
          {isAdmin && (
            <button onClick={() => { setForm(empty); setEditing(null); setShowForm(true); }}
              style={{ padding:'9px 18px', borderRadius:8, background:'linear-gradient(135deg,#3b82f6,#06b6d4)', color:'#fff', fontWeight:600, fontSize:14 }}>
              + Add Product
            </button>
          )}
        </div>
      </div>

      {/* Group by category */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:16 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:120, borderRadius:'var(--r2)' }} />)}
        </div>
      ) : (
        categories.map((cat, ci) => {
          const catItems = filtered.filter(p => p.category === cat);
          if (catItems.length === 0) return null;
          return (
            <div key={cat} className="anim-card-in" style={{ marginBottom:24, animationDelay:`${ci*0.07}s` }}>
              <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, fontWeight:600, marginBottom:8, paddingLeft:4, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ display:'inline-block', width:16, height:2, background:'var(--accent)', borderRadius:1 }}/>
                {cat}
              </div>
              <div className="glass-bright" style={{ overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'rgba(255,255,255,0.025)' }}>
                      {['Shortcut','Name','Price','GST','Unit', isAdmin?'Actions':''].filter(Boolean).map(h => (
                        <th key={h} style={{ padding:'9px 16px', textAlign:'left', fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'1px solid rgba(59,130,246,0.08)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {catItems.map((p, pi) => (
                      <tr key={p._id}
                        className="anim-slide-in"
                        style={{ borderTop:'1px solid rgba(59,130,246,0.05)', transition:'background 0.15s', animationDelay:`${pi*0.04}s` }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(59,130,246,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}
                      >
                        <td style={{ padding:'10px 16px', fontFamily:'var(--font-mono)', fontSize:13, color:'var(--accent)', fontWeight:500 }}>{p.shortcut}</td>
                        <td style={{ padding:'10px 16px', fontWeight:500 }}>{p.name}</td>
                        <td style={{ padding:'10px 16px', fontFamily:'var(--font-mono)', color:'var(--success)', fontWeight:600 }}>₹{p.price.toFixed(2)}</td>
                        <td style={{ padding:'10px 16px', fontSize:13, color:'var(--text2)' }}>{(p.gstRate*100).toFixed(0)}%</td>
                        <td style={{ padding:'10px 16px', fontSize:13, color:'var(--text3)' }}>{p.unit}</td>
                        {isAdmin && (
                          <td style={{ padding:'10px 16px' }}>
                            <button onClick={() => handleEdit(p)} className="btn-ghost" style={{ marginRight:8, padding:'4px 12px', fontSize:12 }}>Edit</button>
                            <button onClick={() => handleDelete(p._id)} className="btn-danger" style={{ padding:'4px 12px', fontSize:12 }}>Del</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" style={{ maxWidth:480 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding:'22px 26px 0', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <h2 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:18 }}>{editing ? 'Edit Product' : 'Add Product'}</h2>
                <p style={{ color:'var(--text3)', fontSize:12, marginTop:2 }}>{editing ? 'Update product details' : 'Fill in product information'}</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)', width:34, height:34, borderRadius:8, color:'var(--text2)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>✕</button>
            </div>
            {error && <div style={{ margin:'0 26px 14px', background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.28)', borderRadius:8, padding:'10px 14px', color:'var(--danger)', fontSize:13 }}>{error}</div>}
            <form onSubmit={handleSubmit} style={{ padding:'0 26px 26px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                {[['name','Name','text',true],['shortcut','Shortcut Code','text',true],['price','Price (₹)','number',true],['category','Category','text',true],['hsnCode','HSN Code','text',false],['unit','Unit','text',false]].map(([k,pl,type,req]) => (
                  <div key={k}>
                    <label style={{ display:'block', fontSize:11, color:'var(--text3)', marginBottom:5, textTransform:'uppercase', letterSpacing:0.5, fontWeight:600 }}>{pl}{req && <span style={{ color:'var(--danger)' }}> *</span>}</label>
                    <input type={type} required={req} value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))}
                      className="inp" style={{ padding:'9px 12px' }} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:18 }}>
                <label style={{ display:'block', fontSize:11, color:'var(--text3)', marginBottom:5, textTransform:'uppercase', letterSpacing:0.5, fontWeight:600 }}>GST Rate</label>
                <select value={form.gstRate} onChange={e => setForm(f => ({...f,gstRate:e.target.value}))}
                  className="inp" style={{ padding:'9px 12px' }}>
                  <option value="0">0% (Exempt)</option>
                  <option value="0.05">5%</option>
                  <option value="0.12">12%</option>
                  <option value="0.18">18%</option>
                  <option value="0.28">28%</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ flex:1, padding:'11px' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex:2, padding:'11px' }}>
                  {editing ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
