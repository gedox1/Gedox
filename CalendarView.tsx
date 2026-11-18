import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Flag, Plus } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import {
  doesScheduleOccurOnDate,
  formatReadableDate,
  isScheduleCompletedOnDate,
} from '../utils/scheduleHelpers';
import { getTodayISO } from '../utils/storage';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView() {
  const { schedules, targets, toggleScheduleCompletion, setActiveSection } = useVault();
  const todayISO = getTodayISO();

  const [viewDate, setViewDate] = useState(() => {
    const [y, m] = todayISO.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });
  const [selectedDateISO, setSelectedDateISO] = useState(todayISO);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthLabel = viewDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ dateISO: string | null; dayNum: number | null }> = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ dateISO: null, dayNum: null });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({ dateISO: `${year}-${mStr}-${dStr}`, dayNum: d });
    }

    return cells;
  }, [year, month]);

  const selectedDaySchedules = useMemo(
    () =>
      schedules
        .filter((s) => doesScheduleOccurOnDate(s, selectedDateISO))
        .sort((a, b) => a.time.localeCompare(b.time)),
    [schedules, selectedDateISO]
  );

  const selectedDayTargets = useMemo(
    () => targets.filter((t) => t.targetDate === selectedDateISO),
    [targets, selectedDateISO]
  );

  const shiftMonth = (delta: number) => {
    setViewDate(new Date(year, month + delta, 1));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      {/* Month Calendar Grid */}
      <section className="xl:col-span-2 rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6">
        <div className="flex items-center justify-between gap-4 pb-5">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            {monthLabel}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const [y, m] = todayISO.split('-').map(Number);
                setViewDate(new Date(y, m - 1, 1));
                setSelectedDateISO(todayISO);
              }}
              className="rounded-lg border border-slate-200 dark:border-[#1B263B] px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-[#D4AF37]/50"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="rounded-lg border border-slate-200 dark:border-[#1B263B] p-1.5 text-slate-600 dark:text-slate-300 hover:border-[#D4AF37]/50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="rounded-lg border border-slate-200 dark:border-[#1B263B] p-1.5 text-slate-600 dark:text-slate-300 hover:border-[#D4AF37]/50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 dark:text-slate-400 pb-2">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-1.5">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((cell, idx) => {
            if (!cell.dateISO || cell.dayNum === null) {
              return <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-lg" />;
            }

            const dayItems = schedules.filter((s) => doesScheduleOccurOnDate(s, cell.dateISO!));
            const dayTargets = targets.filter((t) => t.targetDate === cell.dateISO);
            const hasDeadline = dayItems.some((s) => s.isDeadline) || dayTargets.length > 0;
            const isSelected = cell.dateISO === selectedDateISO;
            const isToday = cell.dateISO === todayISO;

            return (
              <button
                key={cell.dateISO}
                type="button"
                onClick={() => setSelectedDateISO(cell.dateISO!)}
                className={`h-20 sm:h-24 rounded-lg border p-2 text-left flex flex-col justify-between transition-colors ${
                  isSelected
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-slate-100 dark:border-[#1B263B] hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-[#0D1424]/50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-mono tabular-nums font-semibold ${
                      isToday
                        ? 'text-[#B8860B] dark:text-[#D4AF37]'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                  {hasDeadline && (
                    <Flag className="h-3 w-3 text-amber-500 shrink-0" aria-label="Has deadline" />
                  )}
                </div>

                <div className="space-y-0.5 overflow-hidden w-full">
                  {dayItems.slice(0, 2).map((item) => (
                    <p
                      key={item.id}
                      className="truncate text-[11px] text-slate-600 dark:text-slate-300"
                    >
                      {item.time} {item.title}
                    </p>
                  ))}
                  {dayItems.length > 2 && (
                    <p className="text-[10px] font-mono text-slate-400">
                      +{dayItems.length - 2} more
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Day Agenda */}
      <section className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-[#1B263B]">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              {formatReadableDate(selectedDateISO)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedDaySchedules.length} schedule items · {selectedDayTargets.length} target deadlines
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveSection('schedule')}
            className="flex items-center gap-1 rounded-lg bg-[#0F172A] dark:bg-[#D4AF37] px-3 py-1.5 text-xs font-semibold text-white dark:text-[#06080D] whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </div>

        {selectedDayTargets.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              Target Completion Deadlines
            </h4>
            {selectedDayTargets.map((tgt) => (
              <div
                key={tgt.id}
                className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs"
              >
                <p className="font-semibold text-slate-900 dark:text-white">{tgt.title}</p>
                <p className="mt-1 text-slate-500 dark:text-slate-400 capitalize">
                  {tgt.category} · {tgt.progress}% complete
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Scheduled Activities
          </h4>
          {selectedDaySchedules.length === 0 ? (
            <p className="py-6 text-xs text-slate-500 dark:text-slate-400">
              Nothing scheduled for this date.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-[#1B263B]">
              {selectedDaySchedules.map((item) => {
                const done = isScheduleCompletedOnDate(item, selectedDateISO);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleScheduleCompletion(item.id, selectedDateISO)}
                    className="flex items-start gap-3 w-full py-3 text-left group"
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-400 group-hover:text-[#D4AF37] shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          done
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                        {item.time} · {item.category}
                        {item.isDeadline ? ' · Deadline' : ''}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
