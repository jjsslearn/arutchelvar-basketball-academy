import { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL;

function AttendanceForm() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [date, setDate] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/batches`)
      .then((res) => res.json())
      .then((data) => setBatches(data))
      .catch((err) => console.error('Error loading batches:', err));
  }, []);

  useEffect(() => {
    if (!selectedBatch) {
      setStudents([]);
      return;
    }
    fetch(`${API_URL}/batches/${selectedBatch}/students`)
      .then((res) => res.json())
      .then((data) => {
        setStudents(data);
        // Default everyone to "present" when the list loads
        const defaults = {};
        data.forEach((student) => {
          defaults[student.id] = 'present';
        });
        setAttendance(defaults);
      })
      .catch((err) => console.error('Error loading students:', err));
  }, [selectedBatch]);

  function toggleStatus(studentId) {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  }

  async function handleSaveAttendance() {
    setMessage('');

    if (!selectedBatch || !date) {
      setMessage('Please select a batch and date first.');
      return;
    }

    const records = students.map((student) => ({
      student_id: student.id,
      status: attendance[student.id]
    }));

    try {
      const response = await fetch(`${API_URL}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: selectedBatch, date, records })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Attendance saved successfully!');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('Error: Could not connect to server');
    }
  }

  return (
    <div>
      <h2>Attendance</h2>

      <label>
        Select Batch:
        <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
          <option value="">-- Choose a batch --</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name} (Coach: {batch.coach_name})
            </option>
          ))}
        </select>
      </label>

      <label>
        Date:
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      {students.length > 0 && (
        <div>
          <h3>Mark Attendance:</h3>
          <ul className="attendance-list">
            {students.map((student) => (
              <li key={student.id}>
                <span>{student.name} ({student.class})</span>
                <button
                  type="button"
                  className={attendance[student.id] === 'present' ? 'present-btn' : 'absent-btn'}
                  onClick={() => toggleStatus(student.id)}
                >
                  {attendance[student.id] === 'present' ? 'Present' : 'Absent'}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={handleSaveAttendance}>Save Attendance</button>
        </div>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}

export default AttendanceForm;