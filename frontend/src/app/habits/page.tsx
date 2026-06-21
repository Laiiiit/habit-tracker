'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { HabitCard } from '@/components/HabitCard';
import { getHabits, deleteHabit, logHabit, unlogHabit } from '@/lib/api';
import { Habit } from '@/types';

export default function HabitsPage() {
  const { status } = useSession();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/login');
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      load();
    }
  }, [status]);

  async function load() {
    setLoading(true);
    try {
      const data = await getHabits();
      setHabits(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(habit: Habit) {
    const done = Number(habit.today_count) >= habit.target_count;
    if (done) {
      await unlogHabit(habit.id);
    } else {
      await logHabit(habit.id);
    }
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить привычку?')) return;
    await deleteHabit(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Баннер */}
        <div className="relative rounded-2xl overflow-hidden h-36 mb-6">
          <img src="/images/bookshelf.jpg.jpg" alt="bookshelf" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/50 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-between px-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Все привычки</h1>
              <p className="text-white/65 text-sm mt-1">Твоя личная коллекция</p>
            </div>
            <Link href="/habits/new" className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-white/30 transition-colors">
              + Добавить
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 dark:text-slate-500">Загрузка...</div>
        ) : habits.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-500 mb-4">Привычек пока нет</p>
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
                onDelete={() => handleDelete(habit.id)}
                showActions
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
