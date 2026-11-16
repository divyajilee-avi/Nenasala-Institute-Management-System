import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const NAV = [
  { to: '/admin',            icon: 'speedometer2',         label: 'Dashboard'  },
  { to: '/admin/students',   icon: 'people-fill',          label: 'Students'   },
  { to: '/admin/teachers',   icon: 'person-badge-fill',    label: 'Teachers'   },
  { to: '/admin/courses',    icon: 'book-fill',            label: 'Courses'    },
  { to: '/admin/classes',    icon: 'calendar3',            label: 'Timetable'  },
  { to: '/admin/attendance', icon: 'check2-square',        label: 'Attendance' },
  { to: '/admin/fees',       icon: 'cash-stack',           label: 'Fees'       },
  { to: '/admin/exams',      icon: 'pencil-square',        label: 'Exams'      },
  { to: '/admin/notices',    icon: 'megaphone-fill',       label: 'Notices'    },
  { to: '/admin/users',      icon: 'shield-lock-fill',     label: 'Users'      },
  { to: '/admin/reports',    icon: 'file-earmark-bar-graph-fill', label: 'Reports' },
];

export default function AdminLayout() {
  const { user, logout }          = useAuth();
  const navigate                  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showDrop,  setShowDrop]  = useState(false);

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'A';
  const today   = new Date().toLocaleDateString('en-LK', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="d-flex" style={{ minHeight: '100vh', background: '#f1f5f9' }}>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <nav
        className="sidebar d-flex flex-column"
        style={{
          width: collapsed ? 0 : 250,
          minWidth: collapsed ? 0 : 250,
          overflow: 'hidden',
          transition: 'width .25s, min-width .25s',
          background: '#0f2547',
          zIndex: 100,
        }}
      >
        {/* Brand */}
        <div className="sidebar-brand d-flex align-items-center gap-2 px-3 py-3"
             style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <div className="d-flex align-items-center justify-content-center rounded-circle bg-warning"
               style={{ width: 38, height: 38, flexShrink: 0 }}>
            <i className="bi bi-pc-display-horizontal text-dark"/>
          </div>
          <div>
            <div className="fw-bold text-white" style={{ lineHeight: 1.2 }}>Nenasala IT</div>
            <div className="text-white opacity-50" style={{ fontSize: '.7rem' }}>Administration</div>
          </div>
        </div>

        {/* Admin info */}
        <div className="px-3 py-2 d-flex align-items-center gap-2"
             style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
               style={{ width: 34, height: 34, fontSize: '.85rem', flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div className="text-white small fw-semibold text-truncate">{user?.name}</div>
            <div className="text-uppercase opacity-50" style={{ fontSize: '.65rem', color: '#fff' }}>
              {user?.role}
            </div>
          </div>
        </div>

        {/* Nav links */}
        <ul className="nav flex-column flex-grow-1 py-2 overflow-auto">
          {NAV.map(n => (
            <li key={n.to} className="nav-item">
              <NavLink
                to={n.to}
                end={n.to === '/admin'}
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

        {/* Sidebar footer — Logout */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
          <button
            className="btn w-100 d-flex align-items-center gap-2 py-2 rounded-3"
            style={{ background: 'rgba(239,68,68,.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,.3)' }}
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-left"/>
            <span className="fw-semibold small">Logout</span>
          </button>
          <div className="text-center mt-2" style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)' }}>
            v1.0.0
          </div>
        </div>
      </nav>

      {/* ── Main area ──────────────────────────────────── */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>

        {/* Top Navbar */}
        <header className="top-navbar d-flex align-items-center justify-content-between px-4"
                style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.08)', height: 60, flexShrink: 0 }}>

          {/* Hamburger */}
          <button
            className="btn btn-sm btn-light border rounded-2"
            onClick={() => setCollapsed(c => !c)}
            title="Toggle sidebar"
          >
            <i className="bi bi-list fs-5"/>
          </button>

          {/* Center — page date */}
          <span className="text-muted small d-none d-md-block">{today}</span>

          {/* Right — user dropdown */}
          <div className="position-relative">
            <button
              className="btn btn-light d-flex align-items-center gap-2 rounded-3 border"
              onClick={() => setShowDrop(d => !d)}
            >
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                   style={{ width: 32, height: 32, fontSize: '.8rem' }}>
                {initial}
              </div>
              <span className="fw-semibold small d-none d-sm-inline">{user?.name}</span>
              <i className={`bi bi-chevron-${showDrop ? 'up' : 'down'} small text-muted`}/>
            </button>

            {showDrop && (
              <>
                {/* Backdrop */}
                <div
                  className="position-fixed top-0 start-0 w-100 h-100"
                  style={{ zIndex: 1000 }}
                  onClick={() => setShowDrop(false)}
                />
                {/* Dropdown */}
                <div
                  className="position-absolute end-0 mt-1 bg-white border rounded-3 shadow"
                  style={{ minWidth: 200, zIndex: 1001 }}
                >
                  <div className="px-3 py-2 border-bottom">
                    <div className="fw-semibold">{user?.name}</div>
                    <div className="text-muted small">{user?.email}</div>
                    <span className="badge bg-primary mt-1">{user?.role?.toUpperCase()}</span>
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

        {/* Page content */}
        <main className="flex-grow-1 p-4" style={{ overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
