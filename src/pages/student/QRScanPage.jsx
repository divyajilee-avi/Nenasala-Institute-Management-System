import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { attendanceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function QRScanPage() {
  const [params]           = useSearchParams();
  const { user, loading }  = useAuth();
  const navigate           = useNavigate();
  const token              = params.get('token');

  const [step,    setStep]    = useState('checking'); // checking|login|marking|success|error
  const [result,  setResult]  = useState(null);
  const [errMsg,  setErrMsg]  = useState('');

  /* ── After auth check, auto-mark ──────────────── */
  useEffect(() => {
    if (loading) return;

    if (!token) { setErrMsg('Invalid QR code — no token found.'); setStep('error'); return; }

    if (!user) { setStep('login'); return; }

    if (user.role !== 'student') {
      setErrMsg('Only students can scan attendance QR codes.');
      setStep('error');
      return;
    }

    setStep('marking');
    attendanceAPI.scanQR({ token })
      .then(r => { setResult(r.data.data); setStep('success'); })
      .catch(err => {
        setErrMsg(err.response?.data?.message ?? 'Something went wrong');
        setStep('error');
      });
  }, [user, loading, token]);

  /* ── Styles ────────────────────────────────────── */
  const page = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#1a3c6e 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  };

  const card = {
    background: '#fff', borderRadius: 20, padding: '40px 32px',
    maxWidth: 420, width: '100%', textAlign: 'center',
    boxShadow: '0 24px 60px rgba(0,0,0,.25)',
  };

  /* ── Checking ─────────────────────────────────── */
  if (step === 'checking' || loading) return (
    <div style={page}>
      <div style={card}>
        <div className="spinner-border text-primary mb-3" style={{ width: 52, height: 52 }}/>
        <h5 className="fw-bold">Verifying QR Code…</h5>
        <p className="text-muted small">Please wait</p>
      </div>
    </div>
  );

  /* ── Not logged in ────────────────────────────── */
  if (step === 'login') return (
    <div style={page}>
      <div style={card}>
        <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
             style={{ width: 72, height: 72, background: '#dbeafe' }}>
          <i className="bi bi-person-lock text-primary" style={{ fontSize: '2rem' }}/>
        </div>
        <h5 className="fw-bold mb-2">Login Required</h5>
        <p className="text-muted mb-4">You need to login to mark your attendance.</p>
        <Link
          to={`/login?redirect=/attendance/scan?token=${token}`}
          className="btn btn-primary w-100 fw-semibold py-2 rounded-3"
        >
          <i className="bi bi-box-arrow-in-right me-2"/>Login to Mark Attendance
        </Link>
      </div>
    </div>
  );

  /* ── Processing ───────────────────────────────── */
  if (step === 'marking') return (
    <div style={page}>
      <div style={card}>
        <div className="position-relative d-inline-block mb-3">
          <div className="spinner-border text-success" style={{ width: 64, height: 64, borderWidth: 4 }}/>
          <i className="bi bi-qr-code-scan position-absolute top-50 start-50 translate-middle text-success fs-4"/>
        </div>
        <h5 className="fw-bold mb-1">Marking Attendance…</h5>
        <p className="text-muted small">Verifying your QR code</p>
        <div className="progress mt-3" style={{ height: 5 }}>
          <div className="progress-bar bg-success progress-bar-striped progress-bar-animated w-100"/>
        </div>
      </div>
    </div>
  );

  /* ── Success ──────────────────────────────────── */
  if (step === 'success' && result) return (
    <div style={page}>
      <div style={card}>
        {/* Icon */}
        <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
             style={{ width: 80, height: 80,
                      background: result.already_marked ? '#fef3c7' : '#d1fae5' }}>
          <i className={`bi bi-${result.already_marked ? 'check2-all' : 'check-circle-fill'}`}
             style={{ fontSize: '2.4rem',
                      color: result.already_marked ? '#d97706' : '#10b981' }}/>
        </div>

        <h4 className="fw-bold mb-1">
          {result.already_marked ? 'Already Marked!' : 'Attendance Marked!'}
        </h4>
        <p className="text-muted mb-4">
          {result.already_marked
            ? 'Your attendance was already recorded for this session.'
            : 'Your attendance has been successfully recorded.'}
        </p>

        {/* Details card */}
        <div className="rounded-3 p-3 mb-4 text-start"
             style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          {[
            { icon: 'person-fill',    label: 'Student',  value: result.student_name },
            { icon: 'book-fill',      label: 'Subject',  value: result.subject      },
            { icon: 'mortarboard',    label: 'Course',   value: result.course       },
            { icon: 'calendar3',      label: 'Date',     value: result.date         },
            { icon: 'check-circle-fill', label:'Status', value: 'Present ✓',
              color: '#10b981' },
          ].map((r, i) => (
            <div key={i} className="d-flex align-items-center gap-2 py-1">
              <i className={`bi bi-${r.icon} text-primary`} style={{ width: 18 }}/>
              <span className="text-muted small" style={{ width: 60 }}>{r.label}</span>
              <span className="fw-semibold small" style={{ color: r.color ?? '#0f172a' }}>
                {r.value}
              </span>
            </div>
          ))}
        </div>

        <Link to="/student/attendance"
              className="btn btn-primary w-100 fw-semibold py-2 rounded-3">
          <i className="bi bi-list-check me-2"/>View My Attendance
        </Link>
      </div>
    </div>
  );

  /* ── Error ────────────────────────────────────── */
  return (
    <div style={page}>
      <div style={card}>
        <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
             style={{ width: 72, height: 72, background: '#fee2e2' }}>
          <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '2rem' }}/>
        </div>
        <h5 className="fw-bold mb-2 text-danger">Scan Failed</h5>
        <p className="text-muted mb-4">{errMsg}</p>
        <Link to="/student" className="btn btn-outline-primary w-100 rounded-3">
          <i className="bi bi-house me-2"/>Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
