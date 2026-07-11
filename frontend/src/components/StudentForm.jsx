import { useState } from 'react';
import apiFetch from '../api';

function StudentForm() {
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    school: '',
    dob: '',
    phone1: '',
    phone2: '',
    father_name: '',
    mother_name: '',
    address: ''
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

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

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');

    try {
      // Step 1: create the student record
      const studentResponse = await apiFetch('/students', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const studentData = await studentResponse.json();

      if (!studentResponse.ok) {
        setMessage(`Error: ${studentData.error}`);
        return;
      }

      // Step 2: create their login, linked to the new student's id
      const userResponse = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
          role: 'student',
          student_id: studentData.id
        })
      });
      const userData = await userResponse.json();

      if (userResponse.ok) {
        setMessage(`Success! ${formData.name} registered (Age: ${calculateAge(formData.dob)}) with login "${username}"`);
        setFormData({
          name: '', class: '', school: '', dob: '',
          phone1: '', phone2: '', father_name: '', mother_name: '', address: ''
        });
        setUsername('');
        setPassword('');
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

        <h3>Login Details</h3>
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button type="submit">Submit</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default StudentForm;