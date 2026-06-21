'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { HabitCard } from '@/components/HabitCard';
import { getHabits, logHabit, unlogHabit, getEvents, CalendarEvent } from '@/lib/api';
import { Habit } from '@/types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const QUOTES = [
  { text: 'Маленькие действия, совершаемые каждый день, создают большие результаты.', author: 'Джеймс Клир' },
  { text: 'Ты не поднимаешься до уровня своих целей. Ты опускаешься до уровня своих систем.', author: 'Джеймс Клир' },
  { text: 'Победа над собой — величайшая из побед.', author: 'Платон' },
  { text: 'Мотивация заставляет начать. Привычка заставляет продолжать.', author: 'Джим Рон' },
  { text: 'Дисциплина — это мост между целями и достижениями.', author: 'Джим Рон' },
  { text: 'Успех — это сумма небольших усилий, повторяемых изо дня в день.', author: 'Роберт Кольер' },
  { text: 'Твоё будущее создаётся тем, что ты делаешь сегодня, а не завтра.', author: 'Роберт Кийосаки' },
  { text: 'Хорошие привычки — основа всех достижений.', author: 'Og Mandino' },
  { text: 'Сначала мы формируем привычки, потом привычки формируют нас.', author: 'Чарльз Нобл' },
  { text: 'Единственный способ делать великие дела — любить то, что ты делаешь.', author: 'Стив Джобс' },
  { text: 'Каждое утро мы рождаемся заново. Важно то, что мы делаем сегодня.', author: 'Будда' },
  { text: 'Падай семь раз, вставай восемь.', author: 'Японская пословица' },
  { text: 'Не сравнивай себя с другими. Сравнивай себя с тем, кем ты был вчера.', author: 'Джордан Питерсон' },
  { text: 'Человек становится тем, о чём думает большую часть времени.', author: 'Эрл Найтингейл' },
  { text: 'Если хочешь изменить свою жизнь — измени свои ежедневные привычки.', author: 'Джон Максвелл' },
  { text: 'Великие дела совершаются не силой, а упорством.', author: 'Сэмюэль Джонсон' },
  { text: 'Путь в тысячу миль начинается с одного шага.', author: 'Лао-цзы' },
  { text: 'То, что ты делаешь каждый день, важнее того, что ты делаешь изредка.', author: 'Гретхен Рубин' },
  { text: 'Характер — это набор привычек.', author: 'Аристотель' },
  { text: 'Энергия и настойчивость покоряют всё.', author: 'Бенджамин Франклин' },
  { text: 'Секрет движения вперёд — начать.', author: 'Марк Твен' },
  { text: 'Лучшее время посадить дерево было 20 лет назад. Второе лучшее время — сейчас.', author: 'Китайская пословица' },
  { text: 'Жизнь — это то, что происходит, пока ты занят другими планами.', author: 'Джон Леннон' },
  { text: 'Не важно, насколько медленно ты идёшь, главное — не останавливаться.', author: 'Конфуций' },
  { text: 'Верь, что можешь — и ты уже на полпути.', author: 'Теодор Рузвельт' },
  { text: 'Хорошо начать — значит сделать половину дела.', author: 'Аристотель' },
  { text: 'Люди часто переоценивают то, что могут сделать за год, и недооценивают то, что могут сделать за десять.', author: 'Билл Гейтс' },
  { text: 'Либо ты управляешь днём, либо день управляет тобой.', author: 'Джим Рон' },
  { text: 'Трудности — это возможности в рабочей одежде.', author: 'Генри Кайзер' },
  { text: 'Сделай сегодня то, что другие не хотят, и завтра будешь жить так, как другие не могут.', author: 'Джаред Лето' },
];

// Фото-иллюстрация для empty state (спящий Пух)
function EmptyIllustration() {
  return (
    <div className="relative w-40 h-32 mx-auto mb-4 rounded-2xl overflow-hidden">
      <img
        src="/images/sleep-pooh.jpg.jpg"
        alt="sleeping"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white/60 dark:from-slate-900/60 to-transparent" />
    </div>
  );
}

