'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { getEvents, createEvent, deleteEvent, updateEvent, CalendarEvent } from '@/lib/api';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function getSeasonBanner(month: number): { src: string; label: string; position: string } {
  if (month === 12 || month <= 2) return { src: '/images/winter.jpg', label: 'Зима', position: 'center 10%' };
  if (month <= 5) return { src: '/images/spring.jpg', label: 'Весна', position: 'center 62%' };
  if (month <= 8) return { src: '/images/summer.jpg', label: 'Лето', position: 'center 30%' };
  return { src: '/images/autumn.jpg', label: 'Осень', position: 'center 30%' };
};
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
];

function toLocalDateStr(date: Date) {
  return date.toLocaleDateString('sv'); // YYYY-MM-DD local
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

interface EventFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  allDay: boolean;
}

const defaultForm = (dateStr: string): EventFormData => ({
  title: '',
  description: '',
  date: dateStr,
  startTime: '09:00',
  endTime: '10:00',
  color: '#6366f1',
  allDay: false,
});

export default function CalendarPage() {
  const { status } = useSession();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<EventFormData>(defaultForm(toLocalDateStr(today)));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/login');
  }, [status]);

  const loadEvents = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const data = await getEvents(year, month);
      setEvents(data);
    } catch {}
  }, [year, month, status]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Сетка дней для текущего месяца
  function buildGrid() {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    // Понедельник = 0
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push(new Date(year, month - 1, d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  function eventsForDay(day: Date) {
    return events.filter(e => isSameDay(new Date(e.start_time), day));
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  function openAddModal(day: Date) {
    setEditingEvent(null);
    setForm(defaultForm(toLocalDateStr(day)));
    setShowModal(true);
  }

  function openEditModal(e: CalendarEvent) {
    const d = new Date(e.start_time);
    setEditingEvent(e);
    setForm({
      title: e.title,
      description: e.description || '',
      date: toLocalDateStr(d),
      startTime: d.toLocaleTimeString('sv', { hour: '2-digit', minute: '2-digit' }),
      endTime: e.end_time
        ? new Date(e.end_time).toLocaleTimeString('sv', { hour: '2-digit', minute: '2-digit' })
        : '',
      color: e.color,
      allDay: e.all_day,
    });
    setShowModal(true);
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const start = form.allDay
        ? new Date(form.date + 'T00:00:00').toISOString()
        : new Date(form.date + 'T' + form.startTime).toISOString();
      const end = (!form.allDay && form.endTime)
        ? new Date(form.date + 'T' + form.endTime).toISOString()
        : undefined;

      if (editingEvent) {
        await updateEvent(editingEvent.id, {
          title: form.title, description: form.description || undefined,
          start_time: start, end_time: end, color: form.color, all_day: form.allDay,
        });
      } else {
        await createEvent({
          title: form.title, description: form.description || undefined,
          start_time: start, end_time: end, color: form.color, all_day: form.allDay,
        });
      }
      setShowModal(false);
      await loadEvents();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить событие?')) return;
    await deleteEvent(id);
    await loadEvents();
  }

  const grid = buildGrid();
  const selectedEvents = eventsForDay(selectedDay);
  const banner = getSeasonBanner(month);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Баннер-заголовок */}
        <div className="relative rounded-2xl overflow-hidden h-36 mb-6">
          <img
            src={banner.src}
            alt={banner.label}
            className="w-full h-full object-cover"
            style={{ objectPosition: banner.position }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/50 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={prevMonth}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-colors text-lg"
              >
                ‹
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{MONTHS[month - 1]} {year}</h1>
                <p className="text-white/60 text-xs mt-0.5">
                  {today.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <button
                onClick={nextMonth}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-colors text-lg"
              >
                ›
              </button>
              <button
                onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1); setSelectedDay(today); }}
                className="text-sm px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 text-white font-medium hover:bg-white/25 transition-colors"
              >
                Сегодня
              </button>
            </div>
            <button
              onClick={() => openAddModal(selectedDay)}
              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-white/30 transition-colors"
            >
              + Событие
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Сетка календаря */}
          <div className="flex-1">
            <div className="card p-0 overflow-hidden">
              {/* Дни недели */}
              <div className="grid grid-cols-7 border-b border-gray-100 dark:border-slate-700">
                {WEEKDAYS.map(d => (
                  <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase">
                    {d}
                  </div>
                ))}
              </div>

              {/* Сетка дней */}
              <div className="grid grid-cols-7">
                {grid.map((day, i) => {
                  if (!day) return (
                    <div key={`empty-${i}`} className="h-24 border-b border-r border-gray-100 dark:border-slate-800/60 bg-gray-50/50 dark:bg-slate-900/30" />
                  );

                  const isToday = isSameDay(day, today);
                  const isSelected = isSameDay(day, selectedDay);
                  const dayEvents = eventsForDay(day);
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      className={`h-24 border-b border-r border-gray-100 dark:border-slate-800/60 p-1.5 cursor-pointer transition-colors relative group
                        ${isSelected ? 'bg-primary-50 dark:bg-primary-500/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'}
                        ${isWeekend && !isSelected ? 'bg-red-50/30 dark:bg-red-500/5' : ''}
                      `}
                    >
                      {/* Число */}
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${
                        isToday
                          ? 'bg-primary-500 text-white'
                          : isSelected
                            ? 'text-primary-700 dark:text-primary-400 font-bold'
                            : isWeekend
                              ? 'text-red-400 dark:text-red-400'
                              : 'text-gray-700 dark:text-slate-300'
                      }`}>
                        {day.getDate()}
                      </div>

                      {/* События */}
                      <div className="space-y-0.5 overflow-hidden">
                        {dayEvents.slice(0, 3).map(e => (
                          <div
                            key={e.id}
                            className="text-xs px-1 py-0.5 rounded truncate text-white font-medium leading-tight"
                            style={{ backgroundColor: e.color }}
                          >
                            {e.all_day ? e.title : `${formatTime(e.start_time)} ${e.title}`}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-400 dark:text-slate-500 pl-1">
                            +{dayEvents.length - 3} ещё
                          </div>
                        )}
                      </div>

                      {/* Кнопка добавить при ховере */}
                      <button
                        onClick={(ev) => { ev.stopPropagation(); openAddModal(day); }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary-500 text-white text-xs items-center justify-center hidden group-hover:flex"
                      >
                        +
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Панель выбранного дня */}
          <div className="w-72 flex-shrink-0">
            <div className="card sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-slate-100 text-sm leading-tight">
                  {selectedDay.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h2>
                <button
                  onClick={() => openAddModal(selectedDay)}
                  className="w-7 h-7 rounded-lg bg-primary-500 text-white text-lg flex items-center justify-center hover:bg-primary-600 transition-colors flex-shrink-0"
                >
                  +
                </button>
              </div>

              {selectedEvents.length === 0 ? (
                <div className="text-center py-4">
                  <div className="relative w-32 h-24 mx-auto mb-3 rounded-xl overflow-hidden">
                    <img
                      src="/images/sleep-teddy.jpg.jpg"
                      alt="no events"
                      className="w-full h-full object-cover object-[center_40%]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/40 dark:from-slate-900/50 to-transparent" />
                  </div>
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Свободный день</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Никаких событий — отдыхай!</p>
                  <button
                    onClick={() => openAddModal(selectedDay)}
                    className="mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    + Добавить событие
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedEvents
                    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                    .map(e => (
                      <div
                        key={e.id}
                        className="group flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        onClick={() => openEditModal(e)}
                      >
                        <div
                          className="w-1.5 flex-shrink-0 self-stretch rounded-full mt-0.5"
                          style={{ backgroundColor: e.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{e.title}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                            {e.all_day ? 'Весь день' : `${formatTime(e.start_time)}${e.end_time ? ` – ${formatTime(e.end_time)}` : ''}`}
                          </p>
                          {e.description && (
                            <p className="text-xs text-gray-400 dark:text-slate-500 truncate mt-0.5">{e.description}</p>
                          )}
                        </div>
                        <button
                          onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 dark:text-slate-600 hover:text-red-400 transition-all flex-shrink-0 mt-0.5"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Модальное окно добавления/редактирования */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                {editingEvent ? 'Редактировать событие' : 'Новое событие'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Название */}
              <div>
                <label className="label">Название</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Встреча, тренировка, дедлайн..."
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              {/* Весь день */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, allDay: !f.allDay }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.allDay ? 'bg-primary-500' : 'bg-gray-200 dark:bg-slate-600'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    form.allDay ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
                <span className="text-sm text-gray-700 dark:text-slate-300">Весь день</span>
              </div>

              {/* Дата */}
              <div>
                <label className="label">Дата</label>
                <input
                  type="date"
                  className="input"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>

              {/* Время */}
              {!form.allDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Начало</label>
                    <input
                      type="time"
                      className="input"
                      value={form.startTime}
                      onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Конец</label>
                    <input
                      type="time"
                      className="input"
                      value={form.endTime}
                      onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Описание */}
              <div>
                <label className="label">Описание (необязательно)</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="Дополнительные заметки..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              {/* Цвет */}
              <div>
                <label className="label">Цвет</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full transition-all ${
                        form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-slate-900 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">
                  Отмена
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Сохраняем...' : editingEvent ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
