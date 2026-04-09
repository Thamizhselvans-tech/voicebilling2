import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';

const ROLES = ['Worker', 'Staff', 'Manager', 'Cashier', 'Supervisor'];

const ROLE_COLORS = {
  Worker:     { bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.3)',  text:'#f59e0b' },
  Staff:      { bg:'rgba(6,182,212,0.12)',   border:'rgba(6,182,212,0.3)',   text:'#06b6d4' },
  Manager:    { bg:'rgba(139,92,246,0.12)',  border:'rgba(139,92,246,0.3)',  text:'#a78bfa' },
  Cashier:    { bg:'rgba(16,185,129,0.12)',  border:'rgba(16,185,129,0.3)',  text:'#10b981' },
  Supervisor: { bg:'rgba(59,130,246,0.12)',  border:'rgba(59,130,246,0.3)',  text:'#60a5fa' },
};

const emptyForm = { name:'', phone:'', email:'', address:'', role:'Staff', joiningDate:'', salary:'', department:'', notes:'' };

// ── Initials avatar ─────────────────────────────────────────────────
function Avatar({ name, image, size=64 }) {
  const initials = name ? name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?';
  const colors   = ['#3b82f6','#06b6d4','#8b5cf6','#10b981','#f59e0b','#ef4444'];
  const color    = colors[name?.charCodeAt(0) % colors.length] || '#3b82f6';

  if (image) return (
    <img src={`/uploads/${image}`} alt={name}
      style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', display:'block' }} />
  );
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:`${color}22`, border:`2px solid ${color}55`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'var(--font-head)', fontWeight:700,
      fontSize: size * 0.32, color
    }}>{initials}</div>
  );
}

// ── Role badge ──────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.Staff;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'3px 11px', borderRadius:20,
      background:c.bg, border:`1px solid ${c.border}`,
      color:c.text, fontSize:11, fontWeight:600, letterSpacing:0.4,
      textTransform:'uppercase'
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:c.text, display:'inline-block' }}/>
      {role}
    </span>
  );
}

// ── Employee Card ───────────────────────────────────────────────────
function EmployeeCard({ emp, onEdit, onDelete, index }) {
  return (
    <div className="emp-card" style={{ animation:`cardIn 0.4s ease ${index*0.06}s both` }}>
      {/* Top row */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
        <div className="emp-avatar-wrap">
          <Avatar name={emp.name} image={emp.image} size={64} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, color:'var(--text)', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {emp.name}
          </div>
          <RoleBadge role={emp.role} />
        </div>
        {/* Actions */}
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          <button onClick={() => onEdit(emp)} className="btn-ghost" style={{ padding:'5px 10px', fontSize:12 }}>Edit</button>
          <button onClick={() => onDelete(emp)} className="btn-danger" style={{ padding:'5px 10px', fontSize:12 }}>Del</button>
        </div>
      </div>

      {/* Info rows */}
      <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
        <InfoRow icon="📧" value={emp.email} mono />
        <InfoRow icon="📱" value={emp.phone} />
        {emp.department && <InfoRow icon="🏢" value={emp.department} />}
        <InfoRow icon="📅" value={`Joined: ${new Date(emp.joiningDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}`} muted />
        {emp.address && <InfoRow icon="📍" value={emp.address} muted clamp />}
      </div>
    </div>
  );
}

function InfoRow({ icon, value, mono, muted, clamp }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
      <span style={{ fontSize:12, flexShrink:0, marginTop:1, opacity:0.6 }}>{icon}</span>
      <span style={{
        fontSize:12,
        color: muted ? 'var(--text3)' : 'var(--text2)',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        overflow:'hidden',
        display: clamp ? '-webkit-box' : 'block',
        WebkitLineClamp: clamp ? 2 : undefined,
        WebkitBoxOrient: clamp ? 'vertical' : undefined,
        textOverflow: clamp ? 'ellipsis' : undefined,
        wordBreak:'break-all'
      }}>{value}</span>
    </div>
  );
}

