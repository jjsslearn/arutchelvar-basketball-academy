import { useState, useEffect } from 'react';
import apiFetch from '../api';

function DailyAttendanceReport() {
  const [month, setMonth] = useState('');
  const [report, setReport] = useState([]);

  useEffect(() => {
    if (month) {
      apiFetch(`/class-summary/daily-report?month=${month}`)
        .then((res) => res.json())
        .then(setReport)
        .catch((err) => console.error('Error loading report:', err));
    }
  }, [month]);

  return (
    <div>
      <h2>Daily Attendance Report</h2>

      <label>
        Month:
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </label>

      {month && (
        <table className="students-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Morning Total</th>
              <th>Evening Total</th>
            </tr>
          </thead>
          <tbody>
            {report.map((row) => (
              <tr key={row.date}>
                <td>{row.date}</td>
                <td>{row.morningTotal ?? ''}</td>
                <td>{row.eveningTotal ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DailyAttendanceReport;