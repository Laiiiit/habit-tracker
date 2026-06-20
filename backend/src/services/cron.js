const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { pool } = require('../db');

// Транспорт для отправки email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Запускает cron-задачи.
 * Вызывается один раз при старте сервера.
 */
function startCronJobs() {
  // Каждую минуту проверяем напоминания
  cron.schedule('* * * * *', async () => {
    await sendDueReminders();
  });

  // Каждую ночь в 23:59 — сбрасываем статистику дня (не обязательно)
  cron.schedule('59 23 * * *', async () => {
    console.log('[Cron] Daily cleanup tick');
  });

  console.log('⏰ Cron jobs started');
}

async function sendDueReminders() {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  try {
    // Находим все включённые напоминания на это время
    const { rows } = await pool.query(
      `SELECT r.id, r.habit_id, r.user_id, r.remind_at,
              h.title as habit_title,
              u.email, u.name
       FROM reminders r
       JOIN habits h ON h.id = r.habit_id AND h.is_active = TRUE
       JOIN users u ON u.id = r.user_id
       WHERE r.is_enabled = TRUE
         AND TO_CHAR(r.remind_at, 'HH24:MI') = $1
         -- не отправляем если пользователь уже выполнил привычку сегодня
         AND NOT EXISTS (
           SELECT 1 FROM habit_logs hl
           WHERE hl.habit_id = r.habit_id AND hl.user_id = r.user_id
             AND hl.completed_date = CURRENT_DATE
         )`,
      [timeStr]
    );

    for (const reminder of rows) {
      await sendReminderEmail(reminder);
    }
  } catch (err) {
    console.error('[Cron] Error fetching reminders:', err.message);
  }
}

async function sendReminderEmail({ email, name, habit_title }) {
  if (!process.env.SMTP_USER) return; // Email не настроен

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `⏰ Напоминание: ${habit_title}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#6366f1">Привет, ${name}!</h2>
          <p>Не забудь выполнить привычку сегодня:</p>
          <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0">
            <strong style="font-size:18px">${habit_title}</strong>
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}"
             style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;
                    border-radius:8px;text-decoration:none;font-weight:600">
            Открыть трекер
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px">
            Habit Tracker — твой помощник в формировании привычек
          </p>
        </div>
      `,
    });
    console.log(`[Cron] Reminder sent to ${email} for "${habit_title}"`);
  } catch (err) {
    console.error(`[Cron] Failed to send email to ${email}:`, err.message);
  }
}

module.exports = { startCronJobs };
