import { useState, useEffect } from 'react';
import apiFetch from '../api';

function SelfRegistration({ onComplete }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '', class: '', school: '', dob: '',
    phone1: '', phone2: '', father_name: '', mother_name: '', address: '',
    email: '', aadhaar_no: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadMyData();
  }, []);

  function loadMyData() {
    apiFetch('/students/self')
      .then((res) => {
        if (res.status === 404) return null;
        return res.json();
      })
      .then((data) => {
        if (data) {
          setStudent(data);
          setFormData(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');

    const isFirstTime = !student;
    const url = '/students/self';
    const method = isFirstTime ? 'POST' : 'PUT';

    try {
      const response = await apiFetch(url, { method, body: JSON.stringify(formData) });
      const data = await response.json();

      if (response.ok) {
        setMessage(isFirstTime ? 'Registration completed! Please log out and log back in to continue.' : 'Updated successfully!');
        setEditing(false);
        if (isFirstTime) {
          onComplete();
        } else {
          loadMyData();
        }
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('Error: Could not connect to server');
    }
  }

  function daysRemaining() {
    if (!student?.created_at) return 0;
    const createdAt = new Date(student.created_at);
    const daysSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(7 - daysSince));
  }

  if (loading) return <p>Loading...</p>;

  const isFirstTime = !student;
  const canEdit = isFirstTime || daysRemaining() > 0;
  const showForm = isFirstTime || editing;

  return (
    <div>
      <h2>{isFirstTime ? 'Complete Your Registration' : 'My Registration'}</h2>

      {isFirstTime && <p>Please fill in your details below. This can only be submitted once.</p>}
      {!isFirstTime && canEdit && !editing && <p>You can edit your details for {daysRemaining()} more day(s).</p>}
      {!isFirstTime && !canEdit && <p>Edit window has closed. Contact admin for any changes.</p>}

      {showForm ? (
        <form onSubmit={handleSubmit}>
          <input name="name" placeholder="Student Name" value={formData.name || ''} onChange={handleChange} required />
          <input name="class" placeholder="Class" value={formData.class || ''} onChange={handleChange} />
          <input name="school" placeholder="School" value={formData.school || ''} onChange={handleChange} />
          <label>
            Date of Birth:
            <input name="dob" type="date" value={formData.dob || ''} onChange={handleChange} required />
          </label>
          <input name="phone1" placeholder="Phone Number 1" value={formData.phone1 || ''} onChange={handleChange} required />
          <input name="phone2" placeholder="Phone Number 2" value={formData.phone2 || ''} onChange={handleChange} />
          <input name="father_name" placeholder="Father's Name" value={formData.father_name || ''} onChange={handleChange} />
          <input name="mother_name" placeholder="Mother's Name" value={formData.mother_name || ''} onChange={handleChange} />
          <input name="address" placeholder="Address" value={formData.address || ''} onChange={handleChange} />
          <input name="email" type="email" placeholder="Email" value={formData.email || ''} onChange={handleChange} />
          <input name="aadhaar_no" placeholder="Aadhaar Number" value={formData.aadhaar_no || ''} onChange={handleChange} />

          <button type="submit">{isFirstTime ? 'Submit Registration' : 'Save Changes'}</button>
          {!isFirstTime && (
            <button type="button" onClick={() => { setEditing(false); setFormData(student); }}>Cancel</button>
          )}
        </form>
      ) : (
        <div>
          <p><strong>Name:</strong> {student.name}</p>
          <p><strong>Class:</strong> {student.class}</p>
          <p><strong>School:</strong> {student.school}</p>
          <p><strong>Date of Birth:</strong> {student.dob}</p>
          <p><strong>Phone 1:</strong> {student.phone1}</p>
          <p><strong>Phone 2:</strong> {student.phone2}</p>
          <p><strong>Father's Name:</strong> {student.father_name}</p>
          <p><strong>Mother's Name:</strong> {student.mother_name}</p>
          <p><strong>Address:</strong> {student.address}</p>
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Aadhaar Number:</strong> {student.aadhaar_no}</p>

          {canEdit && <button type="button" onClick={() => setEditing(true)}>Edit</button>}
        </div>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}

export default SelfRegistration;