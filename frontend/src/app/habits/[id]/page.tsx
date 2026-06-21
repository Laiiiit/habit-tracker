'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/Navbar';
import { StreakBadge } from '@/components/StreakBadge';
import { ProgressChart } from '@/components/charts/ProgressChart';
import { WeekdayChart } from '@/components/charts/WeekdayChart';
import { HeatmapChart } from '@/components/charts/HeatmapChart';
import {
  getHabit, getHabitStats, logHabit, unlogHabit,
  inviteToHabit, addReminder, deleteHabit, getSharedToday,
} from '@/lib/api';
import { HabitDetail, Stats } from '@/types';

export default function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status } = useSession();

  const [habit, setHabit] = useState<HabitDetail | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sharedToday, setSharedToday] = useState<{ id: string; name: string; done_today: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [activeTab, setActiveTab] = useState<'chart' | 'heatmap' | 'weekday'>('chart');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') loadData();
  }, [status, id]);

  async function loadData() {
    setLoading(true);
    try {
      const [h, s] = await Promise.all([getHabit(id), getHabitStats(id)]);
      setHabit(h);
      setStats(s);
      if (h.is_shared) {
        getSharedToday(id).then(setSharedToday).catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle() {
    if (!habit) return;
    const done = Number(habit.today_count) >= habit.target_count;
    if (done) {
      await unlogHabit(habit.id);
    } else {
      await logHabit(habit.id);
    }
    await loadData();
  }

  async function handleDelete() {
    if (!habit) return;
    if (!confirm(`Удалить привычку "${habit.title}"?`)) return;
    try {
      await deleteHabit(habit.id);
      router.push('/habits');
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || !habit) return;
    try {
      await inviteToHabit(habit.id, inviteEmail);
      setInviteEmail('');
      alert(`Приглашение отправлено ${inviteEmail}`);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!habit) return;
    try {
      await addReminder(habit.id, reminderTime);
      alert(`Напоминание установлено на ${reminderTime}`);
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading || !habit) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex items-center justify-center py-24 text-gray-400 dark:text-slate-500">Загрузка...</div>
      </div>
    );
  }

  const isDone = Number(habit.today_count) >= habit.target_count;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Заголовок */}
        <div className="card flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="text-4xl w-16 h-16 flex items-center justify-center rounded-2xl flex-shrink-0"
              style={{ backgroundColor: habit.color + '20' }}
            >
              {habit.icon}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">{habit.title}</h1>
              {habit.description && (
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{habit.description}</p>
              )}
              <div className="flex gap-2 mt-2">
                <StreakBadge streak={habit.streak?.current ?? 0} />
                <span className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full text-gray-600 dark:text-slate-300">
                  {habit.frequency === 'daily' ? 'Каждый день' : 'По дням недели'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleToggle}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                isDone
                  ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              {isDone ? '✓ Выполнено' : 'Отметить'}
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Удалить привычку"
            >
              🗑
            </button>
          </div>
        </div>

        {/* Стрики */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <div className="text-3xl font-bold text-orange-500">{habit.streak?.current ?? 0}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Текущий streak 🔥</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-purple-500">{habit.streak?.best ?? 0}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Лучший streak 🏆</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-500">{habit.streak?.total ?? 0}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Всего выполнений</div>
          </div>
        </div>

        {/* Графики */}
        {stats && (
          <div className="card">
            <div className="flex gap-2 mb-5 border-b border-gray-100 dark:border-slate-700 pb-4">
              {(['chart', 'heatmap', 'weekday'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab === 'chart' ? '📈 Динамика' : tab === 'heatmap' ? '🗓 Тепловая' : '📊 По дням'}
                </button>
              ))}
            </div>

            {activeTab === 'chart' && <ProgressChart data={habit.chart_data} color={habit.color} />}
            {activeTab === 'heatmap' && <HeatmapChart data={stats.heatmap} />}
            {activeTab === 'weekday' && <WeekdayChart data={stats.by_weekday} color={habit.color} />}
          </div>
        )}

        {/* Общая привычка */}
        {habit.is_shared && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">👥 Общая привычка</h2>

            {/* Статус за сегодня */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Прогресс сегодня</p>
              {sharedToday.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-slate-500">Загрузка...</p>
              ) : (
                <div className="space-y-2">
                  {sharedToday.map(p => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        p.done_today
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                      }`}>
                        {p.name[0].toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-800 dark:text-slate-200 flex-1">{p.name}</span>
                      {p.done_today
                        ? <span className="text-xs font-medium text-green-600 dark:text-green-400">✓ Выполнено</span>
                        : <span className="text-xs text-gray-400 dark:text-slate-500">Ещё не выполнено</span>
                      }
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Партнёры */}
            {habit.partners && habit.partners.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">Участники:</p>
                <div className="space-y-2">
                  {habit.partners.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-sm font-medium text-primary-700 dark:text-primary-400">
                        {p.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{p.name}</div>
                        <div className="text-xs text-gray-400 dark:text-slate-500">{p.email}</div>
                      </div>
                      <span
                        className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                          p.status === 'accepted'
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                            : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                        }`}
                      >
                        {p.status === 'accepted' ? 'Участвует' : 'Ожидает'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Форма приглашения */}
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                className="input flex-1"
                placeholder="Email друга"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <button type="submit" className="btn-primary">
                Пригласить
              </button>
            </form>
          </div>
        )}

        {/* Напоминания */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">⏰ Напоминание</h2>
          <form onSubmit={handleReminder} className="flex gap-2">
            <input
              type="time"
              className="input w-36"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              Установить
            </button>
          </form>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
            Email будет отправлен, если привычка не выполнена к этому времени
          </p>
        </div>
      </main>
    </div>
  );
}
