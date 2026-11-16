import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please enter your email and password'); return; }
    setLoading(true);
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.name}!`);
      const map = { admin:'/admin', teacher:'/teacher', student:'/student', receptionist:'/admin' };
      navigate(map[user.role] ?? '/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Invalid email or password');
    } finally { setLoading(false); }
  };

  /* ── features shown on left panel ── */
  const features = [
    { icon:'mortarboard-fill',  text:'ICT Advanced Level' },
    { icon:'code-slash',        text:'Web Development'     },
    { icon:'shield-lock-fill',  text:'Cybersecurity'       },
    { icon:'cpu-fill',          text:'Software Development'},
    { icon:'brush-fill',        text:'Graphic Design'      },
    { icon:'bar-chart-line-fill',text:'Data Science & AI'  },
  ];

  return (
    <div style={{ minHeight:'100vh', display:'flex' }}>

      {/* ══════════════════════════════════════════
          LEFT  — Institute branding panel
      ══════════════════════════════════════════ */}
      <div
        className="d-none d-lg-flex flex-column justify-content-between"
        style={{
          width: '55%',
          background: 'linear-gradient(160deg, #0a1628 0%, #0f2547 40%, #1a3c6e 75%, #1d4f9e 100%)',
          padding: '48px 52px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:-80, right:-80, width:320, height:320,
          borderRadius:'50%', background:'rgba(37,99,235,.15)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-120, left:-60, width:400, height:400,
          borderRadius:'50%', background:'rgba(16,185,129,.08)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'40%', right:-40, width:200, height:200,
          borderRadius:'50%', background:'rgba(139,92,246,.12)', pointerEvents:'none' }}/>

        {/* Grid dot pattern */}
        <div style={{
          position:'absolute', inset:0, opacity:.04,
          backgroundImage:'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)',
          backgroundSize:'36px 36px', pointerEvents:'none',
        }}/>

        {/* ── Top: Logo & name ── */}
        <div>
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="d-flex align-items-center justify-content-center rounded-3"
                 style={{ width:54, height:54, background:'linear-gradient(135deg,#2563eb,#06b6d4)',
                          boxShadow:'0 8px 24px rgba(37,99,235,.4)' }}>
              <i className="bi bi-pc-display-horizontal text-white" style={{ fontSize:'1.5rem' }}/>
            </div>
            <div>
              <div className="fw-bold text-white" style={{ fontSize:'1.3rem', lineHeight:1.1 }}>
                Nenasala
              </div>
              <div style={{ color:'#60a5fa', fontSize:'.7rem', letterSpacing:'.14em' }}>
                IT CENTER
              </div>
            </div>
          </div>

          {/* Tagline */}
          <h1 className="fw-bold text-white mb-3"
              style={{ fontSize:'2.2rem', lineHeight:1.25, maxWidth:420 }}>
            Build Your Future in
            <span style={{
              display:'block',
              background:'linear-gradient(90deg,#60a5fa,#34d399)',
              WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent',
            }}>
              Information Technology
            </span>
          </h1>

          <p style={{ color:'rgba(255,255,255,.65)', fontSize:'.95rem', lineHeight:1.7,
                      maxWidth:400, marginBottom:36 }}>
            Sri Lanka's professional IT training center offering industry-focused
            courses with experienced instructors and modern lab facilities.
          </p>

          {/* Course chips */}
          <div className="d-flex flex-wrap gap-2">
            {features.map((f,i) => (
              <div key={i} className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                   style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)',
                            backdropFilter:'blur(8px)' }}>
                <i className={`bi bi-${f.icon}`}
                   style={{ color:'#60a5fa', fontSize:'.85rem' }}/>
                <span style={{ color:'rgba(255,255,255,.8)', fontSize:'.78rem' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Middle: Large visual illustration ── */}
        <div className="text-center my-4">
          {/* SVG tech illustration */}
          <svg viewBox="0 0 420 260" width="100%" style={{ maxWidth:420, opacity:.9 }}>
            {/* Monitor */}
            <rect x="110" y="40" width="200" height="130" rx="8" fill="#1e3a5f" stroke="#2563eb" strokeWidth="2"/>
            <rect x="118" y="48" width="184" height="114" rx="4" fill="#0f172a"/>
            {/* Code lines */}
            <rect x="126" y="58" width="80" height="5" rx="2" fill="#60a5fa" opacity=".8"/>
            <rect x="126" y="70" width="120" height="5" rx="2" fill="#34d399" opacity=".7"/>
            <rect x="126" y="82" width="60" height="5" rx="2" fill="#f472b6" opacity=".6"/>
            <rect x="126" y="94" width="100" height="5" rx="2" fill="#60a5fa" opacity=".5"/>
            <rect x="126" y="106" width="140" height="5" rx="2" fill="#34d399" opacity=".4"/>
            <rect x="126" y="118" width="90" height="5" rx="2" fill="#fbbf24" opacity=".7"/>
            <rect x="126" y="130" width="110" height="5" rx="2" fill="#60a5fa" opacity=".6"/>
            <rect x="126" y="142" width="70" height="5" rx="2" fill="#f472b6" opacity=".5"/>
            {/* Monitor stand */}
            <rect x="195" y="170" width="30" height="20" rx="2" fill="#1e3a5f"/>
            <rect x="175" y="188" width="70" height="8" rx="4" fill="#2563eb"/>
            {/* WiFi / network lines */}
            <circle cx="60" cy="100" r="6" fill="#34d399" opacity=".8"/>
            <circle cx="360" cy="80" r="5" fill="#60a5fa" opacity=".8"/>
            <circle cx="360" cy="160" r="7" fill="#f472b6" opacity=".7"/>
            <circle cx="60" cy="170" r="5" fill="#fbbf24" opacity=".7"/>
            <line x1="66" y1="100" x2="110" y2="100" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4,3" opacity=".5"/>
            <line x1="310" y1="80" x2="355" y2="80" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4,3" opacity=".5"/>
            <line x1="310" y1="150" x2="355" y2="160" stroke="#f472b6" strokeWidth="1.5" strokeDasharray="4,3" opacity=".5"/>
            <line x1="66" y1="168" x2="110" y2="155" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4,3" opacity=".5"/>
            {/* Floating badges */}
            <rect x="20" y="85" width="36" height="30" rx="8" fill="#1e3a5f" stroke="#34d399" strokeWidth="1.5"/>
            <text x="38" y="105" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="bold">WiFi</text>
            <rect x="342" y="64" width="36" height="30" rx="8" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="1.5"/>
            <text x="360" y="84" textAnchor="middle" fill="#60a5fa" fontSize="9" fontWeight="bold">Dev</text>
            <rect x="342" y="148" width="40" height="28" rx="8" fill="#1e3a5f" stroke="#f472b6" strokeWidth="1.5"/>
            <text x="362" y="166" textAnchor="middle" fill="#f472b6" fontSize="8" fontWeight="bold">Design</text>
            <rect x="20" y="156" width="38" height="28" rx="8" fill="#1e3a5f" stroke="#fbbf24" strokeWidth="1.5"/>
            <text x="39" y="174" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold">AI/ML</text>
            {/* Decorative dots */}
            {[40,80,120,160,200,240,280,320,360,400].map((x,i)=>(
              <circle key={i} cx={x} cy={230} r="2.5" fill="rgba(255,255,255,.15)"/>
            ))}
          </svg>
        </div>

        {/* ── Bottom: Stats ── */}
        <div>
          <div className="d-flex gap-4 pt-4"
               style={{ borderTop:'1px solid rgba(255,255,255,.1)' }}>
            {[
              { val:'500+', label:'Students'    },
              { val:'8',    label:'IT Courses'  },
              { val:'95%',  label:'Success Rate'},
              { val:'10+',  label:'Years'       },
            ].map((s,i) => (
              <div key={i}>
                <div className="fw-bold text-white" style={{ fontSize:'1.4rem', lineHeight:1 }}>
                  {s.val}
                </div>
                <div style={{ color:'rgba(255,255,255,.5)', fontSize:'.72rem' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT — Login form panel
      ══════════════════════════════════════════ */}
      <div
        className="d-flex flex-column justify-content-center align-items-center flex-grow-1"
        style={{
          background: '#f8fafc',
          padding: '40px 24px',
          minWidth: 0,
        }}
      >
        <div style={{ width:'100%', maxWidth:420 }}>

          {/* Mobile logo (only visible on small screens) */}
          <div className="d-flex d-lg-none align-items-center gap-2 mb-6 justify-content-center mb-4">
            <div className="d-flex align-items-center justify-content-center rounded-2"
                 style={{ width:42, height:42, background:'linear-gradient(135deg,#1a3c6e,#2563eb)' }}>
              <i className="bi bi-pc-display-horizontal text-white" style={{ fontSize:'1.2rem' }}/>
            </div>
            <div>
              <div className="fw-bold text-primary">Nenasala IT Center</div>
            </div>
          </div>

          {/* Form card */}
          <div className="card border-0 shadow"
               style={{ borderRadius:20, overflow:'hidden' }}>

            {/* Card top accent */}
            <div style={{ height:5, background:'linear-gradient(90deg,#1a3c6e,#2563eb,#06b6d4)' }}/>

            <div className="card-body p-4 p-md-5">
              {/* Heading */}
              <div className="mb-4">
                <h3 className="fw-bold mb-1" style={{ color:'#0f172a' }}>
                  Welcome Back 👋
                </h3>
                <p className="text-muted small mb-0">
                  Sign in to your Nenasala IT Center account
                </p>
              </div>

              {/* Form */}
              <form onSubmit={submit} noValidate>

                {/* Email */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-secondary">
                    Email Address
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"
                          style={{ borderRadius:'10px 0 0 10px' }}>
                      <i className="bi bi-envelope text-muted"/>
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0 ps-0"
                      style={{ borderRadius:'0 10px 10px 0' }}
                      name="email"
                      value={form.email}
                      onChange={handle}
                      placeholder="you@nenasala.lk"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="mb-4">
                  <label className="form-label fw-semibold small text-secondary">
                    Password
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"
                          style={{ borderRadius:'10px 0 0 10px' }}>
                      <i className="bi bi-lock text-muted"/>
                    </span>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      className="form-control border-start-0 border-end-0 ps-0"
                      name="password"
                      value={form.password}
                      onChange={handle}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="input-group-text bg-white"
                      style={{ borderRadius:'0 10px 10px 0', cursor:'pointer' }}
                      onClick={() => setShowPwd(s => !s)}
                    >
                      <i className={`bi bi-eye${showPwd ? '-slash' : ''} text-muted`}/>
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="btn w-100 fw-semibold py-2"
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg,#1a3c6e,#2563eb)',
                    color: '#fff', borderRadius: 10, border: 'none',
                    boxShadow: '0 6px 20px rgba(26,60,110,.35)',
                    transition: 'opacity .2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity='.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity='1'}
                >
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2"/>Signing in…</>
                  ) : (
                    <><i className="bi bi-box-arrow-in-right me-2"/>Sign In</>
                  )}
                </button>

              </form>
            </div>
          </div>

          {/* Footer links */}
          <div className="d-flex justify-content-between align-items-center mt-4 px-1">
            <Link to="/" className="text-muted text-decoration-none small d-flex align-items-center gap-1">
              <i className="bi bi-arrow-left"/>Back to Home
            </Link>
            <small className="text-muted">
              © {new Date().getFullYear()} Nenasala IT Center
            </small>
          </div>

          {/* Role hints */}
        {/* <div className="mt-4 p-3 rounded-3"
               style={{ background:'rgba(26,60,110,.04)', border:'1px solid rgba(26,60,110,.08)' }}>
            <div className="text-center small text-muted fw-semibold mb-2">
              <i className="bi bi-shield-lock me-1"/>Secure Login Portals
            </div>
            <div className="row g-2 text-center">
              {[
                { role:'Admin',   color:'#1a3c6e', icon:'shield-fill'      },
                { role:'Teacher', color:'#059669', icon:'person-badge-fill' },
                { role:'Student', color:'#7c3aed', icon:'mortarboard-fill' },
              ].map((r,i) => (
                <div key={i} className="col-4">
                  <div className="rounded-2 py-2"
                       style={{ background:`${r.color}12`, border:`1px solid ${r.color}22` }}>
                    <i className={`bi bi-${r.icon} d-block mb-1`}
                       style={{ color:r.color, fontSize:'.9rem' }}/>
                    <div style={{ color:r.color, fontSize:'.7rem', fontWeight:600 }}>
                      {r.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>*/}

        </div>
      </div>

    </div>
  );
}
