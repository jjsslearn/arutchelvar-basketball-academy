import { useState, useEffect } from 'react';
import apiFetch from '../api';
import logo from '../assets/logo.jpg';

function PrintCards() {
  const [students, setStudents] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [jerseyNumbers, setJerseyNumbers] = useState({});
  const [selectedCoach, setSelectedCoach] = useState('');
  const [tournamentName, setTournamentName] = useState('');
  const [category, setCategory] = useState('');
  const [selectedAsstCoach, setSelectedAsstCoach] = useState('');

  useEffect(() => {
    apiFetch('/students').then(r => r.json()).then(setStudents);
    apiFetch('/coaches').then(r => r.json()).then(setCoaches);
    apiFetch('/teams').then(r => r.json()).then(setTeams);
  }, []);

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSelectTeam(teamId) {
    setSelectedTeamId(teamId);
    if (!teamId) {
      setSelectedIds([]);
      setJerseyNumbers({});
      return;
    }
    const response = await apiFetch(`/teams/${teamId}`);
    const team = await response.json();

    setSelectedIds(team.members.map((m) => m.id));
    const jerseys = {};
    team.members.forEach((m) => {
      jerseys[m.id] = m.jersey_number || '';
    });
    setJerseyNumbers(jerseys);

    if (team.coach_name) {
      setSelectedCoach(team.coach_name);
    }
  }

  function handlePrint() {
    window.print();
  }

  const selectedStudents = students.filter((s) => selectedIds.includes(s.id));

  return (
    <div>
      <h2>Print Player Cards</h2>

      <div className="no-print">
        <label>
          Load Saved Team:
          <select value={selectedTeamId} onChange={(e) => handleSelectTeam(e.target.value)}>
            <option value="">-- Manual Selection --</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
        <label>
        Tournament Name:
        <input value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} placeholder="e.g. 70th Venkatakrishnan Trophy" />
        </label>
        <label>
        Category:
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. U-13 (2014 & above)" />
        </label>
        <label>
        Assistant Coach:
        <select value={selectedAsstCoach} onChange={(e) => setSelectedAsstCoach(e.target.value)}>
        <option value="">-- Select Asst. Coach --</option>
        {coaches.map((c) => (
        <option key={c.id} value={c.name}>{c.name}</option>
        ))}
      </select>
      </label>

        <h4>Select Players:</h4>
        {students.map((s) => (
          <div key={s.id}>
            <label>
              <input
                type="checkbox"
                checked={selectedIds.includes(s.id)}
                onChange={() => toggleSelect(s.id)}
              />
              {s.name}
            </label>
            {selectedIds.includes(s.id) && (
              <input
                placeholder="Jersey #"
                value={jerseyNumbers[s.id] || ''}
                onChange={(e) =>
                  setJerseyNumbers((prev) => ({ ...prev, [s.id]: e.target.value }))
                }
              />
            )}
          </div>
        ))}

        <label>
          Coach:
          <select value={selectedCoach} onChange={(e) => setSelectedCoach(e.target.value)}>
            <option value="">-- Select Coach --</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </label>

        <button type="button" onClick={handlePrint}>Print Cards</button>
      </div>

      <div className="print-area">
  <div className="club-header">
    <img src={logo} alt="Club Logo" className="club-logo" />
    <h1>Arutchelvar Basketball Academy</h1>
    <p>President: A.Rajasekar (9865166001) &nbsp; | &nbsp; Secretary: S.Krishnakumar (9443758242)</p>
  </div>

  {tournamentName && <p className="tournament-line"><strong>Tournament Name:</strong> {tournamentName}</p>}
  {category && <p className="tournament-line"><strong>Category:</strong> {category}</p>}

  <h3 className="players-list-title">PLAYERS LIST</h3>

  <table className="players-table">
    <thead>
      <tr>
        <th>S.NO</th>
        <th>NAME</th>
        <th>DOB</th>
        <th>JERSEY NO</th>
      </tr>
    </thead>
    <tbody>
      {selectedStudents.map((s, index) => (
        <tr key={s.id}>
          <td>{index + 1}</td>
          <td>{s.name}</td>
          <td>{s.dob}</td>
          <td>{jerseyNumbers[s.id] || '-'}</td>
        </tr>
      ))}
    </tbody>
  </table>

  <div className="print-footer">
    <p><strong>COACH NAME:</strong> {selectedCoach || '-'}</p>
    <p><strong>ASST.COACH:</strong> {selectedAsstCoach || '-'}</p>
    <p className="secretary-line">SECRETARY<br />ARUTCHELVAR BASKETBALL ACADEMY</p>
  </div>
</div>
</div>
  );
}

export default PrintCards;