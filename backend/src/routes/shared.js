const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/shared — привычки, которыми поделились со мной
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT h.*, sh.id as share_id, sh.status,
              u.name as owner_name, u.email as owner_email,
              (SELECT COUNT(*) FROM habit_logs hl
               WHERE hl.habit_id = h.id AND hl.user_id = $1
                 AND hl.completed_date = CURRENT_DATE) AS today_count
       FROM shared_habits sh
       JOIN habits h ON h.id = sh.habit_id
       JOIN users u ON u.id = sh.owner_id
       WHERE sh.shared_with_id = $1
       ORDER BY sh.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/shared/invite — пригласить пользователя к привычке
// body: { habit_id, email }
router.post('/invite', async (req, res) => {
  const { habit_id, email } = req.body;
  if (!habit_id || !email) {
    return res.status(400).json({ error: 'habit_id и email обязательны' });
  }

  try {
    // Проверяем, что привычка принадлежит текущему пользователю и помечена как shared
    const habit = await pool.query(
      `SELECT id, is_shared FROM habits WHERE id = $1 AND user_id = $2`,
      [habit_id, req.user.id]
    );
    if (!habit.rows[0]) {
      return res.status(404).json({ error: 'Привычка не найдена или не ваша' });
    }
    if (!habit.rows[0].is_shared) {
      return res.status(400).json({ error: 'Сначала сделайте привычку общей (is_shared: true)' });
    }

    // Находим пользователя по email
    const target = await pool.query('SELECT id FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);
    if (!target.rows[0]) {
      return res.status(404).json({ error: 'Пользователь с таким email не найден' });
    }
    const sharedWithId = target.rows[0].id;

    if (sharedWithId === req.user.id) {
      return res.status(400).json({ error: 'Нельзя пригласить самого себя' });
    }

    // Создаём или обновляем запись
    const { rows } = await pool.query(
      `INSERT INTO shared_habits (habit_id, owner_id, shared_with_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (habit_id, shared_with_id)
       DO UPDATE SET status = 'pending', updated_at = NOW()
       RETURNING *`,
      [habit_id, req.user.id, sharedWithId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PATCH /api/shared/:shareId — принять или отклонить приглашение
// body: { status: 'accepted' | 'rejected' }
router.patch('/:shareId', async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status должен быть accepted или rejected' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE shared_habits SET status = $1
       WHERE id = $2 AND shared_with_id = $3
       RETURNING *`,
      [status, req.params.shareId, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Приглашение не найдено' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/shared/:shareId — убрать общую привычку
router.delete('/:shareId', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM shared_habits
       WHERE id = $1 AND (shared_with_id = $2 OR owner_id = $2)`,
      [req.params.shareId, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/shared/today/:habitId — кто сегодня выполнил, кто нет
router.get('/today/:habitId', async (req, res) => {
  try {
    // Владелец + принятые участники
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.avatar_url,
              EXISTS (
                SELECT 1 FROM habit_logs hl
                WHERE hl.habit_id = $1 AND hl.user_id = u.id
                  AND hl.completed_date = CURRENT_DATE
              ) AS done_today
       FROM (
         SELECT user_id FROM habits WHERE id = $1
         UNION
         SELECT shared_with_id FROM shared_habits
         WHERE habit_id = $1 AND status = 'accepted'
       ) participants
       JOIN users u ON u.id = participants.user_id
       ORDER BY done_today DESC, u.name ASC`,
      [req.params.habitId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/shared/leaderboard/:habitId — рейтинг участников привычки
router.get('/leaderboard/:habitId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.avatar_url,
              COUNT(hl.id) as total_completions,
              MAX(hl.completed_date) as last_completed
       FROM shared_habits sh
       JOIN users u ON u.id = sh.shared_with_id
       LEFT JOIN habit_logs hl ON hl.habit_id = sh.habit_id AND hl.user_id = sh.shared_with_id
       WHERE sh.habit_id = $1 AND sh.status = 'accepted'
         AND (sh.owner_id = $2 OR sh.shared_with_id = $2
              OR EXISTS (SELECT 1 FROM habits h WHERE h.id = $1 AND h.user_id = $2))
       GROUP BY u.id, u.name, u.avatar_url
       ORDER BY total_completions DESC`,
      [req.params.habitId, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
