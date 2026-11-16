import React, { useEffect, useState } from 'react';
import { classesAPI } from '../../services/api';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function StudentTimetable() {
  const [classes, setClasses] = useState([]);
  useEffect(()=>{ classesAPI.list().then(r=>setClasses(r.data.data)).catch(()=>{}); },[]);

  return (
    <>
      <h4 className="page-title mb-4"><i className="bi bi-calendar3 me-2"/>My Timetable</h4>
      {DAYS.map(day => {
        const dc = classes.filter(c=>c.day===day);
        if (!dc.length) return null;
        return (
          <div key={day} className="mb-4">
            <h6 className="fw-bold text-primary border-bottom pb-1">{day}</h6>
            <div className="row">
              {dc.map(c=>(
                <div key={c.id} className="col-md-4 mb-2">
                  <div className="card border-start border-primary border-3">
                    <div className="card-body py-2 px-3">
                      <div className="fw-bold">{c.subject_name}</div>
                      <div className="small text-muted"><i className="bi bi-clock me-1"/>{c.start_time} – {c.end_time}</div>
                      <div className="small text-muted"><i className="bi bi-person me-1"/>{c.teacher_name}</div>
                      {c.room && <div className="small text-muted"><i className="bi bi-door-open me-1"/>Room {c.room}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {!classes.length && <div className="text-center text-muted py-5"><i className="bi bi-calendar-x fs-1"/><p>No classes scheduled</p></div>}
    </>
  );
}
