import { useState, useEffect } from 'react';
import apiFetch from '../api';

function LoginLog() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    apiFetch('/auth/login-log')
      .then((res) => res.json())
      .then(setLogs)
      .catch((err) => console.error('Error loading login log:', err));
  }, []);

  function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  }

  return (
    <div>
      <h2>Coach Login Log</h2>
      <table className="attendance-table">
        <thead>
          <tr>
            <th>Coach</th>
            <th>Login Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => (
            <tr key={i}>
              <td>{log.coach_name}</td>
              <td>{formatTime(log.login_time)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LoginLog;