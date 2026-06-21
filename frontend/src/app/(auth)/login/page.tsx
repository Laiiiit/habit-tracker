'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password,
    });

    setLoading(false);

    if (result?.error) {
      setError('Неверный email или пароль');
    } else {
      router.push('/');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex">
      {/* Левая панель — фото */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src="/images/runner.jpg.jpg"
          alt="runner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Тёмный оверлей */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-primary-900/50 to-slate-900/70" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white w-full">
          <div className="mb-8">
            <Image src="/logo.svg" alt="logo" width={56} height={56} className="mb-5 drop-shadow-lg" />
            <h2 className="text-4xl font-bold mb-3 leading-tight">Начни сегодня.</h2>
            <p className="text-white/75 text-lg leading-relaxed max-w-xs">
              Каждый большой результат — это сумма маленьких шагов, сделанных каждый день.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['🔥', 'Streaks'], ['📊', 'Аналитика'], ['👥', 'Совместно']].map(([icon, label]) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-sm text-white/80">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Правая панель — форма */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Мобильный лого */}
          <div className="lg:hidden text-center mb-8">
            <Image src="/logo.svg" alt="logo" width={56} height={56} className="mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Habit Tracker</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">Добро пожаловать!</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-7">Войдите в свой аккаунт</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Пароль</label>
              <input
                type="password"
                className="input"
                placeholder="••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Вход...
                </span>
              ) : 'Войти'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
