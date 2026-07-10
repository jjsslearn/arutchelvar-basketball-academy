import { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import StudentForm from './components/StudentForm';
import AttendanceForm from './components/AttendanceForm';
import BatchManagement from './components/BatchManagement';
import FeesForm from './components/FeesForm';
import PrintCards from './components/PrintCards';
import AttendanceReport from './components/AttendanceReport';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');

  // On page load, check if a user is already saved from a previous login
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setView('dashboard');
  }

  // Not logged in: show the login page only
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Logged in: show dashboard or the selected module
  return (
    <div className="App">
      <div className="top-bar">
        <h1>Arutchelvar Basketball Academy</h1>
        <div>
          <span>Logged in as: {user.username} ({user.role})</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {view !== 'dashboard' && (
        <button className="back-btn" onClick={() => setView('dashboard')}>← Back to Dashboard</button>
      )}

      {view === 'dashboard' && (
        <div className="dashboard-grid">
          {(user.role === 'admin' || user.role === 'coach' || user.role === 'student') && (
            <button onClick={() => setView('studentForm')}>Student Registration</button>
          )}
          {(user.role === 'admin' || user.role === 'coach') && (
            <button onClick={() => setView('attendance')}>Attendance</button>
          )}
          {(user.role === 'admin') && (
            <button onClick={() => setView('batchManagement')}>Coach & Batch Management</button>
          )}
          {(user.role === 'admin' || user.role === 'coach' || user.role === 'student') && (
            <button onClick={() => setView('fees')}>Fees</button>
          )}
          {(user.role === 'admin') && (
            <button onClick={() => setView('printCards')}>Print Player Cards</button>
          )}
          {(user.role === 'admin' || user.role === 'coach' || user.role === 'student') && (
            <button onClick={() => setView('attendanceReport')}>Attendance Report</button>
          )}
        </div>
      )}

      {view === 'studentForm' && <StudentForm />}
      {view === 'attendance' && <AttendanceForm />}
      {view === 'batchManagement' && <BatchManagement />}
      {view === 'fees' && <FeesForm user={user} />}
      {view === 'printCards' && <PrintCards />}
      {view === 'attendanceReport' && <AttendanceReport user={user} />}
    </div>
  );
}

export default App;