// SVG иллюстрация успеха (все привычки выполнены)
function SuccessIllustration() {
  return (
    <svg viewBox="0 0 80 80" className="w-16 h-16 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="36" fill="#D1FAE5" className="dark:fill-green-500/20"/>
      <path d="M24 40 L34 50 L56 28" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="62" cy="18" r="6" fill="#FCD34D"/>
      <circle cx="18" cy="62" r="4" fill="#A78BFA"/>
      <circle cx="66" cy="60" r="3" fill="#FB923C"/>
    </svg>
  );
}

function timeUntil(startIso: string, endIso?: string | null, allDay?: boolean): { label: string; color: string } {
  if (allDay) return { label: 'Весь день', color: 'text-gray-400 dark:text-slate-500' };

  const now = Date.now();
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : start;

  if (now >= start && now <= end) return { label: '● Сейчас', color: 'text-green-500 dark:text-green-400' };
  if (now > end) return { label: 'Завершилось', color: 'text-gray-300 dark:text-slate-600' };

  const diffMs = start - now;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 60) return { label: `через ${diffMin} мин`, color: diffMin <= 15 ? 'text-orange-500' : 'text-gray-400 dark:text-slate-500' };
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return { label: `через ${h} ч${m ? ` ${m} мин` : ''}`, color: 'text-gray-400 dark:text-slate-500' };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggleError, setToggleError] = useState('');
  const [now, setNow] = useState(() => Date.now());

  // Обновляем время каждую минуту для пересчёта "через X мин"
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/login');
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      const now = new Date();
      Promise.all([
        getHabits(),
        getEvents(now.getFullYear(), now.getMonth() + 1),
      ]).then(([habits, events]) => {
        setHabits(habits);
        const todayStr = now.toLocaleDateString('sv'); // YYYY-MM-DD
        setTodayEvents(
          events.filter(e => new Date(e.start_time).toLocaleDateString('sv') === todayStr)
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        );
      }).finally(() => setLoading(false));
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 dark:text-slate-500 text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  const todayDone = habits.filter((h) => Number(h.today_count) >= h.target_count).length;
  const totalHabits = habits.length;
  const todayPct = totalHabits > 0 ? Math.round((todayDone / totalHabits) * 100) : 0;
  const avgStreak =
    habits.length > 0
      ? Math.round(habits.reduce((s, h) => s + (h.streak?.current ?? 0), 0) / habits.length)
      : 0;
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak?.best ?? 0), 0);
  const allDone = totalHabits > 0 && todayDone === totalHabits;

  async function handleToggle(habit: Habit) {
    const done = Number(habit.today_count) >= habit.target_count;
    setToggleError('');

    // Оптимистичное обновление — сразу меняем UI
    const newCount = done ? 0 : (Number(habit.today_count) || 0) + 1;
    setHabits(prev =>
      prev.map(h =>
        h.id === habit.id
          ? { ...h, today_count: newCount, progress: Math.min(100, Math.round((newCount / h.target_count) * 100)) }
          : h
      )
    );

    try {
      if (done) {
        await unlogHabit(habit.id);
      } else {
        await logHabit(habit.id);
      }
      // Оптимистичный UI уже показывает правильное состояние — не перезаписываем
    } catch (err: any) {
      // Откатываем оптимистичное обновление
      setHabits(prev =>
        prev.map(h => h.id === habit.id ? habit : h)
      );
      const msg = (err as any)?.message || 'ошибка сети';
      setToggleError('Не удалось сохранить: ' + msg);
      console.error('Toggle error:', err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Hero-блок */}
        <div className="rounded-2xl bg-gradient-to-br from-primary-500 via-violet-600 to-purple-700 p-7 text-white relative overflow-hidden">
          {/* Декоративные элементы */}
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full" />
          <div className="absolute -bottom-12 -left-8 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute top-1/2 right-16 w-20 h-20 bg-white/5 rounded-full" />

          <div className="relative z-10">
            {/* Верхняя строка — дата и время */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/70 text-sm capitalize">
                {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="text-white/60 text-sm font-mono">
                {new Date(now).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Приветствие + мини-прогресс */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h1 className="text-3xl font-bold leading-tight">
                  Привет, {session?.user?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-white/65 text-sm mt-1">
                  {todayDone === 0
                    ? 'Начни день с первой привычки'
                    : todayDone === totalHabits
                    ? 'Ты выполнил все привычки сегодня!'
                    : `Осталось ${totalHabits - todayDone} из ${totalHabits}`}
                </p>
              </div>

              {/* Круговой мини-индикатор */}
              {totalHabits > 0 && (
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15" fill="none"
                        stroke="white" strokeWidth="3"
                        strokeDasharray={`${todayPct * 0.942} 94.2`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{todayPct}%</span>
                    </div>
                  </div>
                  <span className="text-white/60 text-xs mt-1">сегодня</span>
                </div>
              )}
            </div>

            {/* Цитата */}
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-sm text-white/90 italic leading-relaxed">«{quote.text}»</p>
              <p className="text-xs text-white/55 mt-2">— {quote.author}</p>
            </div>
          </div>
        </div>

        {/* Мотивационная карточка с завтраком */}
        <div className="relative rounded-2xl overflow-hidden h-44">
          <img src="/images/breakfast.jpg.jpg" alt="breakfast" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent" />
          <div className="absolute inset-0 flex items-center px-6">
            <div>
              <p className="text-white font-semibold text-base leading-tight">Утро начинается с привычек</p>
              <p className="text-white/70 text-xs mt-1">Хорошее начало дня — залог продуктивности</p>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {todayDone}/{totalHabits}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Сегодня</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-orange-500">
              {avgStreak}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Ср. streak 🔥</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-purple-500">
              {bestStreak}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Рекорд 🏆</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-500">{todayPct}%</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Прогресс</div>
          </div>
        </div>

        {/* Круговой график или успех */}
        {totalHabits > 0 && (allDone ? (
          <div className="card text-center py-6 border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/5">
            <SuccessIllustration />
            <p className="font-semibold text-green-700 dark:text-green-400 mt-3">Все привычки выполнены! 🎉</p>
            <p className="text-sm text-green-600/70 dark:text-green-400/60 mt-1">Отличная работа, так держать!</p>
          </div>
        ) : (
          <div className="card flex items-center gap-6">
            <div className="w-44 h-44 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Выполнено', value: todayDone },
                      { name: 'Осталось', value: totalHabits - todayDone },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#6366f1" />
                    <Cell fill="#e2e8f0" className="dark:fill-slate-700" />
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} привычки`, '']}
                    contentStyle={{
                      background: 'var(--tooltip-bg, #fff)',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">Сегодня</p>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-500 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-slate-300">
                  Выполнено — <span className="font-semibold text-primary-600 dark:text-primary-400">{todayDone}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-slate-300">
                  Осталось — <span className="font-semibold text-gray-500 dark:text-slate-400">{totalHabits - todayDone}</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
                {todayPct}% от общего числа
              </p>
            </div>
          </div>
        ))}

        {/* Ошибка при переключении */}
        {toggleError && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
            {toggleError}
          </div>
        )}

        {/* События на сегодня */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              📅 <span>События на сегодня</span>
            </h2>
            <Link href="/calendar" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
              Открыть календарь →
            </Link>
          </div>

          {todayEvents.length === 0 ? (
            <div className="flex items-center gap-3 py-2">
              <p className="text-sm text-gray-400 dark:text-slate-500">Событий нет</p>
              <Link href="/calendar" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                + Добавить
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {todayEvents.map(e => {
                const { label, color } = timeUntil(e.start_time, e.end_time, e.all_day);
                const fmt = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                const timeStr = e.all_day ? '' : e.end_time ? `${fmt(e.start_time)} – ${fmt(e.end_time)}` : fmt(e.start_time);
                return (
                  <Link
                    key={e.id}
                    href="/calendar"
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{e.title}</p>
                      {timeStr && (
                        <p className="text-xs text-gray-400 dark:text-slate-500">{timeStr}</p>
                      )}
                    </div>
                    <span className={`text-xs font-medium flex-shrink-0 ${color}`}>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Список привычек */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Мои привычки</h2>
            <Link href="/habits/new" className="btn-primary text-sm py-1.5 px-3">
              + Добавить
            </Link>
          </div>

          {habits.length === 0 ? (
            <div className="card text-center py-10">
              <EmptyIllustration />
              <p className="text-gray-500 dark:text-slate-400 mb-1 font-medium">Нет привычек</p>
              <p className="text-sm text-gray-400 dark:text-slate-500 mb-5">
                Создай первую и начни путь к лучшей версии себя
              </p>
              <Link href="/habits/new" className="btn-primary">
                Создать привычку
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onToggle={() => handleToggle(habit)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
