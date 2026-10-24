import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X, CalendarDays, Flame } from 'lucide-react';
import { Card, CardHeader, CardBody, Select, Button, EmptyState, Badge } from './ui';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
  return cells;
}

export default function AchievementCalendar({ achievements, onToggleDay }) {
  const [achievementId, setAchievementId] = useState(achievements[0]?.id || '');
  const [viewDate, setViewDate] = useState(() => new Date());

  const achievement = achievements.find((a) => a.id === achievementId) || achievements[0];
  const todayStr = toDateStr(new Date());

  const logsByDate = useMemo(() => {
    if (!achievement) return {};
    return (achievement.logs || []).reduce((acc, log) => {
      acc[log.log_date] = log;
      return acc;
    }, {});
  }, [achievement]);

  const cells = useMemo(
    () => buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  );

  const monthStats = useMemo(() => {
    let done = 0;
    let missed = 0;
    cells.forEach((date) => {
      if (!date) return;
      const log = logsByDate[toDateStr(date)];
      if (log?.done) done++;
      else if (log) missed++;
    });
    return { done, missed };
  }, [cells, logsByDate]);

  if (!achievement) {
    return (
      <Card>
        <EmptyState icon={<CalendarDays size={22} />} title="No achievements yet" message="Create an achievement first to log and view its calendar." />
      </Card>
    );
  }

  const changeMonth = (delta) => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  const goToToday = () => setViewDate(new Date());

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isCurrentMonth = viewDate.getFullYear() === new Date().getFullYear() && viewDate.getMonth() === new Date().getMonth();

  return (
    <Card className="overflow-hidden">
      <CardHeader
        icon={<CalendarDays size={18} />}
        title="Calendar"
        subtitle="Click a past or today's day to log it — future days are locked"
        action={
          achievements.length > 1 ? (
            <Select value={achievementId} onChange={(e) => setAchievementId(e.target.value)} className="w-52">
              {achievements.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </Select>
          ) : null
        }
      />
      <CardBody className="flex flex-col gap-5">
        {/* Month nav + month stats */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => changeMonth(-1)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-all duration-150 hover:scale-105"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-base font-semibold text-[var(--text)] w-40 text-center font-[var(--font-display)]">{monthLabel}</span>
            <button
              onClick={() => changeMonth(1)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-all duration-150 hover:scale-105"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
            {!isCurrentMonth && (
              <Button variant="ghost" size="sm" onClick={goToToday} className="ml-1">
                Today
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success">
              <Flame size={11} /> {monthStats.done} done
            </Badge>
            {monthStats.missed > 0 && <Badge variant="danger">{monthStats.missed} missed</Badge>}
          </div>
        </div>

        {/* Calendar grid */}
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          {/* Weekday header */}
          <div className="grid grid-cols-7 bg-[var(--surface-hover)] border-b border-[var(--border)]">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] py-2.5 border-r border-[var(--border)] last:border-r-0"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((date, i) => {
              if (!date) {
                return (
                  <div
                    key={`blank-${i}`}
                    className="aspect-square bg-[var(--bg)] border-r border-b border-[var(--border)] [&:nth-child(7n)]:border-r-0"
                  />
                );
              }

              const dateStr = toDateStr(date);
              const log = logsByDate[dateStr];
              const isFuture = dateStr > todayStr;
              const isToday = dateStr === todayStr;
              const beforeStart = achievement.start_date && dateStr < achievement.start_date;
              const disabled = isFuture || beforeStart;
              const isLastCol = (i + 1) % 7 === 0;
              const isLastRow = i >= cells.length - 7;

              return (
                <button
                  key={dateStr}
                  disabled={disabled}
                  onClick={() => onToggleDay(achievement.id, dateStr, log)}
                  title={disabled ? "Can't log this day" : dateStr}
                  className={`group relative aspect-square flex flex-col items-center justify-center gap-0.5 text-sm font-medium transition-colors duration-200
                    border-[var(--border)] ${isLastCol ? '' : 'border-r'} ${isLastRow ? '' : 'border-b'}
                    ${disabled
                      ? 'opacity-30 cursor-not-allowed text-[var(--text-muted)] bg-[var(--bg)]'
                      : 'cursor-pointer hover:bg-primary/5'}
                    ${log?.done ? 'bg-accent text-white hover:bg-accent' : ''}
                    ${log && !log.done ? 'bg-danger text-white hover:bg-danger' : ''}
                    ${!log && !disabled ? 'bg-[var(--surface)] text-[var(--text)]' : ''}
                  `}
                >
                  {isToday && !log && (
                    <span className="absolute inset-1 rounded-md ring-2 ring-primary/60 pointer-events-none" />
                  )}
                  <span className={isToday && !log ? 'text-primary font-bold' : ''}>{date.getDate()}</span>
                  {log?.done && <Check size={12} strokeWidth={3} />}
                  {log && !log.done && <X size={12} strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[5px] bg-accent" /> Done</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[5px] bg-danger" /> Missed</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[5px] bg-[var(--surface-hover)] border border-[var(--border)]" /> Not logged</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[5px] ring-2 ring-primary/60" /> Today</span>
        </div>
      </CardBody>
    </Card>
  );
}
