export interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
}

export type Frequency = 'daily' | 'weekly';

export interface Streak {
  current: number;
  best: number;
  total: number;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  icon: string;
  color: string;
  frequency: Frequency;
  frequency_days: number[];
  target_count: number;
  is_active: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  // вычисляемые поля
  streak?: Streak;
  today_count?: number;
  total_count?: number;
  progress?: number;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
  count: number;
  notes?: string;
  created_at: string;
}

export interface ChartPoint {
  date: string;
  label: string;
  count: number;
  completed: boolean;
}

export interface HabitDetail extends Habit {
  logs: HabitLog[];
  chart_data: ChartPoint[];
  partners: SharedHabit[];
}

export interface SharedHabit {
  id: string;
  habit_id: string;
  owner_id?: string;
  owner_name?: string;
  owner_email?: string;
  shared_with_id?: string;
  status: 'pending' | 'accepted' | 'rejected';
  // данные привычки
  title?: string;
  icon?: string;
  color?: string;
  today_count?: number;
}

export interface Stats {
  streak: Streak;
  total: number;
  by_month: { month: string; count: number }[];
  by_weekday: { day: string; count: number }[];
  heatmap: { completed_date: string; count: number }[];
}
