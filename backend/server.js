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
  const { username, password, role, student_id, coach_id } = req.body;

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role, student_id, coach_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, role`,
      [username, password_hash, role, student_id || null, coach_id || null]
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
      { id: user.id, username: user.username, role: user.role, student_id: user.student_id, coach_id: user.coach_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Record this login for tracking purposes
    await pool.query(
      'INSERT INTO login_log (user_id, username, role) VALUES ($1, $2, $3)',
      [user.id, user.username, user.role]
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role, student_id: user.student_id, coach_id: user.coach_id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change your own password (any logged-in user)
app.post('/auth/change-password', requireAuth, async (req, res) => {
  const { newPassword } = req.body;
  try {
    const password_hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin resets anyone's password
app.post('/auth/reset-password', requireAuth, requireRole('admin'), async (req, res) => {
  const { username, newPassword } = req.body;
  try {
    const password_hash = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id',
      [password_hash, username]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'Password reset successfully' });
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

app.post('/students', requireAuth, requireRole('admin'), async (req, res) => {
  const { name, class: studentClass, school, dob, phone1, phone2, father_name, mother_name, address } = req.body;
  try {
    // Check for a duplicate: same name AND same phone number
    const existing = await pool.query(
      'SELECT id FROM students WHERE name = $1 AND phone1 = $2',
      [name, phone1]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A student with this name and phone number is already registered' });
    }

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
// Update a student's details
app.put('/students/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { name, class: studentClass, school, dob, phone1, phone2, father_name, mother_name, address, email, aadhaar_no } = req.body;
  try {
    await pool.query(
      `UPDATE students SET name = $1, class = $2, school = $3, dob = $4, phone1 = $5,
       phone2 = $6, father_name = $7, mother_name = $8, address = $9, email = $10, aadhaar_no = $11 WHERE id = $12`,
      [name, studentClass, school, dob, phone1, phone2, father_name, mother_name, address, email, aadhaar_no, id]
    );
    res.json({ message: 'Student updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a student
app.delete('/students/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    // Clean up related records first, so we don't leave orphaned data
    await pool.query('DELETE FROM batch_students WHERE student_id = $1', [id]);
    await pool.query('DELETE FROM attendance WHERE student_id = $1', [id]);
    await pool.query('DELETE FROM fee_payments WHERE student_id = $1', [id]);
    await pool.query('DELETE FROM team_members WHERE student_id = $1', [id]);
    await pool.query(
      'DELETE FROM login_log WHERE user_id IN (SELECT id FROM users WHERE student_id = $1)',
      [id]
    );
    await pool.query('DELETE FROM users WHERE student_id = $1', [id]);
    await pool.query('DELETE FROM students WHERE id = $1', [id]);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// A student fills in their own profile for the first time
app.post('/students/self', requireAuth, requireRole('student'), async (req, res) => {
  // Check the database directly, not the token, since tokens can be stale
  const userCheck = await pool.query('SELECT student_id FROM users WHERE id = $1', [req.user.id]);
  if (userCheck.rows[0].student_id) {
    return res.status(400).json({ error: 'Your registration is already complete' });
  }
  const { name, class: studentClass, school, dob, phone1, phone2, father_name, mother_name, address, email, aadhaar_no } = req.body;

  try {
    // Duplicate check, same rule as admin registration
    const existing = await pool.query(
      'SELECT id FROM students WHERE name = $1 AND phone1 = $2',
      [name, phone1]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A student with this name and phone number is already registered' });
    }

    const studentResult = await pool.query(
      `INSERT INTO students (name, class, school, dob, phone1, phone2, father_name, mother_name, address, email, aadhaar_no)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [name, studentClass, school, dob, phone1, phone2, father_name, mother_name, address, email, aadhaar_no]
    );

    // Link this new student record to the logged-in user's own account
    await pool.query('UPDATE users SET student_id = $1 WHERE id = $2', [studentResult.rows[0].id, req.user.id]);

    res.status(201).json({ id: studentResult.rows[0].id, message: 'Registration completed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// A student views their own registration
app.get('/students/self', requireAuth, requireRole('student'), async (req, res) => {
  if (!req.user.student_id) {
    return res.status(404).json({ error: 'No registration found' });
  }
  try {
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [req.user.student_id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// A student edits their own registration, only within 7 days of creating it
app.put('/students/self', requireAuth, requireRole('student'), async (req, res) => {
  if (!req.user.student_id) {
    return res.status(404).json({ error: 'No registration found' });
  }

  const { name, class: studentClass, school, dob, phone1, phone2, father_name, mother_name, address, email, aadhaar_no } = req.body;

  try {
    const check = await pool.query('SELECT created_at FROM students WHERE id = $1', [req.user.student_id]);
    const createdAt = new Date(check.rows[0].created_at);
    const daysSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSince > 7) {
      return res.status(403).json({ error: 'Edit window has expired. Please contact admin for changes.' });
    }

    await pool.query(
      `UPDATE students SET name = $1, class = $2, school = $3, dob = $4, phone1 = $5,
       phone2 = $6, father_name = $7, mother_name = $8, address = $9, email = $10, aadhaar_no = $11 WHERE id = $12`,
      [name, studentClass, school, dob, phone1, phone2, father_name, mother_name, address, email, aadhaar_no, req.user.student_id]
    );
    res.json({ message: 'Registration updated successfully' });
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
// Delete a coach
app.delete('/coaches/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    // Unassign this coach from any batches first (set to null, don't delete the batch)
    await pool.query('UPDATE batches SET coach_id = NULL WHERE coach_id = $1', [id]);
    // Unlink any user login tied to this coach (don't delete the login, just the link)
    await pool.query('UPDATE users SET coach_id = NULL WHERE coach_id = $1', [id]);
    await pool.query('DELETE FROM coaches WHERE id = $1', [id]);
    res.json({ message: 'Coach deleted successfully' });
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


// Remove a student from a batch
app.delete('/batches/:batchId/students/:studentId', requireAuth, requireRole('admin', 'coach'), async (req, res) => {
  const { batchId, studentId } = req.params;
  try {
    await pool.query(
      'DELETE FROM batch_students WHERE batch_id = $1 AND student_id = $2',
      [batchId, studentId]
    );
    res.json({ message: 'Student removed from batch' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Delete a batch
app.delete('/batches/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    // Clean up related records first
    await pool.query('DELETE FROM batch_students WHERE batch_id = $1', [id]);
    await pool.query('DELETE FROM attendance WHERE batch_id = $1', [id]);
    await pool.query('DELETE FROM batches WHERE id = $1', [id]);
    res.json({ message: 'Batch deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Create a team (must have exactly 12 members)
app.post('/teams', requireAuth, requireRole('admin'), async (req, res) => {
  const { name, coach_id, members } = req.body;
  // members = [{ student_id, jersey_number }, ...]

  if (!members || members.length < 5 || members.length > 12) {
  return res.status(400).json({ error: 'A team must have between 5 and 12 players' });
}

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const teamResult = await client.query(
      'INSERT INTO teams (name, coach_id) VALUES ($1, $2) RETURNING id',
      [name, coach_id || null]
    );
    const teamId = teamResult.rows[0].id;

    for (const member of members) {
      await client.query(
        'INSERT INTO team_members (team_id, student_id, jersey_number) VALUES ($1, $2, $3)',
        [teamId, member.student_id, member.jersey_number]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ id: teamId, message: 'Team created successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get all teams
app.get('/teams', requireAuth, requireRole('admin', 'coach'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT teams.id, teams.name, coaches.name AS coach_name
      FROM teams
      LEFT JOIN coaches ON teams.coach_id = coaches.id
      ORDER BY teams.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one team's full roster
app.get('/teams/:id', requireAuth, requireRole('admin', 'coach'), async (req, res) => {
  const { id } = req.params;
  try {
    const teamResult = await pool.query(`
      SELECT teams.id, teams.name, coaches.name AS coach_name
      FROM teams
      LEFT JOIN coaches ON teams.coach_id = coaches.id
      WHERE teams.id = $1
    `, [id]);

    const membersResult = await pool.query(`
      SELECT students.id, students.name, students.dob, students.phone1, team_members.jersey_number
      FROM team_members
      JOIN students ON team_members.student_id = students.id
      WHERE team_members.team_id = $1
    `, [id]);

    res.json({ ...teamResult.rows[0], members: membersResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ----- ATTENDANCE -----

app.post('/attendance', requireAuth, requireRole('admin', 'coach'), async (req, res) => {
  const { batch_id, date, records } = req.body;
  const markedByCoachId = req.user.coach_id || null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM attendance WHERE batch_id = $1 AND date = $2', [batch_id, date]);
    for (const record of records) {
      await client.query(
        'INSERT INTO attendance (batch_id, student_id, date, status, coach_id) VALUES ($1, $2, $3, $4, $5)',
        [batch_id, record.student_id, date, record.status, markedByCoachId]
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

app.get('/attendance/monthly', requireAuth, requireRole('admin', 'coach', 'student'), async (req, res) => {
  const { batch_id, month } = req.query;
  try {
    let query = `
  SELECT attendance.student_id, students.name, attendance.date, attendance.status,
         coaches.name AS marked_by_coach
  FROM attendance
  JOIN students ON attendance.student_id = students.id
  LEFT JOIN coaches ON attendance.coach_id = coaches.id
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
app.get('/attendance/stats/:studentId', requireAuth, requireRole('admin', 'coach', 'student'), async (req, res) => {
  const { studentId } = req.params;

  // Students can only see their own stats
  if (req.user.role === 'student' && req.user.student_id != studentId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const result = await pool.query(
      `SELECT batch_students.batch_id, batches.name AS batch_name,
              COUNT(DISTINCT attendance.date) AS total_classes,
              COUNT(DISTINCT CASE WHEN attendance.student_id = $1 AND attendance.status = 'present' THEN attendance.date END) AS classes_attended
       FROM batch_students
       JOIN batches ON batch_students.batch_id = batches.id
       LEFT JOIN attendance ON attendance.batch_id = batch_students.batch_id
       WHERE batch_students.student_id = $1
       GROUP BY batch_students.batch_id, batches.name`,
      [studentId]
    );
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
app.get('/auth/login-log', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT login_log.username, login_log.role, login_log.login_time, coaches.name AS coach_name
       FROM login_log
       LEFT JOIN users ON login_log.user_id = users.id
       LEFT JOIN coaches ON users.coach_id = coaches.id
       WHERE coaches.name IS NOT NULL
       ORDER BY login_log.login_time DESC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/auth/students-list', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT users.username, students.name AS student_name
      FROM users
      LEFT JOIN students ON users.student_id = students.id
      WHERE users.role = 'student'
      ORDER BY users.username
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});