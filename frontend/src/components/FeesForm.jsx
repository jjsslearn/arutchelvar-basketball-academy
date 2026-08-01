import { useState, useEffect } from 'react';
import apiFetch from '../api';

function FeesForm({ user }) {
  const [month, setMonth] = useState('');
  const [category, setCategory] = useState('Monthly Fee');
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payingStudentId, setPayingStudentId] = useState(null);
  const [message, setMessage] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');

  useEffect(() => {
    if (month && category) {
      loadStatus();
      loadTotal();
    }
  }, [month, category]);

  function loadStatus() {
    apiFetch(`/fees/status?month=${month}&category=${category}`)
      .then((res) => res.json())
      .then((data) => setStudents(data))
      .catch((err) => console.error('Error loading fee status:', err));
  }

  function loadTotal() {
    apiFetch(`/fees/total?month=${month}&category=${category}`)
      .then((res) => res.json())
      .then((data) => setTotal(data.total))
      .catch((err) => console.error('Error loading total:', err));
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

async function handleMarkPaid(studentId) {
  setMessage('');

  if (!payAmount || !payDate) {
    setMessage('Please enter amount and date first.');
    return;
  }

  try {
    const response = await apiFetch('/fees', {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        category,
        month,
        amount: payAmount,
        paid_date: payDate,
        payment_mode: paymentMode
      })
    });
    const data = await response.json();

    if (response.ok) {
      setMessage('Payment recorded!');
      setPayAmount('');
      setPayDate('');
      setPaymentMode('Cash');
      setPayingStudentId(null);
      loadStatus();
      loadTotal();
    } else {
      setMessage(`Error: ${data.error}`);
    }
  } catch (err) {
    setMessage('Error: Could not connect to server');
  }
}

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2>Fees</h2>

      <div className="print-controls">
  <label>
    Month:
    <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
  </label>

  <label>
    Category:
    <select value={category} onChange={(e) => setCategory(e.target.value)}>
      <option value="Monthly Fee">Monthly Fee</option>
      <option value="Tournament Fee">Tournament Fee</option>
      <option value="Extra Coaching">Extra Coaching</option>
    </select>
  </label>

  {user?.role !== 'student' && (
    <label>
      Search Student:
      <input
        placeholder="Search student name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </label>
  )}
</div>

      {month && category && (
  <>
    <p><strong>Total Collected: ₹{total}</strong></p>
    <p>
      <strong>Paid: {students.filter((s) => s.amount !== null).length}</strong>
      {' | '}
      <strong>Not Paid: {students.filter((s) => s.amount === null).length}</strong>
    </p>

          <table className="students-table">
  <thead>
    <tr>
      <th>S.No</th>
      <th>Name</th>
      <th>Age</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    {[...filteredStudents]
      .sort((a, b) => new Date(b.dob) - new Date(a.dob))
      .map((student, index) => {
        const isPaid = student.amount !== null;
        return (
          <tr key={student.student_id} className={isPaid ? 'paid-row' : 'unpaid-row'}>
            <td>{index + 1}</td>
            <td>{student.name}</td>
            <td>{student.dob ? calculateAge(student.dob) : '-'}</td>
            <td>
              {isPaid ? (
  <span>Paid ₹{student.amount} via {student.payment_mode || 'Cash'} on {student.paid_date}</span>
) : payingStudentId === student.student_id ? (
  <span className="pay-inputs">
    <input
      type="number"
      placeholder="Amount"
      value={payAmount}
      onChange={(e) => setPayAmount(e.target.value)}
    />
    <input
      type="date"
      value={payDate}
      onChange={(e) => setPayDate(e.target.value)}
    />
    <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
      <option value="Cash">Cash</option>
      <option value="GPay">GPay</option>
    </select>
    <button type="button" onClick={() => handleMarkPaid(student.student_id)}>
      Confirm
    </button>
  </span>
) : (
  <button type="button" onClick={() => setPayingStudentId(student.student_id)}>
    Pay
  </button>
)}
            </td>
          </tr>
        );
        })}
  </tbody>
  </table>
        </>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}

export default FeesForm;