import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { materialsAPI } from '../../services/api';

const FILE_ICONS = {
  pdf:  { icon:'file-earmark-pdf-fill',  color:'#ef4444', bg:'#fee2e2', label:'PDF'  },
  doc:  { icon:'file-earmark-word-fill', color:'#2563eb', bg:'#dbeafe', label:'Word' },
  docx: { icon:'file-earmark-word-fill', color:'#2563eb', bg:'#dbeafe', label:'Word' },
  ppt:  { icon:'file-earmark-ppt-fill',  color:'#f59e0b', bg:'#fef3c7', label:'PPT'  },
  pptx: { icon:'file-earmark-ppt-fill',  color:'#f59e0b', bg:'#fef3c7', label:'PPT'  },
  jpg:  { icon:'file-earmark-image-fill',color:'#10b981', bg:'#d1fae5', label:'Image'},
  jpeg: { icon:'file-earmark-image-fill',color:'#10b981', bg:'#d1fae5', label:'Image'},
  png:  { icon:'file-earmark-image-fill',color:'#10b981', bg:'#d1fae5', label:'Image'},
};

const getFileInfo = (n) => {
  const ext = n?.split('.').pop()?.toLowerCase() ?? '';
  return FILE_ICONS[ext] ?? { icon:'file-earmark-fill', color:'#6b7280', bg:'#f3f4f6', label:'File' };
};

