# 🎯 Habit Tracker

Трекер привычек и личных целей с аналитикой — учебный проект для производственной практики.

## Стек

| Слой | Технологии |
|---|---|
| Frontend | Next.js 14 (App Router), NextAuth.js, Recharts, Tailwind CSS |
| Backend | Node.js, Express.js |
| База данных | PostgreSQL |
| Фоновые задачи | node-cron + Nodemailer |

## Возможности

- Регистрация и авторизация через NextAuth (credentials)
- CRUD привычек: название, иконка, цвет, частота (ежедневно / по дням недели), цель в день
- Отметка выполнения — Upsert по дате, счётчик повторений
- **Streak-логика**: текущая и лучшая серия (daily / weekly)
- **Аналитика**:
  - График динамики за 30 дней (AreaChart)
  - Тепловая карта за 12 недель (кастомная)
  - Активность по дням недели (BarChart)
- **Общие привычки**: владелец приглашает других по email → они принимают/отклоняют → оба отмечают выполнение
- **Напоминания по email**: cron каждую минуту отправляет письмо, если привычка не выполнена к указанному времени

---

## Быстрый старт

### 1. PostgreSQL

```bash
psql -U postgres -c "CREATE DATABASE habit_tracker;"
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # заполните переменные
npm install
npm run dev                  # → http://localhost:4000
```

БД-схема применяется автоматически при первом запуске (`src/db/schema.sql`).

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local   # заполните переменные
npm install
npm run dev                  # → http://localhost:3000
```

> `NEXTAUTH_SECRET` должен совпадать в обоих `.env`.

---

## Переменные окружения

### backend/.env

```env
PORT=4000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=habit_tracker
DB_USER=postgres
DB_PASSWORD=postgres

NEXTAUTH_SECRET=super-secret-change-me-in-production

# Email (опционально, для напоминаний)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="Habit Tracker <your@gmail.com>"

FRONTEND_URL=http://localhost:3000
```

### frontend/.env.local

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=super-secret-change-me-in-production
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Структура проекта

```
habit-tracker/
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js               # Точка входа, Express-сервер
│       ├── db/
│       │   ├── index.js           # PostgreSQL pool + migrate()
│       │   └── schema.sql         # DDL: users, habits, habit_logs, shared_habits, reminders
│       ├── middleware/
│       │   └── auth.js            # Валидация NextAuth JWT
│       ├── routes/
│       │   ├── auth.js            # POST /register, POST /login
│       │   ├── habits.js          # CRUD + /log + /stats + /reminders
│       │   └── shared.js          # Приглашения, принятие, лидерборд
│       └── services/
│           ├── streak.js          # calcStreak(), calcProgress()
│           └── cron.js            # node-cron, отправка email-напоминаний
│
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── .env.example
    └── src/
        ├── app/
        │   ├── layout.tsx          # Root layout + SessionProvider
        │   ├── providers.tsx
        │   ├── globals.css
        │   ├── page.tsx            # Dashboard (/)
        │   ├── api/auth/[...nextauth]/route.ts   # NextAuth handler
        │   ├── (auth)/
        │   │   ├── login/page.tsx
        │   │   └── register/page.tsx
        │   ├── habits/
        │   │   ├── page.tsx        # Список привычек
        │   │   ├── new/page.tsx    # Форма создания
        │   │   └── [id]/page.tsx   # Детали + графики + приглашения
        │   └── shared/page.tsx     # Общие привычки
        ├── components/
        │   ├── Navbar.tsx
        │   ├── HabitCard.tsx
        │   ├── StreakBadge.tsx
        │   └── charts/
        │       ├── ProgressChart.tsx   # AreaChart — динамика 30 дней
        │       ├── WeekdayChart.tsx    # BarChart — по дням недели
        │       └── HeatmapChart.tsx    # Тепловая карта 12 недель
        ├── lib/
        │   └── api.ts              # fetch-обёртки с JWT
        └── types/
            └── index.ts            # TypeScript-типы
```

---

## API (Express)

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Логин (вызывается NextAuth) |
| GET | `/api/habits` | Все привычки пользователя |
| POST | `/api/habits` | Создать привычку |
| GET | `/api/habits/:id` | Детали + chart_data + партнёры |
| PUT | `/api/habits/:id` | Обновить привычку |
| DELETE | `/api/habits/:id` | Удалить (soft delete) |
| POST | `/api/habits/:id/log` | Отметить выполнение |
| DELETE | `/api/habits/:id/log` | Убрать отметку |
| GET | `/api/habits/:id/stats` | Полная аналитика |
| POST | `/api/habits/:id/reminders` | Добавить напоминание |
| GET | `/api/shared` | Общие привычки (входящие) |
| POST | `/api/shared/invite` | Пригласить по email |
| PATCH | `/api/shared/:id` | Принять/отклонить приглашение |
| DELETE | `/api/shared/:id` | Удалить из общих |
| GET | `/api/shared/leaderboard/:habitId` | Рейтинг участников |

---

## Как работает авторизация

1. Пользователь регистрируется через `POST /api/auth/register` (Express)
2. `NextAuth` вызывает `POST /api/auth/login` — Express возвращает `{ id, email, name }`
3. NextAuth создаёт JWT и кладёт его в HTTP-only cookie
4. Фронтенд достаёт JWT из сессии и передаёт в заголовке `Authorization: Bearer <token>` к Express
5. Express middleware (`src/middleware/auth.js`) верифицирует токен через тот же `NEXTAUTH_SECRET`

---

## Streak-алгоритм

Файл `backend/src/services/streak.js`:

- Собирает все уникальные даты выполнения
- Сортирует по возрастанию
- Обходит с конца: если разница между соседними датами = 1 день → серия продолжается
- Текущий streak обнуляется, если последняя дата не сегодня и не вчера
- Аналогично для `weekly` — группировка по ISO-неделям
