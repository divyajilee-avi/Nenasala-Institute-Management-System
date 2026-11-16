import React, { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { QRCodeSVG } from 'qrcode.react';
import { attendanceAPI, classesAPI, studentsAPI } from '../../services/api';

export default function TeacherAttendancePage() {
  const [classes,    setClasses]    = useState([]);
  const [students,   setStudents]   = useState([]);
  const [att,        setAtt]        = useState({});
  const [classId,    setClassId]    = useState('');
  const [date,       setDate]       = useState(new Date().toISOString().slice(0, 10));
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);

  // QR state
  const [qrData,     setQrData]     = useState(null);   // {scan_url, expires_at, class_info, ...}
  const [qrModal,    setQrModal]    = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [timeLeft,   setTimeLeft]   = useState(0);
  const [validMins,  setValidMins]  = useState(15);
  const qrRef                       = useRef(null);
  const timerRef                    = useRef(null);

  /* ── Load classes ────────────────────────────── */
  useEffect(() => {
    classesAPI.list()
      .then(r => setClasses(r.data.data ?? []))
      .catch(() => {});
  }, []);

  /* ── Load enrolled students ──────────────────── */
  const loadStudents = useCallback((cid, currentDate) => {
    if (!cid) return;
    const cls = classes.find(c => String(c.id) === String(cid));
    if (!cls) return;
    setLoading(true);
    Promise.all([
      studentsAPI.list({ per_page: 300 }),
      attendanceAPI.list({ class_id: cid, date: currentDate }),
    ])
      .then(([studs, existing]) => {
        const enrolled = (studs.data.data ?? []).filter(
          s => String(s.course_id) === String(cls.course_id)
        );
        setStudents(enrolled);
        const a = {};
        (existing.data.data ?? []).forEach(e => { a[e.student_id] = e.status; });
        enrolled.forEach(s => { if (!a[s.id]) a[s.id] = 'present'; });
        setAtt(a);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [classes]);

  useEffect(() => {
    if (classId) loadStudents(classId, date);
  }, [classId, date, loadStudents]);

  /* ── QR countdown timer ──────────────────────── */
  useEffect(() => {
    if (!qrData) return;
    const update = () => {
      const left = Math.max(0, Math.round((new Date(qrData.expires_at) - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) { clearInterval(timerRef.current); }
    };
    update();
    timerRef.current = setInterval(update, 1000);
    return () => clearInterval(timerRef.current);
  }, [qrData]);

  /* ── Generate QR ─────────────────────────────── */
  const generateQR = () => {
    if (!classId) { toast.warning('Select a class first'); return; }
    setGenLoading(true);
    attendanceAPI.generateQR({ class_id: +classId, date, valid_minutes: validMins })
      .then(r => {
        setQrData(r.data.data);
        setQrModal(true);
        toast.success('QR code generated!');
      })
      .catch(err => toast.error(err.response?.data?.message ?? 'Failed'))
      .finally(() => setGenLoading(false));
  };

  /* ── Save manual attendance ──────────────────── */
  const save = () => {
    if (!classId) { toast.warning('Select a class first'); return; }
    const records = Object.entries(att).map(([student_id, status]) => ({
      student_id: +student_id, status,
    }));
    setSaving(true);
    attendanceAPI.markBulk({ class_id: +classId, date, records })
      .then(() => { toast.success(`Attendance saved for ${records.length} students!`); loadStudents(classId, date); })
      .catch(() => toast.error('Failed to save'))
      .finally(() => setSaving(false));
  };

  /* ── Print QR ────────────────────────────────── */
  const printQR = () => {
    const w = window.open('', '_blank');
    const svg = qrRef.current?.querySelector('svg')?.outerHTML ?? '';
    const cls = qrData?.class_info ?? {};
    w.document.write(`
      <html><head><title>QR Attendance</title>
      <style>
        body{font-family:'Segoe UI',sans-serif;text-align:center;padding:40px;background:#fff}
        h2{color:#1a3c6e;margin-bottom:4px}
        .info{color:#64748b;font-size:.9rem;margin-bottom:24px}
        .qr{display:inline-block;padding:16px;border:2px solid #1a3c6e;border-radius:12px}
        .foot{margin-top:20px;color:#94a3b8;font-size:.8rem}
      </style></head>
      <body>
        <h2>Nenasala IT Center — Attendance QR</h2>
        <div class="info">
          ${cls.subject_name ?? ''} · ${cls.course_name ?? ''}<br/>
          ${cls.day ?? ''} ${cls.start_time ?? ''} · ${date}<br/>
          <strong>Scan before: ${new Date(qrData.expires_at).toLocaleTimeString()}</strong>
        </div>
        <div class="qr">${svg}</div>
        <div class="foot">
          Scan with your phone camera → open link → attendance marked automatically<br/>
          ${qrData.scan_url}
        </div>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  /* ── Copy link ───────────────────────────────── */
  const copyLink = () => {
    navigator.clipboard.writeText(qrData.scan_url)
      .then(() => toast.success('Link copied to clipboard!'));
  };

  /* ── Share via WhatsApp ──────────────────────── */
  const shareWhatsApp = () => {
    const cls = qrData?.class_info ?? {};
    const msg = encodeURIComponent(
      `📋 *Nenasala IT Center — Attendance*\n\n` +
      `📚 Subject: ${cls.subject_name}\n` +
      `🎓 Course: ${cls.course_name}\n` +
      `📅 Date: ${date}\n` +
      `⏰ Valid until: ${new Date(qrData.expires_at).toLocaleTimeString()}\n\n` +
      `👆 Click to mark attendance:\n${qrData.scan_url}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const counts = { present: 0, absent: 0, late: 0 };
  Object.values(att).forEach(s => { if (counts[s] !== undefined) counts[s]++; });
  const selectedClass = classes.find(c => String(c.id) === String(classId));
  const qrExpired = timeLeft === 0 && qrData;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <>
      {/* ── Header ───────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">
            <i className="bi bi-check2-square me-2"/>Attendance
          </h4>
          {selectedClass && (
            <small className="text-muted">
              <span className="badge bg-success me-1">{selectedClass.course_name}</span>
              {selectedClass.subject_name}
            </small>
          )}
        </div>
      </div>

      {/* ── Controls ─────────────────────────── */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label fw-semibold small">Class / Subject *</label>
              <select className="form-select" value={classId}
                      onChange={e => { setClassId(e.target.value); setStudents([]); setAtt({}); }}>
                <option value="">— Select class —</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.subject_name} · {c.course_name} ({c.day} {c.start_time})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold small">Date</label>
              <input type="date" className="form-control" value={date}
                     onChange={e => setDate(e.target.value)} />
            </div>
            <div className="col-md-4 d-flex gap-2 flex-wrap">
              {/* QR Generate button */}
              <button className="btn btn-success d-flex align-items-center gap-1"
                      onClick={generateQR}
                      disabled={!classId || genLoading}>
                {genLoading
                  ? <><span className="spinner-border spinner-border-sm"/><span className="ms-1">Generating…</span></>
                  : <><i className="bi bi-qr-code-scan"/>Generate QR</>
                }
              </button>
              {/* Manual save */}
              <button className="btn btn-primary d-flex align-items-center gap-1"
                      onClick={save}
                      disabled={saving || !students.length}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-1"/>Saving…</>
                  : <><i className="bi bi-cloud-upload me-1"/>Save</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ────────────────────────────── */}
      {students.length > 0 && (
        <div className="row g-2 mb-3">
          {[
            { key:'present', label:'Present', color:'success', icon:'check-circle-fill' },
            { key:'absent',  label:'Absent',  color:'danger',  icon:'x-circle-fill'     },
            { key:'late',    label:'Late',    color:'warning', icon:'clock-fill'         },
          ].map(s => (
            <div key={s.key} className="col-4">
              <div className={`card border-0 bg-${s.color}-subtle text-center py-2`}>
                <div className={`fw-bold fs-4 text-${s.color}`}>{counts[s.key]}</div>
                <div className="text-muted small">
                  <i className={`bi bi-${s.icon} me-1`}/>{s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Student table ────────────────────── */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {!classId ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-qr-code fs-1 d-block mb-2 opacity-25"/>
              <p>Select a class then generate a QR code for students to scan</p>
            </div>
          ) : loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary"/>
            </div>
          ) : (
            <>
              <div className="px-3 py-2 border-bottom bg-light d-flex justify-content-between">
                <small className="fw-semibold text-muted">
                  {students.length} students in {selectedClass?.course_name}
                </small>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-success btn-sm"
                          onClick={() => { const a={}; students.forEach(s=>{a[s.id]='present';}); setAtt(a); }}>
                    All Present
                  </button>
                  <button className="btn btn-outline-danger btn-sm"
                          onClick={() => { const a={}; students.forEach(s=>{a[s.id]='absent';}); setAtt(a); }}>
                    All Absent
                  </button>
                </div>
              </div>
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr><th>#</th><th>ID</th><th>Name</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {students.map((s, i) => {
                    const status = att[s.id] ?? 'present';
                    return (
                      <tr key={s.id} style={{
                        background: status==='absent'?'#fff5f5':status==='late'?'#fffbeb':'',
                      }}>
                        <td className="text-muted small">{i+1}</td>
                        <td><span className="badge bg-success">{s.student_id}</span></td>
                        <td className="fw-semibold">{s.name}</td>
                        <td>
                          <div className="d-flex gap-3">
                            {[['present','success'],['absent','danger'],['late','warning']].map(([v,c]) => (
                              <div key={v} className="form-check mb-0">
                                <input type="radio" className="form-check-input"
                                       name={`att_${s.id}`} id={`att_${s.id}_${v}`}
                                       checked={att[s.id]===v}
                                       onChange={() => setAtt(p=>({...p,[s.id]:v}))}/>
                                <label htmlFor={`att_${s.id}_${v}`}
                                       className={`form-check-label small fw-semibold text-${c}`}>
                                  {v.charAt(0).toUpperCase()+v.slice(1)}
                                </label>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          QR CODE MODAL
      ══════════════════════════════════════ */}
      {qrModal && qrData && (
        <div className="modal d-block" tabIndex="-1"
             style={{ background:'rgba(0,0,0,.7)', zIndex:1055 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth:480 }}>
            <div className="modal-content border-0 shadow-lg overflow-hidden">

              {/* Header */}
              <div className="modal-header border-0 text-white"
                   style={{ background:'linear-gradient(135deg,#059669,#10b981)' }}>
                <div>
                  <h5 className="modal-title fw-bold mb-0">
                    <i className="bi bi-qr-code-scan me-2"/>QR Attendance Code
                  </h5>
                  <small className="opacity-75">
                    {qrData.class_info?.subject_name} · {qrData.class_info?.course_name} · {date}
                  </small>
                </div>
                <button className="btn-close btn-close-white ms-3"
                        onClick={() => setQrModal(false)}/>
              </div>

              <div className="modal-body p-4">
                {/* Timer */}
                <div className={`text-center rounded-3 py-2 mb-3 ${qrExpired ? 'bg-danger-subtle' : 'bg-success-subtle'}`}>
                  <i className={`bi bi-${qrExpired ? 'x-circle-fill text-danger' : 'clock-fill text-success'} me-1`}/>
                  {qrExpired
                    ? <span className="text-danger fw-bold">QR Code Expired</span>
                    : <span className="text-success fw-bold">
                        Valid for {mins}:{secs.toString().padStart(2,'0')} minutes
                      </span>
                  }
                </div>

                {/* QR Code */}
                <div className="text-center mb-3" ref={qrRef}>
                  <div className="d-inline-block p-3 rounded-3"
                       style={{ background:'#fff', border:'3px solid #1a3c6e',
                                opacity: qrExpired ? .3 : 1 }}>
                    <QRCodeSVG
                      value={qrData.scan_url}
                      size={200}
                      level="H"
                      includeMargin={false}
                      imageSettings={{
                        src: '',
                        width: 0,
                        height: 0,
                        excavate: false,
                      }}
                    />
                  </div>
                  {qrExpired && (
                    <div className="mt-2">
                      <button className="btn btn-sm btn-success" onClick={generateQR}>
                        <i className="bi bi-arrow-clockwise me-1"/>Regenerate QR
                      </button>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="rounded-3 p-3 mb-3"
                     style={{ background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                  <div className="fw-semibold small mb-2">
                    <i className="bi bi-info-circle text-primary me-1"/>How students mark attendance:
                  </div>
                  {[
                    'Student opens camera on their phone',
                    'Scans this QR code',
                    'Opens the link → logs in if needed',
                    'Attendance marked as Present automatically',
                  ].map((t, i) => (
                    <div key={i} className="d-flex align-items-start gap-2 mb-1">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                           style={{ width:18, height:18, fontSize:'.65rem' }}>{i+1}</div>
                      <span style={{ fontSize:'.8rem', color:'#475569' }}>{t}</span>
                    </div>
                  ))}
                </div>

                {/* Validity settings */}
                <div className="d-flex align-items-center gap-2 mb-3">
                  <label className="form-label small fw-semibold mb-0 flex-shrink-0">
                    Valid for:
                  </label>
                  <select className="form-select form-select-sm" style={{ maxWidth:120 }}
                          value={validMins}
                          onChange={e => setValidMins(+e.target.value)}>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                  <button className="btn btn-sm btn-outline-success" onClick={generateQR}
                          disabled={genLoading}>
                    <i className="bi bi-arrow-clockwise me-1"/>New QR
                  </button>
                </div>

                {/* Action buttons */}
                <div className="row g-2">
                  <div className="col-6">
                    <button className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-1"
                            onClick={copyLink}>
                      <i className="bi bi-clipboard"/>Copy Link
                    </button>
                  </div>
                  <div className="col-6">
                    <button className="btn w-100 d-flex align-items-center justify-content-center gap-1"
                            style={{ background:'#25d366', color:'#fff', border:'none' }}
                            onClick={shareWhatsApp}>
                      <i className="bi bi-whatsapp"/>Share WhatsApp
                    </button>
                  </div>
                  <div className="col-6">
                    <button className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-1"
                            onClick={printQR}>
                      <i className="bi bi-printer"/>Print QR
                    </button>
                  </div>
                  <div className="col-6">
                    <a href={`mailto:?subject=Attendance QR Code&body=${encodeURIComponent(
                      `Scan this QR to mark attendance:\n${qrData.scan_url}\n\nValid until: ${new Date(qrData.expires_at).toLocaleTimeString()}`
                    )}`}
                       className="btn btn-outline-info w-100 d-flex align-items-center justify-content-center gap-1">
                      <i className="bi bi-envelope"/>Send Email
                    </a>
                  </div>
                </div>

                {/* Raw URL */}
                <div className="mt-3 p-2 rounded-2 small text-muted text-break"
                     style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', fontSize:'.72rem' }}>
                  <i className="bi bi-link-45deg me-1"/>
                  {qrData.scan_url}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
