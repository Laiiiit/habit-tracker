'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { href: '/', label: 'Сегодня', icon: '🏠' },
  { href: '/calendar', label: 'Календарь', icon: '📅' },
  { href: '/habits', label: 'Привычки', icon: '📋' },
  { href: '/shared', label: 'Общие', icon: '👥' },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-2 flex-shrink-0">
          <Image src="/logo.svg" alt="Habit Tracker" width={32} height={32} />
          <span className="font-bold text-gray-800 dark:text-slate-100 text-lg hidden sm:block">
            Habit Tracker
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1 flex-1">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{icon}</span>
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side: theme toggle + user */}
        <div className="flex items-center gap-1 ml-auto">
          <ThemeToggle />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-sm font-semibold text-primary-700 dark:text-primary-400">
                {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="text-sm text-gray-700 dark:text-slate-300 hidden sm:block">
                {session?.user?.name}
              </span>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg py-1 w-44 z-20">
                  <div className="px-3 py-2 text-xs text-gray-400 dark:text-slate-500 truncate border-b border-gray-100 dark:border-slate-700 mb-1">
                    {session?.user?.email}
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    🚪 Выйти
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="sm:hidden border-t border-gray-100 dark:border-slate-800 flex">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                active
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 dark:text-slate-500'
              }`}
            >
              <span className="text-lg">{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
