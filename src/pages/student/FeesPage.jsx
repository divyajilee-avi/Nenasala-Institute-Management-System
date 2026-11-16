import React, { useEffect, useState, useCallback, useRef } from 'react';
import { feesAPI, authAPI } from '../../services/api';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';

/* ───────── helpers ───────── */
const fmt  = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;
const date = (d) => d ? new Date(d).toLocaleDateString('en-LK', { year:'numeric', month:'short', day:'numeric' }) : '—';

const STATUS = {
  paid:    { color:'#10b981', bg:'#d1fae5', icon:'check-circle-fill',       label:'Paid'    },
  pending: { color:'#f59e0b', bg:'#fef3c7', icon:'clock-fill',              label:'Pending' },
  overdue: { color:'#ef4444', bg:'#fee2e2', icon:'exclamation-circle-fill', label:'Overdue' },
};

const CARD_BRANDS = {
  '4': { name:'Visa',       color:'#1a56db' },
  '5': { name:'Mastercard', color:'#e3000b' },
  '3': { name:'Amex',       color:'#007bc1' },
  '6': { name:'UnionPay',   color:'#e21836' },
};

const fmtCard   = (v) => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
const fmtExpiry = (v) => {
  const d = v.replace(/\D/g,'').slice(0,4);
  return d.length >= 3 ? `${d.slice(0,2)}/${d.slice(2)}` : d;
};

