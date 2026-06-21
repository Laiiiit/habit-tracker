const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { calcStreak, calcProgress } = require('../services/streak');

const router = express.Router();

// Все маршруты требуют авторизации
router.use(requireAuth);

// GET /api/habits — список всех привычек пользователя
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT h.*,
        (SELECT COUNT(*) FROM habit_logs hl
         WHERE hl.habit_id = h.id AND hl.user_id = $1
           AND hl.completed_date = CURRENT_DATE) AS today_count,
        (SELECT COUNT(*) FROM habit_logs hl
         WHERE hl.habit_id = h.id AND hl.user_id = $1) AS total_count
       FROM habits h
       WHERE h.is_active = TRUE
         AND (
           h.user_id = $1
           OR EXISTS (
             SELECT 1 FROM shared_habits sh
             WHERE sh.habit_id = h.id
               AND sh.shared_with_id = $1
               AND sh.status = 'accepted'
           )
         )
       ORDER BY h.created_at ASC`,
      [req.user.id]
    );

    // Добавляем streak для каждой привычки
    const habitsWithStreak = await Promise.all(
      rows.map(async (habit) => {
        const logs = await pool.query(
          `SELECT completed_date::text FROM habit_logs
           WHERE habit_id = $1 AND user_id = $2
           ORDER BY completed_date`,
          [habit.id, req.user.id]
        );
        const dates = logs.rows.map((r) => r.completed_date);
        const streak = calcStreak(dates, habit.frequency);
        const progress = calcProgress(Number(habit.today_count), habit.target_count);
        return { ...habit, streak, progress };
      })
    );

    res.json(habitsWithStreak);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/habits — создать привычку
router.post('/', async (req, res) => {
  const { title, description, icon, color, frequency, frequency_days, target_count, is_shared } =
    req.body;

  if (!title) return res.status(400).json({ error: 'title обязателен' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO habits
         (user_id, title, description, icon, color, frequency, frequency_days, target_count, is_shared)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.user.id,
        title.trim(),
        description || null,
        icon || '✅',
        color || '#6366f1',
        frequency || 'daily',
        JSON.stringify(frequency_days || []),
        target_count || 1,
        is_shared || false,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/habits/:id — одна привычка со статистикой
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT h.* FROM habits h
       WHERE h.id = $1 AND (h.user_id = $2
         OR EXISTS (
           SELECT 1 FROM shared_habits sh
           WHERE sh.habit_id = h.id AND sh.shared_with_id = $2 AND sh.status = 'accepted'
         ))`,
      [req.params.id, req.user.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Привычка не найдена' });

    const habit = rows[0];

    // Все логи пользователя по этой привычке (за последние 90 дней)
    const logs = await pool.query(
      `SELECT completed_date::text, count
       FROM habit_logs
       WHERE habit_id = $1 AND user_id = $2
         AND completed_date >= CURRENT_DATE - INTERVAL '90 days'
       ORDER BY completed_date`,
      [req.params.id, req.user.id]
    );

    const allDates = logs.rows.map((r) => r.completed_date);
    const streak = calcStreak(allDates, habit.frequency);

    // Логи за последние 30 дней для графика
    const last30 = logs.rows.filter((r) => {
      const d = new Date(r.completed_date);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      return d >= cutoff;
    });

    // Партнёры по этой привычке
    const partners = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar_url, sh.status
       FROM shared_habits sh
       JOIN users u ON u.id = sh.shared_with_id
       WHERE sh.habit_id = $1 AND sh.owner_id = $2`,
      [req.params.id, req.user.id]
    );

    res.json({
      ...habit,
      streak,
      logs: logs.rows,
      chart_data: buildChartData(last30),
      partners: partners.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/habits/:id — обновить привычку
router.put('/:id', async (req, res) => {
  const { title, description, icon, color, frequency, frequency_days, target_count, is_shared } =
    req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE habits SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         icon = COALESCE($3, icon),
         color = COALESCE($4, color),
         frequency = COALESCE($5, frequency),
         frequency_days = COALESCE($6, frequency_days),
         target_count = COALESCE($7, target_count),
         is_shared = COALESCE($8, is_shared)
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [
        title,
        description,
        icon,
        color,
        frequency,
        frequency_days ? JSON.stringify(frequency_days) : null,
        target_count,
        is_shared,
        req.params.id,
        req.user.id,
      ]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Привычка не найдена' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/habits/:id — мягкое удаление (is_active = false)
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE habits SET is_active = FALSE
       WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Привычка не найдена' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/habits/:id/log — отметить выполнение
router.post('/:id/log', async (req, res) => {
  const { date, notes } = req.body;

  try {
    // Убеждаемся, что пользователь имеет доступ к привычке
    const habit = await pool.query(
      `SELECT id FROM habits WHERE id = $1 AND (user_id = $2
         OR EXISTS (
           SELECT 1 FROM shared_habits sh
           WHERE sh.habit_id = habits.id AND sh.shared_with_id = $2 AND sh.status = 'accepted'
         ))`,
      [req.params.id, req.user.id]
    );
    if (!habit.rows[0]) return res.status(404).json({ error: 'Привычка не найдена' });

    // Дата: если передана — используем, иначе CURRENT_DATE (PostgreSQL, тот же часовой пояс что и в SELECT)
    const { rows } = await pool.query(
      `INSERT INTO habit_logs (habit_id, user_id, completed_date, notes)
       VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE), $4)
       ON CONFLICT (habit_id, user_id, completed_date)
       DO UPDATE SET count = habit_logs.count + 1, notes = EXCLUDED.notes
       RETURNING *`,
      [req.params.id, req.user.id, date || null, notes || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/habits/:id/log — убрать отметку за сегодня
router.delete('/:id/log', async (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    await pool.query(
      `DELETE FROM habit_logs
       WHERE habit_id = $1 AND user_id = $2 AND completed_date = $3`,
      [req.params.id, req.user.id, targetDate]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/habits/:id/stats — полная аналитика
router.get('/:id/stats', async (req, res) => {
  try {
    const { rows: logs } = await pool.query(
      `SELECT completed_date::text, count
       FROM habit_logs
       WHERE habit_id = $1 AND user_id = $2
       ORDER BY completed_date`,
      [req.params.id, req.user.id]
    );

    const dates = logs.map((r) => r.completed_date);
    const streak = calcStreak(dates, 'daily');

    // По месяцам — кол-во выполнений
    const byMonth = {};
    logs.forEach(({ completed_date, count }) => {
      const month = completed_date.slice(0, 7); // 'YYYY-MM'
      byMonth[month] = (byMonth[month] || 0) + Number(count);
    });

    // По дням недели (0=Вс, 6=Сб) — кол-во выполнений
    const byWeekday = Array(7).fill(0);
    logs.forEach(({ completed_date, count }) => {
      const day = new Date(completed_date).getDay();
      byWeekday[day] += Number(count);
    });

    res.json({
      streak,
      total: logs.length,
      by_month: Object.entries(byMonth).map(([month, count]) => ({ month, count })),
      by_weekday: byWeekday.map((count, i) => ({
        day: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][i],
        count,
      })),
      heatmap: logs, // для календаря-теплокарты
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить напоминание
router.post('/:id/reminders', async (req, res) => {
  const { remind_at } = req.body;
  if (!remind_at) return res.status(400).json({ error: 'remind_at обязателен (HH:MM)' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO reminders (habit_id, user_id, remind_at)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, req.user.id, remind_at]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Helpers
function buildChartData(logs) {
  // Генерируем данные за последние 30 дней для LineChart
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const log = logs.find((l) => l.completed_date === dateStr);
    data.push({
      date: dateStr,
      label: `${d.getDate()}.${d.getMonth() + 1}`,
      count: log ? Number(log.count) : 0,
      completed: !!log,
    });
  }
  return data;
}

module.exports = router;
