import { useState, useEffect } from 'react';
import logo from '../assets/logo.jpg';

function PrintCards() {
  const [students, setStudents] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [jerseyNumbers, setJerseyNumbers] = useState({});
  const [selectedCoach, setSelectedCoach] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/students').then(r => r.json()).then(setStudents);
    fetch('http://localhost:5000/coaches').then(r => r.json()).then(setCoaches);
  }, []);

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handlePrint() {
    window.print();
  }

  const selectedStudents = students.filter((s) => selectedIds.includes(s.id));

  return (
    <div>
      <h2>Print Player Cards</h2>

      <div className="no-print">
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

        {selectedStudents.map((s) => (
          <div key={s.id} className="player-card">
            <p><strong>Name:</strong> {s.name}</p>
            <p><strong>Date of Birth:</strong> {s.dob}</p>
            <p><strong>Jersey Number:</strong> {jerseyNumbers[s.id] || '-'}</p>
            <p><strong>Coach:</strong> {selectedCoach || '-'}</p>
            <p><strong>Phone:</strong> {s.phone1}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PrintCards;