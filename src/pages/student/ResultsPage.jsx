import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { examsAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GRADE_COLOR = { A:'success', B:'primary', C:'info', S:'warning', F:'danger' };
const GRADE_LABEL = { A:'Excellent', B:'Very Good', C:'Good', S:'Satisfactory', F:'Fail' };
const fmt = (n) => `${Number(n || 0).toFixed(1)}`;

export default function StudentResultsPage() {
  const { user }                    = useAuth();
  const [profile,   setProfile]     = useState(null);   // student profile with course
  const [exams,     setExams]       = useState([]);
  const [selected,  setSelected]    = useState(null);
  const [myResult,  setMyResult]    = useState(null);
  const [loading,   setLoading]     = useState(false);
  const [loadingRes,setLoadingRes]  = useState(false);
  const [allSummary,setAllSummary]  = useState([]);     // all exams + my result

  /* ── Load student profile (to get course & subjects) ── */
  useEffect(() => {
    authAPI.me()
      .then(r => setProfile(r.data.data))
      .catch(() => {});
  }, []);

  /* ── Load exams for student's course ──────────────── */
  const loadExams = useCallback(() => {
    setLoading(true);
    examsAPI.list()   // backend auto-filters by student's course
      .then(r => setExams(r.data.data ?? []))
      .catch(() => toast.error('Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadExams(); }, [loadExams]);

  /* ── Load all results summary ──────────────────────── */
  useEffect(() => {
    if (!exams.length) return;
    Promise.all(exams.map(e => examsAPI.getResults(e.id).catch(() => ({ data: { data: [] } }))))
      .then(all => {
        const summary = exams.map((e, i) => ({
          exam:   e,
          result: all[i]?.data?.data?.[0] ?? null,
        }));
        setAllSummary(summary);
      });
  }, [exams]);

  /* ── Select exam ───────────────────────────────────── */
  const selectExam = (exam) => {
    setSelected(exam);
    setMyResult(null);
    setLoadingRes(true);
    examsAPI.getResults(exam.id)
      .then(r => setMyResult(r.data.data?.[0] ?? null))
      .catch(() => toast.error('Failed to load result'))
      .finally(() => setLoadingRes(false));
  };

  /* ── Download single result PDF ────────────────────── */
  const downloadPDF = () => {
    if (!selected || !myResult) return;
    const doc = new jsPDF();
    const p   = profile?.profile ?? {};

    doc.setFillColor(26, 60, 110);
    doc.rect(0, 0, 210, 36, 'F');
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 29, 210, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17); doc.setFont('helvetica', 'bold');
    doc.text('Nenasala IT Center', 105, 14, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('STUDENT EXAMINATION RESULT', 105, 24, { align: 'center' });
    doc.setFontSize(7);
    doc.text('info@nenasala.lk  |  www.nenasala.lk', 105, 32, { align: 'center' });

    doc.setTextColor(0);
    const pct = (+myResult.marks / selected.total_marks * 100).toFixed(1);
    autoTable(doc, {
      startY: 44,
      head: [['Field', 'Details']],
      body: [
        ['Student Name',   user?.name        ?? '—'],
        ['Student ID',     p.student_id       ?? '—'],
        ['Course',         selected.course_name],
        ['Subject',        selected.subject_name],
        ['Exam Name',      selected.name],
        ['Exam Date',      selected.exam_date],
        ['Total Marks',    String(selected.total_marks)],
        ['Pass Marks',     String(selected.pass_marks)],
        ['Marks Obtained', `${myResult.marks} / ${selected.total_marks}`],
        ['Percentage',     `${pct}%`],
        ['Grade',          myResult.grade ?? '—'],
        ['Result',         myResult.remarks ?? '—'],
      ],
      headStyles:  { fillColor: [26, 60, 110], textColor: 255, fontStyle: 'bold' },
      columnStyles:{ 0: { fontStyle: 'bold', cellWidth: 50, fillColor: [248, 250, 252] } },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      didParseCell(d) {
        if (d.column.index === 1 && d.row.index === 11 && d.section === 'body') {
          d.cell.styles.textColor  = d.cell.raw === 'Pass' ? [22, 163, 74] : [220, 38, 38];
          d.cell.styles.fontStyle  = 'bold';
          d.cell.styles.fontSize   = 11;
        }
      },
    });

    const y = doc.lastAutoTable.finalY + 8;
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(55, y, 100, 12, 3, 3, 'F');
    doc.setDrawColor(22, 163, 74); doc.setLineWidth(0.4);
    doc.roundedRect(55, y, 100, 12, 3, 3, 'S');
    doc.setTextColor(22, 163, 74); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('✓  RESULT CONFIRMED', 105, y + 8, { align: 'center' });

    doc.setFontSize(8); doc.setTextColor(150); doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 288, { align: 'center' });

    doc.save(`Result_${selected.name.replace(/\s+/g,'_')}_${user?.name?.replace(/\s+/g,'_')}.pdf`);
    toast.success('Result PDF downloaded!');
  };

  /* ── Download all results PDF (full result sheet) ─── */
  const downloadAllPDF = () => {
    const hasResults = allSummary.filter(s => s.result);
    if (!hasResults.length) { toast.warning('No results published yet'); return; }

    const doc = new jsPDF();
    const p   = profile?.profile ?? {};

    // Header
    doc.setFillColor(26, 60, 110); doc.rect(0, 0, 210, 36, 'F');
    doc.setFillColor(37, 99, 235); doc.rect(0, 29, 210, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17); doc.setFont('helvetica', 'bold');
    doc.text('Nenasala IT Center', 105, 14, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('STUDENT RESULT SHEET', 105, 24, { align: 'center' });
    doc.setFontSize(7);
    doc.text('info@nenasala.lk  |  www.nenasala.lk', 105, 32, { align: 'center' });

    // Student info block
    doc.setTextColor(0); doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Information', 14, 46);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Name      : ${user?.name ?? '—'}`, 14, 54);
    doc.text(`Student ID: ${p.student_id ?? '—'}`, 14, 61);
    doc.text(`Course    : ${p.course_name ?? '—'}`, 14, 68);
    doc.text(`Date      : ${new Date().toLocaleDateString('en-LK')}`, 130, 54);

    // Results table
    autoTable(doc, {
      startY: 75,
      head: [['#', 'Subject', 'Exam', 'Date', 'Marks', 'Total', '%', 'Grade', 'Result']],
      body: allSummary.map((s, i) => {
        const r   = s.result;
        const pct = r ? (+r.marks / s.exam.total_marks * 100).toFixed(1) : '—';
        return [
          i + 1,
          s.exam.subject_name,
          s.exam.name,
          s.exam.exam_date,
          r ? r.marks : '—',
          s.exam.total_marks,
          r ? `${pct}%` : '—',
          r ? (r.grade ?? '—') : '—',
          r ? (r.remarks ?? '—') : 'Pending',
        ];
      }),
      headStyles:  { fillColor: [26, 60, 110], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      styles:      { fontSize: 8, cellPadding: 3 },
      columnStyles:{ 0:{cellWidth:8}, 1:{cellWidth:30}, 2:{cellWidth:35}, 3:{cellWidth:20},
                     4:{halign:'center'}, 5:{halign:'center'}, 6:{halign:'center'},
                     7:{halign:'center', fontStyle:'bold'}, 8:{halign:'center', fontStyle:'bold'} },
      alternateRowStyles: { fillColor: [245, 248, 255] },
      didParseCell(d) {
        if (d.column.index === 8 && d.section === 'body') {
          if (d.cell.raw === 'Pass')    d.cell.styles.textColor = [22, 163, 74];
          else if (d.cell.raw === 'Fail') d.cell.styles.textColor = [220, 38, 38];
          else                            d.cell.styles.textColor = [100, 116, 139];
        }
        if (d.column.index === 7 && d.section === 'body') {
          const gc = { A:[22,163,74], B:[37,99,235], C:[8,145,178], S:[217,119,6], F:[220,38,38] };
          d.cell.styles.textColor = gc[d.cell.raw] ?? [0,0,0];
        }
      },
    });

    // Summary
    const passCount = hasResults.filter(s => s.result?.remarks === 'Pass').length;
    const avgMarks  = hasResults.reduce((a,s) => a + +s.result.marks, 0) / hasResults.length;
    const y = doc.lastAutoTable.finalY + 10;
    autoTable(doc, {
      startY: y,
      head: [['Summary', 'Value']],
      body: [
        ['Total Subjects with Results', hasResults.length],
        ['Passed Subjects',             passCount],
        ['Failed Subjects',             hasResults.length - passCount],
        ['Average Marks',               `${avgMarks.toFixed(1)}`],
      ],
      headStyles:  { fillColor: [15, 23, 42] },
      columnStyles:{ 0: { fontStyle:'bold' } },
      margin: { left: 120 }, tableWidth: 76,
    });

    const fy = doc.lastAutoTable.finalY + 6;
    doc.setFontSize(7); doc.setTextColor(150);
    doc.text('Computer-generated result sheet. No signature required.', 105, fy + 4, { align:'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, fy + 9, { align:'center' });

    doc.save(`Result_Sheet_${user?.name?.replace(/\s+/g,'_')}.pdf`);
    toast.success('Full result sheet downloaded!');
  };

  const course = profile?.profile;

  return (
    <>
      {/* ── Header ──────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">
            <i className="bi bi-award me-2"/>My Exam Results
          </h4>
          {course && (
            <small className="text-muted">
              <i className="bi bi-mortarboard me-1"/>{course.course_name}
              {' · '}{exams.length} exam{exams.length !== 1 ? 's' : ''}
            </small>
          )}
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={downloadAllPDF}
          disabled={!allSummary.some(s => s.result)}
        >
          <i className="bi bi-file-earmark-pdf"/>Full Result Sheet
        </button>
      </div>

      {/* ── Course info banner ───────────────── */}
      {course && (
        <div className="card border-0 shadow-sm mb-4 overflow-hidden">
          <div style={{ height: 4, background: 'linear-gradient(90deg,#1a3c6e,#2563eb,#06b6d4)' }}/>
          <div className="card-body py-2 d-flex align-items-center gap-3 flex-wrap">
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-2 d-flex align-items-center justify-content-center"
                   style={{ width:38, height:38, background:'#dbeafe' }}>
                <i className="bi bi-mortarboard-fill text-primary"/>
              </div>
              <div>
                <div className="fw-bold small">{course.course_name}</div>
                <div className="text-muted" style={{ fontSize:'.72rem' }}>
                  <span className="badge bg-primary me-1">{course.student_id}</span>
                  Registered Course
                </div>
              </div>
            </div>
            <div className="ms-auto d-flex gap-3">
              {[
                { label:'Total Exams',   value: exams.length,                                           color:'primary' },
                { label:'Results Ready', value: allSummary.filter(s=>s.result).length,                  color:'success' },
                { label:'Passed',        value: allSummary.filter(s=>s.result?.remarks==='Pass').length, color:'info'    },
                { label:'Pending',       value: allSummary.filter(s=>!s.result).length,                  color:'warning' },
              ].map((s,i) => (
                <div key={i} className="text-center">
                  <div className={`fw-bold text-${s.color}`}>{s.value}</div>
                  <div className="text-muted" style={{ fontSize:'.68rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"/>
          <p className="text-muted mt-2 small">Loading exams…</p>
        </div>
      ) : (
        <div className="row g-4">

          {/* ── Left: Exam list with result status ── */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header fw-bold"
                   style={{ background:'linear-gradient(135deg,#1a3c6e,#2563eb)', color:'#fff' }}>
                <i className="bi bi-list-ul me-2"/>Registered Subjects &amp; Exams
              </div>
              <div className="list-group list-group-flush" style={{ maxHeight:520, overflowY:'auto' }}>
                {allSummary.map(({ exam, result }) => (
                  <button
                    key={exam.id}
                    className={`list-group-item list-group-item-action ${selected?.id === exam.id ? 'active' : ''}`}
                    onClick={() => selectExam(exam)}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div style={{ minWidth:0 }}>
                        <div className="fw-semibold text-truncate" style={{ fontSize:'.88rem' }}>
                          {exam.name}
                        </div>
                        <div className="small opacity-75 text-truncate">
                          <i className="bi bi-book me-1"/>{exam.subject_name}
                        </div>
                        <div className="small opacity-75">
                          <i className="bi bi-calendar3 me-1"/>{exam.exam_date}
                        </div>
                      </div>
                      <div className="text-end ms-2 flex-shrink-0">
                        {result ? (
                          <>
                            <div className={`badge bg-${GRADE_COLOR[result.grade] ?? 'secondary'} mb-1`}>
                              {result.grade}
                            </div>
                            <div>
                              <span className={`badge ${result.remarks==='Pass'?'bg-success':'bg-danger'}`}
                                    style={{ fontSize:'.65rem' }}>
                                {result.remarks}
                              </span>
                            </div>
                          </>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning"
                                style={{ fontSize:'.65rem' }}>Pending</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {!exams.length && (
                  <div className="list-group-item text-muted text-center py-5">
                    <i className="bi bi-inbox fs-2 d-block mb-2 opacity-25"/>
                    No exams for your course yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Result detail ─────────────── */}
          <div className="col-lg-8">
            {!selected ? (
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5 text-muted">
                  <i className="bi bi-arrow-left-circle fs-1 d-block mb-3 opacity-25"/>
                  <h6>Select an exam to view your result</h6>
                  <p className="small">Only exams from your registered course are shown.</p>
                </div>
              </div>

            ) : loadingRes ? (
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <div className="spinner-border text-primary"/>
                  <p className="text-muted mt-2 small">Loading result…</p>
                </div>
              </div>

            ) : !myResult ? (
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5 text-muted">
                  <i className="bi bi-hourglass-split fs-1 d-block mb-3 opacity-25"/>
                  <h6>Result not published yet</h6>
                  <p className="small">Your teacher hasn't uploaded marks for <strong>{selected.name}</strong>.</p>
                  <span className="badge bg-warning-subtle text-warning px-3 py-2">Pending</span>
                </div>
              </div>

            ) : (
              <div className="card border-0 shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="card-header border-0 d-flex justify-content-between align-items-center"
                     style={{ background:'linear-gradient(135deg,#1a3c6e,#2563eb)' }}>
                  <div>
                    <h6 className="text-white fw-bold mb-0">{selected.name}</h6>
                    <small className="text-white opacity-75">
                      <i className="bi bi-book me-1"/>{selected.subject_name}
                      {' · '}
                      <i className="bi bi-calendar3 me-1"/>{selected.exam_date}
                    </small>
                  </div>
                  <button className="btn btn-sm btn-light d-flex align-items-center gap-1"
                          onClick={downloadPDF}>
                    <i className="bi bi-download"/>Download
                  </button>
                </div>

                <div className="card-body p-4">
                  {/* Grade circle */}
                  <div className="text-center py-3 mb-4">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle text-white fw-bold mb-2"
                         style={{
                           width:90, height:90, fontSize:'2.2rem',
                           background:`var(--bs-${GRADE_COLOR[myResult.grade] ?? 'secondary'})`,
                           boxShadow:`0 0 30px var(--bs-${GRADE_COLOR[myResult.grade] ?? 'secondary'})44`,
                         }}>
                      {myResult.grade ?? '—'}
                    </div>
                    <div className="fw-bold fs-5 mb-2">
                      {GRADE_LABEL[myResult.grade] ?? '—'}
                    </div>
                    <span className={`badge px-4 py-2 fs-6 ${myResult.remarks==='Pass'?'bg-success':'bg-danger'}`}>
                      {myResult.remarks === 'Pass' ? '✅ PASSED' : '❌ FAILED'}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="row g-3 mb-4">
                    {[
                      { label:'Marks',      value:`${myResult.marks}/${selected.total_marks}`, color:'primary', icon:'123'              },
                      { label:'Percentage', value:`${fmt(+myResult.marks/selected.total_marks*100)}%`, color:'info', icon:'percent'      },
                      { label:'Pass Mark',  value:`${selected.pass_marks}`,                    color:'warning', icon:'check-circle'     },
                    ].map((s,i) => (
                      <div key={i} className="col-4">
                        <div className={`card border-0 bg-${s.color}-subtle text-center p-3`}>
                          <i className={`bi bi-${s.icon} text-${s.color} mb-1`} style={{ fontSize:'1.2rem' }}/>
                          <div className={`fw-bold fs-5 text-${s.color}`}>{s.value}</div>
                          <div className="text-muted small">{s.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="mb-1 d-flex justify-content-between small text-muted">
                    <span>Score</span>
                    <span>{myResult.marks} / {selected.total_marks}</span>
                  </div>
                  <div className="progress mb-1" style={{ height:14, borderRadius:7 }}>
                    <div
                      className={`progress-bar bg-${GRADE_COLOR[myResult.grade] ?? 'secondary'}`}
                      style={{ width:`${Math.min(100,(+myResult.marks/selected.total_marks)*100)}%`,
                               transition:'width .8s ease' }}
                    />
                  </div>
                  {/* Pass mark line */}
                  <div className="position-relative mb-3">
                    <div style={{
                      position:'absolute',
                      left:`${(selected.pass_marks/selected.total_marks)*100}%`,
                      width:2, height:18, background:'#374151', top:-16,
                    }}/>
                    <div className="text-muted" style={{ fontSize:'.72rem', paddingTop:4 }}>
                      ▲ Pass mark: {selected.pass_marks}
                    </div>
                  </div>

                  {/* Detail row */}
                  <div className="row g-2 pt-3 border-top">
                    {[
                      ['Course',  selected.course_name ],
                      ['Subject', selected.subject_name],
                      ['Student', user?.name           ],
                      ['Student ID', profile?.profile?.student_id ?? '—'],
                    ].map(([l,v],i) => (
                      <div key={i} className="col-6">
                        <div className="text-muted" style={{ fontSize:'.7rem' }}>{l}</div>
                        <div className="fw-semibold small">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
