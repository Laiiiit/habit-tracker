'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Habit } from '@/types';
import { StreakBadge } from './StreakBadge';

interface Props {
  habit: Habit;
  onToggle: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function HabitCard({ habit, onToggle, onDelete, showActions }: Props) {
  const done = Number(habit.today_count) >= habit.target_count;
  const progress = habit.progress ?? 0;
  const [popping, setPopping] = useState(false);

  function handleToggle() {
    if (!done) {
      setPopping(true);
      setTimeout(() => setPopping(false), 300);
    }
    onToggle();
  }

  return (
    <div className={`card flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5 animate-fade-in ${
      done ? 'opacity-75' : ''
    }`}>
      {/* Иконка */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ backgroundColor: habit.color + '22' }}
      >
        {habit.icon}
      </div>

      {/* Инфо */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/habits/${habit.id}`}
            className="font-semibold text-gray-900 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 truncate transition-colors"
          >
            {habit.title}
          </Link>
          {habit.is_shared && (
            <span className="text-xs bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
              👥
            </span>
          )}
          {done && (
            <span className="text-xs bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
              ✓ Готово
            </span>
          )}
        </div>

        {/* Прогресс */}
        <div className="flex items-center gap-3 mt-1.5">
          <StreakBadge streak={habit.streak?.current ?? 0} small />
          <div className="flex items-center gap-1.5 flex-1">
            <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full flex-1 max-w-28 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: done ? '#22c55e' : habit.color,
                }}
              />
            </div>
            <span className="text-xs text-gray-400 dark:text-slate-500">
              {habit.today_count ?? 0}/{habit.target_count}
            </span>
          </div>
        </div>
      </div>

      {/* Кнопки */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {showActions && onDelete && (
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
            title="Удалить"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        )}

        <button
          onClick={handleToggle}
          className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center text-sm font-bold transition-all ${
            popping ? 'scale-125' : 'scale-100'
          } ${
            done
              ? 'border-green-400 bg-green-400 dark:bg-green-500 dark:border-green-500 text-white'
              : 'border-gray-200 dark:border-slate-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 text-transparent hover:text-primary-500'
          }`}
          title={done ? 'Убрать отметку' : 'Отметить выполнение'}
        >
          ✓
        </button>
      </div>
    </div>
  );
}
