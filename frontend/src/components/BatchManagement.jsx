import { useState, useEffect } from 'react';
import apiFetch from '../api';

function BatchManagement() {
  const [coaches, setCoaches] = useState([]);
  const [coachName, setCoachName] = useState('');
  const [coachPhone, setCoachPhone] = useState('');
  const [coachMessage, setCoachMessage] = useState('');
  const [batches, setBatches] = useState([]);
  const [batchName, setBatchName] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [batchMessage, setBatchMessage] = useState('');
  const [allStudents, setAllStudents] = useState([]);
  const [assignBatchId, setAssignBatchId] = useState('');
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignMessage, setAssignMessage] = useState('');
  const [coachUsername, setCoachUsername] = useState('');
  const [coachPassword, setCoachPassword] = useState('');
  const [coachRole, setCoachRole] = useState('coach');

  useEffect(() => {
    loadCoaches();
    loadBatches();
    loadAllStudents();
  }, []);

  function loadCoaches() {
    apiFetch('/coaches')
      .then((res) => res.json())
      .then((data) => setCoaches(data))
      .catch((err) => console.error('Error loading coaches:', err));
  }

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

  async function handleAddCoach(e) {
  e.preventDefault();
  setCoachMessage('');

  try {
    // Step 1: create the coach record
    const coachResponse = await apiFetch('/coaches', {
      method: 'POST',
      body: JSON.stringify({ name: coachName, phone: coachPhone })
    });
    const coachData = await coachResponse.json();

    if (!coachResponse.ok) {
      setCoachMessage(`Error: ${coachData.error}`);
      return;
    }

   // Step 2: create their login, linked to the new coach's id
const userResponse = await apiFetch('/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    username: coachUsername,
    password: coachPassword,
    role: coachRole,
    coach_id: coachData.id
  })
});
    const userData = await userResponse.json();

    if (userResponse.ok) {
      setCoachMessage(`Coach "${coachName}" added with login "${coachUsername}" (${coachRole})!`);
      setCoachName('');
      setCoachPhone('');
      setCoachUsername('');
      setCoachPassword('');
      setCoachRole('coach');
      loadCoaches();
    } else {
      setCoachMessage(`Coach saved, but login creation failed: ${userData.error}`);
    }
  } catch (err) {
    setCoachMessage('Error: Could not connect to server');
  }
}

  async function handleCreateBatch(e) {
    e.preventDefault();
    setBatchMessage('');

    try {
      const response = await apiFetch('/batches', {
        method: 'POST',
        body: JSON.stringify({ name: batchName, coach_id: selectedCoachId })
      });
      const data = await response.json();

      if (response.ok) {
        setBatchMessage(`Batch "${batchName}" created!`);
        setBatchName('');
        setSelectedCoachId('');
        loadBatches();
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
        setAssignBatchId('');
        setAssignStudentId('');
      } else {
        setAssignMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setAssignMessage('Error: Could not connect to server');
    }
  }

  return (
    <div>
      <h2>Batch Management</h2>

      <h3>Add Coach</h3>
      <form onSubmit={handleAddCoach}>
      <input
    placeholder="Coach Name"
    value={coachName}
    onChange={(e) => setCoachName(e.target.value)}
    required
      />
    <input
    placeholder="Phone Number"
    value={coachPhone}
    onChange={(e) => setCoachPhone(e.target.value)}
      />

      <h4>Login Details</h4>
      <input
    placeholder="Username"
    value={coachUsername}
    onChange={(e) => setCoachUsername(e.target.value)}
    required
      />
      <input
    type="password"
    placeholder="Password"
    value={coachPassword}
    onChange={(e) => setCoachPassword(e.target.value)}
    required
      />
      <select value={coachRole} onChange={(e) => setCoachRole(e.target.value)}>
      <option value="coach">Regular Coach</option>
      <option value="admin">Admin Coach</option>
      </select>

      <button type="submit">Add Coach</button>
      </form>
      <h4>Existing Coaches:</h4>
      <ul>
        {coaches.map((coach) => (
          <li key={coach.id}>{coach.name} — {coach.phone}</li>
        ))}
      </ul>

      <h3>Create Batch</h3>
      <form onSubmit={handleCreateBatch}>
        <input
          placeholder="Batch Name"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
          required
        />
        <select
          value={selectedCoachId}
          onChange={(e) => setSelectedCoachId(e.target.value)}
>
          <option value="">-- No Coach Yet --</option>
          {coaches.map((coach) => (
            <option key={coach.id} value={coach.id}>{coach.name}</option>
          ))}
        </select>
        <button type="submit">Create Batch</button>
      </form>
      {batchMessage && <p>{batchMessage}</p>}

      <h4>Existing Batches:</h4>
      <ul>
        {batches.map((batch) => (
          <li key={batch.id}>{batch.name} — Coach: {batch.coach_name}</li>
        ))}
      </ul>

      <h3>Assign Student to Batch</h3>
      <form onSubmit={handleAssignStudent}>
        <select
          value={assignBatchId}
          onChange={(e) => setAssignBatchId(e.target.value)}
          required
        >
          <option value="">-- Select Batch --</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>{batch.name}</option>
          ))}
        </select>

        <select
          value={assignStudentId}
          onChange={(e) => setAssignStudentId(e.target.value)}
          required
        >
          <option value="">-- Select Student --</option>
          {allStudents.map((student) => (
            <option key={student.id} value={student.id}>{student.name}</option>
          ))}
        </select>

        <button type="submit">Assign Student</button>
      </form>
      {assignMessage && <p>{assignMessage}</p>}
    </div>
  );
}

export default BatchManagement;