import { useState, useEffect } from 'react';
import apiFetch from '../api';

function TeamSelection() {
  const [allStudents, setAllStudents] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [search, setSearch] = useState('');
  const [teamName, setTeamName] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [message, setMessage] = useState('');
  const [teams, setTeams] = useState([]);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editingTeamMembers, setEditingTeamMembers] = useState([]);
  const [addPlayerId, setAddPlayerId] = useState('');
  const [addJersey, setAddJersey] = useState('');

  useEffect(() => {
    apiFetch('/students').then((r) => r.json()).then(setAllStudents);
    apiFetch('/coaches').then((r) => r.json()).then(setCoaches);
    loadTeams();
  }, []);

  function loadTeams() {
    apiFetch('/teams').then((r) => r.json()).then(setTeams);
  }

  function togglePlayer(student) {
    setSelectedPlayers((prev) => {
      const exists = prev.find((p) => p.student_id === student.id);
      if (exists) {
        return prev.filter((p) => p.student_id !== student.id);
      }
      if (prev.length >= 12) {
        setMessage('Maximum 12 players allowed. Remove one first.');
        return prev;
      }
      setMessage('');
      return [...prev, { student_id: student.id, name: student.name, jersey_number: '' }];
    });
  }

  function updateJersey(studentId, value) {
    setSelectedPlayers((prev) =>
      prev.map((p) => (p.student_id === studentId ? { ...p, jersey_number: value } : p))
    );
  }

  async function handleSaveTeam(e) {
    e.preventDefault();
    setMessage('');

    if (selectedPlayers.length < 5 || selectedPlayers.length > 12) {
      setMessage(`You have ${selectedPlayers.length} players selected. Team size must be between 5 and 12.`);
      return;
    }

    try {
      const response = await apiFetch('/teams', {
        method: 'POST',
        body: JSON.stringify({
          name: teamName,
          coach_id: selectedCoachId || null,
          members: selectedPlayers.map((p) => ({ student_id: p.student_id, jersey_number: p.jersey_number }))
        })
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(`Team "${teamName}" saved with ${selectedPlayers.length} players!`);
        setTeamName('');
        setSelectedCoachId('');
        setSelectedPlayers([]);
        loadTeams();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('Error: Could not connect to server');
    }
  }
async function handleDeleteTeam(id, name) {
  if (!window.confirm(`Delete team "${name}"?`)) return;
  try {
    const response = await apiFetch(`/teams/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (response.ok) {
      setMessage(`Team "${name}" deleted`);
      loadTeams();
      if (editingTeamId === id) setEditingTeamId(null);
    } else {
      setMessage(`Error: ${data.error}`);
    }
  } catch (err) {
    setMessage('Error: Could not connect to server');
  }
}

async function startEditTeam(teamId) {
  setEditingTeamId(teamId);
  const response = await apiFetch(`/teams/${teamId}`);
  const team = await response.json();
  setEditingTeamMembers(team.members);
}

async function handleAddPlayer(e) {
  e.preventDefault();
  setMessage('');
  try {
    const response = await apiFetch(`/teams/${editingTeamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ student_id: addPlayerId, jersey_number: addJersey })
    });
    const data = await response.json();
    if (response.ok) {
      setAddPlayerId('');
      setAddJersey('');
      startEditTeam(editingTeamId);
    } else {
      setMessage(`Error: ${data.error}`);
    }
  } catch (err) {
    setMessage('Error: Could not connect to server');
  }
}

async function handleRemovePlayer(studentId, studentName) {
  if (!window.confirm(`Remove ${studentName} from this team?`)) return;
  try {
    const response = await apiFetch(`/teams/${editingTeamId}/members/${studentId}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (response.ok) {
      startEditTeam(editingTeamId);
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (err) {
    alert('Error: Could not connect to server');
  }
}

  const filteredStudents = allStudents.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2>Select Team</h2>
      <p><strong>{selectedPlayers.length} players selected (min 5, max 12)</strong></p>

      <input
        placeholder="Search player by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <ul className="student-list">
        {filteredStudents.map((s) => {
          const isSelected = selectedPlayers.some((p) => p.student_id === s.id);
          return (
            <li key={s.id}>
              <label>
                <input type="checkbox" checked={isSelected} onChange={() => togglePlayer(s)} />
                {s.name} ({s.class})
              </label>
              {isSelected && (
                <input
                  placeholder="Jersey #"
                  value={selectedPlayers.find((p) => p.student_id === s.id).jersey_number}
                  onChange={(e) => updateJersey(s.id, e.target.value)}
                />
              )}
            </li>
          );
        })}
      </ul>

      <form onSubmit={handleSaveTeam}>
        <input
          placeholder="Team Name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
        />
        <select value={selectedCoachId} onChange={(e) => setSelectedCoachId(e.target.value)}>
          <option value="">-- Select Coach (optional) --</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit">Save Team</button>
      </form>
      {message && <p>{message}</p>}

      <h3>Saved Teams:</h3>
<table className="students-table">
  <thead>
    <tr>
      <th>Team Name</th>
      <th>Coach</th>
      <th>Edit</th>
      <th>Delete</th>
    </tr>
  </thead>
  <tbody>
    {teams.map((t) => (
      <tr key={t.id}>
        <td>{t.name}</td>
        <td>{t.coach_name || 'Unassigned'}</td>
        <td>
          <button type="button" onClick={() => startEditTeam(t.id)}>Edit</button>
        </td>
        <td>
          <button type="button" onClick={() => handleDeleteTeam(t.id, t.name)}>Delete</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

{editingTeamId && (
  <div>
    <h3>Editing Team Roster ({editingTeamMembers.length} players)</h3>
    <table className="students-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Jersey #</th>
          <th>Remove</th>
        </tr>
      </thead>
      <tbody>
        {editingTeamMembers.map((m) => (
          <tr key={m.id}>
            <td>{m.name}</td>
            <td>{m.jersey_number || '-'}</td>
            <td>
              <button type="button" onClick={() => handleRemovePlayer(m.id, m.name)}>Remove</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <h4>Add a Player</h4>
    <form onSubmit={handleAddPlayer}>
      <select value={addPlayerId} onChange={(e) => setAddPlayerId(e.target.value)} required>
        <option value="">-- Select Student --</option>
        {allStudents
          .filter((s) => !editingTeamMembers.some((m) => m.id === s.id))
          .map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
      </select>
      <input placeholder="Jersey #" value={addJersey} onChange={(e) => setAddJersey(e.target.value)} />
      <button type="submit">Add Player</button>
    </form>

    <button type="button" onClick={() => setEditingTeamId(null)}>Close</button>
  </div>
)}
    </div>
  );
}

export default TeamSelection;