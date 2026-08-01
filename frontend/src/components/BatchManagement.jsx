import { useState, useEffect } from 'react';
import apiFetch from '../api';

function BatchManagement() {
  const [batches, setBatches] = useState([]);
  const [batchName, setBatchName] = useState('');
  const [batchMessage, setBatchMessage] = useState('');
  const [allStudents, setAllStudents] = useState([]);
  const [assignBatchId, setAssignBatchId] = useState('');
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignMessage, setAssignMessage] = useState('');
  const [viewBatchId, setViewBatchId] = useState('');
  const [batchStudents, setBatchStudents] = useState([]);
  const [batchSession, setBatchSession] = useState('morning');

  useEffect(() => {
    loadBatches();
    loadAllStudents();
  }, []);

  useEffect(() => {
    if (viewBatchId) {
      loadBatchStudents(viewBatchId);
    } else {
      setBatchStudents([]);
    }
  }, [viewBatchId]);

  function loadBatches() {
    apiFetch('/batches')
      .then((res) => res.json())
      .then((data) => setBatches(data))
      .catch((err) => console.error('Error loading batches:', err));
  }

  function loadAllStudents() {
    apiFetch('/students')
      .then((res) => res.json())
      .then((data) => setAllStudents(data))
      .catch((err) => console.error('Error loading students:', err));
  }

  function loadBatchStudents(batchId) {
    apiFetch(`/batches/${batchId}/students`)
      .then((res) => res.json())
      .then((data) => setBatchStudents(data))
      .catch((err) => console.error('Error loading batch students:', err));
  }

  function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  async function handleCreateBatch(e) {
  e.preventDefault();
  setBatchMessage('');

  try {
    const response = await apiFetch('/batches', {
      method: 'POST',
      body: JSON.stringify({ name: batchName, coach_id: null, session: batchSession })
    });
    const data = await response.json();

    if (response.ok) {
      setBatchMessage(`Batch "${batchName}" (${batchSession}) created!`);
      setBatchName('');
      loadBatches();
    } else {
      setBatchMessage(`Error: ${data.error}`);
    }
  } catch (err) {
    setBatchMessage('Error: Could not connect to server');
  }
}
async function handleDeleteBatch(id, name) {
  if (!window.confirm(`Delete batch "${name}"? This removes all its attendance records too.`)) return;
  try {
    const response = await apiFetch(`/batches/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (response.ok) {
      setBatchMessage(`Batch "${name}" deleted`);
      loadBatches();
      if (viewBatchId === id) setViewBatchId('');
    } else {
      setBatchMessage(`Error: ${data.error}`);
    }
  } catch (err) {
    setBatchMessage('Error: Could not connect to server');
  }
}
  async function handleAssignStudent(e) {
    e.preventDefault();
    setAssignMessage('');

    try {
      const response = await apiFetch(`/batches/${assignBatchId}/students`, {
        method: 'POST',
        body: JSON.stringify({ student_id: assignStudentId })
      });
      const data = await response.json();

      if (response.ok) {
        setAssignMessage('Student assigned to batch!');
        setAssignStudentId('');
        if (assignBatchId === viewBatchId) {
          loadBatchStudents(viewBatchId);
        }
      } else {
        setAssignMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setAssignMessage('Error: Could not connect to server');
    }
  }

  async function handleRemoveStudent(batchId, studentId, studentName) {
    if (!window.confirm(`Remove ${studentName} from this batch?`)) return;
    try {
      const response = await apiFetch(`/batches/${batchId}/students/${studentId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok) {
        loadBatchStudents(batchId);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Error: Could not connect to server');
    }
  }

  return (
    <div>
      <h2>Batch Management</h2>

      <h3>Create Batch</h3>
<form onSubmit={handleCreateBatch}>
  <input placeholder="Batch Name (e.g. Beginners, Advanced)" value={batchName} onChange={(e) => setBatchName(e.target.value)} required />
  <select value={batchSession} onChange={(e) => setBatchSession(e.target.value)}>
    <option value="morning">Morning</option>
    <option value="evening">Evening</option>
  </select>
  <button type="submit">Create Batch</button>
</form>
      {batchMessage && <p>{batchMessage}</p>}

      <h3>Assign Student to Batch</h3>
      <form onSubmit={handleAssignStudent}>
        <select value={assignBatchId} onChange={(e) => setAssignBatchId(e.target.value)} required>
          <option value="">-- Select Batch --</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>{batch.name}</option>
          ))}
        </select>
        <select value={assignStudentId} onChange={(e) => setAssignStudentId(e.target.value)} required>
          <option value="">-- Select Student --</option>
          {allStudents.map((student) => (
            <option key={student.id} value={student.id}>{student.name}</option>
          ))}
        </select>
        <button type="submit">Assign</button>
      </form>
      {assignMessage && <p>{assignMessage}</p>}

      <h3>Existing Batches</h3>
<table className="students-table">
  <thead>
    <tr>
      <th>Batch Name</th>
      <th>Session</th>
      <th>Coach</th>
      <th>Delete</th>
    </tr>
  </thead>
  <tbody>
    {batches.map((batch) => (
      <tr key={batch.id}>
        <td>{batch.name}</td>
        <td>{batch.session || '-'}</td>
        <td>{batch.coach_name || 'Unassigned'}</td>
        <td>
          <button type="button" onClick={() => handleDeleteBatch(batch.id, batch.name)}>Delete</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
      {assignMessage && <p>{assignMessage}</p>}

      <h3>View / Remove Batch Members</h3>
      <select value={viewBatchId} onChange={(e) => setViewBatchId(e.target.value)}>
        <option value="">-- Select Batch --</option>
        {batches.map((batch) => (
  <option key={batch.id} value={batch.id}>{batch.name} ({batch.session})</option>
      ))}
      </select>

      {viewBatchId && (
        <table className="students-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Name</th>
              <th>Age</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {[...batchStudents]
              .sort((a, b) => new Date(b.dob) - new Date(a.dob))
              .map((s, index) => (
                <tr key={s.id}>
                  <td>{index + 1}</td>
                  <td>{s.name}</td>
                  <td>{s.dob ? calculateAge(s.dob) : '-'}</td>
                  <td>
                    <button type="button" onClick={() => handleRemoveStudent(viewBatchId, s.id, s.name)}>Remove</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default BatchManagement;