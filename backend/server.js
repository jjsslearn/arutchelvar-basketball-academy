require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Arutchelvar Basketball Academy backend is running!');
});

// ----- STUDENTS -----

app.post('/students', async (req, res) => {
  const { name, class: studentClass, school, dob, phone1, phone2, father_name, mother_name, address } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO students (name, class, school, dob, phone1, phone2, father_name, mother_name, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [name, studentClass, school, dob, phone1, phone2, father_name, mother_name, address]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Student registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- COACHES -----

app.post('/coaches', async (req, res) => {
  const { name, phone } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO coaches (name, phone) VALUES ($1, $2) RETURNING id',
      [name, phone]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Coach added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/coaches', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM coaches');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- BATCHES -----

app.post('/batches', async (req, res) => {
  const { name, coach_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO batches (name, coach_id) VALUES ($1, $2) RETURNING id',
      [name, coach_id]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Batch created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/batches', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT batches.id, batches.name, coaches.name AS coach_name
      FROM batches
      LEFT JOIN coaches ON batches.coach_id = coaches.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/batches/:batchId/students', async (req, res) => {
  const { batchId } = req.params;
  const { student_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO batch_students (batch_id, student_id) VALUES ($1, $2) RETURNING id',
      [batchId, student_id]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Student added to batch' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/batches/:batchId/students', async (req, res) => {
  const { batchId } = req.params;
  try {
    const result = await pool.query(
      `SELECT students.id, students.name, students.class
       FROM batch_students
       JOIN students ON batch_students.student_id = students.id
       WHERE batch_students.batch_id = $1`,
      [batchId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- ATTENDANCE -----

app.post('/attendance', async (req, res) => {
  const { batch_id, date, records } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM attendance WHERE batch_id = $1 AND date = $2', [batch_id, date]);
    for (const record of records) {
      await client.query(
        'INSERT INTO attendance (batch_id, student_id, date, status) VALUES ($1, $2, $3, $4)',
        [batch_id, record.student_id, date, record.status]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ message: 'Attendance recorded successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get('/attendance', async (req, res) => {
  const { batch_id, date } = req.query;
  try {
    const result = await pool.query(
      `SELECT attendance.student_id, students.name, attendance.status
       FROM attendance
       JOIN students ON attendance.student_id = students.id
       WHERE attendance.batch_id = $1 AND attendance.date = $2`,
      [batch_id, date]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/attendance/monthly', async (req, res) => {
  const { batch_id, month } = req.query;
  try {
    const result = await pool.query(
      `SELECT attendance.student_id, students.name, attendance.date, attendance.status
       FROM attendance
       JOIN students ON attendance.student_id = students.id
       WHERE attendance.batch_id = $1 AND attendance.date LIKE $2
       ORDER BY students.name, attendance.date`,
      [batch_id, `${month}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- FEES -----

app.post('/fees', async (req, res) => {
  const { student_id, category, month, amount, paid_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO fee_payments (student_id, category, month, amount, paid_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [student_id, category, month, amount, paid_date]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Payment recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/fees/status', async (req, res) => {
  const { month, category } = req.query;
  try {
    const result = await pool.query(
      `SELECT students.id AS student_id, students.name, students.class,
              fee_payments.amount, fee_payments.paid_date
       FROM students
       LEFT JOIN fee_payments
         ON students.id = fee_payments.student_id
         AND fee_payments.month = $1
         AND fee_payments.category = $2`,
      [month, category]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/fees/total', async (req, res) => {
  const { month, category } = req.query;
  try {
    const result = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM fee_payments
       WHERE month = $1 AND category = $2`,
      [month, category]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});