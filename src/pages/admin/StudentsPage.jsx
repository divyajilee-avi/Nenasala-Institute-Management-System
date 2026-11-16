import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { studentsAPI, coursesAPI } from '../../services/api';

/* ── default form values ─────────────────────────────── */
const freshForm = () => ({
  name: '', email: '', password: 'Student@123',
  course_id: '', phone: '', address: '',
  dob: '', gender: 'male',
  guardian_name: '', guardian_phone: '',
  admission_date: new Date().toISOString().slice(0, 10),
  status: 'active',
});

export default function StudentsPage() {
  const [students,   setStudents]   = useState([]);
  const [courses,    setCourses]    = useState([]);
  const [pagination, setPagination] = useState({});
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(freshForm);
  const [err,        setErr]        = useState({});

  /* ── load students ───────────────────────────── */
  const load = useCallback(() => {
    setLoading(true);
    studentsAPI.list({ page, per_page: 10, search })
      .then(r => {
        setStudents(r.data.data ?? []);
        setPagination(r.data.pagination ?? {});
      })
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    coursesAPI.list()
      .then(r => setCourses(r.data.data ?? []))
      .catch(() => {});
  }, []);

  /* ── field helpers ───────────────────────────── */
  const setField = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErr(e => ({ ...e, [field]: '' }));
  };

  /* ── validate ────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.name.trim())   e.name      = 'Full name is required';
    if (!form.email.trim())  e.email     = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
    if (!form.course_id)     e.course_id = 'Please select a course';
    if (!editing && form.password.length < 6) e.password = 'Min. 6 characters';
    setErr(e);
    return Object.keys(e).length === 0;
  };

  /* ── open / close ────────────────────────────── */
  const openAdd = () => {
    setEditing(null);
    setForm(freshForm());
    setErr({});
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name:           s.name           ?? '',
      email:          s.email          ?? '',
      password:       '',
      course_id:      String(s.course_id ?? ''),
      phone:          s.phone          ?? '',
      address:        s.address        ?? '',
      dob:            s.dob            ?? '',
      gender:         s.gender         ?? 'male',
      guardian_name:  s.guardian_name  ?? '',
      guardian_phone: s.guardian_phone ?? '',
      admission_date: s.admission_date ?? '',
      status:         s.status         ?? 'active',
    });
    setErr({});
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); setErr({}); };

  /* ── submit ──────────────────────────────────── */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) { toast.warning('Please fill in all required fields'); return; }
    setSaving(true);

    const payload = {
      ...form,
      course_id:      parseInt(form.course_id, 10) || 0,
      dob:            form.dob || '',
      admission_date: form.admission_date || new Date().toISOString().slice(0, 10),
    };

    const req = editing
      ? studentsAPI.update(editing.id, payload)
      : studentsAPI.create(payload);

    req
      .then(r => {
        const sid = r.data?.data?.student_id;
        toast.success(editing
          ? 'Student updated successfully!'
          : `Student registered! ID: ${sid}`
        );
        closeModal();
        load();
      })
      .catch(e => toast.error(e.response?.data?.message ?? 'Save failed'))
      .finally(() => setSaving(false));
  };

  /* ── delete ──────────────────────────────────── */
  const handleDelete = (s) => {
    if (!window.confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    studentsAPI.delete(s.id)
      .then(() => { toast.success('Student deleted'); load(); })
      .catch(() => toast.error('Delete failed'));
  };

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <>
      {/* ── Header ───────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">
            <i className="bi bi-people-fill me-2"/>Students
          </h4>
          <small className="text-muted">{pagination.total ?? 0} registered</small>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openAdd}>
          <i className="bi bi-person-plus-fill"/>Register Student
        </button>
      </div>

      {/* ── Search ───────────────────────────── */}
      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="input-group" style={{ maxWidth: 380 }}>
            <span className="input-group-text bg-white">
              <i className="bi bi-search text-muted"/>
            </span>
            <input className="form-control" placeholder="Search by name or ID…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}/>
            {search && (
              <button className="btn btn-outline-secondary"
                onClick={() => { setSearch(''); setPage(1); }}>
                <i className="bi bi-x"/>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table ────────────────────────────── */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"/>
              <p className="text-muted mt-2 small">Loading…</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Student ID</th><th>Name</th><th>Course</th>
                    <th>Phone</th><th>Admission</th><th>Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td><span className="badge bg-primary">{s.student_id}</span></td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                               style={{ width:34, height:34, fontSize:'.8rem', flexShrink:0 }}>
                            {s.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold">{s.name}</div>
                            <div className="text-muted small">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge bg-info-subtle text-info fw-normal">{s.course_name}</span></td>
                      <td className="text-muted small">{s.phone || '—'}</td>
                      <td className="text-muted small">{s.admission_date || '—'}</td>
                      <td>
                        <span className={`badge ${s.status === 'active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(s)}>
                          <i className="bi bi-pencil"/>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s)}>
                          <i className="bi bi-trash"/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!students.length && (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        <i className="bi bi-people fs-1 d-block mb-2 opacity-25"/>
                        No students found{search && <> for "<strong>{search}</strong>"</>}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination.total_pages > 1 && (
          <div className="card-footer d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Page {page} of {pagination.total_pages} · {pagination.total} students
            </small>
            <div className="d-flex gap-1">
              <button className="btn btn-sm btn-outline-primary"
                disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <i className="bi bi-chevron-left"/>
              </button>
              <span className="btn btn-sm btn-primary px-3">{page}</span>
              <button className="btn btn-sm btn-outline-primary"
                disabled={page >= pagination.total_pages} onClick={() => setPage(p => p + 1)}>
                <i className="bi bi-chevron-right"/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          REGISTER / EDIT MODAL
          - Fixed header + sticky footer (always visible)
          - Scrollable body only
      ══════════════════════════════════════════ */}
      {showModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ background: 'rgba(0,0,0,.6)', zIndex: 1050 }}
        >
          <div
            className="modal-dialog modal-lg"
            style={{
              margin: '20px auto',
              maxHeight: 'calc(100vh - 40px)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              className="modal-content border-0 shadow-lg"
              style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 40px)' }}
            >
              {/* ── Fixed Header ─────────────────── */}
              <div className="modal-header flex-shrink-0 border-0"
                   style={{ background: 'linear-gradient(135deg,#1a3c6e,#2563eb)' }}>
                <div>
                  <h5 className="modal-title fw-bold text-white mb-0">
                    <i className={`bi bi-${editing ? 'pencil-square' : 'person-plus-fill'} me-2`}/>
                    {editing ? 'Edit Student Details' : 'Register New Student'}
                  </h5>
                  <small className="text-white opacity-75">
                    {editing ? `Editing: ${editing.student_id}` : 'Fill in the details to create a student account'}
                  </small>
                </div>
                <button className="btn-close btn-close-white ms-3" onClick={closeModal}/>
              </div>

              {/* ── Scrollable Body ───────────────── */}
              <form onSubmit={handleSubmit} noValidate
                    style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

                <div className="modal-body overflow-auto flex-grow-1 px-4 py-3">

                  {/* ─ Account Info ─────────────── */}
                  <div className="border rounded-3 p-3 mb-3 bg-light">
                    <h6 className="fw-bold text-primary mb-3">
                      <i className="bi bi-person-circle me-2"/>Account Information
                    </h6>
                    <div className="row g-3">

                      {/* Full Name */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">
                          Full Name <span className="text-danger">*</span>
                        </label>
                        <input
                          className={`form-control ${err.name ? 'is-invalid' : ''}`}
                          value={form.name}
                          onChange={e => setField('name', e.target.value)}
                          placeholder="e.g. Kasun Perera"
                        />
                        {err.name && <div className="invalid-feedback">{err.name}</div>}
                      </div>

                      {/* Email */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">
                          Email Address <span className="text-danger">*</span>
                        </label>
                        <input
                          type="email"
                          className={`form-control ${err.email ? 'is-invalid' : ''}`}
                          value={form.email}
                          onChange={e => setField('email', e.target.value)}
                          placeholder="e.g. kasun@email.com"
                          disabled={!!editing}
                        />
                        {err.email && <div className="invalid-feedback">{err.email}</div>}
                        {editing && <div className="form-text">Email cannot be changed</div>}
                      </div>

                      {/* Password — new only */}
                      {!editing && (
                        <div className="col-md-6">
                          <label className="form-label fw-semibold small">
                            Login Password <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${err.password ? 'is-invalid' : ''}`}
                            value={form.password}
                            onChange={e => setField('password', e.target.value)}
                            placeholder="Min. 6 characters"
                          />
                          {err.password
                            ? <div className="invalid-feedback">{err.password}</div>
                            : <div className="form-text">Student will use this to login</div>
                          }
                        </div>
                      )}

                      {/* Course */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">
                          Course <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${err.course_id ? 'is-invalid' : ''}`}
                          value={form.course_id}
                          onChange={e => setField('course_id', e.target.value)}
                        >
                          <option value="">— Select course —</option>
                          {courses.map(c => (
                            <option key={c.id} value={String(c.id)}>{c.name}</option>
                          ))}
                        </select>
                        {err.course_id && <div className="invalid-feedback">{err.course_id}</div>}
                      </div>

                    </div>
                  </div>

                  {/* ─ Personal Info ────────────── */}
                  <div className="border rounded-3 p-3 mb-3 bg-light">
                    <h6 className="fw-bold text-primary mb-3">
                      <i className="bi bi-card-text me-2"/>Personal Information
                    </h6>
                    <div className="row g-3">

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Phone Number</label>
                        <input className="form-control" value={form.phone}
                          onChange={e => setField('phone', e.target.value)}
                          placeholder="07X XXXXXXX"/>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Date of Birth</label>
                        <input type="date" className="form-control" value={form.dob}
                          onChange={e => setField('dob', e.target.value)}/>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Gender</label>
                        <select className="form-select" value={form.gender}
                          onChange={e => setField('gender', e.target.value)}>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Admission Date</label>
                        <input type="date" className="form-control" value={form.admission_date}
                          onChange={e => setField('admission_date', e.target.value)}/>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold small">Address</label>
                        <textarea className="form-control" rows={2} value={form.address}
                          onChange={e => setField('address', e.target.value)}
                          placeholder="Home address"/>
                      </div>

                    </div>
                  </div>

                  {/* ─ Guardian Info ─────────────── */}
                  <div className="border rounded-3 p-3 mb-3 bg-light">
                    <h6 className="fw-bold text-primary mb-3">
                      <i className="bi bi-people me-2"/>Guardian Information
                    </h6>
                    <div className="row g-3">

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Guardian Name</label>
                        <input className="form-control" value={form.guardian_name}
                          onChange={e => setField('guardian_name', e.target.value)}
                          placeholder="Parent / Guardian name"/>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Guardian Phone</label>
                        <input className="form-control" value={form.guardian_phone}
                          onChange={e => setField('guardian_phone', e.target.value)}
                          placeholder="07X XXXXXXX"/>
                      </div>

                    </div>
                  </div>

                  {/* ─ Status (edit only) ────────── */}
                  {editing && (
                    <div className="border rounded-3 p-3 bg-light">
                      <h6 className="fw-bold text-primary mb-3">
                        <i className="bi bi-toggle-on me-2"/>Account Status
                      </h6>
                      <div className="d-flex gap-2">
                        {['active', 'inactive'].map(s => (
                          <button key={s} type="button"
                            className={`btn flex-fill ${form.status === s
                              ? s === 'active' ? 'btn-success' : 'btn-danger'
                              : 'btn-outline-secondary'}`}
                            onClick={() => setField('status', s)}>
                            <i className={`bi bi-${s === 'active' ? 'check-circle' : 'x-circle'} me-1`}/>
                            {s === 'active' ? 'Active' : 'Inactive'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* ── STICKY FOOTER — Always visible ─ */}
                <div
                  className="flex-shrink-0 d-flex justify-content-between align-items-center px-4 py-3"
                  style={{
                    borderTop: '2px solid #e5e7eb',
                    background: '#f8fafc',
                  }}
                >
                  {/* Left info */}
                  <div className="text-muted small">
                    <i className="bi bi-info-circle me-1"/>
                    {editing ? 'Update student information' : 'Fields marked * are required'}
                  </div>

                  {/* Buttons */}
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4"
                      onClick={closeModal}
                      disabled={saving}
                    >
                      <i className="bi bi-x-circle me-1"/>Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary px-5 fw-semibold"
                      disabled={saving}
                      style={{ minWidth: 160 }}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"/>
                          {editing ? 'Updating…' : 'Saving…'}
                        </>
                      ) : editing ? (
                        <><i className="bi bi-check-circle-fill me-2"/>Update Student</>
                      ) : (
                        <><i className="bi bi-person-plus-fill me-2"/>Register Student</>
                      )}
                    </button>
                  </div>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
