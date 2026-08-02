import { useState, useEffect } from 'react';
import apiFetch from '../api';

function CoachAttendance() {
  const [coaches, setCoaches] = useState([]);
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [date, setDate] = useState('');
  const [morningStatus, setMorningStatus] = useState('present');
  const [eveningStatus, setEveningStatus] = useState('present');
  const [message, setMessage] = useState('');
  const [month, setMonth] = useState('');
  const [records, setRecords] = useState([]);
  const [totalSessionsPresent, setTotalSessionsPresent] = useState(0);
  
  useEffect(() => {
    apiFetch('/coaches').then((r) => r.json()).then(setCoaches);
  }, []);

  useEffect(() => {
    if (selectedCoachId && month) {
      loadMonthly();
    }
  }, [selectedCoachId, month]);

  function loadMonthly() {
    apiFetch(`/coach-attendance/monthly?coach_id=${selectedCoachId}&month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        setRecords(data.records);
        setTotalSessionsPresent(data.totalSessionsPresent);
      })
      .catch((err) => console.error('Error loading coach attendance:', err));
  }
  function formatDate(dateStr) {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

  async function handleSave(e) {
    e.preventDefault();
    setMessage('');

    if (!selectedCoachId || !date) {
      setMessage('Please select a coach and date.');
      return;
    }

    try {
      const response = await apiFetch('/coach-attendance', {
        method: 'POST',
        body: JSON.stringify({
          coach_id: selectedCoachId,
          date,
          morning_status: morningStatus,
          evening_status: eveningStatus
        })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Attendance saved!');
        if (month && date.startsWith(month)) {
          loadMonthly();
        }
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('Error: Could not connect to server');
    }
  }

  return (
    <div>
      <h2>Coach Attendance</h2>

      <label>
        Select Coach:
        <select value={selectedCoachId} onChange={(e) => setSelectedCoachId(e.target.value)}>
          <option value="">-- Select Coach --</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      <h3>Mark Attendance</h3>
      <form onSubmit={handleSave}>
        <label>
          Date:
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>

        <label>
          Morning:
          <select value={morningStatus} onChange={(e) => setMorningStatus(e.target.value)}>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </label>

        <label>
          Evening:
          <select value={eveningStatus} onChange={(e) => setEveningStatus(e.target.value)}>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </label>

        <button type="submit">Save Attendance</button>
      </form>
      {message && <p>{message}</p>}

      {selectedCoachId && (
        <>
          <h3>Monthly Summary</h3>
          <label>
            Month:
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </label>

          {month && (
            <>
              <p><strong>Total Sessions Present: {totalSessionsPresent}</strong></p>
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Morning</th>
                    <th>Evening</th>
                  </tr>
                </thead>
                <tbody>
          {records.map((r) => (
              <tr key={r.date}>
              <td>{formatDate(r.date)}</td>
              <td>{r.morning_status || '-'}</td>
              <td>{r.evening_status || '-'}</td>
              </tr>
          ))}
</tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default CoachAttendance;