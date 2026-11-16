import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/* ── reusable stat counter ── */
function StatCounter({ end, label, suffix = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    let start = 0;
    const duration = 1800;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      if (ref.current) ref.current.textContent = start.toLocaleString() + suffix;
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [end, suffix]);
  return (
    <div className="text-center">
      <div ref={ref} className="fw-bold text-white"
           style={{ fontSize:'2.4rem', lineHeight:1 }}>0</div>
      <div className="text-white opacity-75 small mt-1">{label}</div>
    </div>
  );
}

const COURSES = [
  {
    icon:'mortarboard-fill',
    color:'#3b82f6', bg:'#dbeafe',
    title:'ICT — Advanced Level',
    desc:'A/L ICT covering programming, networking, databases, system analysis & design.',
    duration:'2 Years', fee:'Rs. 35,000/yr',
    badge:'Most Popular',
  },
  {
    icon:'code-slash',
    color:'#10b981', bg:'#d1fae5',
    title:'Web Development',
    desc:'Full-stack web development: HTML, CSS, JavaScript, React, PHP & MySQL.',
    duration:'6 Months', fee:'Rs. 18,000',
    badge:'',
  },
  {
    icon:'hdd-network-fill',
    color:'#f59e0b', bg:'#fef3c7',
    title:'Computer Hardware & Networking',
    desc:'Hardware assembly, OS installation, LAN/WAN networking & server administration.',
    duration:'4 Months', fee:'Rs. 15,000',
    badge:'',
  },
  {
    icon:'file-earmark-spreadsheet-fill',
    color:'#8b5cf6', bg:'#ede9fe',
    title:'Office Automation',
    desc:'MS Office, Google Workspace, professional typing & computer skills for work.',
    duration:'3 Months', fee:'Rs. 8,000',
    badge:'Beginner Friendly',
  },
  {
    icon:'brush-fill',
    color:'#ec4899', bg:'#fce7f3',
    title:'Graphic Design',
    desc:'Adobe Photoshop, Illustrator & CorelDRAW for print and digital media design.',
    duration:'4 Months', fee:'Rs. 12,000',
    badge:'',
  },
  {
    icon:'cpu-fill',
    color:'#06b6d4', bg:'#cffafe',
    title:'Software Development',
    desc:'Python, Java, OOP, data structures, mobile app development & software engineering.',
    duration:'8 Months', fee:'Rs. 25,000',
    badge:'',
  },
  {
    icon:'shield-lock-fill',
    color:'#ef4444', bg:'#fee2e2',
    title:'Cybersecurity Fundamentals',
    desc:'Network security, ethical hacking basics, cryptography & cyber laws.',
    duration:'4 Months', fee:'Rs. 20,000',
    badge:'High Demand',
  },
  {
    icon:'bar-chart-line-fill',
    color:'#f97316', bg:'#ffedd5',
    title:'Data Science & AI',
    desc:'Python for data science, machine learning, AI fundamentals & data visualization.',
    duration:'6 Months', fee:'Rs. 28,000',
    badge:'New Course',
  },
];

const FEATURES = [
  { icon:'award-fill',       color:'#3b82f6', title:'Experienced Teachers',    desc:'Qualified educators with 10+ years experience in their fields.' },
  { icon:'people-fill',      color:'#10b981', title:'Small Class Sizes',       desc:'Maximum 25 students per class for personalized attention.' },
  { icon:'laptop-fill',      color:'#f59e0b', title:'Digital Resources',       desc:'Online notes, PDFs, and recorded sessions available 24/7.' },
  { icon:'graph-up-arrow',   color:'#ef4444', title:'Proven Results',          desc:'95% of our students achieve their target grades every year.' },
  { icon:'clock-fill',       color:'#8b5cf6', title:'Flexible Schedules',      desc:'Morning, afternoon, and weekend batches to suit your timetable.' },
  { icon:'shield-check-fill',color:'#06b6d4', title:'Safe Environment',        desc:'CCTV monitored, secure campus with parent communication portal.' },
];

const TESTIMONIALS = [
  
  {
    text: "The web development course gave me practical experience and confidence to build real-world projects.",
    name: "Kasun Perera",
    course: "Web Development",
    year: "2026",
    avatar: "KP",
  },
  {
    text: "The instructors explained programming concepts clearly. I successfully completed my final project with their guidance.",
    name: "Nadeesha Silva",
    course: "Software Development",
    year: "2026",
    avatar: "NS",
  },
  {
    text: "The networking course helped me improve my technical skills and prepared me for my first IT internship.",
    name: "Tharindu Fernando",
    course: "Computer Networking",
    year: "2025",
    avatar: "TF",
  },
];

