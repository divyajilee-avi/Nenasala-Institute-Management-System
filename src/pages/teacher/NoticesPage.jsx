import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { noticesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AUDIENCE_BADGE = {
  all:     'bg-info',
  student: 'bg-primary',
  teacher: 'bg-success',
  admin:   'bg-warning text-dark',
};

const INIT_FORM = { title: '', content: '', audience: 'all' };

export default function TeacherNoticesPage() {
  const { user }                = useAuth();
  const [notices,  setNotices]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(INIT_FORM);
  const [errors,   setErrors]   = useState({});

  const load = useCallback(() => {
    setLoading(true);
    noticesAPI.list()
      .then(r => setNotices(r.data.data ?? []))
      .catch(() => toast.error('Failed to load notices'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const validate = () => {
    const e = {};
    if (!form.title.trim())   e.title   = 'Title is required';
    if (!form.content.trim()) e.content = 'Content is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    noticesAPI.create(form)
      .then(() => {
        toast.success('Notice posted successfully');
        setModal(false);
        setForm(INIT_FORM);
        setErrors({});
        load();
      })
      .catch(err => toast.error(err.response?.data?.message ?? 'Failed to post'))
      .finally(() => setSaving(false));
  };

  return (
    <>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">
            <i className="bi bi-megaphone-fill me-2"/>Notices
          </h4>
          <small className="text-muted">{notices.length} notice{notices.length !== 1 ? 's' : ''}</small>
        </div>
        <button className="btn btn-success d-flex align-items-center gap-2"
                onClick={() => { setForm(INIT_FORM); setErrors({}); setModal(true); }}>
          <i className="bi bi-plus-lg"/>Post Notice
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-success"/>
          <p className="text-muted mt-2 small">Loading notices…</p>
        </div>
      )}

      {/* Cards */}
      {!loading && (
        <div className="row">
          {notices.map(n => (
            <div key={n.id} className="col-lg-6 mb-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                    <span className={`badge ${AUDIENCE_BADGE[n.audience] ?? 'bg-secondary'}`}>
                      <i className={`bi bi-${n.audience === 'all' ? 'globe' : n.audience === 'student' ? 'mortarboard' : 'person-badge'} me-1`}/>
                      {n.audience === 'all' ? 'Everyone' : n.audience.charAt(0).toUpperCase() + n.audience.slice(1) + 's'}
                    </span>
                    {/* Teacher can only delete their own notices */}
                    {n.posted_by_name === user?.name && (
                      <span className="badge bg-secondary ms-auto">Your Notice</span>
                    )}
                  </div>

                  <h6 className="fw-bold mb-1">{n.title}</h6>
                  <p className="text-muted mb-3" style={{ fontSize: '.88rem', lineHeight: 1.6 }}>
                    {n.content}
                  </p>

                  <div className="d-flex align-items-center gap-2 pt-2 border-top">
                    <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                         style={{ width: 28, height: 28, background: '#10b981', fontSize: '.7rem', flexShrink: 0 }}>
                      {n.posted_by_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="small fw-semibold">{n.posted_by_name}</div>
                      <div className="text-muted" style={{ fontSize: '.72rem' }}>
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
          ))}

          {!notices.length && !loading && (
            <div className="col-12 text-center py-5 text-muted">
              <i className="bi bi-megaphone fs-1 d-block mb-2 opacity-25"/>
              <h6>No notices yet</h6>
              <p className="small">Post a notice to inform students.</p>
            </div>
          )}
        </div>
      )}

      {/* Post Modal */}
      {modal && (
        <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">

              <div className="modal-header"
                   style={{ background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff' }}>
                <h5 className="modal-title">
                  <i className="bi bi-megaphone-fill me-2"/>Post New Notice
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setModal(false)}/>
              </div>

              <form onSubmit={save}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">
                      Title <span className="text-danger">*</span>
                    </label>
                    <input
                      className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                      value={form.title}
                      onChange={e => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: '' }); }}
                      placeholder="Notice title…"
                    />
                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">
                      Content <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className={`form-control ${errors.content ? 'is-invalid' : ''}`}
                      rows={5}
                      value={form.content}
                      onChange={e => { setForm({ ...form, content: e.target.value }); setErrors({ ...errors, content: '' }); }}
                      placeholder="Write the notice content here…"
                    />
                    {errors.content && <div className="invalid-feedback">{errors.content}</div>}
                  </div>

                  <div>
                    <label className="form-label fw-semibold small">Send To</label>
                    <div className="d-flex gap-2 flex-wrap">
                      {[
                        { value: 'all',     label: 'Everyone', icon: 'globe',       color: 'info'    },
                        { value: 'student', label: 'Students', icon: 'mortarboard', color: 'primary' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`btn btn-sm ${form.audience === opt.value ? `btn-${opt.color}` : `btn-outline-${opt.color}`}`}
                          onClick={() => setForm({ ...form, audience: opt.value })}
                        >
                          <i className={`bi bi-${opt.icon} me-1`}/>{opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary"
                          onClick={() => setModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success px-4" disabled={saving}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2"/>Posting…</>
                      : <><i className="bi bi-send me-1"/>Post Notice</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
