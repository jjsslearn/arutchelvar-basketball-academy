require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Arutchelvar Basketball Academy backend is running!');
});
// Register a new user (used for admin/coach creation, and student self-registration)
app.post('/auth/register', async (req, res) => {
  const { username, password, role, student_id } = req.body;

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role, student_id)
       VALUES ($1, $2, $3, $4) RETURNING id, username, role`,
      [username, password_hash, role, student_id || null]
    );

    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      // Postgres's error code for "unique constraint violated"
      res.status(400).json({ error: 'Username already taken' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, student_id: user.student_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role, student_id: user.student_id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Middleware: verifies the token and attaches user info to the request
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // "Bearer <token>"
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info (id, username, role, student_id) to the request
    next(); // proceed to the actual route
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Middleware factory: restricts a route to specific roles
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied for your role' });
    }
    next();
  };
}
// ----- STUDENTS -----

app.post('/students', requireAuth, requireRole('admin', 'coach', 'student'), async (req, res) => {
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

app.get('/students', requireAuth, requireRole('admin', 'coach'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- COACHES -----

app.post('/coaches', requireAuth, requireRole('admin'), async (req, res) => {
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

app.get('/coaches', requireAuth, requireRole('admin', 'coach'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM coaches');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- BATCHES -----

app.post('/batches', requireAuth, requireRole('admin'), async (req, res) => {
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

app.get('/batches', requireAuth, requireRole('admin', 'coach', 'student'), async (req, res) => {
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

app.post('/batches/:batchId/students', requireAuth, requireRole('admin', 'coach'), async (req, res) => {
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

app.get('/batches/:batchId/students', requireAuth, requireRole('admin', 'coach'), async (req, res) => {
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

app.post('/attendance', requireAuth, requireRole('admin', 'coach'), async (req, res) => {
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

app.get('/attendance', requireAuth, requireRole('admin', 'coach'), async (req, res) => {
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

app.get('/attendance/monthly', requireAuth, requireRole('admin', 'coach', 'student'), async (req, res) => {
  const { batch_id, month } = req.query;
  try {
    let query = `
      SELECT attendance.student_id, students.name, attendance.date, attendance.status
      FROM attendance
      JOIN students ON attendance.student_id = students.id
      WHERE attendance.batch_id = $1 AND attendance.date LIKE $2
    `;
    const params = [batch_id, `${month}%`];

    if (req.user.role === 'student') {
      query += ' AND attendance.student_id = $3';
      params.push(req.user.student_id);
    }

    query += ' ORDER BY students.name, attendance.date';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- FEES -----

app.post('/fees', requireAuth, requireRole('admin', 'coach'), async (req, res) => {
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

app.get('/fees/status', requireAuth, requireRole('admin', 'coach', 'student'), async (req, res) => {
  const { month, category } = req.query;
  try {
    let query = `
      SELECT students.id AS student_id, students.name, students.class,
             fee_payments.amount, fee_payments.paid_date
      FROM students
      LEFT JOIN fee_payments
        ON students.id = fee_payments.student_id
        AND fee_payments.month = $1
        AND fee_payments.category = $2
    `;
    const params = [month, category];

    // If a student is asking, only show their own record
    if (req.user.role === 'student') {
      query += ' WHERE students.id = $3';
      params.push(req.user.student_id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/fees/total', requireAuth, requireRole('admin', 'coach'), async (req, res) => {
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