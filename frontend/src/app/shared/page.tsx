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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Баннер */}
        <div className="relative rounded-2xl overflow-hidden h-32 mb-6">
          <img src="/images/book-flowers.jpg.jpg" alt="shared" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent" />
          <div className="absolute inset-0 flex items-center px-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Общие привычки</h1>
              <p className="text-white/65 text-sm mt-1">Достигай целей вместе с друзьями</p>
            </div>
          </div>
        </div>

        {/* Ожидающие приглашения */}
        {pending.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Приглашения ({pending.length})
            </h2>
            <div className="space-y-3">
              {pending.map((invite) => (
                <div key={invite.share_id} className="card flex items-center gap-4">
                  <div className="text-3xl">{invite.icon ?? '✅'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-slate-100 truncate">{invite.title}</p>
                    <p className="text-sm text-gray-400 dark:text-slate-500">
                      от {invite.owner_name} ({invite.owner_email})
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRespond(invite.share_id, 'accepted')}
                      className="px-3 py-1.5 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-500/30"
                    >
                      Принять
                    </button>
                    <button
                      onClick={() => handleRespond(invite.share_id, 'rejected')}
                      className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-500/20"
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
          <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Участвую ({accepted.length})
          </h2>
          {loading ? (
            <div className="text-center py-8 text-gray-400 dark:text-slate-500">Загрузка...</div>
          ) : accepted.length === 0 ? (
            <div className="card text-center py-10">
              <div className="relative w-36 h-28 mx-auto mb-4 rounded-2xl overflow-hidden">
                <img
                  src="/images/sleep-tom.jpg.jpg"
                  alt="sleeping tom"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/50 dark:from-slate-900/60 to-transparent" />
              </div>
              <p className="text-gray-500 dark:text-slate-400 font-medium mb-1">Пока тихо, как у Тома</p>
              <p className="text-sm text-gray-400 dark:text-slate-500">
                <Link href="/habits" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Создай привычку
                </Link>{' '}
                и пригласи друзей!
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
                        className="font-medium text-gray-900 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 truncate block"
                      >
                        {habit.title}
                      </Link>
                      <p className="text-sm text-gray-400 dark:text-slate-500">Хозяин: {habit.owner_name}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(habit)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        done
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
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
