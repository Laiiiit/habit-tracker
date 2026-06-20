'use client';

import Link from 'next/link';
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

  return (
    <div
      className={`card flex items-center gap-4 transition-all hover:shadow-md ${
        done ? 'opacity-80' : ''
      }`}
    >
      {/* Иконка */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ backgroundColor: habit.color + '20' }}
      >
        {habit.icon}
      </div>

      {/* Инфо */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/habits/${habit.id}`}
            className="font-semibold text-gray-900 hover:text-primary-600 truncate"
          >
            {habit.title}
          </Link>
          {habit.is_shared && (
            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
              👥
            </span>
          )}
        </div>

        {/* Прогресс и streak */}
        <div className="flex items-center gap-3 mt-1">
          <StreakBadge streak={habit.streak?.current ?? 0} small />
          <div className="flex items-center gap-1.5 flex-1">
            <div className="h-1.5 bg-gray-100 rounded-full flex-1 max-w-24">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: done ? '#22c55e' : habit.color,
                }}
              />
            </div>
            <span className="text-xs text-gray-400">
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
            className="text-gray-300 hover:text-red-400 transition-colors text-lg p-1"
            title="Удалить"
          >
            🗑
          </button>
        )}

        <button
          onClick={onToggle}
          className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center text-sm font-bold transition-all ${
            done
              ? 'border-green-400 bg-green-400 text-white'
              : 'border-gray-200 hover:border-primary-400 hover:text-primary-500 text-transparent'
          }`}
          style={!done ? { borderColor: habit.color + '60' } : {}}
          title={done ? 'Убрать отметку' : 'Отметить выполнение'}
        >
          ✓
        </button>
      </div>
    </div>
  );
}
