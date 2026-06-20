/**
 * Streak calculation service.
 * Streak — это количество последовательных дней/недель выполнения привычки.
 */

/**
 * Считает текущий streak и лучший streak для привычки.
 * @param {string[]} dates — массив дат ISO 'YYYY-MM-DD' в любом порядке
 * @param {'daily'|'weekly'} frequency
 */
function calcStreak(dates, frequency = 'daily') {
  if (!dates || dates.length === 0) {
    return { current: 0, best: 0, total: dates?.length || 0 };
  }

  // Нормализуем и сортируем
  const sorted = [...new Set(dates)]
    .map((d) => new Date(d))
    .sort((a, b) => a - b);

  if (frequency === 'daily') {
    return calcDailyStreak(sorted);
  } else if (frequency === 'weekly') {
    return calcWeeklyStreak(sorted);
  }

  return calcDailyStreak(sorted);
}

function calcDailyStreak(sortedDates) {
  const today = startOfDay(new Date());
  const yesterday = addDays(today, -1);

  let current = 0;
  let best = 0;
  let run = 1;

  for (let i = sortedDates.length - 1; i >= 0; i--) {
    if (i === sortedDates.length - 1) {
      // Последний элемент — начинаем с него
      // Streak активен только если последний день = сегодня или вчера
      const lastDate = startOfDay(sortedDates[i]);
      const isRecent = sameDay(lastDate, today) || sameDay(lastDate, yesterday);
      current = isRecent ? 1 : 0;
      run = 1;
    } else {
      const prev = startOfDay(sortedDates[i + 1]);
      const curr = startOfDay(sortedDates[i]);
      const diff = Math.round((prev - curr) / (1000 * 60 * 60 * 24));

      if (diff === 1) {
        run++;
        if (current > 0) current = run;
      } else {
        if (run > best) best = run;
        run = 1;
      }
    }
  }

  if (run > best) best = run;
  if (current === 0 && sortedDates.length > 0) {
    // Все серии уже в прошлом
    best = Math.max(best, run);
  }

  return { current, best, total: sortedDates.length };
}

function calcWeeklyStreak(sortedDates) {
  // Группируем по номеру ISO-недели
  const weeks = new Set(sortedDates.map(getWeekKey));
  const sortedWeeks = [...weeks].sort();

  let current = 0;
  let best = 0;
  let run = 1;

  const currentWeek = getWeekKey(new Date());
  const lastWeek = getWeekKey(addDays(new Date(), -7));

  for (let i = sortedWeeks.length - 1; i >= 0; i--) {
    if (i === sortedWeeks.length - 1) {
      const isRecent = sortedWeeks[i] === currentWeek || sortedWeeks[i] === lastWeek;
      current = isRecent ? 1 : 0;
      run = 1;
    } else {
      const [y1, w1] = sortedWeeks[i + 1].split('-W').map(Number);
      const [y0, w0] = sortedWeeks[i].split('-W').map(Number);
      const totalWeeks1 = y1 * 52 + w1;
      const totalWeeks0 = y0 * 52 + w0;

      if (totalWeeks1 - totalWeeks0 === 1) {
        run++;
        if (current > 0) current = run;
      } else {
        if (run > best) best = run;
        run = 1;
      }
    }
  }

  if (run > best) best = run;
  return { current, best, total: sortedDates.length };
}

// Helpers
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getWeekKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Считает прогресс за сегодня/текущую неделю.
 * @param {number} logsCount — кол-во выполнений за период
 * @param {number} targetCount — цель
 */
function calcProgress(logsCount, targetCount) {
  if (targetCount <= 0) return 100;
  return Math.min(100, Math.round((logsCount / targetCount) * 100));
}

module.exports = { calcStreak, calcProgress };
