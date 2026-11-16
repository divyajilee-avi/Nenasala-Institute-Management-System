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

export default function NoticesPage() {
  const { user }                      = useAuth();
  const [notices,  setNotices]        = useState([]);
  const [loading,  setLoading]        = useState(false);
  const [saving,   setSaving]         = useState(false);
  const [modal,    setModal]          = useState(false);
  const [deleting, setDeleting]       = useState(null);
  const [form,     setForm]           = useState(INIT_FORM);
  const [errors,   setErrors]         = useState({});

  /* ── Load ─────────────────────────────────────── */
  const load = useCallback(() => {
    setLoading(true);
    noticesAPI.list()
      .then(r => setNotices(r.data.data ?? []))
      .catch(() => toast.error('Failed to load notices'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Validate ─────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.title.trim())   e.title   = 'Title is required';
    if (!form.content.trim()) e.content = 'Content is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Post notice ──────────────────────────────── */
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
      .catch(err => toast.error(err.response?.data?.message ?? 'Failed to post notice'))
      .finally(() => setSaving(false));
  };

  /* ── Delete notice ────────────────────────────── */
  const del = (id) => {
    if (!window.confirm('Delete this notice?')) return;
    setDeleting(id);
    noticesAPI.delete(id)
      .then(() => { toast.success('Notice deleted'); load(); })
      .catch(() => toast.error('Failed to delete'))
      .finally(() => setDeleting(null));
  };

  const openModal = () => { setForm(INIT_FORM); setErrors({}); setModal(true); };

  const isAdmin = user?.role === 'admin';

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
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openModal}>
          <i className="bi bi-plus-lg"/>Post Notice
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"/>
          <p className="text-muted mt-2 small">Loading notices…</p>
        </div>
      )}

      {/* Notice cards */}
      {!loading && (
        <div className="row">
          {notices.map(n => (
            <div key={n.id} className="col-lg-6 mb-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  {/* Card header */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className={`badge ${AUDIENCE_BADGE[n.audience] ?? 'bg-secondary'}`}>
                        <i className={`bi bi-${n.audience === 'all' ? 'globe' : n.audience === 'student' ? 'mortarboard' : n.audience === 'teacher' ? 'person-badge' : 'shield'} me-1`}/>
                        {n.audience === 'all' ? 'Everyone' : n.audience.charAt(0).toUpperCase() + n.audience.slice(1) + 's'}
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => del(n.id)}
                        disabled={deleting === n.id}
                        title="Delete notice"
                      >
                        {deleting === n.id
                          ? <span className="spinner-border spinner-border-sm"/>
                          : <i className="bi bi-trash"/>
                        }
                      </button>
                    )}
                  </div>

                  {/* Title */}
                  <h6 className="fw-bold mb-1">{n.title}</h6>

                  {/* Content */}
                  <p className="text-muted mb-3" style={{ fontSize: '.88rem', lineHeight: 1.6 }}>
                    {n.content}
                  </p>

                  {/* Footer */}
                  <div className="d-flex align-items-center gap-2 pt-2 border-top">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                         style={{ width: 28, height: 28, fontSize: '.7rem', flexShrink: 0 }}>
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
              <p className="small">Post a notice to inform students or teachers.</p>
              <button className="btn btn-outline-primary btn-sm" onClick={openModal}>
                <i className="bi bi-plus-lg me-1"/>Post First Notice
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Post Notice Modal ─────────────────────── */}
      {modal && (
        <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">

              <div className="modal-header"
                   style={{ background: 'linear-gradient(135deg,#1a3c6e,#2563eb)', color: '#fff' }}>
                <h5 className="modal-title">
                  <i className="bi bi-megaphone-fill me-2"/>Post New Notice
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setModal(false)}/>
              </div>

              <form onSubmit={save}>
                <div className="modal-body">

                  {/* Title */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">
                      Notice Title <span className="text-danger">*</span>
                    </label>
                    <input
                      className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                      value={form.title}
                      onChange={e => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: '' }); }}
                      placeholder="e.g. Exam Schedule Changed"
                    />
                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                  </div>

                  {/* Content */}
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
                    <div className="form-text">{form.content.length} characters</div>
                  </div>

                  {/* Audience */}
                  <div className="mb-2">
                    <label className="form-label fw-semibold small">Send To</label>
                    <div className="d-flex gap-2 flex-wrap">
                      {[
                        { value: 'all',     label: 'Everyone',  icon: 'globe',        color: 'info'    },
                        { value: 'student', label: 'Students',  icon: 'mortarboard',  color: 'primary' },
                        { value: 'teacher', label: 'Teachers',  icon: 'person-badge', color: 'success' },
                        { value: 'admin',   label: 'Admin',     icon: 'shield',       color: 'warning' },
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
                  <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={saving}>
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