const fmt = (b) => {
  if (!b) return '—';
  if (b < 1024)      return `${b} B`;
  if (b < 1024*1024) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/(1024*1024)).toFixed(1)} MB`;
};

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [subject,   setSubject]   = useState('');
  const [preview,   setPreview]   = useState(null);  // material being previewed

  const load = useCallback(() => {
    setLoading(true);
    materialsAPI.list({ search })
      .then(r => setMaterials(r.data.data ?? []))
      .catch(() => toast.error('Failed to load materials'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  // Unique subjects from loaded materials
  const subjectOptions = [...new Map(
    materials.filter(m => m.subject_name)
             .map(m => [m.subject_name, m.subject_name])
  ).values()];

  const filtered = materials.filter(m =>
    (!subject || m.subject_name === subject)
  );

  const isPDF = (fileName) => fileName?.toLowerCase().endsWith('.pdf');

  return (
    <>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">
            <i className="bi bi-folder2-open me-2"/>Study Materials
          </h4>
          <small className="text-muted">{filtered.length} material{filtered.length !== 1 ? 's' : ''} available</small>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={load}>
          <i className="bi bi-arrow-clockwise me-1"/>Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="row g-2">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search text-muted"/>
                </span>
                <input className="form-control" placeholder="Search materials…"
                       value={search} onChange={e => setSearch(e.target.value)}/>
                {search && (
                  <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>
                    <i className="bi bi-x"/>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-4">
              <select className="form-select" value={subject}
                      onChange={e => setSubject(e.target.value)}>
                <option value="">All Subjects</option>
                {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Materials grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"/>
          <p className="text-muted mt-2 small">Loading materials…</p>
        </div>
      ) : (
        <div className="row">
          {filtered.map(mat => {
            const fi = getFileInfo(mat.file_name);
            return (
              <div key={mat.id} className="col-md-6 col-lg-4 mb-3">
                <div className="card border-0 shadow-sm h-100">
                  {/* Color top bar by file type */}
                  <div style={{ height:4, background: fi.color, borderRadius:'8px 8px 0 0' }}/>
                  <div className="card-body d-flex flex-column">

                    {/* File icon + info */}
                    <div className="d-flex gap-3 mb-3">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                           style={{ width:52, height:52, background:fi.bg }}>
                        <i className={`bi bi-${fi.icon} fs-4`} style={{ color:fi.color }}/>
                      </div>
                      <div style={{ minWidth:0 }}>
                        <h6 className="fw-bold mb-0 text-truncate" title={mat.title}>
                          {mat.title}
                        </h6>
                        <small className="text-muted d-block text-truncate">{mat.file_name}</small>
                        <span className="badge" style={{ background:fi.bg, color:fi.color, fontSize:'.65rem' }}>
                          {fi.label}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {mat.description && (
                      <p className="text-muted small mb-2 flex-grow-1" style={{
                        overflow:'hidden', display:'-webkit-box',
                        WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                      }}>
                        {mat.description}
                      </p>
                    )}

                    {/* Badges */}
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      <span className="badge bg-primary-subtle text-primary small">
                        <i className="bi bi-book me-1"/>{mat.course_name}
                      </span>
                      {mat.subject_name && (
                        <span className="badge bg-info-subtle text-info small">
                          {mat.subject_name}
                        </span>
                      )}
                      <span className="badge bg-light text-muted small">{fmt(mat.file_size)}</span>
                    </div>

                    {/* Meta */}
                    <div className="text-muted mb-3" style={{ fontSize:'.72rem' }}>
                      <i className="bi bi-person me-1"/>{mat.uploaded_by_name} ·{' '}
                      <i className="bi bi-calendar3 me-1"/>
                      {new Date(mat.created_at).toLocaleDateString('en-LK')}
                    </div>

                    {/* Action buttons */}
                    <div className="d-flex gap-2 mt-auto">
                      {isPDF(mat.file_name) && (
                        <button
                          className="btn btn-sm btn-outline-primary flex-fill"
                          onClick={() => setPreview(mat)}
                        >
                          <i className="bi bi-eye me-1"/>View
                        </button>
                      )}
                      <a
                        href={mat.file_path}
                        target="_blank"
                        rel="noreferrer"
                        download={mat.file_name}
                        className="btn btn-sm btn-primary flex-fill d-flex align-items-center justify-content-center gap-1"
                      >
                        <i className="bi bi-download"/>Download
                      </a>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}

          {!filtered.length && !loading && (
            <div className="col-12 text-center py-5 text-muted">
              <i className="bi bi-folder2-open fs-1 d-block mb-2 opacity-25"/>
              <h6>No materials available yet</h6>
              <p className="small">Your teacher hasn't uploaded any materials for this course.</p>
            </div>
          )}
        </div>
      )}

      {/* ── PDF Preview Modal ─────────────────────── */}
      {preview && (
        <div className="modal d-block" tabIndex="-1"
             style={{ background:'rgba(0,0,0,.8)', zIndex:1055 }}>
          <div className="modal-dialog modal-xl"
               style={{ margin:'20px auto', height:'calc(100vh - 40px)',
                        display:'flex', flexDirection:'column' }}>
            <div className="modal-content border-0 shadow-lg"
                 style={{ display:'flex', flexDirection:'column', height:'100%' }}>

              {/* Header */}
              <div className="modal-header flex-shrink-0 border-0"
                   style={{ background:'linear-gradient(135deg,#1a3c6e,#2563eb)' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center rounded-2"
                       style={{ width:38, height:38, background:'#fee2e2' }}>
                    <i className="bi bi-file-earmark-pdf-fill text-danger fs-5"/>
                  </div>
                  <div>
                    <h6 className="modal-title fw-bold text-white mb-0">{preview.title}</h6>
                    <small className="text-white opacity-75">
                      {preview.course_name}{preview.subject_name ? ` · ${preview.subject_name}` : ''}
                      {' · '}{fmt(preview.file_size)}
                    </small>
                  </div>
                </div>
                <div className="d-flex gap-2 ms-auto me-2">
                  <a href={preview.file_path} download={preview.file_name}
                     className="btn btn-sm btn-light d-flex align-items-center gap-1">
                    <i className="bi bi-download"/>Download
                  </a>
                  <a href={preview.file_path} target="_blank" rel="noreferrer"
                     className="btn btn-sm btn-light d-flex align-items-center gap-1">
                    <i className="bi bi-box-arrow-up-right"/>Open
                  </a>
                </div>
                <button className="btn-close btn-close-white"
                        onClick={() => setPreview(null)}/>
              </div>

              {/* PDF iframe viewer */}
              <div className="flex-grow-1" style={{ minHeight:0 }}>
                <iframe
                  src={`${preview.file_path}#toolbar=1&navpanes=1&scrollbar=1`}
                  title={preview.title}
                  width="100%"
                  height="100%"
                  style={{ border:'none', display:'block' }}
                />
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 d-flex justify-content-between align-items-center px-4 py-2"
                   style={{ background:'#f8fafc', borderTop:'1px solid #e5e7eb' }}>
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"/>
                  Uploaded by {preview.uploaded_by_name} ·{' '}
                  {new Date(preview.created_at).toLocaleDateString('en-LK')}
                </small>
                <button className="btn btn-sm btn-outline-secondary"
                        onClick={() => setPreview(null)}>
                  <i className="bi bi-x-circle me-1"/>Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
