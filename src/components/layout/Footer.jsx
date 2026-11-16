import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background:'#0f172a', color:'#cbd5e1' }}>

      {/* Main footer */}
      <div className="container py-5">
        <div className="row g-5">

          {/* Brand col */}
          <div className="col-lg-4">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="d-flex align-items-center justify-content-center rounded-circle"
                   style={{ width:48, height:48, background:'linear-gradient(135deg,#1a3c6e,#2563eb)' }}>
                <i className="bi bi-mortarboard-fill text-white fs-5"/>
              </div>
              <div>
                <div className="fw-bold text-white fs-5 lh-1">Nenasala</div>
                <div className="text-warning lh-1" style={{ fontSize:'.72rem', letterSpacing:'.08em' }}>
                  INSTITUTE
                </div>
              </div>
            </div>
            <p style={{ fontSize:'.9rem', lineHeight:1.7 }}>
              Empowering students with practical IT education since 2015. We offer industry-focused courses in Programming, Web Development, Computer Applications, Networking, and Digital Skills with experienced instructors and modern facilities.

            </p>
            {/* Social links */}
            <div className="d-flex gap-2 mt-3">
              {[
                { icon:'facebook',  href:'#', color:'#1877f2' },
                { icon:'instagram', href:'#', color:'#e1306c' },
                { icon:'youtube',   href:'#', color:'#ff0000' },
                { icon:'whatsapp',  href:'#', color:'#25d366' },
              ].map(s => (
                <a key={s.icon} href={s.href}
                   className="d-flex align-items-center justify-content-center rounded-circle"
                   style={{ width:38, height:38, background:'rgba(255,255,255,.08)',
                            color:'#fff', textDecoration:'none', transition:'all .2s' }}
                   onMouseEnter={e => e.currentTarget.style.background = s.color}
                   onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'}
                >
                  <i className={`bi bi-${s.icon}`}/>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-sm-6 col-lg-2">
            <h6 className="text-white fw-bold mb-3 text-uppercase"
                style={{ letterSpacing:'.06em', fontSize:'.8rem' }}>
              Quick Links
            </h6>
            <ul className="list-unstyled">
              {[
                { to:'/',        label:'Home'    },
                { to:'/about',   label:'About Us'},
                { to:'/contact', label:'Contact' },
                { to:'/login',   label:'Student Portal'},
                { to:'/login',   label:'Teacher Portal'},
              ].map((l,i) => (
                <li key={i} className="mb-2">
                  <Link to={l.to}
                    className="text-decoration-none d-flex align-items-center gap-2"
                    style={{ color:'#94a3b8', fontSize:'.88rem' }}
                    onMouseEnter={e => e.currentTarget.style.color='#fff'}
                    onMouseLeave={e => e.currentTarget.style.color='#94a3b8'}
                  >
                    <i className="bi bi-chevron-right small"/>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Courses */}
          <div className="col-sm-6 col-lg-3">
            <h6 className="text-white fw-bold mb-3 text-uppercase"
                style={{ letterSpacing:'.06em', fontSize:'.8rem' }}>
              Our Courses
            </h6>
            <ul className="list-unstyled">
              {[
                { icon:'mortarboard', label:'Computer Hardware & Networking' },
                { icon:'mortarboard', label:'Cybersecurity Fundamentals' },
                { icon:'mortarboard', label:'Data Science & AI' },
                { icon:'mortarboard',  label:'Graphic Design' },
                { icon:'mortarboard',  label:'ICT — Advanced Level' },
                 { icon:'mortarboard',  label:'Office Automation' },
                  { icon:'mortarboard',  label:'Software Development' },
                   { icon:'mortarboard',  label:'Web Development' },
              
              ].map((c,i) => (
                <li key={i} className="mb-3 d-flex gap-2">
                  <i className={`bi bi-${c.icon} mt-1 text-primary`}/>
                  <div>
                    <div style={{ color:'#e2e8f0', fontSize:'.88rem' }}>{c.label}</div>
                    <div style={{ color:'#64748b', fontSize:'.75rem' }}>{c.sub}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-lg-3">
            <h6 className="text-white fw-bold mb-3 text-uppercase"
                style={{ letterSpacing:'.06em', fontSize:'.8rem' }}>
              Contact Us
            </h6>
            <ul className="list-unstyled">
              {[
                { icon:'geo-alt-fill',   text:'nenasala Institute , Deniyaya , Sri Lanka' },
                { icon:'telephone-fill', text:'+94 11 234 5678' },
                { icon:'envelope-fill',  text:'info@nenasala.lk' },
                { icon:'clock-fill',     text:'Mon–Fri: 8:00 AM – 7:00 PM\nSat: 8:00 AM – 4:00 PM' },
              ].map((c,i) => (
                <li key={i} className="mb-3 d-flex gap-2 align-items-start">
                  <i className={`bi bi-${c.icon} text-primary mt-1 flex-shrink-0`}/>
                  <span style={{ color:'#94a3b8', fontSize:'.88rem', whiteSpace:'pre-line' }}>
                    {c.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,.06)' }}>
        <div className="container py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <small style={{ color:'#475569' }}>
            © {year} Nenasala Institute. All rights reserved.
          </small>
          <div className="d-flex gap-3">
            {['Privacy Policy','Terms of Use','Sitemap'].map(t => (
              <a key={t} href="#" style={{ color:'#475569', textDecoration:'none', fontSize:'.8rem' }}
                 onMouseEnter={e => e.currentTarget.style.color='#94a3b8'}
                 onMouseLeave={e => e.currentTarget.style.color='#475569'}>
                {t}
              </a>
            ))}
          </div>
        </div>
      </div>

    </footer>
  );
}
