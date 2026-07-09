import { useState } from 'react';
const API_URL = import.meta.env.VITE_API_URL;

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
      const response = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Success! ${formData.name} registered (Age: ${calculateAge(formData.dob)})`);
        setFormData({
          name: '', class: '', school: '', dob: '',
          phone1: '', phone2: '', father_name: '', mother_name: '', address: ''
        });
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage(`Error: Could not connect to server`);
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

        <button type="submit">Submit</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default StudentForm;