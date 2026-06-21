'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/Navbar';
import { createHabit } from '@/lib/api';

const ICONS = ['✅', '💪', '📚', '🏃', '🧘', '💧', '🥗', '😴', '🎯', '✍️', '🎵', '🌿'];
const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
];

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export default function NewHabitPage() {
  const router = useRouter();
  const { status } = useSession();
  const [form, setForm] = useState({
    title: '',
    description: '',
    icon: '✅',
    color: '#6366f1',
    frequency: 'daily',
    frequency_days: [] as number[],
    target_count: 1,
    is_shared: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (status === 'unauthenticated') router.push('/login');

  function toggleDay(day: number) {
    setForm((f) => ({
      ...f,
      frequency_days: f.frequency_days.includes(day)
        ? f.frequency_days.filter((d) => d !== day)
        : [...f.frequency_days, day],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return setError('Введите название');
    setLoading(true);
    setError('');
    try {
      const habit = await createHabit(form);
      router.push(`/habits/${habit.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Новая привычка</h1>

        <form onSubmit={handleSubmit} className="card space-y-5">
          {/* Название */}
          <div>
            <label className="label">Название *</label>
            <input
              className="input"
              placeholder="Например: Читать 20 минут"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={100}
              required
            />
          </div>

          {/* Описание */}
          <div>
            <label className="label">Описание</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Зачем эта привычка?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Иконка */}
          <div>
            <label className="label">Иконка</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm({ ...form, icon })}
                  className={`text-2xl p-2 rounded-xl border-2 transition-colors ${
                    form.icon === icon
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                      : 'border-transparent hover:border-gray-200 dark:hover:border-slate-600'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Цвет */}
          <div>
            <label className="label">Цвет</label>
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-full border-4 transition-all ${
                    form.color === color ? 'border-gray-400 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Частота */}
          <div>
            <label className="label">Частота</label>
            <div className="flex gap-3">
              {['daily', 'weekly'].map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setForm({ ...form, frequency: freq })}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${
                    form.frequency === freq
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400'
                      : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500'
                  }`}
                >
                  {freq === 'daily' ? 'Ежедневно' : 'По дням недели'}
                </button>
              ))}
            </div>

            {form.frequency === 'weekly' && (
              <div className="flex gap-2 mt-3">
                {WEEKDAYS.map((day, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`w-9 h-9 rounded-full text-sm font-medium border-2 transition-colors ${
                      form.frequency_days.includes(i)
                        ? 'border-primary-500 bg-primary-500 text-white'
                        : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-primary-300'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Цель */}
          <div>
            <label className="label">Цель в день</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, target_count: Math.max(1, f.target_count - 1) }))}
                className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 font-bold text-lg text-gray-800 dark:text-slate-100"
              >
                −
              </button>
              <span className="text-lg font-semibold w-8 text-center">{form.target_count}</span>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, target_count: f.target_count + 1 }))}
                className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 font-bold text-lg text-gray-800 dark:text-slate-100"
              >
                +
              </button>
              <span className="text-sm text-gray-500 dark:text-slate-400">раз</span>
            </div>
          </div>

          {/* Общая привычка */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, is_shared: !f.is_shared }))}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                form.is_shared ? 'bg-primary-500' : 'bg-gray-200 dark:bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  form.is_shared ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-slate-300">Общая привычка</div>
              <div className="text-xs text-gray-400 dark:text-slate-500">Можно приглашать других пользователей</div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Создаём...' : 'Создать привычку'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-ghost"
            >
              Отмена
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
