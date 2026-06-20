'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { HabitCard } from '@/components/HabitCard';
import { getHabits, logHabit, unlogHabit } from '@/lib/api';
import { Habit } from '@/types';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/login');
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      getHabits()
        .then(setHabits)
        .finally(() => setLoading(false));
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">Загрузка...</div>
      </div>
    );
  }

  const todayDone = habits.filter((h) => Number(h.today_count) >= h.target_count).length;
  const totalHabits = habits.length;
  const avgStreak =
    habits.length > 0
      ? Math.round(habits.reduce((s, h) => s + (h.streak?.current ?? 0), 0) / habits.length)
      : 0;

  async function handleToggle(habit: Habit) {
    const done = Number(habit.today_count) >= habit.target_count;
    try {
      if (done) {
        await unlogHabit(habit.id);
      } else {
        await logHabit(habit.id);
      }
      const updated = await getHabits();
      setHabits(updated);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Приветствие */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Привет, {session?.user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString('ru-RU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>

        {/* Сводка */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-600">
              {todayDone}/{totalHabits}
            </div>
            <div className="text-sm text-gray-500 mt-1">Сегодня</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-orange-500">{avgStreak}</div>
            <div className="text-sm text-gray-500 mt-1">Ср. streak 🔥</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-500">
              {totalHabits > 0 ? Math.round((todayDone / totalHabits) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-500 mt-1">Прогресс</div>
          </div>
        </div>

        {/* Прогресс-бар дня */}
        {totalHabits > 0 && (
          <div className="card mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span className="font-medium">Прогресс за сегодня</span>
              <span>{todayDone} из {totalHabits}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${totalHabits > 0 ? (todayDone / totalHabits) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Список привычек */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Мои привычки</h2>
          <Link href="/habits/new" className="btn-primary text-sm py-1.5">
            + Добавить
          </Link>
        </div>

        {habits.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">🌱</div>
            <p className="text-gray-500 mb-4">Пока нет привычек</p>
            <Link href="/habits/new" className="btn-primary">
              Создать первую привычку
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} onToggle={() => handleToggle(habit)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
