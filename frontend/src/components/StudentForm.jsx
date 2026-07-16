import { useState, useEffect } from 'react';
import apiFetch from '../api';

function StudentForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [students, setStudents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    loadStudents();
  }, []);

  function loadStudents() {
    apiFetch('/students')
      .then((res) => res.json())
      .then((data) => setStudents(data))
      .catch((err) => console.error('Error loading students:', err));
  }

  function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  async function handleCreateLogin(e) {
    e.preventDefault();
    setMessage('');

    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, role: 'student' })
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(`Login "${username}" created. Share these credentials with the student/parent to complete registration.`);
        setUsername('');
        setPassword('');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('Error: Could not connect to server');
    }
  }

  function startEdit(student) {
    setEditingId(student.id);
    setEditData({
      name: student.name, class: student.class, school: student.school, dob: student.dob,
      phone1: student.phone1 || '', phone2: student.phone2 || '',
      father_name: student.father_name || '', mother_name: student.mother_name || '',
      address: student.address || ''
    });
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdate(id) {
    try {
      const response = await apiFetch(`/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editData)
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`${editData.name} updated successfully`);
        setEditingId(null);
        loadStudents();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('Error: Could not connect to server');
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete ${name}? This also removes their attendance, fees, and login.`)) return;
    try {
      const response = await apiFetch(`/students/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        setMessage(`${name} deleted successfully`);
        loadStudents();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('Error: Could not connect to server');
    }
  }

  return (
    <div>
      <h2>Student Registration</h2>
      <p><strong>Total Registered: {students.length}</strong></p>

      <h3>Create Student Login</h3>
      <p>Give the student/parent these credentials — they'll fill in their own details after logging in.</p>
      <form onSubmit={handleCreateLogin}>
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Create Login</button>
      </form>
      {message && <p>{message}</p>}

      <h3>Registered Students</h3>
      <ul className="student-list">
        {students.map((s) => (
          <li key={s.id}>
            {editingId === s.id ? (
              <div className="edit-block">
                <input name="name" value={editData.name} onChange={handleEditChange} placeholder="Name" />
                <input name="class" value={editData.class} onChange={handleEditChange} placeholder="Class" />
                <input name="school" value={editData.school} onChange={handleEditChange} placeholder="School" />
                <input name="dob" type="date" value={editData.dob} onChange={handleEditChange} />
                <input name="phone1" value={editData.phone1} onChange={handleEditChange} placeholder="Phone 1" />
                <input name="phone2" value={editData.phone2} onChange={handleEditChange} placeholder="Phone 2" />
                <input name="father_name" value={editData.father_name} onChange={handleEditChange} placeholder="Father's Name" />
                <input name="mother_name" value={editData.mother_name} onChange={handleEditChange} placeholder="Mother's Name" />
                <input name="address" value={editData.address} onChange={handleEditChange} placeholder="Address" />
                <button type="button" onClick={() => handleUpdate(s.id)}>Save</button>
                <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            ) : (
              <>
                <span>{s.name} ({s.class}) — {s.phone1} {s.dob && `— Age ${calculateAge(s.dob)}`}</span>
                <span>
                  <button type="button" onClick={() => startEdit(s)}>Edit</button>
                  <button type="button" onClick={() => handleDelete(s.id, s.name)}>Delete</button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StudentForm;