// ── Add/Edit Modal ──────────────────────────────────────────────────
function EmployeeModal({ emp, onClose, onSave }) {
  const [form, setForm]     = useState(emp ? {
    name:emp.name, phone:emp.phone, email:emp.email,
    address:emp.address||'', role:emp.role,
    joiningDate: emp.joiningDate ? emp.joiningDate.substring(0,10) : '',
    salary:emp.salary||'', department:emp.department||'', notes:emp.notes||''
  } : { ...emptyForm, joiningDate: new Date().toISOString().substring(0,10) });
  const [imageFile, setImageFile] = useState(null);
  const [preview,   setPreview]   = useState(emp?.image ? `/uploads/${emp.image}` : '');
  const [loading, setLoading]     = useState(false);
  const [error,   setError]       = useState('');
  const fileRef = useRef();

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const handleImage = e => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => v !== '' && fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      let data;
      if (emp) { data = await api.put(`/employees/${emp._id}`, fd, { headers:{'Content-Type':'multipart/form-data'} }); }
      else     { data = await api.post('/employees', fd, { headers:{'Content-Type':'multipart/form-data'} }); }
      onSave(data.data.employee);
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  const fields = [
    [['name','Employee Name','text',true],['phone','Phone Number','tel',true]],
    [['email','Gmail Address','email',true],['department','Department','text',false]],
    [['address','Address','text',false],['salary','Salary (₹)','number',false]],
    [['joiningDate','Joining Date','date',false],['notes','Notes','text',false]],
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding:'22px 28px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h2 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:800 }}>{emp ? 'Edit Employee' : 'Add Employee'}</h2>
            <p style={{ color:'var(--text3)', fontSize:12, marginTop:3 }}>{emp ? `Editing: ${emp.name}` : 'Fill in employee details'}</p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', width:34, height:34, borderRadius:8, color:'var(--text2)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'20px 28px 28px' }}>
          {/* Avatar upload */}
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:22, padding:'16px', background:'rgba(59,130,246,0.05)', borderRadius:12, border:'1px solid rgba(59,130,246,0.1)' }}>
            <div style={{ position:'relative', cursor:'pointer' }} onClick={() => fileRef.current.click()}>
              {preview ? (
                <img src={preview} alt="preview" style={{ width:64, height:64, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(59,130,246,0.4)' }} />
              ) : (
                <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(59,130,246,0.12)', border:'2px dashed rgba(59,130,246,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>👤</div>
              )}
              <div style={{ position:'absolute', bottom:0, right:0, width:22, height:22, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff' }}>+</div>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--text2)', marginBottom:4 }}>Profile Photo</div>
              <button type="button" className="btn-ghost" style={{ fontSize:12, padding:'5px 14px' }} onClick={() => fileRef.current.click()}>
                {preview ? 'Change Photo' : 'Upload Photo'}
              </button>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>JPG, PNG — max 3MB</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display:'none' }} />
          </div>

          {/* Role selector */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8, fontWeight:600 }}>Role</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {ROLES.map(r => {
                const c = ROLE_COLORS[r];
                const active = form.role === r;
                return (
                  <button key={r} type="button" onClick={() => set('role', r)} style={{
                    padding:'6px 16px', borderRadius:20, fontSize:12, fontWeight:600,
                    background: active ? c.bg : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? c.border : 'rgba(255,255,255,0.07)'}`,
                    color: active ? c.text : 'var(--text3)',
                    transition:'all 0.18s'
                  }}>{r}</button>
                );
              })}
            </div>
          </div>

          {/* Fields grid */}
          {fields.map((row, ri) => (
            <div key={ri} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              {row.map(([key, label, type, required]) => (
                <div key={key}>
                  <label style={{ display:'block', fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:5, fontWeight:600 }}>
                    {label}{required && <span style={{ color:'var(--danger)' }}> *</span>}
                  </label>
                  <input type={type} required={required} value={form[key]}
                    onChange={e => set(key, e.target.value)}
                    className="inp" style={{ padding:'10px 12px' }} />
                </div>
              ))}
            </div>
          ))}

          {error && (
            <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', color:'var(--danger)', fontSize:13, marginBottom:14 }}>
              {error}
            </div>
          )}

          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex:1, padding:12 }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex:2, padding:12, fontSize:14 }}>
              {loading ? <span className="loader" style={{ width:18, height:18, borderWidth:2 }} /> : (emp ? '✓ Update Employee' : '+ Add Employee')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm ──────────────────────────────────────────────────
function DeleteModal({ emp, onClose, onConfirm, loading }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth:420 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:'28px', textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
          <h3 style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:800, marginBottom:8 }}>Remove Employee?</h3>
          <p style={{ color:'var(--text2)', fontSize:14, marginBottom:6 }}>
            You are about to remove <strong style={{ color:'var(--text)' }}>{emp.name}</strong> from the system.
          </p>
          <p style={{ color:'var(--text3)', fontSize:13, marginBottom:24 }}>This action can be undone by an admin. The record is soft-deleted.</p>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} className="btn-ghost" style={{ flex:1, padding:11 }}>Cancel</button>
            <button onClick={onConfirm} disabled={loading} style={{
              flex:1, padding:11, borderRadius:10, fontWeight:700,
              background:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff', fontSize:14,
              opacity: loading ? 0.7 : 1
            }}>{loading ? 'Removing…' : 'Yes, Remove'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Employees Page ─────────────────────────────────────────────
export default function Employees() {
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [viewMode, setViewMode]     = useState('grid'); // 'grid' | 'table'
  const [showAdd,  setShowAdd]      = useState(false);
  const [editEmp,  setEditEmp]      = useState(null);
  const [deleteEmp,setDeleteEmp]    = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const [total, setTotal]           = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [toast, setToast]           = useState('');
  const searchRef = useRef();

  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit:100 });
      if (search) params.append('search', search);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      const { data } = await api.get(`/employees?${params}`);
      setEmployees(data.employees);
      setTotal(data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleSave = emp => {
    setShowAdd(false); setEditEmp(null);
    fetchEmployees();
    showToast(editEmp ? `${emp.name} updated successfully!` : `${emp.name} added successfully!`);
  };

  const handleDelete = async () => {
    setDelLoading(true);
    try {
      await api.delete(`/employees/${deleteEmp._id}`);
      setDeleteEmp(null);
      fetchEmployees();
      showToast('Employee removed.');
    } catch (err) { console.error(err); }
    finally { setDelLoading(false); }
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try {
      const res = await api.get('/employees/pdf', { responseType:'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type:'application/pdf' }));
      const a   = document.createElement('a');
      a.href = url; a.download = 'employees.pdf'; a.click();
      URL.revokeObjectURL(url);
      showToast('PDF downloaded!');
    } catch (err) { console.error(err); }
    finally { setPdfLoading(false); }
  };

  // Role counts
  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r] = employees.filter(e => e.role === r).length;
    return acc;
  }, {});

  return (
    <div className="page-bg bg-employees" style={{ padding:'28px 32px', minHeight:'100vh' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', top:20, right:20, zIndex:999,
          background:'rgba(16,185,129,0.15)', backdropFilter:'blur(12px)',
          border:'1px solid rgba(16,185,129,0.35)', borderRadius:12,
          padding:'12px 20px', color:'#10b981', fontSize:13, fontWeight:500,
          animation:'slideIn 0.3s ease', boxShadow:'0 8px 24px rgba(0,0,0,0.4)'
        }}>✓ {toast}</div>
      )}

      {/* Page header */}
      <div className="page-header anim-fade-down" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
        <div>
          <h1>Employee Directory</h1>
          <p>{total} team member{total !== 1 ? 's' : ''} · Manage your workforce</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={handlePDF} disabled={pdfLoading} className="btn-ghost" style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px' }}>
            {pdfLoading ? <span className="loader" style={{ width:14, height:14, borderWidth:2 }} /> : '📄'}
            <span className="hide-mobile">Export PDF</span>
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px' }}>
            <span style={{ fontSize:16 }}>+</span> Add Employee
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:24 }}>
        {/* Total */}
        <div className="stat-card" style={{ borderLeft:'3px solid var(--accent)' }}>
          <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 }}>Total</div>
          <div style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:800, color:'var(--text)' }}>{total}</div>
        </div>
        {ROLES.map(r => {
          const c = ROLE_COLORS[r];
          return (
            <div key={r} className="stat-card" style={{ borderLeft:`3px solid ${c.text}`, cursor:'pointer' }}
                 onClick={() => setRoleFilter(roleFilter === r ? 'all' : r)}>
              <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 }}>{r}</div>
              <div style={{ fontFamily:'var(--font-head)', fontSize:24, fontWeight:800, color:c.text }}>{roleCounts[r] || 0}</div>
            </div>
          );
        })}
      </div>

      {/* Search + filter bar */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ flex:1, minWidth:220, position:'relative' }}>
          <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', fontSize:14, pointerEvents:'none' }}>🔍</span>
          <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone…"
            className="inp" style={{ paddingLeft:38 }} />
        </div>

        {/* Role filter pills */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <button onClick={() => setRoleFilter('all')} style={{
            padding:'7px 14px', borderRadius:20, fontSize:12, fontWeight:500,
            background: roleFilter==='all' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
            border:`1px solid ${roleFilter==='all' ? 'rgba(59,130,246,0.5)' : 'var(--border)'}`,
            color: roleFilter==='all' ? 'var(--accent)' : 'var(--text3)'
          }}>All</button>
          {ROLES.map(r => {
            const c = ROLE_COLORS[r];
            const active = roleFilter === r;
            return (
              <button key={r} onClick={() => setRoleFilter(active ? 'all' : r)} style={{
                padding:'7px 14px', borderRadius:20, fontSize:12, fontWeight:500,
                background: active ? c.bg : 'rgba(255,255,255,0.04)',
                border:`1px solid ${active ? c.border : 'var(--border)'}`,
                color: active ? c.text : 'var(--text3)'
              }}>{r}</button>
            );
          })}
        </div>

        {/* View toggle */}
        <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:4, border:'1px solid var(--border)' }}>
          {[['grid','⊞'],['table','☰']].map(([mode, icon]) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              width:32, height:32, borderRadius:7, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
              background: viewMode===mode ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: viewMode===mode ? 'var(--accent)' : 'var(--text3)',
              border: viewMode===mode ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent'
            }}>{icon}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ background:'rgba(255,255,255,0.03)', borderRadius:'var(--r2)', padding:22, height:180 }}>
              <div style={{ display:'flex', gap:14, marginBottom:14 }}>
                <div className="skeleton" style={{ width:64, height:64, borderRadius:'50%', flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div className="skeleton" style={{ height:16, width:'70%', marginBottom:8 }} />
                  <div className="skeleton" style={{ height:12, width:'45%' }} />
                </div>
              </div>
              <div className="skeleton" style={{ height:12, marginBottom:8 }} />
              <div className="skeleton" style={{ height:12, width:'80%' }} />
            </div>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--text3)' }}>
          <div style={{ fontSize:56, marginBottom:16, opacity:0.5 }}>👥</div>
          <div style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700, marginBottom:8, color:'var(--text2)' }}>No employees found</div>
          <div style={{ fontSize:14, marginBottom:24 }}>
            {search || roleFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Add your first team member to get started.'}
          </div>
          {!search && roleFilter === 'all' && (
            <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ padding:'11px 28px' }}>+ Add First Employee</button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="emp-grid stagger" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {employees.map((emp, i) => (
            <EmployeeCard key={emp._id} emp={emp} index={i}
              onEdit={setEditEmp} onDelete={setDeleteEmp} />
          ))}
        </div>
      ) : (
        /* Table view */
        <div style={{ background:'rgba(13,21,40,0.75)', backdropFilter:'blur(20px)', border:'1px solid rgba(59,130,246,0.12)', borderRadius:'var(--r2)', overflow:'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                {['Employee','Role','Phone','Email','Department','Joined','Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp._id} style={{ animation:`slideUp 0.3s ease ${i*0.04}s both` }}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <Avatar name={emp.name} image={emp.image} size={36} />
                      <span style={{ fontWeight:500 }}>{emp.name}</span>
                    </div>
                  </td>
                  <td><RoleBadge role={emp.role} /></td>
                  <td style={{ fontFamily:'var(--font-mono)', color:'var(--text2)' }}>{emp.phone}</td>
                  <td style={{ color:'var(--text2)', fontSize:12 }}>{emp.email}</td>
                  <td style={{ color:'var(--text3)' }}>{emp.department || '—'}</td>
                  <td style={{ color:'var(--text3)', fontSize:12 }}>{new Date(emp.joiningDate).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => setEditEmp(emp)} className="btn-ghost" style={{ padding:'4px 12px', fontSize:12 }}>Edit</button>
                      <button onClick={() => setDeleteEmp(emp)} className="btn-danger" style={{ padding:'4px 12px', fontSize:12 }}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {(showAdd || editEmp) && (
        <EmployeeModal
          emp={editEmp}
          onClose={() => { setShowAdd(false); setEditEmp(null); }}
          onSave={handleSave}
        />
      )}
      {deleteEmp && (
        <DeleteModal emp={deleteEmp} loading={delLoading}
          onClose={() => setDeleteEmp(null)} onConfirm={handleDelete} />
      )}
    </div>
  );
}
