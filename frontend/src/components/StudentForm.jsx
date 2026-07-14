import { useState, useEffect } from 'react';
import apiFetch from '../api';

function StudentForm() {
  const [formData, setFormData] = useState({
    name: '', class: '', school: '', dob: '',
    phone1: '', phone2: '', father_name: '', mother_name: '', address: ''
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [students, setStudents] = useState([]);
  const [editingId, setEditingId] = useState(null);

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

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function startEdit(student) {
    setEditingId(student.id);
    setFormData({
      name: student.name, class: student.class, school: student.school, dob: student.dob,
      phone1: student.phone1 || '', phone2: student.phone2 || '',
      father_name: student.father_name || '', mother_name: student.mother_name || '',
      address: student.address || ''
    });
    setMessage('');
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData({
      name: '', class: '', school: '', dob: '',
      phone1: '', phone2: '', father_name: '', mother_name: '', address: ''
    });
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete ${name}? This also removes their attendance, fees, and login.`)) {
      return;
    }
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

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');

    try {
      if (editingId) {
        // Editing an existing student
        const response = await apiFetch(`/students/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (response.ok) {
          setMessage(`${formData.name} updated successfully`);
          cancelEdit();
          loadStudents();
        } else {
          setMessage(`Error: ${data.error}`);
        }
        return;
      }

      // Creating a new student
      const studentResponse = await apiFetch('/students', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const studentData = await studentResponse.json();

      if (!studentResponse.ok) {
        setMessage(`Error: ${studentData.error}`);
        return;
      }

      const userResponse = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username, password, role: 'student', student_id: studentData.id
        })
      });
      const userData = await userResponse.json();

      if (userResponse.ok) {
        setMessage(`Success! ${formData.name} registered (Age: ${calculateAge(formData.dob)}) with login "${username}"`);
        cancelEdit();
        setUsername('');
        setPassword('');
        loadStudents();
      } else {
        setMessage(`Student saved, but login creation failed: ${userData.error}`);
      }
    } catch (err) {
      setMessage('Error: Could not connect to server');
    }
  }

  return (
    <div>
      <h2>Student Registration</h2>
      <p><strong>Total Registered: {students.length}</strong></p>

      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Student Name" value={formData.name} onChange={handleChange} required />
        <input name="class" placeholder="Class" value={formData.class} onChange={handleChange} />
        <input name="school" placeholder="School" value={formData.school} onChange={handleChange} />

        <label>
          Date of Birth:
          <input name="dob" type="date" value={formData.dob} onChange={handleChange} required />
        </label>
        {formData.dob && <p>Age: {calculateAge(formData.dob)} years</p>}

        <input name="phone1" placeholder="Phone Number 1" value={formData.phone1} onChange={handleChange} />
        <input name="phone2" placeholder="Phone Number 2" value={formData.phone2} onChange={handleChange} />
        <input name="father_name" placeholder="Father's Name" value={formData.father_name} onChange={handleChange} />
        <input name="mother_name" placeholder="Mother's Name" value={formData.mother_name} onChange={handleChange} />
        <input name="address" placeholder="Address" value={formData.address} onChange={handleChange} />

        {!editingId && (
          <>
            <h3>Login Details</h3>
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </>
        )}

        <button type="submit">{editingId ? 'Update Student' : 'Submit'}</button>
        {editingId && <button type="button" onClick={cancelEdit}>Cancel</button>}
      </form>

      {message && <p>{message}</p>}

      <h3>Registered Students</h3>
      <ul className="student-list">
        {students.map((s) => (
          <li key={s.id}>
            <span>{s.name} ({s.class}) — {s.phone1}</span>
            <span>
              <button type="button" onClick={() => startEdit(s)}>Edit</button>
              <button type="button" onClick={() => handleDelete(s.id, s.name)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StudentForm;