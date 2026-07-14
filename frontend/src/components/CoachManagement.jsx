import { useState, useEffect } from 'react';
import apiFetch from '../api';

function CoachManagement() {
  const [coaches, setCoaches] = useState([]);
  const [coachName, setCoachName] = useState('');
  const [coachPhone, setCoachPhone] = useState('');
  const [coachUsername, setCoachUsername] = useState('');
  const [coachPassword, setCoachPassword] = useState('');
  const [coachRole, setCoachRole] = useState('coach');
  const [coachMessage, setCoachMessage] = useState('');

  useEffect(() => {
    loadCoaches();
  }, []);

  function loadCoaches() {
    apiFetch('/coaches')
      .then((res) => res.json())
      .then((data) => setCoaches(data))
      .catch((err) => console.error('Error loading coaches:', err));
  }

  async function handleAddCoach(e) {
    e.preventDefault();
    setCoachMessage('');

    try {
      const coachResponse = await apiFetch('/coaches', {
        method: 'POST',
        body: JSON.stringify({ name: coachName, phone: coachPhone })
      });
      const coachData = await coachResponse.json();

      if (!coachResponse.ok) {
        setCoachMessage(`Error: ${coachData.error}`);
        return;
      }

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

  async function handleDeleteCoach(id, name) {
    if (!window.confirm(`Delete coach ${name}? Their batches will remain but become unassigned.`)) {
      return;
    }
    try {
      const response = await apiFetch(`/coaches/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        setCoachMessage(`Coach ${name} deleted`);
        loadCoaches();
      } else {
        setCoachMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setCoachMessage('Error: Could not connect to server');
    }
  }

  return (
    <div>
      <h2>Coach Management</h2>
      <p><strong>Total Coaches: {coaches.length}</strong></p>

      <h3>Add Coach</h3>
      <form onSubmit={handleAddCoach}>
        <input placeholder="Coach Name" value={coachName} onChange={(e) => setCoachName(e.target.value)} required />
        <input placeholder="Phone Number" value={coachPhone} onChange={(e) => setCoachPhone(e.target.value)} />

        <h4>Login Details</h4>
        <input placeholder="Username" value={coachUsername} onChange={(e) => setCoachUsername(e.target.value)} required />
        <input type="password" placeholder="Password" value={coachPassword} onChange={(e) => setCoachPassword(e.target.value)} required />
        <select value={coachRole} onChange={(e) => setCoachRole(e.target.value)}>
          <option value="coach">Regular Coach</option>
          <option value="admin">Admin Coach</option>
        </select>

        <button type="submit">Add Coach</button>
      </form>
      {coachMessage && <p>{coachMessage}</p>}

      <h4>Existing Coaches:</h4>
      <ul className="student-list">
        {coaches.map((coach) => (
          <li key={coach.id}>
            <span>{coach.name} — {coach.phone}</span>
            <button type="button" onClick={() => handleDeleteCoach(coach.id, coach.name)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CoachManagement;