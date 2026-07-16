import { useState, useEffect } from 'react';
import apiFetch from '../api';
import arutchelvarLogo from '../assets/logo.jpg';
import youngbloodLogo from '../assets/youngblood-logo.jpg';

const CLUB_IDENTITIES = {
  arutchelvar: {
    logo: arutchelvarLogo,
    name: 'PassionPollachi Basketball Academy',
    presidentName: 'A.Rajasekar',
    presidentPhone: '9865166001',
    secretaryName: 'S.Krishnakumar',
    secretaryPhone: '9443758242'
  },
  youngblood: {
    logo: youngbloodLogo,
    name: 'Youngblood Basketball Academy, Pollachi',
    presidentName: 'A.Senthil Kumar',
    presidentPhone: '9865677220',
    secretaryName: 'P. Santhosh Robinson',
    secretaryPhone: '7502483018'
  }
};

function PrintCards() {
  const [coaches, setCoaches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [jerseyNumbers, setJerseyNumbers] = useState({});
  const [selectedCoach, setSelectedCoach] = useState('');
  const [selectedAsstCoach, setSelectedAsstCoach] = useState('');
  const [tournamentName, setTournamentName] = useState('');
  const [category, setCategory] = useState('');
  const [identityKey, setIdentityKey] = useState('arutchelvar');

  const identity = CLUB_IDENTITIES[identityKey];

  useEffect(() => {
    apiFetch('/coaches').then(r => r.json()).then(setCoaches);
    apiFetch('/teams').then(r => r.json()).then(setTeams);
  }, []);

  async function handleSelectTeam(teamId) {
    setSelectedTeamId(teamId);
    if (!teamId) {
      setSelectedStudents([]);
      setJerseyNumbers({});
      return;
    }
    const response = await apiFetch(`/teams/${teamId}`);
    const team = await response.json();

    setSelectedStudents(team.members);
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

  return (
    <div>
      <h2 className="no-print">Print Player Cards</h2>

      <div className="no-print">
        <label>
          Club Identity:
          <select value={identityKey} onChange={(e) => setIdentityKey(e.target.value)}>
            <option value="arutchelvar">PassionPollachi Basketball Academy</option>
            <option value="youngblood">Youngblood Basketball Academy</option>
          </select>
        </label>

        <label>
          Select Team:
          <select value={selectedTeamId} onChange={(e) => handleSelectTeam(e.target.value)}>
            <option value="">-- Select a Saved Team --</option>
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
          Coach:
          <select value={selectedCoach} onChange={(e) => setSelectedCoach(e.target.value)}>
            <option value="">-- Select Coach --</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
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

        <button type="button" onClick={handlePrint} disabled={!selectedTeamId}>Print Cards</button>
      </div>

      <div className="print-area">
  <div className="doc-header">
    <img src={identity.logo} alt="Club Logo" className="doc-logo" />
    <h1 className="doc-club-name">{identity.name}</h1>

    <div className="doc-officials">
      <div className="doc-official-left">
        <p>President</p>
        <p>{identity.presidentName}</p>
        <p>{identity.presidentPhone}</p>
      </div>
      <div className="doc-official-right">
  <p>Secretary</p>
  <p>{identity.secretaryName}</p>
  <p>{identity.secretaryPhone}</p>
</div>
</div>
<hr className="doc-divider" />
</div>

        {tournamentName && <p className="tournament-line"><strong>Tournament Name:</strong> {tournamentName}</p>}
        {category && <p className="tournament-line"><strong>Category:</strong> {category}</p>}

        {selectedStudents.length > 0 && (
          <>
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
  <div className="footer-coach-block">
    <p><strong>COACH NAME:</strong> {selectedCoach || '-'}</p>
    <p><strong>ASST.COACH:</strong> {selectedAsstCoach || '-'}</p>
  </div>
  <div className="footer-secretary-block">
    <p>SECRETARY</p>
    <p>{identity.name.toUpperCase()}</p>
  </div>
</div>
</>

        )}
      </div>
    </div>
  );
}

export default PrintCards;