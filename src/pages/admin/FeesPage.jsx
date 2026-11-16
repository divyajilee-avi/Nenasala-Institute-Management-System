import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { feesAPI, studentsAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const FEE_TYPES = [
  'Course Fee', 'Registration Fee', 'Exam Fee',
  'Lab Fee', 'Certificate Fee', 'Other',
];

const METHOD_ICONS = {
  cash:   { icon: 'cash-coin',     color: '#10b981', label: 'Cash'          },
  bank:   { icon: 'bank2',         color: '#3b82f6', label: 'Bank Transfer' },
  online: { icon: 'credit-card-2-front', color: '#8b5cf6', label: 'Online' },
};

const STATUS_CONFIG = {
  paid:    { color: '#10b981', bg: '#d1fae5', icon: 'check-circle-fill'  },
  pending: { color: '#f59e0b', bg: '#fef3c7', icon: 'clock-fill'         },
  overdue: { color: '#ef4444', bg: '#fee2e2', icon: 'exclamation-circle-fill' },
};

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

/* ─────────────────────────────────────────────────
   StudentSearch — type-to-search, click-to-select
───────────────────────────────────────────────── */
function StudentSearch({ students, value, onChange }) {
  const [query,    setQuery]    = React.useState('');
  const [open,     setOpen]     = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const wrapRef                 = React.useRef(null);

  // Sync selected label when value changes externally
  React.useEffect(() => {
    if (!value) { setSelected(null); setQuery(''); return; }
    const s = students.find(s => String(s.id) === String(value));
    if (s) setSelected(s);
  }, [value, students]);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? students.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.student_id?.toLowerCase().includes(query.toLowerCase()) ||
        s.course_name?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : students.slice(0, 8);

  const handleSelect = (s) => {
    setSelected(s);
    setQuery('');
    setOpen(false);
    onChange(s.id);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
    onChange('');
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Selected student card */}
      {selected ? (
        <div className="d-flex align-items-center gap-3 p-2 rounded-3 border"
             style={{ background: '#f0f9ff', borderColor: '#2563eb' }}>
          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
               style={{ width: 38, height: 38, fontSize: '.85rem' }}>
            {selected.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-grow-1">
            <div className="fw-semibold">{selected.name}</div>
            <div className="text-muted small">
              <span className="badge bg-primary me-1">{selected.student_id}</span>
              {selected.course_name}
            </div>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary rounded-circle p-1"
                  style={{ width: 28, height: 28, lineHeight: 1 }}
                  onClick={handleClear} title="Change student">
            <i className="bi bi-x" style={{ fontSize: '.8rem' }}/>
          </button>
        </div>
      ) : (
        /* Search input */
        <>
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="bi bi-search text-muted"/>
            </span>
            <input
              className="form-control"
              placeholder="Type student name or ID to search…"
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              autoComplete="off"
            />
            {query && (
              <button type="button" className="btn btn-outline-secondary"
                      onClick={() => { setQuery(''); setOpen(false); }}>
                <i className="bi bi-x"/>
              </button>
            )}
          </div>

          {/* Dropdown results */}
          {open && (
            <div className="border rounded-3 shadow-sm overflow-hidden"
                 style={{ position: 'absolute', top: '100%', left: 0, right: 0,
                          zIndex: 9999, background: '#fff', maxHeight: 240,
                          overflowY: 'auto', marginTop: 4 }}>
              {filtered.length > 0 ? (
                filtered.map(s => (
                  <div key={s.id}
                       className="d-flex align-items-center gap-3 px-3 py-2 cursor-pointer"
                       style={{ cursor: 'pointer', transition: 'background .15s' }}
                       onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                       onMouseLeave={e => e.currentTarget.style.background = ''}
                       onMouseDown={() => handleSelect(s)}>
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                         style={{ width: 34, height: 34, fontSize: '.78rem' }}>
                      {s.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="fw-semibold small">{s.name}</div>
                      <div className="text-muted" style={{ fontSize: '.72rem' }}>
                        <span className="badge bg-primary-subtle text-primary me-1">{s.student_id}</span>
                        {s.course_name}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted py-3 small">
                  <i className="bi bi-person-x d-block mb-1 fs-5 opacity-50"/>
                  No students found for "{query}"
                </div>
              )}
              {!query && students.length > 8 && (
                <div className="text-center text-muted py-2 border-top"
                     style={{ fontSize: '.72rem' }}>
                  Type to search from {students.length} students
                </div>
              )}
            </div>
          )}
        </>
      )}
      {/* Hidden required input for form validation */}
      <input type="hidden" value={selected ? selected.id : ''} required/>
    </div>
  );
}

export default function FeesPage() {
  const [fees,      setFees]      = useState([]);
  const [students,  setStudents]  = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [payments,  setPayments]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [tab,       setTab]       = useState('fees');   // fees | payments
  const [filter,    setFilter]    = useState('');
  const [search,    setSearch]    = useState('');
  const [modal,     setModal]     = useState('');       // fee | pay | receipt
  const [form,      setForm]      = useState({});
  const [payForm,   setPayForm]   = useState({});
  const [receipt,   setReceipt]   = useState(null);
  const [saving,    setSaving]    = useState(false);

  /* ── Load ────────────────────────────────────── */
  const loadFees = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filter) params.status = filter;
    if (search) params.search = search;
    feesAPI.list(params)
      .then(r => setFees(r.data.data ?? []))
      .catch(() => toast.error('Failed to load fees'))
      .finally(() => setLoading(false));
  }, [filter, search]);

  const loadSummary = useCallback(() => {
    feesAPI.summary().then(r => setSummary(r.data.data)).catch(() => {});
  }, []);

  const loadPayments = useCallback(() => {
    feesAPI.payments().then(r => setPayments(r.data.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => { loadFees(); loadSummary(); loadPayments(); }, [loadFees, loadSummary, loadPayments]);

  useEffect(() => {
    studentsAPI.list({ per_page: 300 })
      .then(r => setStudents(r.data.data ?? []))
      .catch(() => {});
  }, []);

  /* ── Create fee ──────────────────────────────── */
  const saveFee = (e) => {
    e.preventDefault();
    if (!form.student_id) { toast.error('Please select a student'); return; }
    setSaving(true);
    feesAPI.create(form)
      .then(() => { toast.success('Fee created'); setModal(''); loadFees(); loadSummary(); })
      .catch(err => toast.error(err.response?.data?.message ?? 'Error'))
      .finally(() => setSaving(false));
  };

  /* ── Record payment ──────────────────────────── */
  const savePayment = (e) => {
    e.preventDefault();
    setSaving(true);
    feesAPI.pay(payForm)
      .then(r => {
        toast.success(`Payment recorded! Receipt: ${r.data.data.receipt_no}`);
        setReceipt(r.data.data.receipt);
        setModal('receipt');
        loadFees(); loadSummary(); loadPayments();
      })
      .catch(err => toast.error(err.response?.data?.message ?? 'Error'))
      .finally(() => setSaving(false));
  };

  /* ── Mark overdue ────────────────────────────── */
  const markOverdue = (id) => {
    feesAPI.update(id, { status: 'overdue' })
      .then(() => { toast.warning('Marked as overdue'); loadFees(); loadSummary(); })
      .catch(() => toast.error('Failed'));
  };

  /* ── Delete fee ──────────────────────────────── */
  const deleteFee = (id) => {
    if (!window.confirm('Delete this fee record?')) return;
    feesAPI.delete(id)
      .then(() => { toast.success('Deleted'); loadFees(); loadSummary(); })
      .catch(err => toast.error(err.response?.data?.message ?? 'Cannot delete paid fee'));
  };

  /* ── Print receipt PDF ───────────────────────── */
  const printReceipt = (rec) => {
    const doc = new jsPDF({ format: [148, 210] }); // A5
    doc.setFillColor(26, 60, 110);
    doc.rect(0, 0, 148, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('Nenasala IT Center', 74, 11, { align: 'center' });
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text('PAYMENT RECEIPT', 74, 20, { align: 'center' });

    doc.setTextColor(0);
    doc.setFontSize(9);
    const rows = [
      ['Receipt No',     rec.receipt_no],
      ['Date',           rec.payment_date],
      ['Student',        rec.student_name],
      ['Student ID',     rec.student_code],
      ['Course',         rec.course_name],
      ['Description',    rec.description],
      ['Amount Paid',    fmt(rec.amount_paid)],
      ['Payment Method', rec.payment_method?.toUpperCase()],
      ['Collected By',   rec.collected_by_name ?? 'Admin'],
    ];
    autoTable(doc, {
      startY: 32, head: [['Field', 'Details']],
      body: rows,
      headStyles: { fillColor: [26, 60, 110], textColor: 255, fontSize: 8 },
      styles: { fontSize: 8 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    });
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(8); doc.setTextColor(100);
    doc.text('Thank you for your payment!', 74, finalY, { align: 'center' });
    doc.text('Nenasala IT Center — www.nenasala.lk', 74, finalY + 5, { align: 'center' });
    doc.save(`Receipt_${rec.receipt_no}.pdf`);
  };

  const s = summary?.stats ?? {};

  return (
    <>
      {/* ── Header ───────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0"><i className="bi bi-cash-stack me-2"/>Fees Management</h4>
          <small className="text-muted">{fees.length} records</small>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2"
                onClick={() => { setForm({ fee_type: 'Course Fee', student_id: '' }); setModal('fee'); }}>
          <i className="bi bi-plus-lg"/>Add Fee
        </button>
      </div>

      {/* ── Summary cards ────────────────────── */}
      <div className="row g-3 mb-4">
        {[
          { label:'Total Fees',  value: fmt(s.total_amount),   count: s.total_records,  color:'primary', icon:'receipt'              },
          { label:'Collected',   value: fmt(s.paid_amount),    count: s.paid_count,     color:'success', icon:'check-circle-fill'     },
          { label:'Pending',     value: fmt(s.pending_amount), count: s.pending_count,  color:'warning', icon:'clock-fill'            },
          { label:'Overdue',     value: fmt(s.overdue_amount), count: s.overdue_count,  color:'danger',  icon:'exclamation-circle-fill'},
        ].map((c, i) => (
          <div key={i} className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100"
                 style={{ borderLeft: `4px solid var(--bs-${c.color})` }}>
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className={`fw-bold fs-5 text-${c.color}`}>{c.value}</div>
                    <div className="text-muted small">{c.label}</div>
                    <div className={`badge bg-${c.color}-subtle text-${c.color} mt-1`}>
                      {c.count ?? 0} records
                    </div>
                  </div>
                  <div className={`d-flex align-items-center justify-content-center rounded-2 bg-${c.color}-subtle`}
                       style={{ width:40, height:40 }}>
                    <i className={`bi bi-${c.icon} text-${c.color}`}/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────── */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <ul className="nav nav-tabs card-header-tabs border-0 gap-1">
              {[['fees','list-ul','Fee Records'],['payments','clock-history','Payment History']].map(([t,ic,lb])=>(
                <li key={t} className="nav-item">
                  <button className={`nav-link ${tab===t?'active fw-semibold':''}`}
                          onClick={() => setTab(t)}>
                    <i className={`bi bi-${ic} me-1`}/>{lb}
                  </button>
                </li>
              ))}
            </ul>
            {tab === 'fees' && (
              <div className="d-flex gap-2 flex-wrap">
                <div className="input-group input-group-sm" style={{width:220}}>
                  <span className="input-group-text bg-white"><i className="bi bi-search text-muted"/></span>
                  <input className="form-control" placeholder="Search…"
                         value={search} onChange={e => setSearch(e.target.value)}/>
                  {search && <button className="btn btn-outline-secondary" onClick={()=>setSearch('')}><i className="bi bi-x"/></button>}
                </div>
                <div className="d-flex gap-1">
                  {[['','All'],['pending','Pending'],['paid','Paid'],['overdue','Overdue']].map(([v,l])=>(
                    <button key={v}
                            className={`btn btn-sm ${filter===v?'btn-primary':'btn-outline-secondary'}`}
                            onClick={()=>setFilter(v)}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fee Records Tab */}
        {tab === 'fees' && (
          loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"/></div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr><th>Student</th><th>Course</th><th>Description</th><th>Amount</th><th>Due Date</th><th>Status</th><th className="text-center">Actions</th></tr>
                </thead>
                <tbody>
                  {fees.map(f => {
                    const sc = STATUS_CONFIG[f.status] ?? STATUS_CONFIG.pending;
                    const isOverdue = f.status === 'pending' && new Date(f.due_date) < new Date();
                    return (
                      <tr key={f.id} style={isOverdue ? {background:'#fff7ed'} : {}}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                 style={{width:34,height:34,fontSize:'.8rem'}}>
                              {f.student_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-semibold">{f.student_name}</div>
                              <div className="text-muted" style={{fontSize:'.72rem'}}>{f.student_code}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge bg-info-subtle text-info fw-normal">{f.course_name}</span></td>
                        <td className="text-muted small">{f.description || '—'}</td>
                        <td className="fw-bold">{fmt(f.amount)}</td>
                        <td>
                          <div className="small">{f.due_date}</div>
                          {isOverdue && <span className="badge bg-danger-subtle text-danger" style={{fontSize:'.65rem'}}>Past Due</span>}
                        </td>
                        <td>
                          <span className="badge d-flex align-items-center gap-1 w-fit"
                                style={{background:sc.bg, color:sc.color, width:'fit-content'}}>
                            <i className={`bi bi-${sc.icon}`}/>
                            {f.status}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            {f.status !== 'paid' && (
                              <button className="btn btn-sm btn-success"
                                      onClick={() => { setPayForm({fee_id:f.id,student_id:f.student_id,amount_paid:f.amount,payment_date:new Date().toISOString().slice(0,10),payment_method:'cash'}); setModal('pay'); }}>
                                <i className="bi bi-check2-circle me-1"/>Pay
                              </button>
                            )}
                            {f.status === 'pending' && isOverdue && (
                              <button className="btn btn-sm btn-outline-warning" onClick={() => markOverdue(f.id)} title="Mark overdue">
                                <i className="bi bi-exclamation-triangle"/>
                              </button>
                            )}
                            {f.status !== 'paid' && (
                              <button className="btn btn-sm btn-outline-danger" onClick={() => deleteFee(f.id)} title="Delete">
                                <i className="bi bi-trash"/>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!fees.length && (
                    <tr><td colSpan={7} className="text-center text-muted py-5">
                      <i className="bi bi-receipt fs-1 d-block mb-2 opacity-25"/>No fee records found
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Payments History Tab */}
        {tab === 'payments' && (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr><th>Receipt No</th><th>Student</th><th>Description</th><th>Amount</th><th>Method</th><th>Date</th></tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const mi = METHOD_ICONS[p.payment_method] ?? METHOD_ICONS.cash;
                  return (
                    <tr key={p.id}>
                      <td><span className="badge bg-success-subtle text-success fw-semibold">{p.receipt_no}</span></td>
                      <td>
                        <div className="fw-semibold">{p.student_name}</div>
                        <div className="text-muted" style={{fontSize:'.72rem'}}>{p.student_code}</div>
                      </td>
                      <td className="text-muted small">{p.description}</td>
                      <td className="fw-bold text-success">{fmt(p.amount_paid)}</td>
                      <td>
                        <span className="d-flex align-items-center gap-1" style={{color:mi.color}}>
                          <i className={`bi bi-${mi.icon}`}/>{mi.label}
                        </span>
                      </td>
                      <td className="text-muted small">{p.payment_date}</td>
                    </tr>
                  );
                })}
                {!payments.length && <tr><td colSpan={6} className="text-center text-muted py-5">No payments yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══ Add Fee Modal ══════════════════════ */}
      {modal === 'fee' && (
        <div className="modal d-block" style={{background:'rgba(0,0,0,.55)',zIndex:1050}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0" style={{background:'linear-gradient(135deg,#1a3c6e,#2563eb)'}}>
                <h5 className="modal-title fw-bold text-white"><i className="bi bi-plus-circle me-2"/>Add Fee Record</h5>
                <button className="btn-close btn-close-white" onClick={()=>setModal('')}/>
              </div>
              <form onSubmit={saveFee}>
                <div className="modal-body row g-3">
                  {/* ── Student search field ─── */}
                  <div className="col-12">
                    <label className="form-label fw-semibold small">
                      Student Name <span className="text-danger">*</span>
                    </label>
                    <StudentSearch
                      students={students}
                      value={form.student_id}
                      onChange={(id) => setForm(f => ({ ...f, student_id: id }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Fee Type <span className="text-danger">*</span></label>
                    <select className="form-select" value={form.fee_type||'Course Fee'} onChange={e=>setForm({...form,fee_type:e.target.value})} required>
                      {FEE_TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Amount (Rs.) <span className="text-danger">*</span></label>
                    <input type="number" className="form-control" min="1" value={form.amount||''} onChange={e=>setForm({...form,amount:e.target.value})} required placeholder="e.g. 15000"/>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Due Date <span className="text-danger">*</span></label>
                    <input type="date" className="form-control" value={form.due_date||''} onChange={e=>setForm({...form,due_date:e.target.value})} required/>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Note (optional)</label>
                    <input className="form-control" value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Additional note…"/>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={()=>setModal('')}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                    {saving?<><span className="spinner-border spinner-border-sm me-2"/>Saving…</>:<><i className="bi bi-plus-lg me-1"/>Create Fee</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══ Pay Modal ══════════════════════════ */}
      {modal === 'pay' && (
        <div className="modal d-block" style={{background:'rgba(0,0,0,.55)',zIndex:1050}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0" style={{background:'linear-gradient(135deg,#059669,#10b981)'}}>
                <h5 className="modal-title fw-bold text-white"><i className="bi bi-check2-circle me-2"/>Record Payment</h5>
                <button className="btn-close btn-close-white" onClick={()=>setModal('')}/>
              </div>
              <form onSubmit={savePayment}>
                <div className="modal-body row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Amount Paid (Rs.) *</label>
                    <input type="number" className="form-control" min="1" value={payForm.amount_paid||''} onChange={e=>setPayForm({...payForm,amount_paid:e.target.value})} required/>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Payment Date *</label>
                    <input type="date" className="form-control" value={payForm.payment_date||''} onChange={e=>setPayForm({...payForm,payment_date:e.target.value})} required/>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold small">Payment Method</label>
                    <div className="d-flex gap-2">
                      {Object.entries(METHOD_ICONS).map(([val,mi])=>(
                        <button key={val} type="button"
                                className={`btn flex-fill ${payForm.payment_method===val?'btn-success':'btn-outline-secondary'}`}
                                onClick={()=>setPayForm({...payForm,payment_method:val})}>
                          <i className={`bi bi-${mi.icon} me-1`}/>{mi.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={()=>setModal('')}>Cancel</button>
                  <button type="submit" className="btn btn-success px-4" disabled={saving}>
                    {saving?<><span className="spinner-border spinner-border-sm me-2"/>Processing…</>:<><i className="bi bi-check2-circle me-1"/>Confirm Payment</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══ Receipt Modal ═══════════════════════ */}
      {modal === 'receipt' && receipt && (
        <div className="modal d-block" style={{background:'rgba(0,0,0,.55)',zIndex:1050}}>
          <div className="modal-dialog modal-dialog-centered" style={{maxWidth:440}}>
            <div className="modal-content border-0 shadow-lg overflow-hidden">
              <div className="text-center p-4" style={{background:'linear-gradient(135deg,#1a3c6e,#2563eb)'}}>
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white mb-3" style={{width:60,height:60}}>
                  <i className="bi bi-check-circle-fill text-success fs-3"/>
                </div>
                <h5 className="text-white fw-bold mb-0">Payment Successful!</h5>
                <div className="text-white opacity-75 small">{receipt.receipt_no}</div>
              </div>
              <div className="p-4">
                {[['Student',receipt.student_name],['Student ID',receipt.student_code],['Course',receipt.course_name],['Description',receipt.description],['Amount Paid',fmt(receipt.amount_paid)],['Method',receipt.payment_method?.toUpperCase()],['Date',receipt.payment_date]].map(([l,v])=>(
                  <div key={l} className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted small">{l}</span>
                    <span className="fw-semibold small">{v}</span>
                  </div>
                ))}
              </div>
              <div className="d-flex gap-2 p-3 bg-light">
                <button className="btn btn-outline-secondary flex-fill" onClick={()=>setModal('')}>Close</button>
                <button className="btn btn-primary flex-fill" onClick={()=>printReceipt(receipt)}>
                  <i className="bi bi-download me-1"/>Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