/* ───────── Receipt PDF (A5, full details) ───────── */
function printReceipt(rec, student) {
  const doc = new jsPDF({ format:[148,210] });

  /* header */
  doc.setFillColor(26,60,110); doc.rect(0,0,148,36,'F');
  doc.setFillColor(37,99,235); doc.rect(0,29,148,7,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(15); doc.setFont('helvetica','bold');
  doc.text('Nenasala IT Center', 74, 14, {align:'center'});
  doc.setFontSize(8); doc.setFont('helvetica','normal');
  doc.text('OFFICIAL PAYMENT RECEIPT', 74, 23, {align:'center'});
  doc.setFontSize(7);
  doc.text('info@nenasala.lk  |  www.nenasala.lk', 74, 32, {align:'center'});

  /* receipt no */
  doc.setFillColor(239,246,255);
  doc.roundedRect(10,40,128,13,3,3,'F');
  doc.setTextColor(26,60,110);
  doc.setFontSize(9); doc.setFont('helvetica','bold');
  doc.text(`Receipt No: ${rec.receipt_no}`, 74, 49, {align:'center'});

  /* main info table */
  doc.setTextColor(0);
  autoTable(doc, {
    startY: 58,
    showHead: false,
    body: [
      ['Student Name',    rec.student_name ?? student?.name ?? '—'],
      ['Student ID',      rec.student_code ?? '—'],
      ['Course',          rec.course_name  ?? '—'],
      ['Course Total Fee',fmt(rec.course_fee ?? rec.fee_amount)],
      ['Description',     rec.description  ?? 'Course Fee'],
      ['Amount Paid',     fmt(rec.amount_paid)],
      ['Payment Method',  (rec.payment_method ?? 'Online').toUpperCase()],
      ['Payment Date',    date(rec.payment_date)],
      ['Balance Due',     fmt(Math.max(0, (rec.course_fee ?? rec.fee_amount) - rec.amount_paid))],
      ['Status',          'PAID ✓'],
    ],
    styles:       { fontSize:9, cellPadding:3.5 },
    columnStyles: { 0:{ fontStyle:'bold', cellWidth:44, fillColor:[248,250,252] } },
    alternateRowStyles: { fillColor:[255,255,255] },
    didParseCell(d) {
      if (d.column.index===1 && d.row.index===9) {
        d.cell.styles.textColor = [22,163,74];
        d.cell.styles.fontStyle = 'bold';
        d.cell.styles.fontSize  = 10;
      }
    },
  });

  /* payment history mini-table */
  if (rec.history && rec.history.length > 0) {
    const y = doc.lastAutoTable.finalY + 6;
    doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(26,60,110);
    doc.text('Payment History', 10, y+2);
    autoTable(doc, {
      startY: y+5,
      head: [['Receipt','Amount','Method','Date']],
      body: rec.history.map(h=>[h.receipt_no, fmt(h.amount_paid), h.payment_method, date(h.payment_date)]),
      headStyles:{ fillColor:[26,60,110], textColor:255, fontSize:7 },
      styles:{ fontSize:7, cellPadding:2.5 },
    });
  }

  /* stamp */
  const sy = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : 170;
  doc.setFillColor(220,252,231);
  doc.roundedRect(35, sy, 78, 12, 3, 3, 'F');
  doc.setDrawColor(22,163,74); doc.setLineWidth(0.4);
  doc.roundedRect(35, sy, 78, 12, 3, 3, 'S');
  doc.setTextColor(22,163,74); doc.setFontSize(8.5); doc.setFont('helvetica','bold');
  doc.text('✓  PAYMENT CONFIRMED', 74, sy+8, {align:'center'});

  /* footer */
  doc.setFontSize(6.5); doc.setFont('helvetica','normal'); doc.setTextColor(160);
  doc.text('Computer-generated receipt. No signature required.', 74, 202, {align:'center'});
  doc.text(`Printed: ${new Date().toLocaleString()}`, 74, 207, {align:'center'});

  doc.save(`Receipt_${rec.receipt_no}.pdf`);
}

/* ───────── Statement PDF ───────── */
function printStatement(fees, payments, summary, studentName) {
  const doc  = new jsPDF();
  const s    = summary?.stats ?? {};

  doc.setFillColor(26,60,110); doc.rect(0,0,210,34,'F');
  doc.setFillColor(37,99,235); doc.rect(0,27,210,7,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(16); doc.setFont('helvetica','bold');
  doc.text('Nenasala IT Center', 105, 14, {align:'center'});
  doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.text('STUDENT FEE STATEMENT', 105, 25, {align:'center'});
  doc.setFontSize(8);
  doc.text('info@nenasala.lk  |  www.nenasala.lk', 105, 32, {align:'center'});

  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text(`Student : ${studentName}`, 14, 46);
  doc.text(`Date    : ${new Date().toLocaleDateString('en-LK')}`, 14, 54);

  /* fees table */
  autoTable(doc, {
    startY: 60,
    head:[['Description','Amount','Due Date','Status']],
    body: fees.map(f=>[f.description||'Course Fee', fmt(f.amount), f.due_date, f.status.toUpperCase()]),
    headStyles:{ fillColor:[26,60,110], textColor:255, fontStyle:'bold' },
    alternateRowStyles:{ fillColor:[245,248,255] },
    didParseCell(d) {
      if (d.column.index===3 && d.section==='body') {
        d.cell.styles.textColor = d.cell.raw==='PAID'?[22,163,74]:d.cell.raw==='OVERDUE'?[220,38,38]:[217,119,6];
        d.cell.styles.fontStyle = 'bold';
      }
    },
  });

  /* payment history */
  if (payments.length > 0) {
    const y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(26,60,110);
    doc.text('Payment History', 14, y);
    autoTable(doc, {
      startY: y+5,
      head:[['Receipt No','Description','Amount','Method','Date']],
      body: payments.map(p=>[p.receipt_no, p.description, fmt(p.amount_paid), p.payment_method, p.payment_date]),
      headStyles:{ fillColor:[15,23,42], textColor:255 },
      alternateRowStyles:{ fillColor:[245,248,255] },
    });
  }

  /* summary box */
  const sy = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 200;
  autoTable(doc, {
    startY: sy,
    head:[['Summary','Amount']],
    body:[
      ['Course Total Fee', fmt(s.total_amount)],
      ['Total Paid',       fmt(s.paid_amount)],
      ['Pending',          fmt(s.pending_amount)],
      ['Overdue',          fmt(s.overdue_amount)],
    ],
    headStyles:{ fillColor:[15,23,42] },
    columnStyles:{ 0:{ fontStyle:'bold' } },
    margin:{ left:120 }, tableWidth:76,
  });

  doc.save(`Fee_Statement_${studentName?.replace(/\s+/g,'_')}.pdf`);
  toast.success('Statement downloaded!');
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export default function StudentFeesPage() {
  const { user }                  = useAuth();

  /* data */
  const [fees,     setFees]       = useState([]);
  const [payments, setPayments]   = useState([]);
  const [summary,  setSummary]    = useState(null);
  const [profile,  setProfile]    = useState(null);
  const [loading,  setLoading]    = useState(false);

  /* UI */
  const [tab,      setTab]        = useState('fees');
  const [filter,   setFilter]     = useState('');

  /* payment modal */
  const [payModal,    setPayModal]    = useState(false);
  const [selFee,      setSelFee]      = useState(null);
  const [payMethod,   setPayMethod]   = useState('card');
  const [card,        setCard]        = useState({ name:'', number:'', expiry:'', cvv:'' });
  const [showCVV,     setShowCVV]     = useState(false);
  const [step,        setStep]        = useState('form'); // form|processing|success
  const [receipt,     setReceipt]     = useState(null);
  const [saving,      setSaving]      = useState(false);
  const timer                         = useRef(null);

  /* ── load ────────────────────────────────────── */
  const loadFees = useCallback(() => {
    setLoading(true);
    feesAPI.list(filter ? { status: filter } : {})
      .then(r => setFees(r.data.data ?? []))
      .catch(() => toast.error('Failed to load fees'))
      .finally(() => setLoading(false));
  }, [filter]);

  const reload = useCallback(() => {
    loadFees();
    feesAPI.summary().then(r => setSummary(r.data.data)).catch(() => {});
    feesAPI.payments().then(r => setPayments(r.data.data ?? [])).catch(() => {});
  }, [loadFees]);

  useEffect(() => { reload(); }, [reload]);

  /* load student profile for course info */
  useEffect(() => {
    authAPI.me()
      .then(r => setProfile(r.data.data))
      .catch(() => {});
  }, []);

  /* ── open pay modal ──────────────────────────── */
  const openPay = (fee) => {
    setSelFee(fee);
    setPayMethod('card');
    setCard({ name:'', number:'', expiry:'', cvv:'' });
    setStep('form');
    setReceipt(null);
    setShowCVV(false);
    setPayModal(true);
  };

  const closeModal = () => {
    clearTimeout(timer.current);
    setPayModal(false);
    setSelFee(null);
    setStep('form');
    setReceipt(null);
  };

  /* ── submit payment ──────────────────────────── */
  const submitPay = (e) => {
    e.preventDefault();
    if (payMethod === 'card') {
      const c = card.number.replace(/\s/g,'');
      if (!card.name.trim())        { toast.error('Enter card holder name'); return; }
      if (c.length < 13)            { toast.error('Invalid card number'); return; }
      if (!card.expiry.includes('/')) { toast.error('Invalid expiry date (MM/YY)'); return; }
      if (card.cvv.length < 3)      { toast.error('Invalid CVV'); return; }
    }
    setStep('processing');
    setSaving(true);

    timer.current = setTimeout(() => {
      feesAPI.payOnline({
        fee_id:         selFee.id,
        amount:         selFee.amount,
        payment_method: 'online',
        card_name:      card.name,
        card_number:    card.number.replace(/\s/g,''),
        expiry:         card.expiry,
        cvv:            card.cvv,
      })
        .then(r => {
          const rec = r.data.data;
          /* attach extra data for receipt */
          rec.course_fee = profile?.profile?.course_fee ?? selFee.amount;
          rec.history    = payments.slice(0, 5).concat([{
            receipt_no:     rec.receipt_no,
            amount_paid:    rec.amount_paid,
            payment_method: 'Online',
            payment_date:   rec.payment_date,
          }]);
          setReceipt(rec);
          setStep('success');
          reload();
        })
        .catch(err => {
          setStep('form');
          toast.error(err.response?.data?.message ?? 'Payment failed');
        })
        .finally(() => setSaving(false));
    }, 2600);
  };

  /* ── computed ────────────────────────────────── */
  const s        = summary?.stats ?? {};
  const tot      = parseFloat(s.total_amount   ?? 0);
  const paidAmt  = parseFloat(s.paid_amount    ?? 0);
  const pendAmt  = parseFloat(s.pending_amount ?? 0);
  const ovdAmt   = parseFloat(s.overdue_amount ?? 0);
  const pct      = tot > 0 ? Math.round((paidAmt / tot) * 100) : 0;
  const brand    = CARD_BRANDS[card.number.replace(/\s/g,'')[0]] ?? null;
  const coursePr = profile?.profile;

  return (
    <>
      {/* ═══ HEADER ════════════════════════════ */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0"><i className="bi bi-cash-stack me-2"/>My Fees</h4>
          <small className="text-muted">{fees.length} records</small>
        </div>
        <button className="btn btn-outline-primary d-flex align-items-center gap-2"
                onClick={() => printStatement(fees, payments, summary, user?.name)}
                disabled={!fees.length}>
          <i className="bi bi-file-earmark-pdf"/>Download Statement
        </button>
      </div>

      {/* ═══ STUDENT COURSE CARD ═══════════════ */}
      {coursePr && (
        <div className="card border-0 shadow-sm mb-4 overflow-hidden">
          <div className="d-flex align-items-center gap-0">
            <div className="p-4 text-white d-flex flex-column justify-content-center"
                 style={{ background:'linear-gradient(135deg,#1a3c6e,#2563eb)', minWidth:200 }}>
              <div className="small opacity-75 mb-1">Enrolled Course</div>
              <div className="fw-bold fs-6">{coursePr.course_name ?? '—'}</div>
              <div className="small opacity-75 mt-1">
                <i className="bi bi-person-badge me-1"/>{user?.name}
              </div>
            </div>
            <div className="flex-grow-1 px-4 py-3">
              <div className="row g-3">
                <div className="col-6 col-md-3 text-center">
                  <div className="fw-bold text-primary fs-5">{fmt(tot)}</div>
                  <div className="text-muted small">Total Fees</div>
                </div>
                <div className="col-6 col-md-3 text-center">
                  <div className="fw-bold text-success fs-5">{fmt(paidAmt)}</div>
                  <div className="text-muted small">Paid</div>
                </div>
                <div className="col-6 col-md-3 text-center">
                  <div className="fw-bold text-warning fs-5">{fmt(pendAmt)}</div>
                  <div className="text-muted small">Pending</div>
                </div>
                <div className="col-6 col-md-3 text-center">
                  <div className="fw-bold text-danger fs-5">{fmt(ovdAmt)}</div>
                  <div className="text-muted small">Overdue</div>
                </div>
              </div>
              {tot > 0 && (
                <div className="mt-2">
                  <div className="d-flex justify-content-between mb-1 small text-muted">
                    <span>Payment Progress</span><span>{pct}% paid</span>
                  </div>
                  <div className="progress" style={{ height:8, borderRadius:4 }}>
                    <div className={`progress-bar ${pct>=100?'bg-success':pct>=50?'bg-primary':'bg-warning'}`}
                         style={{ width:`${pct}%`, transition:'width .6s' }}/>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TABS ══════════════════════════════ */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
          <ul className="nav nav-tabs card-header-tabs border-0 gap-1">
            {[['fees','list-ul','Fee Records'],['payments','clock-history','Payment History']].map(([t,ic,lb])=>(
              <li key={t} className="nav-item">
                <button className={`nav-link ${tab===t?'active fw-semibold':''}`} onClick={()=>setTab(t)}>
                  <i className={`bi bi-${ic} me-1`}/>{lb}
                  {t==='payments' && payments.length>0 && (
                    <span className="badge bg-success-subtle text-success ms-1" style={{fontSize:'.65rem'}}>
                      {payments.length}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {tab==='fees' && (
            <div className="d-flex gap-1">
              {[['','All'],['pending','Pending'],['paid','Paid'],['overdue','Overdue']].map(([v,l])=>(
                <button key={v} className={`btn btn-sm ${filter===v?'btn-primary':'btn-outline-secondary'}`}
                        onClick={()=>setFilter(v)}>{l}</button>
              ))}
            </div>
          )}
        </div>

        {/* ── Fee records ──────────────────────── */}
        {tab==='fees' && (
          loading
            ? <div className="text-center py-5"><div className="spinner-border text-primary"/></div>
            : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr><th>Description</th><th>Amount</th><th>Due Date</th><th>Status</th><th className="text-center">Action</th></tr>
                  </thead>
                  <tbody>
                    {fees.map(f => {
                      const sc       = STATUS[f.status] ?? STATUS.pending;
                      const isOverdue = f.status==='pending' && new Date(f.due_date)<new Date();
                      return (
                        <tr key={f.id} style={isOverdue?{background:'#fff7ed'}:{}}>
                          <td>
                            <div className="fw-semibold">{f.description||'Course Fee'}</div>
                            {isOverdue && (
                              <span className="badge bg-danger-subtle text-danger mt-1" style={{fontSize:'.65rem'}}>
                                Past Due — Please pay immediately
                              </span>
                            )}
                          </td>
                          <td className="fw-bold">{fmt(f.amount)}</td>
                          <td className="text-muted small">{date(f.due_date)}</td>
                          <td>
                            <span className="d-inline-flex align-items-center gap-1 badge"
                                  style={{background:sc.bg,color:sc.color,padding:'6px 10px',fontSize:'.78rem'}}>
                              <i className={`bi bi-${sc.icon}`}/>{sc.label}
                            </span>
                          </td>
                          <td className="text-center">
                            {f.status !== 'paid'
                              ? <button className="btn btn-sm btn-primary d-flex align-items-center gap-1 mx-auto"
                                        onClick={() => openPay(f)}>
                                  <i className="bi bi-credit-card"/>Pay Now
                                </button>
                              : <span className="text-success small fw-semibold">
                                  <i className="bi bi-check-circle-fill me-1"/>Paid
                                </span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                    {!fees.length && (
                      <tr><td colSpan={5} className="text-center text-muted py-5">
                        <i className="bi bi-receipt fs-1 d-block mb-2 opacity-25"/>No fee records
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
        )}

        {/* ── Payment history ───────────────────── */}
        {tab==='payments' && (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr><th>Receipt No</th><th>Description</th><th>Amount</th><th>Method</th><th>Date</th><th className="text-center">Download</th></tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td><span className="badge bg-success-subtle text-success fw-semibold">{p.receipt_no}</span></td>
                    <td className="text-muted small">{p.description}</td>
                    <td className="fw-bold text-success">{fmt(p.amount_paid)}</td>
                    <td>
                      <span className="badge bg-info-subtle text-info">
                        <i className={`bi bi-${p.payment_method==='cash'?'cash-coin':p.payment_method==='bank'?'bank2':'credit-card-2-front'} me-1`}/>
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="text-muted small">{date(p.payment_date)}</td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        title="Download Receipt"
                        onClick={() => printReceipt({
                          receipt_no:     p.receipt_no,
                          student_name:   user?.name,
                          student_code:   p.student_code ?? coursePr?.student_id,
                          course_name:    p.course_name  ?? coursePr?.course_name,
                          course_fee:     tot,
                          description:    p.description,
                          fee_amount:     p.fee_amount   ?? p.amount_paid,
                          amount_paid:    p.amount_paid,
                          payment_method: p.payment_method,
                          payment_date:   p.payment_date,
                          history:        payments.map(h=>({
                            receipt_no:     h.receipt_no,
                            amount_paid:    h.amount_paid,
                            payment_method: h.payment_method,
                            payment_date:   h.payment_date,
                          })),
                        }, user)}
                      >
                        <i className="bi bi-download"/>
                      </button>
                    </td>
                  </tr>
                ))}
                {!payments.length && (
                  <tr><td colSpan={6} className="text-center text-muted py-5">
                    <i className="bi bi-clock-history fs-1 d-block mb-2 opacity-25"/>No payments yet
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          ONLINE PAYMENT MODAL
      ═══════════════════════════════════════════ */}
      {payModal && selFee && (
        <div className="modal d-block" tabIndex="-1"
             style={{ background:'rgba(0,0,0,.65)', zIndex:1050 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth:500 }}>
            <div className="modal-content border-0 shadow-lg overflow-hidden">

              {/* ── Processing ─────────────────── */}
              {step === 'processing' && (
                <div className="text-center p-5">
                  <div className="position-relative d-inline-block mb-4">
                    <div className="spinner-border text-primary" style={{ width:64, height:64, borderWidth:4 }}/>
                    <i className="bi bi-lock-fill position-absolute top-50 start-50 translate-middle text-primary fs-5"/>
                  </div>
                  <h5 className="fw-bold mb-2">Processing Payment…</h5>
                  <p className="text-muted small mb-3">Please wait. Do not close this window.</p>
                  <div className="progress" style={{ height:5 }}>
                    <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"/>
                  </div>
                  <div className="text-muted mt-3" style={{ fontSize:'.75rem' }}>
                    <i className="bi bi-shield-lock me-1"/>256-bit SSL Encrypted
                  </div>
                </div>
              )}

              {/* ── Success ────────────────────── */}
              {step === 'success' && receipt && (
                <>
                  <div className="text-center py-4 px-3"
                       style={{ background:'linear-gradient(135deg,#059669,#10b981)' }}>
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white mb-3"
                         style={{ width:72, height:72 }}>
                      <i className="bi bi-check-circle-fill text-success" style={{ fontSize:'2.2rem' }}/>
                    </div>
                    <h5 className="text-white fw-bold mb-1">Payment Successful!</h5>
                    <div className="text-white opacity-75 small">{receipt.receipt_no}</div>
                  </div>

                  <div className="p-4">
                    {/* Summary grid */}
                    <div className="rounded-3 p-3 mb-3"
                         style={{ background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
                      <div className="row g-2">
                        {[
                          ['Student',      receipt.student_name ?? user?.name],
                          ['Course',       receipt.course_name  ?? coursePr?.course_name ?? '—'],
                          ['Course Fee',   fmt(receipt.course_fee ?? tot)],
                          ['Amount Paid',  <span className="fw-bold text-success fs-6">{fmt(receipt.amount_paid)}</span>],
                          ['Receipt No',   <span className="badge bg-success-subtle text-success fw-semibold">{receipt.receipt_no}</span>],
                          ['Method',       'Online Payment'],
                          ['Date',         date(receipt.payment_date)],
                          ['Balance Due',  fmt(Math.max(0, tot - paidAmt))],
                        ].map(([l,v], i) => (
                          <div key={i} className="col-6">
                            <div className="text-muted" style={{ fontSize:'.7rem' }}>{l}</div>
                            <div className="fw-semibold small">{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment history mini */}
                    {payments.length > 0 && (
                      <div className="mb-3">
                        <div className="fw-semibold small text-muted mb-1">
                          <i className="bi bi-clock-history me-1"/>Previous Payments
                        </div>
                        <div className="rounded-2 overflow-hidden border">
                          {payments.slice(0,3).map((p,i) => (
                            <div key={i}
                                 className="d-flex justify-content-between align-items-center px-3 py-2"
                                 style={{ background: i%2===0 ? '#f8fafc':'#fff', fontSize:'.78rem' }}>
                              <span className="text-muted">{date(p.payment_date)}</span>
                              <span className="badge bg-info-subtle text-info">{p.payment_method}</span>
                              <span className="fw-semibold text-success">{fmt(p.amount_paid)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-secondary flex-fill" onClick={closeModal}>
                        <i className="bi bi-x-circle me-1"/>Close
                      </button>
                      <button className="btn btn-primary flex-fill fw-semibold"
                              onClick={() => printReceipt({
                                ...receipt,
                                student_code: coursePr?.student_id,
                                course_fee:   tot,
                                history: payments.map(p => ({
                                  receipt_no:     p.receipt_no,
                                  amount_paid:    p.amount_paid,
                                  payment_method: p.payment_method,
                                  payment_date:   p.payment_date,
                                })),
                              }, user)}>
                        <i className="bi bi-download me-2"/>Download Receipt
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── Payment Form ───────────────── */}
              {step === 'form' && (
                <>
                  {/* Modal header */}
                  <div className="modal-header border-0 text-white"
                       style={{ background:'linear-gradient(135deg,#1a3c6e,#2563eb)' }}>
                    <div>
                      <h5 className="modal-title fw-bold mb-0">
                        <i className="bi bi-credit-card me-2"/>Online Payment
                      </h5>
                      <small className="opacity-75">
                        {selFee.description || 'Course Fee'} — {fmt(selFee.amount)}
                      </small>
                    </div>
                    <button className="btn-close btn-close-white ms-3" onClick={closeModal}/>
                  </div>

                  <form onSubmit={submitPay} noValidate>
                    <div className="modal-body px-4 py-3">

                      {/* Amount banner */}
                      <div className="d-flex justify-content-between align-items-center p-3 rounded-3 mb-3"
                           style={{ background:'linear-gradient(135deg,#1a3c6e,#2563eb)' }}>
                        <div>
                          <div className="text-white opacity-75 small">Amount to Pay</div>
                          <div className="text-white fw-bold fs-4">{fmt(selFee.amount)}</div>
                        </div>
                        <div className="text-end">
                          <div className="text-white opacity-75 small">Course</div>
                          <div className="text-white small fw-semibold">
                            {selFee.course_name ?? coursePr?.course_name ?? '—'}
                          </div>
                        </div>
                      </div>

                      {/* Payment method selector */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold small">Payment Method</label>
                        <div className="d-flex gap-2 flex-wrap">
                          {[
                            { val:'card',   icon:'credit-card-2-front', label:'Debit/Credit Card' },
                            { val:'bank',   icon:'bank2',               label:'Bank Transfer'     },
                            { val:'online', icon:'globe',               label:'Online Pay'        },
                            { val:'wallet', icon:'phone',               label:'eWallet'           },
                          ].map(m => (
                            <button key={m.val} type="button"
                                    className={`btn flex-fill py-2 ${payMethod===m.val ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => setPayMethod(m.val)}>
                              <i className={`bi bi-${m.icon} d-block mb-1`} style={{ fontSize:'1.3rem' }}/>
                              <div style={{ fontSize:'.72rem' }}>{m.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ── Card form ──────────────── */}
                      {payMethod === 'card' && (
                        <div className="row g-3">
                          {/* Card visual */}
                          <div className="col-12">
                            <div className="rounded-3 p-3 position-relative overflow-hidden"
                                 style={{ background:'linear-gradient(135deg,#1e3a5f,#2563eb)',
                                          minHeight:100, color:'#fff' }}>
                              <div style={{ position:'absolute', top:-20, right:-20, width:130,
                                            height:130, borderRadius:'50%',
                                            background:'rgba(255,255,255,.05)' }}/>
                              <div style={{ position:'absolute', bottom:-30, right:10, width:90,
                                            height:90, borderRadius:'50%',
                                            background:'rgba(255,255,255,.04)' }}/>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <span style={{ fontSize:'.7rem', opacity:.7 }}>Nenasala IT Center</span>
                                {brand && (
                                  <span className="badge"
                                        style={{ background:'rgba(255,255,255,.15)',
                                                 color:'#fff', fontSize:'.75rem' }}>
                                    {brand.name}
                                  </span>
                                )}
                              </div>
                              <div className="fw-bold mb-1"
                                   style={{ letterSpacing:'.18em', fontSize:'.95rem' }}>
                                {card.number || '•••• •••• •••• ••••'}
                              </div>
                              <div className="d-flex justify-content-between"
                                   style={{ fontSize:'.75rem', opacity:.8 }}>
                                <span>{card.name || 'CARD HOLDER'}</span>
                                <span>{card.expiry || 'MM/YY'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="col-12">
                            <label className="form-label fw-semibold small">
                              Card Holder Name <span className="text-danger">*</span>
                            </label>
                            <input className="form-control" placeholder="As printed on card"
                                   value={card.name}
                                   onChange={e => setCard({ ...card, name: e.target.value.toUpperCase() })}
                                   required/>
                          </div>

                          <div className="col-12">
                            <label className="form-label fw-semibold small">
                              Card Number <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <input className="form-control" placeholder="1234 5678 9012 3456"
                                     value={card.number}
                                     onChange={e => setCard({ ...card, number: fmtCard(e.target.value) })}
                                     maxLength={19} required/>
                              <span className="input-group-text bg-white">
                                <i className="bi bi-credit-card text-muted"/>
                              </span>
                            </div>
                          </div>

                          <div className="col-6">
                            <label className="form-label fw-semibold small">
                              Expiry <span className="text-danger">*</span>
                            </label>
                            <input className="form-control" placeholder="MM/YY"
                                   value={card.expiry}
                                   onChange={e => setCard({ ...card, expiry: fmtExpiry(e.target.value) })}
                                   maxLength={5} required/>
                          </div>

                          <div className="col-6">
                            <label className="form-label fw-semibold small">
                              CVV <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <input className="form-control"
                                     type={showCVV ? 'text' : 'password'}
                                     placeholder="•••"
                                     value={card.cvv}
                                     onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g,'').slice(0,4) })}
                                     maxLength={4} required/>
                              <button type="button" className="input-group-text bg-white"
                                      onClick={() => setShowCVV(s => !s)}>
                                <i className={`bi bi-eye${showCVV ? '-slash' : ''} text-muted`}/>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Bank transfer ───────────── */}
                      {payMethod === 'bank' && (
                        <div className="rounded-3 p-3"
                             style={{ background:'#eff6ff', border:'1px solid #bfdbfe' }}>
                          <h6 className="fw-bold text-primary mb-3">
                            <i className="bi bi-bank2 me-2"/>Bank Transfer Details
                          </h6>
                          {[
                            ['Bank',         'Bank of Ceylon (BOC)'],
                            ['Account Name', 'Nenasala IT Center'],
                            ['Account No',   '12345678901'],
                            ['Branch',       'Colombo Main'],
                            ['Reference',    `FEE-${selFee.id}-${user?.name?.split(' ')[0]}`],
                          ].map(([l,v]) => (
                            <div key={l} className="d-flex justify-content-between py-2 border-bottom">
                              <span className="text-muted small">{l}</span>
                              <span className="fw-semibold small">{v}</span>
                            </div>
                          ))}
                          <p className="text-muted mt-2 mb-0" style={{ fontSize:'.75rem' }}>
                            <i className="bi bi-info-circle me-1"/>
                            After transferring, click Confirm. Our team will verify within 24 hours.
                          </p>
                        </div>
                      )}

                      {/* ── Online Pay ──────────────── */}
                      {payMethod === 'online' && (
                        <div>
                          {/* Header */}
                          <div className="rounded-3 p-3 mb-3 text-center"
                               style={{ background:'linear-gradient(135deg,#1a3c6e,#2563eb)' }}>
                            <i className="bi bi-globe text-white d-block mb-1" style={{ fontSize:'2rem' }}/>
                            <div className="text-white fw-bold">Online Payment Gateway</div>
                            <div className="text-white opacity-75 small">Secure · Fast · Easy</div>
                          </div>

                          {/* Supported gateways */}
                          <div className="mb-3">
                            <label className="form-label fw-semibold small">Select Payment Gateway</label>
                            <div className="row g-2">
                              {[
                                { id:'payhere', name:'PayHere',      desc:'Sri Lanka\'s #1 payment gateway', color:'#ff6b35', bg:'#fff5f0', icon:'credit-card-fill' },
                                { id:'genie',   name:'Genie',        desc:'Dialog Axiata payment service',   color:'#e40046', bg:'#fff0f3', icon:'phone-fill'       },
                                { id:'frimi',   name:'FriMi',        desc:'Nations Trust Bank eWallet',      color:'#6c2fc7', bg:'#f5f0ff', icon:'wallet-fill'      },
                                { id:'stripe',  name:'International',desc:'Visa · Mastercard · Amex',        color:'#635bff', bg:'#f5f5ff', icon:'globe2'           },
                              ].map(gw => (
                                <div key={gw.id} className="col-6">
                                  <div
                                    className="rounded-3 p-3 d-flex align-items-center gap-2"
                                    style={{
                                      border: `2px solid ${gw.color}33`,
                                      background: gw.bg,
                                      cursor: 'pointer',
                                      transition: 'all .2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = gw.color; e.currentTarget.style.boxShadow=`0 4px 12px ${gw.color}33`; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = `${gw.color}33`; e.currentTarget.style.boxShadow=''; }}
                                  >
                                    <div className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                                         style={{ width:38, height:38, background:gw.color }}>
                                      <i className={`bi bi-${gw.icon} text-white`}/>
                                    </div>
                                    <div>
                                      <div className="fw-bold small" style={{ color:gw.color }}>{gw.name}</div>
                                      <div className="text-muted" style={{ fontSize:'.68rem' }}>{gw.desc}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Steps */}
                          <div className="rounded-3 p-3"
                               style={{ background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                            <div className="fw-semibold small mb-2">
                              <i className="bi bi-info-circle me-1 text-primary"/>How it works
                            </div>
                            {[
                              ['1', 'Click "Pay Now" to proceed to the gateway'],
                              ['2', 'Log in or enter your payment details'],
                              ['3', 'Confirm the payment of ' + fmt(selFee.amount)],
                              ['4', 'Receipt will be sent to your registered email'],
                            ].map(([n,t]) => (
                              <div key={n} className="d-flex align-items-start gap-2 mb-1">
                                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                     style={{ width:20, height:20, fontSize:'.65rem' }}>{n}</div>
                                <span style={{ fontSize:'.78rem', color:'#475569' }}>{t}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── eWallet ─────────────────── */}
                      {payMethod === 'wallet' && (
                        <div className="rounded-3 p-3 text-center"
                             style={{ background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
                          <h6 className="fw-bold text-success mb-3">Scan QR Code to Pay</h6>
                          <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                               style={{ width:130, height:130, background:'#fff',
                                        border:'2px solid #10b981' }}>
                            <i className="bi bi-qr-code" style={{ fontSize:'4.5rem', color:'#1a3c6e' }}/>
                          </div>
                          <p className="text-muted small mb-1">Scan with any eWallet or banking app</p>
                          <p className="fw-bold text-success fs-5 mb-1">{fmt(selFee.amount)}</p>
                          <p className="text-muted" style={{ fontSize:'.72rem' }}>
                            Reference: FEE-{selFee.id}
                          </p>
                        </div>
                      )}

                      {/* Security note */}
                      <div className="d-flex align-items-center gap-2 mt-3 p-2 rounded-2"
                           style={{ background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                        <i className="bi bi-shield-lock-fill text-success"/>
                        <small className="text-muted">
                          256-bit SSL encrypted · Your payment is 100% secure
                        </small>
                      </div>

                    </div>

                    {/* Footer */}
                    <div className="d-flex justify-content-between align-items-center px-4 py-3"
                         style={{ borderTop:'2px solid #e5e7eb', background:'#f8fafc' }}>
                      <button type="button" className="btn btn-outline-secondary"
                              onClick={closeModal}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary fw-semibold px-5"
                              disabled={saving}>
                        {saving
                          ? <><span className="spinner-border spinner-border-sm me-2"/>Processing…</>
                          : <><i className="bi bi-lock-fill me-2"/>Pay {fmt(selFee.amount)}</>
                        }
                      </button>
                    </div>

                  </form>
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
