import React, { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { materialsAPI, coursesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const FILE_ICONS = {
  pdf:  { icon: 'file-earmark-pdf-fill',  color: '#ef4444', bg: '#fee2e2' },
  doc:  { icon: 'file-earmark-word-fill', color: '#2563eb', bg: '#dbeafe' },
  docx: { icon: 'file-earmark-word-fill', color: '#2563eb', bg: '#dbeafe' },
  ppt:  { icon: 'file-earmark-ppt-fill',  color: '#f59e0b', bg: '#fef3c7' },
  pptx: { icon: 'file-earmark-ppt-fill',  color: '#f59e0b', bg: '#fef3c7' },
  jpg:  { icon: 'file-earmark-image-fill',color: '#10b981', bg: '#d1fae5' },
  jpeg: { icon: 'file-earmark-image-fill',color: '#10b981', bg: '#d1fae5' },
  png:  { icon: 'file-earmark-image-fill',color: '#10b981', bg: '#d1fae5' },
};

const getFileInfo = (fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase() ?? '';
  return FILE_ICONS[ext] ?? { icon: 'file-earmark-fill', color: '#6b7280', bg: '#f3f4f6' };
};

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024*1024)  return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/(1024*1024)).toFixed(1)} MB`;
};

export default function TeacherMaterialsPage() {
  const { user }                    = useAuth();
  const fileInputRef                = useRef(null);
  const [materials,  setMaterials]  = useState([]);
  const [courses,    setCourses]    = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [progress,   setProgress]   = useState(0);
  const [filterCourse, setFilterCourse] = useState('');
  const [search,     setSearch]     = useState('');

  // Upload form state
  const [form, setForm] = useState({
    title: '', description: '', course_id: '', subject_id: '',
  });
  const [file,     setFile]    = useState(null);
  const [dragOver, setDragOver]= useState(false);
  const [formErr,  setFormErr] = useState({});

  /* ── Load ────────────────────────────────────── */
  const load = useCallback(() => {
    setLoading(true);
    materialsAPI.list({ search })
      .then(r => setMaterials(r.data.data ?? []))
      .catch(() => toast.error('Failed to load materials'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    coursesAPI.list().then(r => setCourses(r.data.data ?? [])).catch(() => {});
    coursesAPI.listSubjects().then(r => setSubjects(r.data.data ?? [])).catch(() => {});
  }, []);

  /* ── File drag & drop ────────────────────────── */
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleFileSelect = (f) => {
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(f.type)) {
      toast.error('Only PDF, Word, PowerPoint, and image files allowed');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error('File must be under 20MB');
      return;
    }
    setFile(f);
    setFormErr(e => ({ ...e, file: '' }));
    // Auto-fill title from filename
    if (!form.title) {
      const name = f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setForm(prev => ({ ...prev, title: name }));
    }
  };

  /* ── Validate ────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title     = 'Title is required';
    if (!form.course_id)    e.course_id = 'Please select a course';
    if (!file)              e.file      = 'Please select a file';
    setFormErr(e);
    return Object.keys(e).length === 0;
  };

  /* ── Upload ──────────────────────────────────── */
  const handleUpload = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const fd = new FormData();
    fd.append('file',        file);
    fd.append('title',       form.title.trim());
    fd.append('description', form.description.trim());
    fd.append('course_id',   form.course_id);
    if (form.subject_id) fd.append('subject_id', form.subject_id);

    setUploading(true);
    setProgress(0);

    materialsAPI.upload(fd)
      .then(() => {
        toast.success(`"${form.title}" uploaded successfully!`);
        setShowModal(false);
        setForm({ title: '', description: '', course_id: '', subject_id: '' });
        setFile(null);
        setFormErr({});
        setProgress(0);
        load();
      })
      .catch(err => toast.error(err.response?.data?.message ?? 'Upload failed'))
      .finally(() => setUploading(false));
  };

  /* ── Delete ──────────────────────────────────── */
  const handleDelete = (mat) => {
    if (!window.confirm(`Delete "${mat.title}"?\nThis will permanently remove the file.`)) return;
    setDeleting(mat.id);
    materialsAPI.delete(mat.id)
      .then(() => { toast.success('Material deleted'); load(); })
      .catch(() => toast.error('Delete failed'))
      .finally(() => setDeleting(null));
  };

  /* ── Filtered list ───────────────────────────── */
  const filtered = materials.filter(m =>
    (!filterCourse || String(m.course_id) === String(filterCourse))
  );

  const openModal = () => {
    setForm({ title: '', description: '', course_id: '', subject_id: '' });
    setFile(null); setFormErr({}); setProgress(0);
    setShowModal(true);
  };

  const filteredSubjects = subjects.filter(s =>
    !form.course_id || String(s.course_id) === String(form.course_id)
  );

  return (
    <>
      {/* ── Header ───────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">
            <i className="bi bi-folder-fill me-2"/>Study Materials
          </h4>
          <small className="text-muted">{filtered.length} material{filtered.length !== 1 ? 's' : ''}</small>
        </div>
        <button className="btn btn-success d-flex align-items-center gap-2" onClick={openModal}>
          <i className="bi bi-cloud-upload-fill"/>Upload Material
        </button>
      </div>

      {/* ── Filters ──────────────────────────── */}
      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search text-muted"/>
                </span>
                <input className="form-control" placeholder="Search materials…"
                       value={search}
                       onChange={e => setSearch(e.target.value)}/>
                {search && (
                  <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>
                    <i className="bi bi-x"/>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-4">
              <select className="form-select" value={filterCourse}
                      onChange={e => setFilterCourse(e.target.value)}>
                <option value="">All Courses</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-md-3 text-end">
              <button className="btn btn-outline-secondary btn-sm" onClick={load}>
                <i className="bi bi-arrow-clockwise me-1"/>Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Materials Grid ───────────────────── */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success"/>
          <p className="text-muted mt-2 small">Loading materials…</p>
        </div>
      ) : (
        <div className="row">
          {filtered.map(mat => {
            const fi = getFileInfo(mat.file_name);
            const isOwn = mat.uploaded_by == user?.id;
            return (
              <div key={mat.id} className="col-md-6 col-lg-4 mb-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    {/* File icon + title */}
                    <div className="d-flex gap-3 mb-3">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                           style={{ width:52, height:52, background: fi.bg }}>
                        <i className={`bi bi-${fi.icon} fs-4`} style={{ color: fi.color }}/>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h6 className="fw-bold mb-0 text-truncate" title={mat.title}>
                          {mat.title}
                        </h6>
                        <small className="text-muted">{mat.file_name}</small>
                      </div>
                    </div>

                    {/* Description */}
                    {mat.description && (
                      <p className="text-muted small mb-2" style={{
                        overflow:'hidden', display:'-webkit-box',
                        WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                      }}>
                        {mat.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      <span className="badge bg-primary-subtle text-primary">
                        {mat.course_name}
                      </span>
                      {mat.subject_name && (
                        <span className="badge bg-info-subtle text-info">
                          {mat.subject_name}
                        </span>
                      )}
                      <span className="badge bg-secondary-subtle text-secondary">
                        {formatSize(mat.file_size)}
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <div className="text-muted" style={{ fontSize:'.72rem' }}>
                        <i className="bi bi-person me-1"/>{mat.uploaded_by_name}
                        <br/>
                        <i className="bi bi-clock me-1"/>
                        {new Date(mat.created_at).toLocaleDateString('en-LK')}
                      </div>
                      <div className="d-flex gap-1">
                        <a href={mat.file_path} target="_blank" rel="noreferrer"
                           className="btn btn-sm btn-outline-primary"
                           title="View / Download">
                          <i className="bi bi-eye"/>
                        </a>
                        <a href={mat.file_path} download={mat.file_name}
                           className="btn btn-sm btn-outline-success"
                           title="Download">
                          <i className="bi bi-download"/>
                        </a>
                        {isOwn && (
                          <button className="btn btn-sm btn-outline-danger"
                                  title="Delete"
                                  disabled={deleting === mat.id}
                                  onClick={() => handleDelete(mat)}>
                            {deleting === mat.id
                              ? <span className="spinner-border spinner-border-sm"/>
                              : <i className="bi bi-trash"/>
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!filtered.length && !loading && (
            <div className="col-12 text-center py-5 text-muted">
              <i className="bi bi-folder2-open fs-1 d-block mb-2 opacity-25"/>
              <h6>No materials uploaded yet</h6>
              <p className="small">Upload PDF, Word, or PowerPoint files for your students.</p>
              <button className="btn btn-success btn-sm" onClick={openModal}>
                <i className="bi bi-cloud-upload me-1"/>Upload First Material
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          UPLOAD MODAL
      ════════════════════════════════════════ */}
      {showModal && (
        <div className="modal d-block" tabIndex="-1"
             style={{ background: 'rgba(0,0,0,.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg"
               style={{ margin:'20px auto', maxHeight:'calc(100vh - 40px)',
                        display:'flex', flexDirection:'column' }}>
            <div className="modal-content border-0 shadow-lg"
                 style={{ display:'flex', flexDirection:'column',
                          maxHeight:'calc(100vh - 40px)' }}>

              {/* Header */}
              <div className="modal-header flex-shrink-0 border-0"
                   style={{ background:'linear-gradient(135deg,#059669,#10b981)' }}>
                <div>
                  <h5 className="modal-title fw-bold text-white mb-0">
                    <i className="bi bi-cloud-upload-fill me-2"/>Upload Study Material
                  </h5>
                  <small className="text-white opacity-75">
                    PDF, Word, PowerPoint, Images — max 20MB
                  </small>
                </div>
                <button className="btn-close btn-close-white ms-3"
                        onClick={() => setShowModal(false)}/>
              </div>

              <form onSubmit={handleUpload} noValidate
                    style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0 }}>

                {/* Scrollable body */}
                <div className="modal-body overflow-auto flex-grow-1 px-4 py-3">

                  {/* ── Drop zone ─────────────── */}
                  <div
                    className={`border-2 rounded-3 p-4 text-center mb-4 ${dragOver ? 'border-success bg-success-subtle' : formErr.file ? 'border-danger' : 'border-dashed'}`}
                    style={{
                      border: `2px dashed ${dragOver ? '#2563eb' : formErr.file ? '#ef4444' : '#d1d5db'}`,
                      cursor: 'pointer', transition: 'all .2s',
                      background: dragOver ? '#f0fdf4' : '#fafafa',
                    }}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                      onChange={e => e.target.files[0] && handleFileSelect(e.target.files[0])}
                    />

                    {file ? (
                      <div>
                        <div className="d-flex align-items-center justify-content-center gap-3 mb-2">
                          <div className="d-flex align-items-center justify-content-center rounded-3"
                               style={{ width:52, height:52,
                                 background: getFileInfo(file.name).bg }}>
                            <i className={`bi bi-${getFileInfo(file.name).icon} fs-3`}
                               style={{ color: getFileInfo(file.name).color }}/>
                          </div>
                          <div className="text-start">
                            <div className="fw-bold">{file.name}</div>
                            <div className="text-muted small">{formatSize(file.size)}</div>
                          </div>
                        </div>
                        <button type="button" className="btn btn-sm btn-outline-secondary"
                                onClick={e => { e.stopPropagation(); setFile(null); }}>
                          <i className="bi bi-x me-1"/>Remove file
                        </button>
                      </div>
                    ) : (
                      <div>
                        <i className="bi bi-cloud-upload text-success d-block mb-2"
                           style={{ fontSize:'2.5rem' }}/>
                        <div className="fw-semibold mb-1">
                          Drop file here or <span className="text-success">click to browse</span>
                        </div>
                        <small className="text-muted">
                          PDF, Word, PowerPoint, Images · Max 20MB
                        </small>
                      </div>
                    )}
                  </div>
                  {formErr.file && (
                    <div className="text-danger small mb-3">
                      <i className="bi bi-exclamation-circle me-1"/>{formErr.file}
                    </div>
                  )}

                  {/* Upload progress */}
                  {uploading && (
                    <div className="mb-3">
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Uploading…</span><span>{progress}%</span>
                      </div>
                      <div className="progress" style={{ height:8 }}>
                        <div className="progress-bar bg-success progress-bar-striped progress-bar-animated"
                             style={{ width:`${progress}%` }}/>
                      </div>
                    </div>
                  )}

                  {/* ── Form fields ───────────── */}
                  <div className="border rounded-3 p-3 bg-light">
                    <h6 className="fw-bold text-success mb-3">
                      <i className="bi bi-info-circle me-2"/>Material Details
                    </h6>
                    <div className="row g-3">

                      {/* Title */}
                      <div className="col-12">
                        <label className="form-label fw-semibold small">
                          Title <span className="text-danger">*</span>
                        </label>
                        <input
                          className={`form-control ${formErr.title ? 'is-invalid' : ''}`}
                          value={form.title}
                          onChange={e => { setForm(f=>({...f, title:e.target.value})); setFormErr(fe=>({...fe, title:''})); }}
                          placeholder="e.g. Chapter 3 - Electricity Notes"
                        />
                        {formErr.title && <div className="invalid-feedback">{formErr.title}</div>}
                      </div>

                      {/* Course */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">
                          Course <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${formErr.course_id ? 'is-invalid' : ''}`}
                          value={form.course_id}
                          onChange={e => { setForm(f=>({...f, course_id:e.target.value, subject_id:''})); setFormErr(fe=>({...fe, course_id:''})); }}
                        >
                          <option value="">— Select course —</option>
                          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {formErr.course_id && <div className="invalid-feedback">{formErr.course_id}</div>}
                      </div>

                      {/* Subject */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Subject <span className="text-muted">(optional)</span></label>
                        <select className="form-select" value={form.subject_id}
                                onChange={e => setForm(f=>({...f, subject_id:e.target.value}))}>
                          <option value="">— All subjects —</option>
                          {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>

                      {/* Description */}
                      <div className="col-12">
                        <label className="form-label fw-semibold small">Description <span className="text-muted">(optional)</span></label>
                        <textarea
                          className="form-control" rows={3}
                          value={form.description}
                          onChange={e => setForm(f=>({...f, description:e.target.value}))}
                          placeholder="Brief description of the material…"
                        />
                      </div>

                    </div>
                  </div>

                </div>

                {/* Sticky Footer */}
                <div className="flex-shrink-0 d-flex justify-content-between align-items-center px-4 py-3"
                     style={{ borderTop:'2px solid #e5e7eb', background:'#f8fafc' }}>
                  <div className="text-muted small">
                    <i className="bi bi-shield-check text-success me-1"/>
                    File will be stored securely
                  </div>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary px-4"
                            onClick={() => setShowModal(false)} disabled={uploading}>
                      <i className="bi bi-x-circle me-1"/>Cancel
                    </button>
                    <button type="submit" className="btn btn-success px-5 fw-semibold"
                            disabled={uploading} style={{ minWidth:150 }}>
                      {uploading ? (
                        <><span className="spinner-border spinner-border-sm me-2"/>Uploading…</>
                      ) : (
                        <><i className="bi bi-cloud-upload me-2"/>Upload File</>
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
