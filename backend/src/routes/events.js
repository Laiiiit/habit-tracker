const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/events?year=2026&month=6  — события за месяц
router.get('/', async (req, res) => {
  const { year, month } = req.query;
  try {
    let query = `SELECT * FROM calendar_events WHERE user_id = $1`;
    const params = [req.user.id];

    if (year && month) {
      // Получаем события, которые пересекаются с нужным месяцем
      query += ` AND start_time >= $2 AND start_time < $3`;
      const from = new Date(Number(year), Number(month) - 1, 1).toISOString();
      const to   = new Date(Number(year), Number(month), 1).toISOString();
      params.push(from, to);
    }

    query += ` ORDER BY start_time ASC`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/events — создать событие
router.post('/', async (req, res) => {
  const { title, description, start_time, end_time, color, all_day } = req.body;
  if (!title) return res.status(400).json({ error: 'title обязателен' });
  if (!start_time) return res.status(400).json({ error: 'start_time обязателен' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO calendar_events (user_id, title, description, start_time, end_time, color, all_day)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, title.trim(), description || null, start_time,
       end_time || null, color || '#6366f1', all_day || false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/events/:id — обновить событие
router.put('/:id', async (req, res) => {
  const { title, description, start_time, end_time, color, all_day } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE calendar_events SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         start_time = COALESCE($3, start_time),
         end_time = COALESCE($4, end_time),
         color = COALESCE($5, color),
         all_day = COALESCE($6, all_day)
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [title, description, start_time, end_time, color, all_day, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Событие не найдено' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/events/:id — удалить событие
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM calendar_events WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Событие не найдено' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
