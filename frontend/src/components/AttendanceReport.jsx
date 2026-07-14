import { useState, useEffect } from 'react';
import apiFetch from '../api';
function AttendanceReport() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [month, setMonth] = useState('');
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [stats, setStats] = useState([]);

  useEffect(() => {
    apiFetch('/batches').then(r => r.json()).then(setBatches);
  }, []);

  
useEffect(() => {
    if (selectedBatch && month) {
      apiFetch(`/attendance/monthly?batch_id=${selectedBatch}&month=${month}`)
        .then((res) => res.json())
        .then(setRecords)
        .catch((err) => console.error(err));
    }
  }, [selectedBatch, month]);
useEffect(() => {
  apiFetch('/students')
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) setStudents(data);
    })
    .catch(() => {});
}, []);
function loadStats(studentId) {
  apiFetch(`/attendance/stats/${studentId}`)
    .then((res) => res.json())
    .then((data) => setStats(data))
    .catch((err) => console.error('Error loading stats:', err));
}
  // Build a unique list of student names and dates from the raw records
  const studentNames = [...new Set(records.map((r) => r.name))];
  const dates = [...new Set(records.map((r) => r.date))].sort();

  // Look up a student's status for a specific date
  function getStatus(name, date) {
    const record = records.find((r) => r.name === name && r.date === date);
    return record ? record.status : '-';
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      <h2>Monthly Attendance Report</h2>

      <div className="no-print">
        <label>
          Batch:
          <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
            <option value="">-- Select Batch --</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>

        <label>
          Month:
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>

        <button type="button" onClick={handlePrint}>Print Report</button>
      </div>
      <div className="no-print">
  <h3>Attendance Stats</h3>
  <select
    value={selectedStudentId}
    onChange={(e) => {
      setSelectedStudentId(e.target.value);
      if (e.target.value) loadStats(e.target.value);
    }}
  >
    <option value="">-- Select Student for Stats --</option>
    {students.map((s) => (
      <option key={s.id} value={s.id}>{s.name}</option>
    ))}
  </select>

  {stats.length > 0 && (
    <ul>
      {stats.map((s) => (
        <li key={s.batch_id}>
          {s.batch_name}: {s.classes_attended} / {s.total_classes} classes attended
        </li>
      ))}
    </ul>
  )}
</div>

      {studentNames.length > 0 && (
  <table className="attendance-table">
    <thead>
      <tr>
        <th>Student</th>
        {dates.map((d) => (
          <th key={d}>{d.slice(8)}</th>
        ))}
      </tr>
      <tr>
        <th>Marked by</th>
        {dates.map((d) => {
          const recordForDate = records.find((r) => r.date === d && r.marked_by_coach) || records.find((r) => r.date === d);
          return <th key={d} className="marked-by-row">{recordForDate?.marked_by_coach || '-'}</th>;
        })}
      </tr>
    </thead>
    <tbody>
      {studentNames.map((name) => (
              <tr key={name}>
                <td>{name}</td>
                {dates.map((d) => (
                  <td key={d}>{getStatus(name, d) === 'present' ? 'P' : 'A'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AttendanceReport;