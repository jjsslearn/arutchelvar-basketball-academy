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
      <ul>
        {teams.map((t) => (
          <li key={t.id}>{t.name} — Coach: {t.coach_name || 'Unassigned'}</li>
        ))}
      </ul>
    </div>
  );
}

export default TeamSelection;