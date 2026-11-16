import React from 'react';
import { Link } from 'react-router-dom';

const TEAM = [
  {
    name: "Mr. Kasun Perera",
    role: "Institute Director",
    subject: "Information Technology",
    exp: "12 Years",
    avatar: "K",
    color: "#3b82f6",
  },
  {
    name: "Ms. Nadeesha Silva",
    role: "Senior Software Development Instructor",
    subject: "Web Development & Programming",
    exp: "8 Years",
    avatar: "N",
    color: "#10b981",
  },
  {
    name: "Mr. Tharindu Fernando",
    role: "Networking & Hardware Instructor",
    subject: "Computer Networking",
    exp: "10 Years",
    avatar: "T",
    color: "#f59e0b",
  },
  {
    name: "Ms. Dilani Jayawardena",
    role: "Graphic Design & Digital Skills Instructor",
    subject: "Graphic Design & Multimedia",
    exp: "7 Years",
    avatar: "D",
    color: "#8b5cf6",
  },
];

const MILESTONES = [
  { year:'2015', icon:'flag-fill',          color:'#3b82f6', title:'Founded',         desc:'Nenasala Institute established with 30 students and 4 teachers.' },
  { year:'2017', icon:'people-fill',        color:'#10b981', title:'500 Students',    desc:'Crossed 500 enrolled students milestone with expanded facilities.' },
  { year:'2019', icon:'building-fill',      color:'#f59e0b', title:'New Campus',      desc:'Moved to larger premises with modern classrooms and a science lab.' },
  { year:'2021', icon:'laptop-fill',        color:'#ef4444', title:'Digital Learning',desc:'Launched online portal for notes, PDFs, and recorded sessions.' },
  { year:'2023', icon:'award-fill',         color:'#8b5cf6', title:'Best Institute',  desc:'Awarded Best Private Institute in Western Province by MOE.' },
  { year:'2025', icon:'graph-up-arrow',     color:'#06b6d4', title:'2000+ Alumni',    desc:'Over 2000 successful alumni in universities and professions.' },
];

const VALUES = [
  { icon:'lightbulb-fill',  color:'#f59e0b', title:'Excellence',  desc:'We set high standards and help every student achieve them.' },
  { icon:'heart-fill',      color:'#ef4444', title:'Dedication',  desc:'Our teachers are passionate about student success above all.' },
  { icon:'shield-fill',     color:'#3b82f6', title:'Integrity',   desc:'Honest, transparent, and accountable in everything we do.' },
  { icon:'people-fill',     color:'#10b981', title:'Community',   desc:'A supportive environment where every student belongs.' },
];

