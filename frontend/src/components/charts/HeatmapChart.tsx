'use client';

interface HeatmapEntry {
  completed_date: string;
  count: number;
}

interface Props {
  data: HeatmapEntry[];
}

/** Тепловая карта: 12 недель × 7 дней */
export function HeatmapChart({ data }: Props) {
  // Строим индекс дата → count
  const index: Record<string, number> = {};
  const max = data.reduce((m, d) => Math.max(m, Number(d.count)), 0) || 1;

  data.forEach((d) => {
    index[d.completed_date] = Number(d.count);
  });

  // Генерируем ячейки за последние 84 дня (12 недель)
  const days: { date: string; count: number }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({ date: dateStr, count: index[dateStr] ?? 0 });
  }

  function opacity(count: number) {
    if (count === 0) return 0;
    return 0.2 + (count / max) * 0.8;
  }

  // Разбиваем по неделям
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-4">Активность за 12 недель</p>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {/* Метки дней */}
        <div className="flex flex-col gap-1 mr-1 flex-shrink-0">
          {WEEKDAYS_SHORT.map((d) => (
            <div key={d} className="h-5 text-xs text-gray-400 flex items-center">
              {d}
            </div>
          ))}
        </div>

        {/* Сетка */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map(({ date, count }) => (
              <div
                key={date}
                className="w-5 h-5 rounded-sm cursor-default"
                style={{
                  backgroundColor: count > 0 ? '#6366f1' : '#f3f4f6',
                  opacity: count > 0 ? opacity(count) : 1,
                }}
                title={`${date}: ${count} выполнений`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Легенда */}
      <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
        <span>Меньше</span>
        {[0, 0.2, 0.5, 0.8, 1].map((op, i) => (
          <div
            key={i}
            className="w-3.5 h-3.5 rounded-sm"
            style={{
              backgroundColor: op === 0 ? '#f3f4f6' : '#6366f1',
              opacity: op === 0 ? 1 : op,
            }}
          />
        ))}
        <span>Больше</span>
      </div>
    </div>
  );
}
