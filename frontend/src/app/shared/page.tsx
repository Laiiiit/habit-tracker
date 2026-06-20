'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { getSharedHabits, respondToInvite, logHabit, unlogHabit } from '@/lib/api';
import { SharedHabit } from '@/types';

export default function SharedPage() {
  const { status } = useSession();
  const [shared, setShared] = useState<SharedHabit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/login');
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') load();
  }, [status]);

  async function load() {
    setLoading(true);
    try {
      setShared(await getSharedHabits());
    } finally {
      setLoading(false);
    }
  }

  async function handleRespond(shareId: string, response: 'accepted' | 'rejected') {
    await respondToInvite(shareId, response);
    await load();
  }

  async function handleToggle(habit: SharedHabit) {
    const done = Number(habit.today_count) >= 1;
    if (done) {
      await unlogHabit(habit.habit_id);
    } else {
      await logHabit(habit.habit_id);
    }
    await load();
  }

  const pending = shared.filter((s) => s.status === 'pending');
  const accepted = shared.filter((s) => s.status === 'accepted');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">👥 Общие привычки</h1>

        {/* Ожидающие приглашения */}
        {pending.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Приглашения ({pending.length})
            </h2>
            <div className="space-y-3">
              {pending.map((invite) => (
                <div key={invite.id} className="card flex items-center gap-4">
                  <div className="text-3xl">{invite.icon ?? '✅'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{invite.title}</p>
                    <p className="text-sm text-gray-400">
                      от {invite.owner_name} ({invite.owner_email})
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRespond(invite.id, 'accepted')}
                      className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                    >
                      Принять
                    </button>
                    <button
                      onClick={() => handleRespond(invite.id, 'rejected')}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Принятые */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Участвую ({accepted.length})
          </h2>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Загрузка...</div>
          ) : accepted.length === 0 ? (
            <div className="card text-center py-10">
              <div className="text-4xl mb-3">🤝</div>
              <p className="text-gray-500">
                Пока нет общих привычек.{' '}
                <Link href="/habits" className="text-primary-600 hover:underline">
                  Создайте привычку
                </Link>{' '}
                и пригласите друзей!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {accepted.map((habit) => {
                const done = Number(habit.today_count) >= 1;
                return (
                  <div key={habit.id} className="card flex items-center gap-4">
                    <div className="text-3xl">{habit.icon ?? '✅'}</div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/habits/${habit.habit_id}`}
                        className="font-medium text-gray-900 hover:text-primary-600 truncate block"
                      >
                        {habit.title}
                      </Link>
                      <p className="text-sm text-gray-400">Хозяин: {habit.owner_name}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(habit)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        done
                          ? 'bg-green-100 text-green-700'
                          : 'bg-primary-500 text-white hover:bg-primary-600'
                      }`}
                    >
                      {done ? '✓ Готово' : 'Отметить'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