export default function AboutPage() {
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
            Our Story
          </span>
          <h1 className="display-5 fw-bold text-white mb-4">
            About Nenasala Institute
          </h1>
          <p className="text-white mx-auto mb-5" style={{ opacity:.75, maxWidth:560, fontSize:'1.05rem', lineHeight:1.8 }}>
            Since 2015, we've been shaping futures through quality education, 
            experienced teachers, and an unwavering commitment to student success.
          </p>
          {/* Breadcrumb */}
          <nav>
            <ol className="breadcrumb justify-content-center mb-0">
              <li className="breadcrumb-item"><Link to="/" className="text-white opacity-50 text-decoration-none">Home</Link></li>
              <li className="breadcrumb-item active text-white">About</li>
            </ol>
          </nav>
        </div>
      </section>

      {/* ── Mission / Vision ─────────────────── */}
      <section className="py-5" style={{ background:'#f8fafc' }}>
        <div className="container py-4">
          <div className="row g-4">
            {[
              { icon:'bullseye',       color:'#3b82f6', bg:'#dbeafe', title:'Our Mission',
                text:"To provide accessible, high-quality education that empowers Sri Lankan students to achieve academic excellence and build successful futures through dedicated teaching, modern resources, and a nurturing environment." },
              { icon:'eye-fill',       color:'#10b981', bg:'#d1fae5', title:'Our Vision',
                text:"To be Sri Lanka's most trusted private education institute — recognised for academic excellence, innovative teaching, and producing graduates who lead in their chosen fields." },
              { icon:'gem-fill',       color:'#f59e0b', bg:'#fef3c7', title:'Our Values',
                text:"Excellence, Integrity, Dedication, and Community are at the heart of everything we do. We believe every student deserves the best, and we deliver it every single day." },
            ].map((m,i) => (
              <div key={i} className="col-md-4">
                <div className="card border-0 h-100 shadow-sm p-4" style={{ borderRadius:16 }}>
                  <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                       style={{ width:56, height:56, background:m.bg }}>
                    <i className={`bi bi-${m.icon} fs-3`} style={{ color:m.color }}/>
                  </div>
                  <h5 className="fw-bold mb-3">{m.title}</h5>
                  <p className="text-muted mb-0" style={{ lineHeight:1.7, fontSize:'.92rem' }}>{m.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story ────────────────────────────── */}
      <section className="py-5">
        <div className="container py-4">
          <div className="row align-items-center g-5">
            {/* Left - visual */}
            <div className="col-lg-5">
              <div className="position-relative">
                <div className="rounded-4 overflow-hidden shadow-lg"
                     style={{ background:'linear-gradient(135deg,#1a3c6e,#2563eb)',
                              padding:40, minHeight:320 }}>
                  <div className="text-white">
                    <i className="bi bi-quote display-4 opacity-25"/>
                    <p className="fs-5 mt-3 mb-4" style={{ lineHeight:1.7 }}>
                      "Education is not just about passing exams — it's about building 
                      the confidence, knowledge, and skills to succeed in life."
                    </p>
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center justify-content-center rounded-circle bg-warning fw-bold"
                           style={{ width:48, height:48, color:'#0f172a', fontSize:'1.1rem' }}>R</div>
                      <div>
                        <div className="fw-bold">Mr. Ruwan Jayasinghe</div>
                        <small className="opacity-75">Principal & Founder</small>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Float card */}
                <div className="position-absolute top-0 end-0 translate-middle shadow"
                     style={{ background:'#fff', borderRadius:12, padding:'12px 16px', marginTop:-12 }}>
                  <div className="text-center">
                    <div className="fw-bold text-primary" style={{ fontSize:'1.5rem' }}>10+</div>
                    <div className="text-muted small">Years</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - text */}
            <div className="col-lg-7">
              <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill mb-3">
                Our Journey
              </span>
              <h2 className="fw-bold mb-4" style={{ color:'#0f172a', fontSize:'1.9rem', lineHeight:1.3 }}>
                A Decade of Shaping Student Success
              </h2>
              <p className="text-muted mb-4" style={{ lineHeight:1.8 }}>
                Nenasala Institute was founded in 2015 by Mr. Chamal Boralesa  with a simple 
                but powerful vision: create an institute where every student gets the attention, 
                resources, and encouragement they need to succeed.
              </p>
              <p className="text-muted mb-4" style={{ lineHeight:1.8 }}>
                Starting with just 30 students in a single classroom, we have grown into one of 
                the most respected private institutes in the Western Province, with over 500 
                active students and a network of 2000+ proud alumni.
              </p>
              <div className="row g-3">
                {[
                  { val:'2000+', label:'Alumni',        color:'#3b82f6' },
                  { val:'95%',   label:'Pass Rate',     color:'#10b981' },
                  { val:'50+',   label:'Teachers',      color:'#f59e0b' },
                  { val:'4',     label:'Courses',       color:'#8b5cf6' },
                ].map((s,i) => (
                  <div key={i} className="col-6">
                    <div className="p-3 rounded-3 border text-center">
                      <div className="fw-bold" style={{ color:s.color, fontSize:'1.6rem' }}>{s.val}</div>
                      <div className="text-muted small">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Timeline ─────────────────────────── */}
      <section className="py-5" style={{ background:'#f8fafc' }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="badge bg-info-subtle text-info px-3 py-2 rounded-pill mb-3">
              Our Milestones
            </span>
            <h2 className="fw-bold" style={{ color:'#0f172a', fontSize:'2rem' }}>
              Key Milestones
            </h2>
          </div>
          <div className="row g-4">
            {MILESTONES.map((m,i) => (
              <div key={i} className="col-md-4">
                <div className="d-flex gap-3 p-4 rounded-3 bg-white shadow-sm border">
                  <div>
                    <div className="d-flex align-items-center justify-content-center rounded-2 mb-2"
                         style={{ width:44, height:44, background:`${m.color}15` }}>
                      <i className={`bi bi-${m.icon}`} style={{ color:m.color, fontSize:'1.1rem' }}/>
                    </div>
                    <div className="fw-bold small" style={{ color:m.color }}>{m.year}</div>
                  </div>
                  <div>
                    <div className="fw-bold mb-1">{m.title}</div>
                    <p className="text-muted small mb-0" style={{ lineHeight:1.5 }}>{m.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ─────────────────────────────── */}
      <section className="py-5">
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill mb-3">
              Our Educators
            </span>
            <h2 className="fw-bold mb-3" style={{ color:'#0f172a', fontSize:'2rem' }}>
              Meet Our Teachers
            </h2>
            <p className="text-muted mx-auto" style={{ maxWidth:460 }}>
              Our experienced, passionate educators are committed to your success.
            </p>
          </div>
          <div className="row g-4 justify-content-center">
            {TEAM.map((t,i) => (
              <div key={i} className="col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm text-center p-4 h-100"
                     style={{ borderRadius:16, transition:'transform .25s' }}
                     onMouseEnter={e => e.currentTarget.style.transform='translateY(-6px)'}
                     onMouseLeave={e => e.currentTarget.style.transform=''}>
                  <div className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold mx-auto mb-3"
                       style={{ width:72, height:72, background:`linear-gradient(135deg,${t.color},${t.color}aa)`,
                                fontSize:'1.6rem' }}>
                    {t.avatar}
                  </div>
                  <h6 className="fw-bold mb-1">{t.name}</h6>
                  <div className="fw-semibold mb-1" style={{ color:t.color, fontSize:'.82rem' }}>
                    {t.role}
                  </div>
                  <div className="text-muted small mb-2">{t.subject}</div>
                  <span className="badge" style={{ background:`${t.color}15`, color:t.color }}>
                    {t.exp} Experience
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ───────────────────────────── */}
      <section className="py-5" style={{ background:'linear-gradient(135deg,#0f172a,#1a3c6e)' }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-bold text-white mb-3" style={{ fontSize:'2rem' }}>Our Core Values</h2>
          </div>
          <div className="row g-4">
            {VALUES.map((v,i) => (
              <div key={i} className="col-sm-6 col-lg-3">
                <div className="text-center p-4 rounded-3"
                     style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)' }}>
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                       style={{ width:56, height:56, background:`${v.color}22` }}>
                    <i className={`bi bi-${v.icon} fs-4`} style={{ color:v.color }}/>
                  </div>
                  <h6 className="fw-bold text-white mb-2">{v.title}</h6>
                  <p className="mb-0" style={{ color:'#94a3b8', fontSize:'.85rem', lineHeight:1.6 }}>
                    {v.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────── */}
      <section className="py-5 text-center" style={{ background:'#f8fafc' }}>
        <div className="container py-4">
          <h2 className="fw-bold mb-3" style={{ color:'#0f172a', fontSize:'1.8rem' }}>
            Ready to Join the Nenasala Family?
          </h2>
          <p className="text-muted mb-4 mx-auto" style={{ maxWidth:440 }}>
            Contact us today to learn about enrollments, schedules, and fees for 2025/2026.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/contact" className="btn btn-primary btn-lg rounded-pill px-5 fw-semibold">
              <i className="bi bi-envelope-fill me-2"/>Contact Us
            </Link>
            <Link to="/login" className="btn btn-outline-primary btn-lg rounded-pill px-5 fw-semibold">
              <i className="bi bi-box-arrow-in-right me-2"/>Student Login
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
