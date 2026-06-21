'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { register } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', name: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) return setError('Пароли не совпадают');
    if (form.password.length < 6) return setError('Пароль минимум 6 символов');

    setLoading(true);
    try {
      await register({ email: form.email, name: form.name, password: form.password });
      await signIn('credentials', { redirect: false, email: form.email, password: form.password });
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex">

      {/* Левая панель — фото йога */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src="/images/yoga.jpg.jpg"
          alt="yoga"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/70 via-purple-900/50 to-slate-900/70" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white w-full">
          <Image src="/logo.svg" alt="logo" width={56} height={56} className="mb-5 drop-shadow-lg" />
          <h2 className="text-4xl font-bold mb-3 leading-tight">Твой путь<br/>начинается здесь.</h2>
          <p className="text-white/75 text-lg leading-relaxed max-w-xs">
            Осознанность, движение, рост — каждый день немного лучше.
          </p>
        </div>
      </div>

      {/* Правая панель — форма */}
      <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="lg:hidden">
            <Image src="/logo.svg" alt="logo" width={56} height={56} className="mx-auto mb-3" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Создать аккаунт</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Начни путь к лучшим привычкам</p>
        </div>

        <div className="card shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Имя</label>
              <input
                type="text"
                className="input"
                placeholder="Никита"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

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
                placeholder="Минимум 6 символов"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Повторите пароль</label>
              <input
                type="password"
                className="input"
                placeholder="••••••"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
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
                  Создаём аккаунт...
                </span>
              ) : 'Зарегистрироваться'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-5">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
            Войти
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
}
