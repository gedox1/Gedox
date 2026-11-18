import React from 'react';
import { ArrowRight, CalendarClock, CheckCircle2, Circle, Clock, Target, Trophy } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import {
  calculateProductivityForDate,
  doesScheduleOccurOnDate,
  formatDaysRemainingLabel,
  formatReadableDate,
  getDaysRemaining,
  getLast7DaysProductivity,
  isScheduleCompletedOnDate,
} from '../utils/scheduleHelpers';
import { getTodayISO } from '../utils/storage';

export function DashboardView() {
  const {
    schedules,
    routines,
    targets,
    achievements,
    journal,
    toggleScheduleCompletion,
    toggleRoutineStep,
    setActiveSection,
  } = useVault();

  const todayISO = getTodayISO();
  const todayStats = calculateProductivityForDate(todayISO, schedules, routines);
  const weeklyTrend = getLast7DaysProductivity(schedules, routines);

  const todaySchedules = schedules
    .filter((s) => doesScheduleOccurOnDate(s, todayISO))
    .sort((a, b) => a.time.localeCompare(b.time));

  const upcomingDeadlines = schedules
    .filter((s) => s.isDeadline && s.date >= todayISO && !isScheduleCompletedOnDate(s, s.date))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5);

  const activeTargets = targets.filter((t) => t.progress < 100);
  const completedTargets = targets.filter((t) => t.progress >= 100);

  return (
    <div className="space-y-8">
      {/* KPI Summary Strip */}
      <section aria-label="Daily overview metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Daily Productivity</span>
            <Clock className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
              {todayStats.percent}%
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {todayStats.completed}/{todayStats.total} done
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 dark:bg-[#131C31] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#D4AF37] transition-all duration-300"
              style={{ width: `${todayStats.percent}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Today&apos;s Activities</span>
            <CalendarClock className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
              {todaySchedules.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              scheduled blocks
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {todaySchedules.filter((s) => isScheduleCompletedOnDate(s, todayISO)).length} completed today
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Active Targets</span>
            <Target className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
              {activeTargets.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              in progress
            </span>
          </div>
          <p className="mt-3 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            Avg completion:{' '}
            {activeTargets.length
              ? Math.round(activeTargets.reduce((sum, t) => sum + t.progress, 0) / activeTargets.length)
              : 0}
            %
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Completed Goals</span>
            <Trophy className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
              {completedTargets.length}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {achievements.length} achievements
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {journal.length} journal entries archived
          </p>
        </div>
      </section>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Today's Activities + 7-Day Productivity Chart */}
        <div className="xl:col-span-2 space-y-6">
          <section className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1B263B]">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  Today&apos;s Activities &amp; Routines
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Check off scheduled blocks and daily routine steps as you complete them.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('schedule')}
                className="flex items-center gap-1.5 text-xs font-medium text-[#B8860B] dark:text-[#D4AF37] hover:underline whitespace-nowrap shrink-0"
              >
                <span>Open Schedule</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {todaySchedules.length === 0 && routines.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No activities scheduled for today yet.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSection('schedule')}
                  className="mt-3 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#06080D]"
                >
                  Add Schedule Item
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#1B263B]">
                {todaySchedules.map((item) => {
                  const done = isScheduleCompletedOnDate(item, todayISO);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 py-3.5"
                    >
                      <button
                        type="button"
                        onClick={() => toggleScheduleCompletion(item.id, todayISO)}
                        className="flex items-start gap-3 text-left min-w-0 flex-1 group"
                      >
                        {done ? (
                          <CheckCircle2 className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-400 group-hover:text-[#D4AF37] shrink-0 mt-0.5 transition-colors" />
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
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-mono tabular-nums">{item.time}</span>
                            <span aria-hidden="true">·</span>
                            <span>{item.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">{item.recurrence}</span>
                            {item.isDeadline && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-amber-600 dark:text-amber-400 font-medium">
                                  Deadline
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}

                {routines.map((routine) => {
                  const doneIds = routine.completedStepIdsByDate[todayISO] || [];
                  return (
                    <div key={routine.id} className="py-4">
                      <div className="flex items-center justify-between text-xs mb-2.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {routine.name}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {routine.preferredTime} · {doneIds.length}/{routine.steps.length} steps
                        </span>
                      </div>
                      <div className="space-y-2 pl-1">
                        {routine.steps.map((step) => {
                          const checked = doneIds.includes(step.id);
                          return (
                            <button
                              key={step.id}
                              type="button"
                              onClick={() => toggleRoutineStep(routine.id, step.id, todayISO)}
                              className="flex items-center gap-2.5 text-left w-full group"
                            >
                              {checked ? (
                                <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-slate-400 group-hover:text-[#D4AF37] shrink-0" />
                              )}
                              <span
                                className={`text-xs ${
                                  checked
                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {step.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 7-Day Productivity Chart */}
          <section className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6">
            <div className="flex items-center justify-between pb-5">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  7-Day Productivity Trend
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Completion rate across scheduled tasks and daily routines
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-[#B8860B] dark:text-[#D4AF37]">
                Today: {todayStats.percent}%
              </span>
            </div>

            <div className="grid grid-cols-7 gap-3 items-end h-40 pt-4">
              {weeklyTrend.map((day) => {
                const isToday = day.dateISO === todayISO;
                const barHeight = Math.max(8, day.percent);
                return (
                  <div key={day.dateISO} className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {day.percent}%
                    </span>
                    <div className="w-full max-w-[36px] h-24 rounded-md bg-slate-100 dark:bg-[#131C31] flex items-end overflow-hidden">
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          isToday ? 'bg-[#D4AF37]' : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                        style={{ height: `${barHeight}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isToday
                          ? 'text-[#B8860B] dark:text-[#D4AF37]'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Upcoming Deadlines + Active Targets + Recent Achievements */}
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1B263B]">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Upcoming Deadlines
              </h2>
              <button
                type="button"
                onClick={() => setActiveSection('calendar')}
                className="text-xs font-medium text-[#B8860B] dark:text-[#D4AF37] hover:underline whitespace-nowrap"
              >
                Calendar
              </button>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <p className="py-6 text-xs text-slate-500 dark:text-slate-400">
                No pending deadlines scheduled.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#1B263B]">
                {upcomingDeadlines.map((dl) => {
                  const days = getDaysRemaining(dl.date, todayISO);
                  return (
                    <div key={dl.id} className="py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {dl.title}
                        </p>
                        <span
                          className={`text-xs font-mono tabular-nums whitespace-nowrap shrink-0 ${
                            days <= 1
                              ? 'text-amber-600 dark:text-amber-400 font-semibold'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {formatDaysRemainingLabel(days)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {formatReadableDate(dl.date)} · {dl.time} · {dl.category}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1B263B]">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Active Targets
              </h2>
              <button
                type="button"
                onClick={() => setActiveSection('targets')}
                className="text-xs font-medium text-[#B8860B] dark:text-[#D4AF37] hover:underline whitespace-nowrap"
              >
                Manage All
              </button>
            </div>

            {activeTargets.length === 0 ? (
              <p className="py-6 text-xs text-slate-500 dark:text-slate-400">
                All targets completed or none added yet.
              </p>
            ) : (
              <div className="space-y-4 pt-4">
                {activeTargets.slice(0, 4).map((tgt) => (
                  <div key={tgt.id}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {tgt.title}
                      </span>
                      <span className="font-mono text-xs font-semibold tabular-nums text-[#B8860B] dark:text-[#D4AF37] shrink-0">
                        {tgt.progress}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 dark:bg-[#131C31] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#D4AF37]"
                        style={{ width: `${tgt.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {tgt.category} · {tgt.horizon} · Target {formatReadableDate(tgt.targetDate)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
