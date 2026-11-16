import React, { useEffect, useState, useCallback } from 'react';
import { noticesAPI } from '../../services/api';
import { toast } from 'react-toastify';

const AUDIENCE_BADGE = {
  all:     { bg: 'bg-info',    icon: 'globe'        },
  student: { bg: 'bg-primary', icon: 'mortarboard'  },
  teacher: { bg: 'bg-success', icon: 'person-badge' },
  admin:   { bg: 'bg-warning text-dark', icon: 'shield' },
};

export default function StudentNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    noticesAPI.list()
      .then(r => setNotices(r.data.data ?? []))
      .catch(() => toast.error('Failed to load notices'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary"/>
      <p className="text-muted mt-2 small">Loading notices…</p>
    </div>
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">
            <i className="bi bi-megaphone-fill me-2"/>Notices
          </h4>
          <small className="text-muted">{notices.length} notice{notices.length !== 1 ? 's' : ''}</small>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={load}>
          <i className="bi bi-arrow-clockwise me-1"/>Refresh
        </button>
      </div>

      {notices.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-megaphone fs-1 d-block mb-2 opacity-25"/>
          <h6>No notices for you right now</h6>
          <p className="small">Check back later for updates from your teachers and admin.</p>
        </div>
      ) : (
        <div className="row">
          {notices.map(n => {
            const badge = AUDIENCE_BADGE[n.audience] ?? { bg: 'bg-secondary', icon: 'bell' };
            return (
              <div key={n.id} className="col-lg-6 mb-3">
                <div className="card h-100 border-0 shadow-sm">
                  {/* Colored top accent bar */}
                  <div style={{
                    height: 4,
                    background: n.audience === 'all' ? '#06b6d4'
                      : n.audience === 'student' ? '#3b82f6'
                      : n.audience === 'teacher' ? '#10b981'
                      : '#f59e0b',
                    borderRadius: '8px 8px 0 0'
                  }}/>
                  <div className="card-body">
                    {/* Badge */}
                    <div className="mb-2">
                      <span className={`badge ${badge.bg}`} style={{ fontSize: '.72rem' }}>
                        <i className={`bi bi-${badge.icon} me-1`}/>
                        {n.audience === 'all' ? 'For Everyone' : 'For ' + n.audience.charAt(0).toUpperCase() + n.audience.slice(1) + 's'}
                      </span>
                    </div>

                    {/* Title */}
                    <h6 className="fw-bold mb-2">{n.title}</h6>

                    {/* Content */}
                    <p className="text-muted mb-3" style={{ fontSize: '.9rem', lineHeight: 1.7 }}>
                      {n.content}
                    </p>

                    {/* Footer */}
                    <div className="d-flex align-items-center gap-2 pt-2 border-top">
                      <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                           style={{ width: 30, height: 30, background: '#6366f1', fontSize: '.75rem', flexShrink: 0 }}>
                        {n.posted_by_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="small fw-semibold text-dark">{n.posted_by_name}</div>
                        <div className="text-muted" style={{ fontSize: '.72rem' }}>
                          <i className="bi bi-clock me-1"/>
                          {n.created_at
                            ? new Date(n.created_at).toLocaleString('en-LK', {
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : '—'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
