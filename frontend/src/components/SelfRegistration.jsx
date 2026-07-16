import { useState } from 'react';
import apiFetch from '../api';

function SelfRegistration({ onComplete }) {
  const [formData, setFormData] = useState({
    name: '', class: '', school: '', dob: '',
    phone1: '', phone2: '', father_name: '', mother_name: '', address: ''
  });
  const [message, setMessage] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');

    try {
      const response = await apiFetch('/students/self', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (response.ok) {
        setMessage('Registration completed! Please log out and log back in to continue.');
        onComplete();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('Error: Could not connect to server');
    }
  }

  return (
    <div>
      <h2>Complete Your Registration</h2>
      <p>Please fill in your details below. This can only be submitted once.</p>

      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Student Name" value={formData.name} onChange={handleChange} required />
        <input name="class" placeholder="Class" value={formData.class} onChange={handleChange} />
        <input name="school" placeholder="School" value={formData.school} onChange={handleChange} />

        <label>
          Date of Birth:
          <input name="dob" type="date" value={formData.dob} onChange={handleChange} required />
        </label>

        <input name="phone1" placeholder="Phone Number 1" value={formData.phone1} onChange={handleChange} required />
        <input name="phone2" placeholder="Phone Number 2" value={formData.phone2} onChange={handleChange} />
        <input name="father_name" placeholder="Father's Name" value={formData.father_name} onChange={handleChange} />
        <input name="mother_name" placeholder="Mother's Name" value={formData.mother_name} onChange={handleChange} />
        <input name="address" placeholder="Address" value={formData.address} onChange={handleChange} />

        <button type="submit">Submit Registration</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default SelfRegistration;