import { useState, useEffect } from 'react';
import apiFetch from '../api';

function StudentLogins() {
  const [logins, setLogins] = useState([]);
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadLogins();
  }, []);

  function loadLogins() {
    apiFetch('/auth/students-list')
      .then((res) => res.json())
      .then(setLogins)
      .catch((err) => console.error('Error loading logins:', err));
  }

  async function handleReset(e) {
    e.preventDefault();
    setMessage('');

    try {
      const response = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ username: resetUsername, newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`Password reset for "${resetUsername}"`);
        setResetUsername('');
        setNewPassword('');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('Error: Could not connect to server');
    }
  }
  async function handleDeleteLogin(username) {
  if (!window.confirm(`Delete unused login "${username}"?`)) return;
  try {
    const response = await apiFetch(`/auth/users/${username}`, { method: 'DELETE' });
    const data = await response.json();
    if (response.ok) {
      setMessage(`Login "${username}" deleted`);
      loadLogins();
    } else {
      setMessage(`Error: ${data.error}`);
    }
  } catch (err) {
    setMessage('Error: Could not connect to server');
  }
}

  return (
    <div>
      <h2>Student Logins</h2>
      <p>Passwords can't be viewed once set (they're securely encrypted), but you can reset any student's password below.</p>

      <table className="students-table">
  <thead>
    <tr>
      <th>Username</th>
      <th>Student Name</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
    {logins.map((l, i) => (
      <tr key={i}>
        <td>{l.username}</td>
        <td>{l.student_name || '(not registered yet)'}</td>
        <td>
          {!l.student_name && (
            <button type="button" onClick={() => handleDeleteLogin(l.username)}>Delete</button>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>
      <h3>Reset a Password</h3>
      <form onSubmit={handleReset}>
        <select value={resetUsername} onChange={(e) => setResetUsername(e.target.value)} required>
          <option value="">-- Select Username --</option>
          {logins.map((l, i) => (
            <option key={i} value={l.username}>{l.username}</option>
          ))}
        </select>
        <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        <button type="submit">Reset Password</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default StudentLogins;