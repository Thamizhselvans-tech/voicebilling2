import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import useSpeech from '../hooks/useSpeech';

export default function Billing() {
  const [step, setStep]             = useState('voice');
  const [items, setItems]           = useState([]);
  const [bill, setBill]             = useState(null);
  const [customer, setCustomer]     = useState({ name:'', phone:'', gstin:'', email:'' });
  const [payMethod, setPayMethod]   = useState('cash');
  const [isInterState, setInterState] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [invoice, setInvoice]       = useState(null);
  const [unrecognized, setUnrec]    = useState([]);
  const [manualCode, setManualCode] = useState('');
  const [manualQty, setManualQty]   = useState(1);
  const [products, setProducts]     = useState([]);
  const speech = useSpeech();

  useEffect(() => { api.get('/products').then(r => setProducts(r.data.products)).catch(() => {}); }, []);
  useEffect(() => { if (speech.transcript) decodeVoice(speech.transcript); }, [speech.transcript]);

  const decodeVoice = async (transcript) => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/voice/decode', { transcript });
      if (data.order.length === 0) { setError('No items recognized. Try again.'); setLoading(false); return; }
      const merged = mergeItems([...items, ...data.order]);
      setItems(merged); setUnrec(data.unrecognized || []);
      await recalculate(merged); setStep('preview');
    } catch (err) { setError(err.response?.data?.message || 'Decode failed'); }
    finally { setLoading(false); }
  };

  const mergeItems = (arr) => {
    const map = {};
    arr.forEach(it => {
      const key = it.productId?.toString() || it.shortcut;
      if (map[key]) { map[key].qty += it.qty; map[key].lineTotal = map[key].unitPrice * map[key].qty; }
      else map[key] = { ...it };
    });
    return Object.values(map);
  };

  const recalculate = async (itms = items) => {
    const { data } = await api.post('/bill/calculate', { items: itms, isInterState });
    setBill(data); return data;
  };

  const updateQty = async (idx, newQty) => {
    if (newQty < 1) return;
    const updated = items.map((it, i) => i === idx ? { ...it, qty: newQty, lineTotal: it.unitPrice * newQty } : it);
    setItems(updated); await recalculate(updated);
  };

  const removeItem = async (idx) => {
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    if (updated.length === 0) { setBill(null); return; }
    await recalculate(updated);
  };

  const addManual = async () => {
    if (!manualCode) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/voice/decode', { transcript: manualCode + ' ' + manualQty });
      if (data.order.length === 0) { setError("Shortcut not found"); setLoading(false); return; }
      const merged = mergeItems([...items, ...data.order]);
      setItems(merged); await recalculate(merged);
      setManualCode(''); setManualQty(1);
    } catch { setError('Item not found'); }
    finally { setLoading(false); }
  };

  const generateInvoice = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/invoice/generate', {
        ...bill, items, customer, paymentMethod: payMethod,
        voiceTranscript: speech.transcript, confirmed: true,
      });
      setInvoice(data.invoice); setStep('done');
    } catch (err) { setError(err.response?.data?.message || 'Invoice generation failed'); }
    finally { setLoading(false); }
  };

  const resetAll = () => {
    setStep('voice'); setItems([]); setBill(null); setInvoice(null);
    setError(''); setUnrec([]); speech.reset();
    setCustomer({ name:'', phone:'', gstin:'', email:'' });
  };

  const fmt = n => String.fromCharCode(8377) + parseFloat(n || 0).toFixed(2);

  const stepMap = { voice:0, preview:1, confirm:2, done:3 };
  const stepLabels = ['Voice', 'Preview', 'Confirm', 'Done'];

  const StepBar = () => (
    <div style={{ display:'flex', alignItems:'center', marginBottom:32 }} className="anim-fade-down">
      {stepLabels.map((label, i) => {
        const current = stepMap[step];
        const done    = i < current;
        const active  = i === current;
        return (
          React.createElement(React.Fragment, { key:label },
            React.createElement('div', { style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 } },
              React.createElement('div', { style:{
                width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:13, fontWeight:700,
                background: done ? 'var(--success)' : active ? 'linear-gradient(135deg,#3b82f6,#06b6d4)' : 'rgba(255,255,255,0.06)',
                border: '2px solid ' + (done ? 'var(--success)' : active ? '#3b82f6' : 'rgba(255,255,255,0.10)'),
                color: (done || active) ? '#fff' : 'var(--text3)',
                boxShadow: active ? '0 0 16px rgba(59,130,246,0.45)' : 'none',
              }}, done ? React.createElement('span', null, String.fromCharCode(10003)) : i+1),
              React.createElement('span', { style:{ fontSize:11, color: active ? 'var(--accent)' : done ? 'var(--success)' : 'var(--text3)', fontWeight: active ? 600 : 400 }}, label)
            ),
            i < stepLabels.length - 1 && React.createElement('div', { style:{ flex:1, height:2, margin:'0 4px 18px', background: done ? 'var(--success)' : 'rgba(255,255,255,0.07)', borderRadius:2 }})
          )
        );
      })}
    </div>
  );

  if (step === 'voice') return (
    React.createElement('div', { className:'page-bg bg-billing', style:{ padding:32, minHeight:'100vh' } },
      React.createElement('div', { className:'page-header anim-fade-down' },
        React.createElement('h1', null, 'New Bill'),
        React.createElement('p', null, 'Speak item shortcuts or type them manually')
      ),
      React.createElement(StepBar, null),
      React.createElement('div', { style:{ maxWidth:640, margin:'0 auto' } },
        React.createElement('div', { className:'glass-bright anim-card-in', style:{ padding:30, marginBottom:16 } },
          React.createElement('div', { style:{ textAlign:'center', padding:'10px 0' } },
            React.createElement('div', { style:{ position:'relative', display:'inline-block', marginBottom:28 } },
              speech.listening && React.createElement('div', { style:{ position:'absolute', inset:-10, borderRadius:'50%', border:'2px solid rgba(239,68,68,0.5)', animation:'pulse-ring 1.2s ease-out infinite' }}),
              React.createElement('button', {
                onClick: speech.listening ? speech.stop : speech.start,
                style:{
                  width:96, height:96, borderRadius:'50%',
                  background: speech.listening ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#3b82f6,#06b6d4)',
                  color:'#fff', fontSize:36, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto',
                  boxShadow: speech.listening ? '0 0 36px rgba(239,68,68,0.55)' : '0 0 28px rgba(59,130,246,0.40)',
                  border:'none', cursor:'pointer',
                  animation: speech.listening ? 'none' : 'glowPulse 3s ease-in-out infinite',
                }
              }, speech.listening ? String.fromCharCode(9209) : String.fromCharCode(127908))
            ),
            React.createElement('div', { style:{ fontSize:15, fontWeight:600, color: speech.listening ? '#ef4444' : 'var(--text2)', marginBottom:10 }},
              speech.listening ? String.fromCharCode(9679) + ' Recording... speak now' : 'Tap mic to start speaking'),
            (speech.interim || speech.transcript) && React.createElement('div', {
              style:{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.20)', borderRadius:10, padding:'12px 18px', margin:'14px 0', fontFamily:'var(--font-mono)', fontSize:13, color:'var(--text2)', minHeight:44, textAlign:'left' }
            }, speech.interim || speech.transcript),
            speech.error && React.createElement('div', { style:{ color:'var(--danger)', fontSize:13, marginTop:8 }}, speech.error),
            React.createElement('div', { style:{ marginTop:22, padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, textAlign:'left' }},
              React.createElement('div', { style:{ fontSize:11, color:'var(--text3)', letterSpacing:1, textTransform:'uppercase', marginBottom:10, fontWeight:600 }}, 'Example voice commands'),
              ['"bn 2, ch 1, lsi 3"','"vt 2 wtr 4"','"pbm 1 roti 4 dal 2"'].map(ex =>
                React.createElement('div', { key:ex, style:{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--accent)', marginBottom:6 }}, ex)
              )
            )
          )
        ),
        React.createElement('div', { className:'glass-bright anim-card-in', style:{ padding:20, marginBottom:16, animationDelay:'0.1s' }},
          React.createElement('div', { style:{ fontSize:12, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.6, marginBottom:14, fontWeight:600 }}, 'Or add by shortcut code'),
          React.createElement('div', { style:{ display:'flex', gap:8 }},
            React.createElement('input', { value:manualCode, onChange:e=>setManualCode(e.target.value.toLowerCase()), onKeyDown:e=>e.key==='Enter'&&addManual(), placeholder:'code (e.g. bn)', className:'inp', style:{ flex:2 }}),
            React.createElement('input', { type:'number', value:manualQty, min:1, onChange:e=>setManualQty(parseInt(e.target.value)||1), className:'inp', style:{ flex:1 }}),
            React.createElement('button', { onClick:addManual, disabled:loading, className:'btn-primary', style:{ padding:'10px 18px', whiteSpace:'nowrap' }}, loading ? '...' : 'Add')
          ),
          products.length > 0 && React.createElement('div', { style:{ marginTop:14, display:'flex', flexWrap:'wrap', gap:6 }},
            products.map(p => React.createElement('button', {
              key:p._id, onClick:()=>setManualCode(p.shortcut),
              style:{ padding:'4px 10px', borderRadius:6, fontSize:12, cursor:'pointer', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(59,130,246,0.14)', color:'var(--text2)' }
            }, React.createElement('span', { style:{ color:'var(--accent)', fontFamily:'var(--font-mono)' }}, p.shortcut), ' — ', p.name))
          )
        ),
        error && React.createElement('div', { style:{ background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.28)', borderRadius:10, padding:'11px 15px', color:'var(--danger)', fontSize:13, marginBottom:14 }}, error),
        items.length > 0 && React.createElement('button', { onClick:()=>{ recalculate(); setStep('preview'); }, className:'btn-primary', style:{ width:'100%', padding:14, fontSize:15, marginTop:4 }},
          'View Bill Preview (' + items.length + ' item' + (items.length>1?'s':'') + ') \u2192'
        )
      )
    )
  );

  if (step === 'preview') return (
    React.createElement('div', { className:'page-bg bg-billing', style:{ padding:32, minHeight:'100vh' }},
      React.createElement('div', { className:'page-header anim-fade-down' }, React.createElement('h1',null,'Bill Preview'), React.createElement('p',null,'Review and edit before confirming')),
      React.createElement(StepBar, null),
      React.createElement('div', { style:{ maxWidth:720, margin:'0 auto' }},
        unrecognized.length > 0 && React.createElement('div', { style:{ background:'rgba(245,158,11,0.10)', border:'1px solid rgba(245,158,11,0.30)', borderRadius:10, padding:'10px 16px', color:'var(--warning)', fontSize:13, marginBottom:16 }},
          'Unrecognized: ' + unrecognized.join(', ') + ' — skipped.'),
        React.createElement('div', { className:'glass-bright anim-card-in', style:{ padding:0, overflow:'hidden', marginBottom:14 }},
          React.createElement('div', { style:{ padding:'14px 20px', borderBottom:'1px solid rgba(59,130,246,0.09)', fontFamily:'var(--font-head)', fontWeight:700, fontSize:15 }}, 'Order Items'),
          React.createElement('table', { style:{ width:'100%', borderCollapse:'collapse' }},
            React.createElement('thead', null, React.createElement('tr', { style:{ background:'rgba(255,255,255,0.025)' }},
              ['Item','Code','Qty','Rate','GST','Total',''].map(h => React.createElement('th', { key:h, style:{ padding:'9px 16px', textAlign:'left', fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'1px solid rgba(59,130,246,0.08)' }}, h))
            )),
            React.createElement('tbody', null, items.map((it, i) =>
              React.createElement('tr', { key:i, className:'anim-slide-in', style:{ borderTop:'1px solid rgba(59,130,246,0.06)', animationDelay: (i*0.05)+'s' },
                onMouseEnter:e=>e.currentTarget.style.background='rgba(59,130,246,0.05)',
                onMouseLeave:e=>e.currentTarget.style.background='transparent' },
                React.createElement('td', { style:{ padding:'12px 16px', fontWeight:500 }}, it.name),
                React.createElement('td', { style:{ padding:'12px 16px', fontFamily:'var(--font-mono)', fontSize:13, color:'var(--accent)' }}, it.shortcut),
                React.createElement('td', { style:{ padding:'12px 16px' }},
                  React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:6 }},
                    React.createElement('button', { onClick:()=>updateQty(i,it.qty-1), style:qtyBtn }, '-'),
                    React.createElement('span', { style:{ fontFamily:'var(--font-mono)', minWidth:22, textAlign:'center', fontWeight:600 }}, it.qty),
                    React.createElement('button', { onClick:()=>updateQty(i,it.qty+1), style:qtyBtn }, '+')
                  )
                ),
                React.createElement('td', { style:{ padding:'12px 16px', fontFamily:'var(--font-mono)', fontSize:13 }}, fmt(it.unitPrice)),
                React.createElement('td', { style:{ padding:'12px 16px', fontSize:12, color:'var(--text3)' }}, (it.gstRate*100).toFixed(0)+'%'),
                React.createElement('td', { style:{ padding:'12px 16px', fontFamily:'var(--font-mono)', fontSize:13, color:'var(--success)', fontWeight:600 }}, fmt(it.lineTotal)),
                React.createElement('td', { style:{ padding:'12px 16px' }}, React.createElement('button', { onClick:()=>removeItem(i), style:{ background:'none', color:'var(--danger)', fontSize:18, padding:4 }}, String.fromCharCode(10005)))
              )
            ))
          )
        ),
        bill && React.createElement('div', { className:'glass-bright anim-card-in', style:{ padding:20, marginBottom:14, animationDelay:'0.12s' }},
          React.createElement('label', { style:{ display:'flex', alignItems:'center', gap:9, fontSize:13, color:'var(--text2)', cursor:'pointer', marginBottom:16 }},
            React.createElement('input', { type:'checkbox', checked:isInterState, onChange:e=>{ setInterState(e.target.checked); recalculate(); }}),
            'Inter-state (IGST applies)'
          ),
          React.createElement('div', { style:{ borderTop:'1px solid rgba(59,130,246,0.08)', paddingTop:14 }},
            React.createElement(TaxRow, { label:'Subtotal', value:fmt(bill.subtotal) }),
            bill.isInterState ? React.createElement(TaxRow, { label:'IGST', value:fmt(bill.igst) }) : React.createElement(React.Fragment, null, React.createElement(TaxRow,{label:'CGST',value:fmt(bill.cgst)}), React.createElement(TaxRow,{label:'SGST',value:fmt(bill.sgst)})),
            React.createElement('div', { style:{ marginTop:12, paddingTop:12, borderTop:'1px solid rgba(59,130,246,0.15)', display:'flex', justifyContent:'space-between', alignItems:'center' }},
              React.createElement('span', { style:{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:18 }}, 'Grand Total'),
              React.createElement('span', { style:{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:22, color:'var(--accent)' }}, fmt(bill.grandTotal))
            )
          )
        ),
        error && React.createElement('div', { style:{ background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.28)', borderRadius:10, padding:'11px 15px', color:'var(--danger)', fontSize:13, marginBottom:14 }}, error),
        React.createElement('div', { style:{ display:'flex', gap:12, marginTop:8 }},
          React.createElement('button', { onClick:()=>setStep('voice'), className:'btn-ghost', style:{ flex:1, padding:13, fontSize:14 }}, '\u2190 Edit'),
          React.createElement('button', { onClick:()=>setStep('confirm'), className:'btn-primary', style:{ flex:2, padding:13, fontSize:14 }}, 'Proceed to Confirm \u2192')
        )
      )
    )
  );

  if (step === 'confirm') return (
    React.createElement('div', { className:'page-bg bg-billing', style:{ padding:32, minHeight:'100vh' }},
      React.createElement('div', { className:'page-header anim-fade-down' }, React.createElement('h1',null,'Confirm Invoice'), React.createElement('p',null,'Final review - PDF will be created after this step')),
      React.createElement(StepBar, null),
      React.createElement('div', { style:{ maxWidth:640, margin:'0 auto' }},
        React.createElement('div', { className:'glass-bright anim-card-in', style:{ padding:22, marginBottom:14 }},
          React.createElement('div', { style:{ fontSize:12, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.6, marginBottom:14, fontWeight:600 }}, 'Customer Details (optional)'),
          React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }},
            [['name','Customer Name'],['phone','Phone'],['gstin','GSTIN'],['email','Email']].map(([k,pl]) =>
              React.createElement('input', { key:k, value:customer[k], onChange:e=>setCustomer(c=>({...c,[k]:e.target.value})), placeholder:pl, className:'inp' })
            )
          ),
          React.createElement('div', { style:{ fontSize:12, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8, fontWeight:600 }}, 'Payment Method'),
          React.createElement('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' }},
            ['cash','upi','card','credit'].map(m =>
              React.createElement('button', { key:m, onClick:()=>setPayMethod(m), style:{
                padding:'7px 18px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer',
                background: payMethod===m ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                color: payMethod===m ? '#fff' : 'var(--text2)',
                border: '1px solid ' + (payMethod===m ? 'var(--accent)' : 'rgba(255,255,255,0.10)'),
                textTransform:'uppercase', letterSpacing:0.5,
              }}, m)
            )
          )
        ),
        React.createElement('div', { className:'glass-bright anim-card-in', style:{ padding:22, marginBottom:14, border:'1px solid rgba(59,130,246,0.28)', animationDelay:'0.10s' }},
          React.createElement('div', { style:{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, marginBottom:14, color:'var(--accent)' }}, 'Final Bill Summary'),
          items.map((it,i) => React.createElement('div', { key:i, style:{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'5px 0', borderBottom:'1px solid rgba(59,130,246,0.07)' }},
            React.createElement('span',null,it.name,' x ',it.qty),
            React.createElement('span',{ style:{ fontFamily:'var(--font-mono)', color:'var(--text2)' }},fmt(it.lineTotal))
          )),
          React.createElement('div', { style:{ marginTop:14 }},
            React.createElement(TaxRow,{label:'Subtotal',value:fmt(bill?.subtotal)}),
            bill?.isInterState ? React.createElement(TaxRow,{label:'IGST',value:fmt(bill?.igst)}) : React.createElement(React.Fragment,null,React.createElement(TaxRow,{label:'CGST',value:fmt(bill?.cgst)}),React.createElement(TaxRow,{label:'SGST',value:fmt(bill?.sgst)}))
          ),
          React.createElement('div', { style:{ marginTop:14, paddingTop:14, borderTop:'2px solid rgba(59,130,246,0.40)', display:'flex', justifyContent:'space-between', alignItems:'center' }},
            React.createElement('span',{ style:{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:20 }},'GRAND TOTAL'),
            React.createElement('span',{ style:{ fontFamily:'var(--font-mono)', fontWeight:800, fontSize:26, color:'var(--accent)' }},fmt(bill?.grandTotal))
          )
        ),
        React.createElement('div', { style:{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.28)', borderRadius:10, padding:'12px 16px', marginBottom:14, fontSize:13, color:'var(--warning)' }},
          String.fromCharCode(9888)+' Once confirmed, invoice is saved and PDF generated.'),
        error && React.createElement('div', { style:{ background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.28)', borderRadius:10, padding:'11px 15px', color:'var(--danger)', fontSize:13, marginBottom:14 }}, error),
        React.createElement('div', { style:{ display:'flex', gap:12 }},
          React.createElement('button', { onClick:()=>setStep('preview'), className:'btn-ghost', style:{ flex:1, padding:13, fontSize:14 }}, '\u2190 Back'),
          React.createElement('button', { onClick:generateInvoice, disabled:loading, style:{
            flex:2, padding:13, borderRadius:10, border:'none', cursor: loading ? 'default':'pointer',
            background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#10b981,#059669)',
            color:'#fff', fontWeight:700, fontSize:15,
            boxShadow: loading ? 'none' : '0 0 20px rgba(16,185,129,0.35)',
          }}, loading ? 'Generating...' : '\u2713 Confirm & Generate Invoice')
        )
      )
    )
  );

  return (
    React.createElement('div', { className:'page-bg bg-billing', style:{ padding:32, display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }},
      React.createElement('div', { style:{ maxWidth:480, width:'100%', textAlign:'center' }, className:'anim-scale-in' },
        React.createElement('div', { style:{ fontSize:80, marginBottom:20, animation:'float 3s ease-in-out infinite', display:'inline-block' }}, String.fromCharCode(9989)),
        React.createElement('h2', { style:{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:800, marginBottom:8, background:'linear-gradient(135deg,#f1f5f9,#94a3b8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}, 'Invoice Generated!'),
        React.createElement('p', { style:{ color:'var(--text2)', marginBottom:28, fontSize:15 }}, 'Your invoice has been saved and PDF created.'),
        React.createElement('div', { className:'glass-bright', style:{ padding:22, textAlign:'left', marginBottom:20 }},
          [['Invoice Number', invoice?.invoiceNumber, 'var(--accent)', true],['Grand Total', fmt(invoice?.grandTotal), 'var(--success)', true],['Confirmed At', invoice?.confirmedAt ? new Date(invoice.confirmedAt).toLocaleString('en-IN') : '-', 'var(--text2)', false]].map(([label,val,clr,mono]) =>
            React.createElement('div', { key:label, style:{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(59,130,246,0.07)' }},
              React.createElement('span', { style:{ color:'var(--text3)', fontSize:13 }}, label),
              React.createElement('span', { style:{ fontFamily: mono ? 'var(--font-mono)' : 'inherit', color:clr, fontWeight:600, fontSize: label==='Grand Total'?18:13 }}, val)
            )
          )
        ),
        React.createElement('div', { style:{ display:'flex', gap:10 }},
          invoice?.pdfUrl && React.createElement('button', {
  onClick: () => window.open(invoice.pdfUrl, "_blank"),
  className:'btn-primary',
  style:{ flex:1, padding:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }
}, 'Download PDF'),
          React.createElement('button', { onClick:resetAll, className:'btn-ghost', style:{ flex:1, padding:12, fontSize:14 }}, '+ New Bill')
        )
      )
    )
  );
}

function TaxRow({ label, value }) {
  return React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text2)', padding:'4px 0' }},
    React.createElement('span',null,label),
    React.createElement('span',{ style:{ fontFamily:'var(--font-mono)' }},value)
  );
}

const qtyBtn = {
  width:28, height:28, borderRadius:7,
  background:'rgba(255,255,255,0.06)', color:'var(--text)',
  fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
  border:'1px solid rgba(255,255,255,0.10)', cursor:'pointer',
};
