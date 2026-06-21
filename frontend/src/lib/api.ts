import { getSession } from 'next-auth/react';
import { Habit, HabitDetail, SharedHabit, Stats } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** Получить JWT токен из NextAuth сессии */
async function getToken(): Promise<string | null> {
  const session = await getSession();
  return (session as any)?.accessToken ?? null;
}

/** Базовый fetch с авторизацией */
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API error');
  }

  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function register(data: { email: string; name: string; password: string }) {
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  return res.json();
}

// ─── Habits ───────────────────────────────────────────────────────────────────

export const getHabits = () => apiFetch<Habit[]>('/api/habits');

export const getHabit = (id: string) => apiFetch<HabitDetail>(`/api/habits/${id}`);

export const getHabitStats = (id: string) => apiFetch<Stats>(`/api/habits/${id}/stats`);

export const createHabit = (data: Partial<Habit>) =>
  apiFetch<Habit>('/api/habits', { method: 'POST', body: JSON.stringify(data) });

export const updateHabit = (id: string, data: Partial<Habit>) =>
  apiFetch<Habit>(`/api/habits/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteHabit = (id: string) =>
  apiFetch(`/api/habits/${id}`, { method: 'DELETE' });

export const logHabit = (id: string, data?: { date?: string; notes?: string }) =>
  apiFetch(`/api/habits/${id}/log`, { method: 'POST', body: JSON.stringify(data || {}) });

export const unlogHabit = (id: string, date?: string) =>
  apiFetch(`/api/habits/${id}/log${date ? `?date=${date}` : ''}`, { method: 'DELETE' });

export const addReminder = (habitId: string, remind_at: string) =>
  apiFetch(`/api/habits/${habitId}/reminders`, {
    method: 'POST',
    body: JSON.stringify({ remind_at }),
  });

// ─── Calendar ─────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  color: string;
  all_day: boolean;
  created_at: string;
}

export const getEvents = (year: number, month: number) =>
  apiFetch<CalendarEvent[]>(`/api/events?year=${year}&month=${month}`);

export const createEvent = (data: Partial<CalendarEvent>) =>
  apiFetch<CalendarEvent>('/api/events', { method: 'POST', body: JSON.stringify(data) });

export const updateEvent = (id: string, data: Partial<CalendarEvent>) =>
  apiFetch<CalendarEvent>(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteEvent = (id: string) =>
  apiFetch(`/api/events/${id}`, { method: 'DELETE' });

// ─── Shared ───────────────────────────────────────────────────────────────────

export const getSharedHabits = () => apiFetch<SharedHabit[]>('/api/shared');

export const inviteToHabit = (habit_id: string, email: string) =>
  apiFetch('/api/shared/invite', { method: 'POST', body: JSON.stringify({ habit_id, email }) });

export const respondToInvite = (shareId: string, status: 'accepted' | 'rejected') =>
  apiFetch(`/api/shared/${shareId}`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const removeShared = (shareId: string) =>
  apiFetch(`/api/shared/${shareId}`, { method: 'DELETE' });

export const getLeaderboard = (habitId: string) =>
  apiFetch(`/api/shared/leaderboard/${habitId}`);

export const getSharedToday = (habitId: string) =>
  apiFetch<{ id: string; name: string; avatar_url?: string; done_today: boolean }[]>(
    `/api/shared/today/${habitId}`
  );