export default function HomePage() {
  return (
    <div style={{ overflowX:'hidden' }}>

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section style={{
        minHeight:'100vh',
        position:'relative',
        overflow:'hidden',
        display:'flex',
        alignItems:'center',
      }}>
        {/* ── Background image layer ── */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:`url('https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80')`,
          backgroundSize:'cover',
          backgroundPosition:'center',
          backgroundRepeat:'no-repeat',
        }}/>
        {/* ── Dark overlay gradient ── */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(135deg, rgba(10,22,40,.95) 0%, rgba(15,37,71,.90) 45%, rgba(26,60,110,.82) 100%)',
        }}/>
        {/* Glowing orbs */}
        <div style={{ position:'absolute', top:'10%', right:'8%', width:400, height:400,
          background:'radial-gradient(circle, rgba(37,99,235,.25) 0%, transparent 70%)',
          borderRadius:'50%', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'15%', left:'5%', width:300, height:300,
          background:'radial-gradient(circle, rgba(16,185,129,.15) 0%, transparent 70%)',
          borderRadius:'50%', pointerEvents:'none' }}/>
        {/* Dot pattern */}
        <div style={{
          position:'absolute', inset:0, opacity:.04,
          backgroundImage:'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)',
          backgroundSize:'40px 40px', pointerEvents:'none',
        }}/>

        <div className="container position-relative">
          <div className="row align-items-center g-5">
            {/* Left text */}
            <div className="col-lg-6">
              <div className="d-inline-flex align-items-center gap-2 rounded-pill px-3 py-1 mb-4"
                   style={{ background:'rgba(37,99,235,.2)', border:'1px solid rgba(37,99,235,.4)' }}>
                <div className="rounded-circle bg-success" style={{ width:8, height:8 }}/>
                <small className="text-white opacity-75">Admissions Open 2025/2026</small>
              </div>

              <h1 className="display-4 fw-bold text-white mb-4" style={{ lineHeight: 1.15 }}>
  Build Your IT Career
  <br />
  <span
    style={{
      background: "linear-gradient(90deg,#60a5fa,#34d399)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    }}
  >
    with Nenasala Institute
  </span>
</h1>

              <p className="text-white mb-5" style={{ fontSize:'1.1rem', opacity:.8, lineHeight:1.8 }}>
                Sri Lanka's trusted IT training center, offering professional courses in Information Technology, Computer Applications, Programming, Graphic Design, and Digital Skills. Join hundreds of successful students who have built their careers with our expert instructors and practical, industry-focused training.
              </p>

              <div className="d-flex flex-wrap gap-3">
                <Link to="/contact"
                  className="btn btn-primary btn-lg rounded-pill px-5 fw-semibold"
                  style={{ background:'linear-gradient(135deg,#2563eb,#1d4ed8)', border:'none' }}>
                  <i className="bi bi-arrow-right-circle me-2"/>Enroll Now
                </Link>
                <Link to="/about"
                  className="btn btn-lg rounded-pill px-5 fw-semibold"
                  style={{ background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.25)',
                           color:'#fff', backdropFilter:'blur(8px)' }}>
                  <i className="bi bi-play-circle me-2"/>Learn More
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="d-flex flex-wrap gap-4 mt-5 pt-2"
                   style={{ borderTop:'1px solid rgba(255,255,255,.1)' }}>
                {[
                  { icon:'patch-check-fill', text:'Government Registered', color:'#34d399' },
                  { icon:'star-fill',         text:'4.9★ Rated Institute',  color:'#fbbf24' },
                  { icon:'people-fill',        text:'2000+ Alumni',          color:'#60a5fa' },
                ].map((t,i) => (
                  <div key={i} className="d-flex align-items-center gap-2">
                    <i className={`bi bi-${t.icon}`} style={{ color:t.color, fontSize:'1.1rem' }}/>
                    <small className="text-white opacity-75">{t.text}</small>
                  </div>
                ))}
              </div>
            </div>

            {/* Right card grid — all 8 ICT courses */}
            <div className="col-lg-5 d-none d-lg-block">
              <div className="row g-2">
                {[
                  { icon:'mortarboard-fill',              label:'ICT — A/L',            students:142, color:'#3b82f6' },
                  { icon:'code-slash',                    label:'Web Development',       students:98,  color:'#10b981' },
                  { icon:'hdd-network-fill',              label:'Hardware & Networking', students:76,  color:'#f59e0b' },
                  { icon:'file-earmark-spreadsheet-fill', label:'Office Automation',     students:215, color:'#8b5cf6' },
                  { icon:'brush-fill',                    label:'Graphic Design',        students:64,  color:'#ec4899' },
                  { icon:'cpu-fill',                      label:'Software Development',  students:88,  color:'#06b6d4' },
                  { icon:'shield-lock-fill',              label:'Cybersecurity',         students:53,  color:'#ef4444' },
                  { icon:'bar-chart-line-fill',           label:'Data Science & AI',     students:45,  color:'#f97316' },
                ].map((c,i) => (
                  <div key={i} className="col-6">
                    <div className="p-3 rounded-3 d-flex align-items-center gap-2"
                         style={{
                           background:'rgba(255,255,255,.06)',
                           border:'1px solid rgba(255,255,255,.1)',
                           backdropFilter:'blur(8px)',
                           animation:`fadeSlideUp .4s ease ${i*0.08}s both`,
                           transition:'background .2s',
                         }}
                         onMouseEnter={e => e.currentTarget.style.background=`${c.color}25`}
                         onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.06)'}
                    >
                      <div className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                           style={{ width:38, height:38, background:`${c.color}22` }}>
                        <i className={`bi bi-${c.icon}`} style={{ color:c.color, fontSize:'1.1rem' }}/>
                      </div>
                      <div>
                        <div className="text-white fw-semibold" style={{ fontSize:'.78rem', lineHeight:1.2 }}>
                          {c.label}
                        </div>
                        <div style={{ color:c.color, fontSize:'.7rem' }}>
                          {c.students} students
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="position-absolute bottom-0 start-50 translate-middle-x pb-3 text-white opacity-50"
             style={{ animation:'bounce 2s infinite' }}>
          <i className="bi bi-chevron-double-down fs-5"/>
        </div>
      </section>

      {/* ── Stats Banner ─── */}
      <section style={{ background:'linear-gradient(135deg,#1a3c6e,#2563eb)', padding:'48px 0' }}>
        <div className="container">
          <div className="row g-4 justify-content-center">
            {[
              { end:2000, suffix:'+', label:'Students Enrolled'   },
              { end:50,   suffix:'+', label:'Expert Teachers'     },
              { end:10,   suffix:'+', label:'Years of Excellence' },
              { end:95,   suffix:'%', label:'Pass Rate'           },
            ].map((s,i) => (
              <div key={i} className="col-6 col-md-3">
                <StatCounter {...s}/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Courses Section ─── */}
      <section className="py-5" style={{ background:'#f8fafc' }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill mb-3">
              Our Programs
            </span>
            <h2 className="fw-bold mb-3" style={{ color:'#0f172a', fontSize:'2rem' }}>
              Courses We Offer
            </h2>
            <p className="text-muted mx-auto" style={{ maxWidth:520 }}>
              Choose from our range of carefully designed courses taught by 
              experienced educators with proven track records.
            </p>
          </div>

          <div className="row g-4">
            {COURSES.map((c,i) => (
              <div key={i} className="col-sm-6 col-lg-3">
                <div className="card border-0 h-100 shadow-sm position-relative overflow-hidden"
                     style={{ borderRadius:16, transition:'transform .25s, box-shadow .25s' }}
                     onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow='0 20px 40px rgba(0,0,0,.12)'; }}
                     onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>

                  {/* Colored top accent */}
                  <div style={{ height:4, background:c.color, borderRadius:'16px 16px 0 0' }}/>

                  {/* Badge */}
                  {c.badge && (
                    <div className="position-absolute top-0 end-0 mt-2 me-2">
                      <span className="badge fw-semibold px-2 py-1"
                            style={{ background:c.color, fontSize:'.65rem', borderRadius:6 }}>
                        {c.badge}
                      </span>
                    </div>
                  )}

                  <div className="card-body p-4">
                    {/* Icon */}
                    <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                         style={{ width:52, height:52, background:c.bg }}>
                      <i className={`bi bi-${c.icon} fs-4`} style={{ color:c.color }}/>
                    </div>

                    {/* Title */}
                    <h6 className="fw-bold mb-2" style={{ fontSize:'.92rem', lineHeight:1.4 }}>
                      {c.title}
                    </h6>

                    {/* Description */}
                    <p className="text-muted mb-3" style={{ fontSize:'.82rem', lineHeight:1.6 }}>
                      {c.desc}
                    </p>

                    {/* Duration + Fee */}
                    <div className="d-flex justify-content-between pt-3"
                         style={{ borderTop:`1px solid ${c.bg}` }}>
                      <div>
                        <div className="text-muted" style={{ fontSize:'.65rem', textTransform:'uppercase', letterSpacing:'.05em' }}>Duration</div>
                        <div className="fw-semibold small">{c.duration}</div>
                      </div>
                      <div className="text-end">
                        <div className="text-muted" style={{ fontSize:'.65rem', textTransform:'uppercase', letterSpacing:'.05em' }}>Fee</div>
                        <div className="fw-bold small" style={{ color:c.color }}>{c.fee}</div>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="card-footer border-0 bg-transparent px-4 pb-4 pt-0">
                    <Link to="/contact"
                      className="btn btn-sm w-100 fw-semibold"
                      style={{ background:c.bg, color:c.color, border:`1px solid ${c.color}22`,
                               borderRadius:8, transition:'all .2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background=c.color; e.currentTarget.style.color='#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background=c.bg; e.currentTarget.style.color=c.color; }}>
                      Enroll Now →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ─── */}
      <section className="py-5">
        <div className="container py-4">
          <div className="row align-items-center g-5">
            <div className="col-lg-5">
              <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill mb-3">
                Why Nenasala
              </span>
              <h2 className="fw-bold mb-4" style={{ color:'#0f172a', fontSize:'2rem', lineHeight:1.3 }}>
                Why Thousands Choose Us Every Year
              </h2>
              <p className="text-muted mb-4" style={{ lineHeight:1.8 }}>
                We combine qualified teachers, modern facilities, and a proven 
                teaching methodology to help every student reach their full potential.
              </p>
              <Link to="/about" className="btn btn-primary rounded-pill px-5">
                <i className="bi bi-arrow-right-circle me-2"/>Read Our Story
              </Link>
            </div>
            <div className="col-lg-7">
              <div className="row g-3">
                {FEATURES.map((f,i) => (
                  <div key={i} className="col-sm-6">
                    <div className="d-flex gap-3 p-3 rounded-3"
                         style={{ background:'#f8fafc', border:'1px solid #e2e8f0',
                                  transition:'all .2s' }}
                         onMouseEnter={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.08)'; }}
                         onMouseLeave={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.boxShadow=''; }}>
                      <div className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                           style={{ width:42, height:42, background:`${f.color}15` }}>
                        <i className={`bi bi-${f.icon}`} style={{ color:f.color, fontSize:'1.1rem' }}/>
                      </div>
                      <div>
                        <div className="fw-semibold small mb-1">{f.title}</div>
                        <div className="text-muted" style={{ fontSize:'.78rem', lineHeight:1.5 }}>
                          {f.desc}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─── */}
      <section className="py-5" style={{ background:'#f8fafc' }}>
        <div className="container py-4">
          <div className="text-center mb-5">
  <span className="badge bg-warning-subtle text-warning px-3 py-2 rounded-pill mb-3">
    Student Success Stories
  </span>
  <h2 className="fw-bold" style={{ color: '#0f172a', fontSize: '2rem' }}>
    What Our IT Students Say
  </h2>
  <p className="text-muted mt-3">
    Hear from students who have gained valuable IT skills and advanced their careers through our training programs.
  </p>
</div>
          <div className="row g-4">
            {TESTIMONIALS.map((t,i) => (
              <div key={i} className="col-md-4">
                <div className="card border-0 shadow-sm h-100 p-4" style={{ borderRadius:16 }}>
                  {/* Stars */}
                  <div className="d-flex gap-1 mb-3">
                    {[...Array(5)].map((_,j) => (
                      <i key={j} className="bi bi-star-fill text-warning" style={{ fontSize:'.9rem' }}/>
                    ))}
                  </div>
                  <p className="text-muted mb-4" style={{ lineHeight:1.7, fontSize:'.92rem' }}>
                    "{t.text}"
                  </p>
                  <div className="d-flex align-items-center gap-3 mt-auto">
                    <div className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
                         style={{ width:44, height:44, background:'linear-gradient(135deg,#1a3c6e,#2563eb)',
                                  fontSize:'1rem', flexShrink:0 }}>
                      {t.avatar}
                    </div>
                    <div>
                      <div className="fw-semibold small">{t.name}</div>
                      <div className="text-muted" style={{ fontSize:'.75rem' }}>
                        {t.course} · Class of {t.year}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─── */}
      <section style={{ background:'linear-gradient(135deg,#1a3c6e 0%,#2563eb 100%)', padding:'72px 0' }}>
        <div className="container text-center">
          <h2 className="fw-bold text-white mb-3" style={{ fontSize:'2rem' }}>
            Ready to Start Your Journey?
          </h2>
          <p className="text-white mb-5" style={{ opacity:.8, maxWidth:480, margin:'0 auto 2rem' }}>
            Enroll today and take the first step towards achieving your academic goals 
            with Sri Lanka's most trusted institute.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/contact"
              className="btn btn-warning btn-lg rounded-pill px-5 fw-bold"
              style={{ color:'#0f172a' }}>
              <i className="bi bi-person-plus-fill me-2"/>Apply Now
            </Link>
            <Link to="/about"
              className="btn btn-outline-light btn-lg rounded-pill px-5 fw-semibold">
              <i className="bi bi-info-circle me-2"/>Learn More
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes bounce {
          0%,100%{transform:translateX(-50%) translateY(0)}
          50%{transform:translateX(-50%) translateY(-8px)}
        }
        @keyframes fadeSlideUp {
          from{opacity:0;transform:translateY(20px)}
          to{opacity:1;transform:translateY(0)}
        }
      `}</style>
    </div>
  );
}
