import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const NAV = [
  { to: '/student',             icon: 'speedometer2',   label: 'Dashboard',  end: true },
  { to: '/student/profile',     icon: 'person-circle',  label: 'My Profile'  },
  { to: '/student/timetable',   icon: 'calendar3',      label: 'Timetable'   },
  { to: '/student/attendance',  icon: 'check2-square',  label: 'Attendance'  },
  { to: '/student/results',     icon: 'award',          label: 'Results'     },
  { to: '/student/fees',        icon: 'cash-stack',     label: 'Fees'        },
  { to: '/student/materials',   icon: 'folder-fill',    label: 'Materials'   },
  { to: '/student/notices',     icon: 'megaphone-fill', label: 'Notices'     },
];

export default function StudentLayout() {
  const { user, logout }          = useAuth();
  const navigate                  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showDrop,  setShowDrop]  = useState(false);

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'S';
  const today   = new Date().toLocaleDateString('en-LK', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="d-flex" style={{ minHeight: '100vh', background: '#f1f5f9' }}>

      {/* Sidebar */}
      <nav
        className="d-flex flex-column"
        style={{
          width: collapsed ? 0 : 240,
          minWidth: collapsed ? 0 : 240,
          overflow: 'hidden',
          transition: 'width .25s, min-width .25s',
          background: '#0f2547',
          zIndex: 100,
        }}
      >
        {/* Brand */}
        <div className="d-flex align-items-center gap-2 px-3 py-3"
             style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <div className="d-flex align-items-center justify-content-center rounded-circle"
               style={{ width: 38, height: 38, background: '#6366f1', flexShrink: 0 }}>
            <i className="bi bi-mortarboard text-white"/>
          </div>
          <div>
            <div className="fw-bold text-white" style={{ lineHeight: 1.2 }}>Nenasala IMS</div>
            <div className="text-white opacity-50" style={{ fontSize: '.7rem' }}>Student Portal</div>
          </div>
        </div>

        {/* Student info */}
        <div className="px-3 py-2 d-flex align-items-center gap-2"
             style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
               style={{ width: 34, height: 34, background: '#6366f1', fontSize: '.85rem', flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div className="text-white small fw-semibold text-truncate">{user?.name}</div>
            <div className="text-uppercase opacity-50" style={{ fontSize: '.65rem', color: '#fff' }}>Student</div>
          </div>
        </div>

        {/* Nav */}
        <ul className="nav flex-column flex-grow-1 py-2 overflow-auto">
          {NAV.map(n => (
            <li key={n.to} className="nav-item">
              <NavLink
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-2 mx-2 rounded-2 ${isActive ? 'active' : ''}`
                }
                style={({ isActive }) => ({
                  color: isActive ? '#fff' : 'rgba(255,255,255,.7)',
                  background: isActive ? 'rgba(255,255,255,.15)' : 'transparent',
                  padding: '9px 12px',
                  marginBottom: 2,
                })}
              >
                <i className={`bi bi-${n.icon}`} style={{ width: 18, textAlign: 'center' }}/>
                <span style={{ fontSize: '.88rem' }}>{n.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Logout */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
          <button
            className="btn w-100 d-flex align-items-center gap-2 py-2 rounded-3"
            style={{ background: 'rgba(239,68,68,.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,.3)' }}
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-left"/>
            <span className="fw-semibold small">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>

        {/* Top bar */}
        <header className="d-flex align-items-center justify-content-between px-4"
                style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.08)', height: 60, flexShrink: 0 }}>

          <button className="btn btn-sm btn-light border rounded-2"
                  onClick={() => setCollapsed(c => !c)}>
            <i className="bi bi-list fs-5"/>
          </button>

          <span className="text-muted small d-none d-md-block">{today}</span>

          {/* Dropdown */}
          <div className="position-relative">
            <button
              className="btn btn-light d-flex align-items-center gap-2 rounded-3 border"
              onClick={() => setShowDrop(d => !d)}
            >
              <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                   style={{ width: 32, height: 32, background: '#6366f1', fontSize: '.8rem' }}>
                {initial}
              </div>
              <span className="fw-semibold small d-none d-sm-inline">{user?.name}</span>
              <i className={`bi bi-chevron-${showDrop ? 'up' : 'down'} small text-muted`}/>
            </button>

            {showDrop && (
              <>
                <div className="position-fixed top-0 start-0 w-100 h-100"
                     style={{ zIndex: 1000 }} onClick={() => setShowDrop(false)}/>
                <div className="position-absolute end-0 mt-1 bg-white border rounded-3 shadow"
                     style={{ minWidth: 200, zIndex: 1001 }}>
                  <div className="px-3 py-2 border-bottom">
                    <div className="fw-semibold">{user?.name}</div>
                    <div className="text-muted small">{user?.email}</div>
                    <span className="badge mt-1" style={{ background: '#6366f1' }}>STUDENT</span>
                  </div>
                  <div className="p-1">
                    <button
                      className="btn btn-sm w-100 text-start d-flex align-items-center gap-2 text-danger rounded-2"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right"/>
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-grow-1 p-4" style={{ overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
