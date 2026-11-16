import React, { useState } from 'react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { studentsAPI, teachersAPI, feesAPI, examsAPI } from '../../services/api';

export default function ReportsPage() {
  const [loading, setLoading] = useState('');

  const genStudentsPDF = async () => {
    setLoading('students');
    try {
      const r = await studentsAPI.list({ per_page:500 });
      const rows = r.data.data;
      const doc = new jsPDF();
      doc.setFontSize(16); doc.text('Nenasala IMS — Students Report', 14, 18);
      doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
      autoTable(doc, {
        startY: 32,
        head: [['ID','Name','Email','Course','Admission','Status']],
        body: rows.map(s=>[s.student_id,s.name,s.email,s.course_name,s.admission_date||'-',s.status]),
        styles: { fontSize:8 },
        headStyles: { fillColor:[26,60,110] },
      });
      doc.save('students_report.pdf');
      toast.success('Students PDF downloaded');
    } catch { toast.error('Failed'); } finally { setLoading(''); }
  };

  const genFeesExcel = async () => {
    setLoading('fees');
    try {
      const r = await feesAPI.list({});
      const rows = r.data.data.map(f=>({
        'Student ID': f.student_code, Name: f.student_name,
        Amount: f.amount, 'Due Date': f.due_date,
        Description: f.description||'', Status: f.status,
      }));
      const ws  = XLSX.utils.json_to_sheet(rows);
      const wb  = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Fees');
      XLSX.writeFile(wb, 'fees_report.xlsx');
      toast.success('Fees Excel downloaded');
    } catch { toast.error('Failed'); } finally { setLoading(''); }
  };

  const genResultsPDF = async () => {
    setLoading('results');
    try {
      const examsRes = await examsAPI.list({});
      const exams = examsRes.data.data;
      if (!exams.length) { toast.warning('No exams found'); return; }
      const doc = new jsPDF();
      doc.setFontSize(16); doc.text('Nenasala IMS — Exam Results Report', 14, 18);
      let y = 28;
      for (const exam of exams.slice(0,5)) {
        const res = await examsAPI.getResults(exam.id);
        if (!res.data.data.length) continue;
        doc.setFontSize(12); doc.text(`${exam.name} (${exam.course_name} — ${exam.subject_name})`, 14, y); y += 6;
        autoTable(doc, {
          startY: y,
          head: [['Student','ID','Marks','Grade','Remarks']],
          body: res.data.data.map(r=>[r.student_name,r.student_code,r.marks,r.grade,r.remarks]),
          styles:{ fontSize:8 }, headStyles:{ fillColor:[26,60,110] },
          didDrawPage:(d)=>{ y = d.cursor.y + 8; }
        });
        y = doc.lastAutoTable.finalY + 10;
      }
      doc.save('results_report.pdf');
      toast.success('Results PDF downloaded');
    } catch { toast.error('Failed'); } finally { setLoading(''); }
  };

  const reports = [
    { key:'students', icon:'people-fill',      title:'Students Report', desc:'Complete list of all enrolled students', color:'primary', action:genStudentsPDF, label:'Download PDF' },
    { key:'fees',     icon:'cash-stack',        title:'Fees Report',     desc:'All fee records with payment status',  color:'success', action:genFeesExcel,  label:'Download Excel' },
    { key:'results',  icon:'list-ol',           title:'Results Report',  desc:'Exam results for all courses',         color:'warning', action:genResultsPDF, label:'Download PDF' },
  ];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="page-title mb-0"><i className="bi bi-file-earmark-bar-graph me-2"/>Reports</h4>
      </div>
      <div className="row">
        {reports.map(r=>(
          <div key={r.key} className="col-md-4 mb-4">
            <div className="card stat-card h-100">
              <div className="card-body text-center py-4">
                <div className={`stat-icon bg-${r.color}-subtle mx-auto mb-3`} style={{color:`var(--bs-${r.color})`}}>
                  <i className={`bi bi-${r.icon}`}/>
                </div>
                <h5 className="fw-bold">{r.title}</h5>
                <p className="text-muted small">{r.desc}</p>
                <button className={`btn btn-${r.color}`} onClick={r.action} disabled={loading===r.key}>
                  {loading===r.key ? <><span className="spinner-border spinner-border-sm me-2"/>Generating…</> : <><i className="bi bi-download me-2"/>{r.label}</>}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
