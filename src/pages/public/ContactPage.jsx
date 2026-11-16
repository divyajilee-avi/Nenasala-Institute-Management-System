import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const INIT = { name:'', email:'', phone:'', course:'', message:'' };

export default function ContactPage() {
  const [form,     setForm]     = useState(INIT);
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [errors,   setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Name is required';
    if (!form.email.trim())   e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.message.trim()) e.message = 'Message is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSending(true);
    // Simulate sending (replace with real API call)
    setTimeout(() => {
      setSending(false);
      setSent(true);
      toast.success('Message sent! We will contact you soon.');
    }, 1500);
  };

  const set = (f, v) => { setForm(p=>({...p,[f]:v})); setErrors(e=>({...e,[f]:''})); };

  return (
    <div style={{ overflowX:'hidden' }}>

      {/* ── Hero ─────────────────────────────── */}
      <section style={{
        background:'linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#1a3c6e 100%)',
        paddingTop:120, paddingBottom:80, position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', inset:0, opacity:.04,
                      backgroundImage:'radial-gradient(circle at 2px 2px,#fff 1px,transparent 0)',
                      backgroundSize:'40px 40px' }}/>
        <div className="container text-center position-relative">
          <span className="badge bg-warning-subtle text-warning px-3 py-2 rounded-pill mb-4">
            Get In Touch
          </span>
          <h1 className="display-5 fw-bold text-white mb-4">Contact Us</h1>
          <p className="text-white mx-auto mb-4" style={{ opacity:.75, maxWidth:480, fontSize:'1.05rem' }}>
            Have questions about enrollments, courses, or schedules? 
            We'd love to hear from you.
          </p>
          <nav>
            <ol className="breadcrumb justify-content-center mb-0">
              <li className="breadcrumb-item">
                <Link to="/" className="text-white opacity-50 text-decoration-none">Home</Link>
              </li>
              <li className="breadcrumb-item active text-white">Contact</li>
            </ol>
          </nav>
        </div>
      </section>

      {/* ── Contact Cards ─────────────────────── */}
      <section className="py-5" style={{ background:'#f8fafc', marginTop:-1 }}>
        <div className="container">
          <div className="row g-4 justify-content-center" style={{ marginTop:-60 }}>
            {[
              { icon:'geo-alt-fill',   color:'#3b82f6', bg:'#dbeafe',
                title:'Visit Us',       lines:['Nenasala Institute , Deniyaya , Sri Lanka'] },
              { icon:'telephone-fill', color:'#10b981', bg:'#d1fae5',
                title:'Call Us',        lines:['+94 11 234 5678','+94 70 295 3390'] },
              { icon:'envelope-fill',  color:'#f59e0b', bg:'#fef3c7',
                title:'Email Us',       lines:['info@nenasala.lk','admissions@nenasala.lk'] },
              { icon:'clock-fill',     color:'#8b5cf6', bg:'#ede9fe',
                title:'Opening Hours', lines:['Mon–Fri: 8 AM – 7 PM','Sat: 8 AM – 4 PM'] },
            ].map((c,i) => (
              <div key={i} className="col-sm-6 col-lg-3">
                <div className="card border-0 shadow text-center p-4 h-100" style={{ borderRadius:16 }}>
                  <div className="d-inline-flex align-items-center justify-content-center rounded-3 mx-auto mb-3"
                       style={{ width:56, height:56, background:c.bg }}>
                    <i className={`bi bi-${c.icon} fs-3`} style={{ color:c.color }}/>
                  </div>
                  <h6 className="fw-bold mb-2">{c.title}</h6>
                  {c.lines.map((l,j) => (
                    <p key={j} className="text-muted small mb-1">{l}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form + Map ────────────────────────── */}
      <section className="py-5" style={{ background:'#f8fafc' }}>
        <div className="container py-4">
          <div className="row g-5 align-items-start">

            {/* Contact Form */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm p-4 p-md-5" style={{ borderRadius:20 }}>
                <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill mb-3 d-inline-block">
                  Send a Message
                </span>
                <h3 className="fw-bold mb-2" style={{ color:'#0f172a' }}>
                  We'd Love to Hear From You
                </h3>
                <p className="text-muted mb-4 small">
                  Fill in the form below and we'll get back to you within 24 hours.
                </p>

                {sent ? (
                  <div className="text-center py-4">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success-subtle mb-3"
                         style={{ width:72, height:72 }}>
                      <i className="bi bi-check-circle-fill text-success fs-2"/>
                    </div>
                    <h5 className="fw-bold text-success mb-2">Message Sent!</h5>
                    <p className="text-muted mb-4">
                      Thank you, <strong>{form.name}</strong>! We'll contact you at{' '}
                      <strong>{form.email}</strong> within 24 hours.
                    </p>
                    <button className="btn btn-primary rounded-pill px-4"
                            onClick={() => { setSent(false); setForm(INIT); }}>
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate>
                    <div className="row g-3">

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">
                          Full Name <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-person text-muted"/>
                          </span>
                          <input
                            className={`form-control border-start-0 ${errors.name ? 'is-invalid' : ''}`}
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            placeholder="Your full name"
                          />
                          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">
                          Email <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-envelope text-muted"/>
                          </span>
                          <input
                            type="email"
                            className={`form-control border-start-0 ${errors.email ? 'is-invalid' : ''}`}
                            value={form.email}
                            onChange={e => set('email', e.target.value)}
                            placeholder="your@email.com"
                          />
                          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Phone Number</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-telephone text-muted"/>
                          </span>
                          <input
                            className="form-control border-start-0"
                            value={form.phone}
                            onChange={e => set('phone', e.target.value)}
                            placeholder="07X XXXXXXX"
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Interested In</label>
                        <select className="form-select" value={form.course}
                                onChange={e => set('course', e.target.value)}>
                          <option value="">Select course…</option>
                          <option>Data Science</option>
                          <option>Network & Cybersecurity</option>
                          <option>Graphic Design</option>
                          <option>ICT — Advanced Level</option>
                          
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold small">
                          Message <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                          rows={4}
                          value={form.message}
                          onChange={e => set('message', e.target.value)}
                          placeholder="Tell us how we can help you…"
                        />
                        {errors.message && <div className="invalid-feedback">{errors.message}</div>}
                      </div>

                      <div className="col-12">
                        <button type="submit"
                          className="btn btn-primary w-100 fw-semibold py-2 rounded-3"
                          disabled={sending}>
                          {sending ? (
                            <><span className="spinner-border spinner-border-sm me-2"/>Sending…</>
                          ) : (
                            <><i className="bi bi-send-fill me-2"/>Send Message</>
                          )}
                        </button>
                      </div>

                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Map + Info */}
            <div className="col-lg-6">
              {/* Map placeholder */}
              <div className="rounded-3 overflow-hidden shadow-sm mb-4"
                   style={{ height:280, background:'linear-gradient(135deg,#1a3c6e,#2563eb)',
                            display:'flex', flexDirection:'column', alignItems:'center',
                            justifyContent:'center', color:'#fff' }}>
                <i className="bi bi-geo-alt-fill" style={{ fontSize:'3rem', opacity:.5 }}/>
                <h6 className="mt-3 fw-bold">Nenasala Institute , Deniyaya , Sri Lanka </h6>
                <p className="small opacity-75">Sri Lanka</p>
                <a href="https://maps.google.com" target="_blank" rel="noreferrer"
                   className="btn btn-sm btn-outline-light rounded-pill mt-2">
                  <i className="bi bi-map me-1"/>Open in Google Maps
                </a>
              </div>

              {/* Quick info */}
              <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius:16 }}>
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-calendar-check text-primary me-2"/>Class Schedules
                </h6>
                <div className="row g-2">
                  {[
                    { day:'Weekday Morning', time:'8:00 AM – 12:00 PM' },
                    { day:'Weekday Evening', time:'2:00 PM – 7:00 PM'  },
                    { day:'Saturday',        time:'8:00 AM – 4:00 PM'  },
                  ].map((s,i) => (
                    <div key={i} className="col-12">
                      <div className="d-flex justify-content-between align-items-center p-2 rounded-2"
                           style={{ background:'#f8fafc' }}>
                        <span className="fw-semibold small">{s.day}</span>
                        <span className="badge bg-primary-subtle text-primary">{s.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp CTA */}
              <div className="p-4 rounded-3 d-flex align-items-center gap-3"
                   style={{ background:'#dcfce7', border:'1px solid #bbf7d0' }}>
                <div className="d-flex align-items-center justify-content-center rounded-circle"
                     style={{ width:50, height:50, background:'#25d366', flexShrink:0 }}>
                  <i className="bi bi-whatsapp text-white fs-4"/>
                </div>
                <div>
                  <div className="fw-bold" style={{ color:'#14532d' }}>Chat on WhatsApp</div>
                  <div className="small text-muted">Quick responses · Usually within 1 hour</div>
                  <a href="https://wa.me/94702953390" target="_blank" rel="noreferrer"
                     className="btn btn-sm mt-2 fw-semibold"
                     style={{ background:'#25d366', color:'#fff', border:'none', borderRadius:8 }}>
                    Start Chat →
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────── */}
      <section className="py-5">
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="badge bg-info-subtle text-info px-3 py-2 rounded-pill mb-3">FAQ</span>
            <h2 className="fw-bold" style={{ color:'#0f172a', fontSize:'2rem' }}>
              Frequently Asked Questions
            </h2>
          </div>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {[
                { q:'When does the new academic year begin?',
                  a:'Our new batches start in January and July each year. Limited seats available — early enrollment is recommended.' },
                { q:'Do you offer trial classes?',
                  a:'Yes! We offer a free trial class for all new students. Contact us to schedule your session.' },
                { q:'What payment plans are available?',
                  a:'We offer monthly, quarterly, and annual payment options. Scholarships are available for deserving students.' },
                { q:'How do students access online materials?',
                  a:'Students can login to the Nenasala IMS portal at any time to access notes, PDFs, recorded classes, and results.' },
                { q:'What is your class size?',
                  a:'We maintain a maximum of 25 students per class to ensure personalized attention for every student.' },
              ].map((f,i) => (
                <details key={i} className="mb-2" style={{ borderRadius:12, overflow:'hidden' }}>
                  <summary className="p-4 fw-semibold"
                           style={{ background:'#f8fafc', cursor:'pointer', listStyle:'none',
                                    border:'1px solid #e2e8f0', borderRadius:12,
                                    display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span><i className="bi bi-question-circle text-primary me-2"/>{f.q}</span>
                    <i className="bi bi-chevron-down text-muted"/>
                  </summary>
                  <div className="p-4 text-muted"
                       style={{ background:'#fff', border:'1px solid #e2e8f0',
                                borderTop:'none', borderRadius:'0 0 12px 12px', lineHeight:1.7 }}>
                    {f.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
