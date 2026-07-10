import { useState, useEffect } from 'react';
import apiFetch from '../api';

function FeesForm() {
  const [month, setMonth] = useState('');
  const [category, setCategory] = useState('Monthly Fee');
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payingStudentId, setPayingStudentId] = useState(null);
  const [message, setMessage] = useState('');

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
    paid_date: payDate
  })
});
      const data = await response.json();

      if (response.ok) {
        setMessage('Payment recorded!');
        setPayAmount('');
        setPayDate('');
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

      <input
        placeholder="Search student name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {month && category && (
        <>
          <p><strong>Total Collected: ₹{total}</strong></p>

          <ul className="fees-list">
            {filteredStudents.map((student) => {
              const isPaid = student.amount !== null;
              return (
                <li key={student.student_id} className={isPaid ? 'paid-row' : 'unpaid-row'}>
                  <span>{student.name} ({student.class})</span>

                  {isPaid ? (
                    <span>Paid ₹{student.amount} on {student.paid_date}</span>
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
                      <button type="button" onClick={() => handleMarkPaid(student.student_id)}>
                        Confirm
                      </button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setPayingStudentId(student.student_id)}>
                      Mark Paid
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}

export default FeesForm;