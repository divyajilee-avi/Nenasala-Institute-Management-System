import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { examsAPI, studentsAPI, classesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function TeacherResultsPage() {
  const { user }                      = useAuth();
  const [exams,      setExams]        = useState([]);
  const [selected,   setSelected]     = useState(null);   // selected exam
  const [students,   setStudents]     = useState([]);
  const [results,    setResults]      = useState([]);
  const [marks,      setMarks]        = useState({});     // { student_id: value }
  const [loading,    setLoading]      = useState(false);
  const [saving,     setSaving]       = useState(false);
  const [showModal,  setShowModal]    = useState(false);
  const [search,     setSearch]       = useState('');

  /* ── load exams ──────────────────────────────── */
  const loadExams = useCallback(() => {
    setLoading(true);
    examsAPI.list()
      .then(r => setExams(r.data.data ?? []))
      .catch(() => toast.error('Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadExams(); }, [loadExams]);

  /* ── open upload marks modal ─────────────────── */
  const openUpload = (exam) => {
    setSelected(exam);
    setMarks({});
    setSearch('');
    setShowModal(true);

    // Load students for this course + existing results
    Promise.all([
      studentsAPI.list({ per_page: 200 }),
      examsAPI.getResults(exam.id),
    ])
      .then(([studs, res]) => {
        const allStudents = studs.data.data ?? [];
        // Filter students for exam's course
        const filtered = allStudents.filter(s => s.course_id == exam.course_id);
        setStudents(filtered);
        setResults(res.data.data ?? []);
        // Pre-fill existing marks
        const m = {};
        (res.data.data ?? []).forEach(r => { m[r.student_id] = r.marks; });
        setMarks(m);
      })
      .catch(() => toast.error('Failed to load students'));
  };

  /* ── save marks ──────────────────────────────── */
  const saveMarks = (e) => {
    e.preventDefault();
    const records = Object.entries(marks)
      .filter(([, v]) => v !== '' && v !== null && v !== undefined)
      .map(([student_id, m]) => ({ student_id: +student_id, marks: +m }));

    if (!records.length) { toast.warning('Enter at least one mark'); return; }

    setSaving(true);
    examsAPI.uploadResults({ exam_id: selected.id, results: records })
      .then(() => {
        toast.success(`Marks saved for ${records.length} students!`);
        setShowModal(false);
        loadExams();
      })
      .catch(err => toast.error(err.response?.data?.message ?? 'Save failed'))
      .finally(() => setSaving(false));
  };

  /* ── download result sheet as PDF ───────────── */
  const downloadPDF = () => {
    if (!selected) return;
    const doc = new jsPDF();
    // Header
    doc.setFillColor(26, 60, 110);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('Nenasala Institute Management System', 105, 12, { align: 'center' });
    doc.setFontSize(11); doc.setFont('helvetica', 'normal');
    doc.text('Exam Results Sheet', 105, 22, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Exam    : ${selected.name}`,   14, 38);
    doc.text(`Course  : ${selected.course_name}`, 14, 45);
    doc.text(`Subject : ${selected.subject_name}`, 14, 52);
    doc.text(`Date    : ${selected.exam_date}`,    14, 59);
    doc.text(`Total   : ${selected.total_marks}  Pass: ${selected.pass_marks}`, 14, 66);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 73);

    const rows = students.map(s => {
      const m = marks[s.id] ?? results.find(r => r.student_id == s.id)?.marks ?? '-';
      const pct = selected.total_marks > 0 && m !== '-' ? ((+m / selected.total_marks) * 100).toFixed(1) : '-';
      const grade = pct !== '-'
        ? +pct >= 75 ? 'A' : +pct >= 65 ? 'B' : +pct >= 55 ? 'C' : +pct >= 45 ? 'S' : 'F'
        : '-';
      const result = m !== '-' && +m >= selected.pass_marks ? 'PASS' : m !== '-' ? 'FAIL' : '-';
      return [s.student_id, s.name, m, pct !== '-' ? `${pct}%` : '-', grade, result];
    });

    autoTable(doc, {
      startY: 78,
      head: [['Student ID', 'Name', 'Marks', 'Percentage', 'Grade', 'Result']],
      body: rows,
      headStyles: { fillColor: [26, 60, 110], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 248, 255] },
      columnStyles: {
        0: { cellWidth: 28 },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center', fontStyle: 'bold' },
        5: { halign: 'center', fontStyle: 'bold' },
      },
      didParseCell(data) {
        if (data.column.index === 5 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'PASS' ? [22, 163, 74] : data.cell.raw === 'FAIL' ? [220, 38, 38] : [0, 0, 0];
        }
      },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}  —  Nenasala IMS`, 105, 290, { align: 'center' });
    }

    doc.save(`${selected.name.replace(/\s+/g, '_')}_results.pdf`);
    toast.success('PDF downloaded');
  };

  /* ── download as Excel ───────────────────────── */
  const downloadExcel = () => {
    if (!selected) return;
    const rows = students.map(s => {
      const m = marks[s.id] ?? results.find(r => r.student_id == s.id)?.marks ?? '';
      const pct = selected.total_marks > 0 && m !== '' ? (+m / selected.total_marks * 100).toFixed(1) : '';
      const grade = pct ? (+pct >= 75 ? 'A' : +pct >= 65 ? 'B' : +pct >= 55 ? 'C' : +pct >= 45 ? 'S' : 'F') : '';
      return {
        'Student ID': s.student_id,
        'Name':       s.name,
        'Marks':      m,
        'Percentage': pct ? `${pct}%` : '',
        'Grade':      grade,
        'Result':     m !== '' ? (+m >= selected.pass_marks ? 'PASS' : 'FAIL') : '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, `${selected.name.replace(/\s+/g, '_')}_results.xlsx`);
    toast.success('Excel downloaded');
  };

  /* ── computed stats ──────────────────────────── */
  const getStats = () => {
    const vals = Object.values(marks).filter(v => v !== '' && v !== null && v !== undefined).map(Number);
    if (!vals.length || !selected) return null;
    const passed = vals.filter(v => v >= selected.pass_marks).length;
    const avg    = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    return { total: vals.length, passed, failed: vals.length - passed, avg };
  };

  const stats          = getStats();
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* ── Header ───────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">
            <i className="bi bi-list-ol me-2"/>Upload Student Marks
          </h4>
          <small className="text-muted">{exams.length} exam{exams.length !== 1 ? 's' : ''} available</small>
        </div>
      </div>

      {/* ── Exams List ───────────────────────── */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success"/>
          <p className="text-muted mt-2 small">Loading exams…</p>
        </div>
      ) : (
        <div className="row">
          {exams.map(exam => (
            <div key={exam.id} className="col-md-6 col-lg-4 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  {/* Exam header */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-primary-subtle text-primary">{exam.course_name}</span>
                    <span className="badge bg-secondary-subtle text-secondary">{exam.exam_date}</span>
                  </div>
                  <h6 className="fw-bold mb-1">{exam.name}</h6>
                  <p className="text-muted small mb-2">
                    <i className="bi bi-book me-1"/>{exam.subject_name}
                  </p>
                  <div className="d-flex gap-3 mb-3 small text-muted">
                    <span><i className="bi bi-123 me-1"/>Total: <b>{exam.total_marks}</b></span>
                    <span><i className="bi bi-check-circle me-1"/>Pass: <b>{exam.pass_marks}</b></span>
                  </div>
                  <button
                    className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2"
                    onClick={() => openUpload(exam)}
                  >
                    <i className="bi bi-upload"/>Upload Marks
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!exams.length && (
            <div className="col-12 text-center py-5 text-muted">
              <i className="bi bi-pencil-square fs-1 d-block mb-2 opacity-25"/>
              <h6>No exams available</h6>
              <p className="small">Ask admin to schedule an exam first.</p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          UPLOAD MARKS MODAL
      ════════════════════════════════════════ */}
      {showModal && selected && (
        <div className="modal d-block" tabIndex="-1"
             style={{ background: 'rgba(0,0,0,.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-xl"
               style={{ margin: '20px auto', maxHeight: 'calc(100vh - 40px)',
                        display: 'flex', flexDirection: 'column' }}>
            <div className="modal-content border-0 shadow-lg"
                 style={{ display: 'flex', flexDirection: 'column',
                          maxHeight: 'calc(100vh - 40px)' }}>

              {/* Fixed Header */}
              <div className="modal-header flex-shrink-0 border-0"
                   style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                <div>
                  <h5 className="modal-title fw-bold text-white mb-0">
                    <i className="bi bi-upload me-2"/>Upload Marks — {selected.name}
                  </h5>
                  <small className="text-white opacity-75">
                    {selected.course_name} · {selected.subject_name} · {selected.exam_date} ·
                    Total: {selected.total_marks} · Pass: {selected.pass_marks}
                  </small>
                </div>
                <button className="btn-close btn-close-white ms-3"
                        onClick={() => setShowModal(false)}/>
              </div>

              <form onSubmit={saveMarks}
                    style={{ display: 'flex', flexDirection: 'column',
                             flex: 1, minHeight: 0 }}>

                {/* Stats bar */}
                {stats && (
                  <div className="flex-shrink-0 d-flex gap-3 px-4 py-2 border-bottom"
                       style={{ background: '#f0fdf4' }}>
                    <span className="small"><i className="bi bi-people me-1 text-primary"/>
                      Entered: <b>{stats.total}</b>/{students.length}
                    </span>
                    <span className="small text-success"><i className="bi bi-check-circle me-1"/>
                      Pass: <b>{stats.passed}</b>
                    </span>
                    <span className="small text-danger"><i className="bi bi-x-circle me-1"/>
                      Fail: <b>{stats.failed}</b>
                    </span>
                    <span className="small text-primary"><i className="bi bi-bar-chart me-1"/>
                      Avg: <b>{stats.avg}</b>
                    </span>
                  </div>
                )}

                {/* Search */}
                <div className="flex-shrink-0 px-4 py-2 border-bottom">
                  <div className="input-group" style={{ maxWidth: 300 }}>
                    <span className="input-group-text bg-white">
                      <i className="bi bi-search text-muted"/>
                    </span>
                    <input className="form-control" placeholder="Search student…"
                           value={search}
                           onChange={e => setSearch(e.target.value)}/>
                  </div>
                </div>

                {/* Scrollable student table */}
                <div className="modal-body overflow-auto flex-grow-1 p-0">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                      <tr>
                        <th style={{ background: '#1a3c6e', color: '#fff' }}>#</th>
                        <th style={{ background: '#1a3c6e', color: '#fff' }}>Student ID</th>
                        <th style={{ background: '#1a3c6e', color: '#fff' }}>Name</th>
                        <th style={{ background: '#1a3c6e', color: '#fff' }}>
                          Marks <span className="opacity-75 fw-normal small">/ {selected.total_marks}</span>
                        </th>
                        <th style={{ background: '#1a3c6e', color: '#fff' }}>Grade</th>
                        <th style={{ background: '#1a3c6e', color: '#fff' }}>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s, idx) => {
                        const m      = marks[s.id] ?? '';
                        const pct    = selected.total_marks > 0 && m !== '' ? (+m / selected.total_marks) * 100 : null;
                        const grade  = pct !== null
                          ? pct >= 75 ? 'A' : pct >= 65 ? 'B' : pct >= 55 ? 'C' : pct >= 45 ? 'S' : 'F'
                          : '—';
                        const passed = m !== '' && +m >= selected.pass_marks;
                        const gradeColors = { A:'success', B:'primary', C:'info', S:'warning', F:'danger' };

                        return (
                          <tr key={s.id}>
                            <td className="text-muted small">{idx + 1}</td>
                            <td><span className="badge bg-primary">{s.student_id}</span></td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold"
                                     style={{ width:32, height:32, fontSize:'.75rem', flexShrink:0 }}>
                                  {s.name?.charAt(0).toUpperCase()}
                                </div>
                                <span className="fw-semibold">{s.name}</span>
                              </div>
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                style={{ width: 90 }}
                                min={0}
                                max={selected.total_marks}
                                value={m}
                                placeholder="—"
                                onChange={e => setMarks(prev => ({
                                  ...prev, [s.id]: e.target.value
                                }))}
                              />
                            </td>
                            <td>
                              <span className={`badge bg-${gradeColors[grade] ?? 'secondary'} px-2`}>
                                {grade}
                              </span>
                            </td>
                            <td>
                              {m !== '' ? (
                                <span className={`badge ${passed ? 'bg-success' : 'bg-danger'}`}>
                                  {passed ? 'PASS' : 'FAIL'}
                                </span>
                              ) : (
                                <span className="text-muted small">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {!filteredStudents.length && (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-4">
                            No students found{search && ` for "${search}"`}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Sticky Footer */}
                <div className="flex-shrink-0 d-flex justify-content-between align-items-center px-4 py-3"
                     style={{ borderTop: '2px solid #e5e7eb', background: '#f8fafc' }}>
                  {/* Download buttons */}
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-danger btn-sm"
                            onClick={downloadPDF}
                            disabled={!students.length}>
                      <i className="bi bi-file-earmark-pdf me-1"/>Download PDF
                    </button>
                    <button type="button" className="btn btn-outline-success btn-sm"
                            onClick={downloadExcel}
                            disabled={!students.length}>
                      <i className="bi bi-file-earmark-excel me-1"/>Download Excel
                    </button>
                  </div>

                  {/* Save buttons */}
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary px-4"
                            onClick={() => setShowModal(false)}>
                      <i className="bi bi-x-circle me-1"/>Cancel
                    </button>
                    <button type="submit" className="btn btn-success px-5 fw-semibold"
                            disabled={saving} style={{ minWidth: 140 }}>
                      {saving ? (
                        <><span className="spinner-border spinner-border-sm me-2"/>Saving…</>
                      ) : (
                        <><i className="bi bi-cloud-upload me-2"/>Save Marks</>
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
