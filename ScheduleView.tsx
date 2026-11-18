import React, { useState } from 'react';
import { Bell, CheckCircle2, Circle, Plus, Repeat, Trash2, X } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { RecurrenceType, ScheduleItem } from '../types/vault';
import {
  doesScheduleOccurOnDate,
  formatReadableDate,
  isScheduleCompletedOnDate,
} from '../utils/scheduleHelpers';
import { getTodayISO } from '../utils/storage';

type ScheduleTab = 'all' | 'daily' | 'weekly' | 'monthly' | 'routines';

export function ScheduleView() {
  const {
    schedules,
    routines,
    addSchedule,
    deleteSchedule,
    toggleScheduleCompletion,
    addRoutine,
    deleteRoutine,
    toggleRoutineStep,
  } = useVault();

  const todayISO = getTodayISO();
  const [activeTab, setActiveTab] = useState<ScheduleTab>('all');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [reminderNotice, setReminderNotice] = useState<string | null>(null);

  // Schedule form state
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(todayISO);
  const [time, setTime] = useState('09:00');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('once');
  const [category, setCategory] = useState<ScheduleItem['category']>('Personal');
  const [isDeadline, setIsDeadline] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(15);

  // Routine form state
  const [routineName, setRoutineName] = useState('');
  const [routineCadence, setRoutineCadence] = useState<'daily' | 'weekly'>('daily');
  const [routineTime, setRoutineTime] = useState('07:00');
  const [routineStepsText, setRoutineStepsText] = useState('');

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addSchedule({
      title: title.trim(),
      notes: notes.trim(),
      date,
      time,
      recurrence,
      isDeadline,
      reminderMinutes,
      category,
    });

    if (reminderMinutes !== null && 'Notification' in window && Notification.permission === 'default') {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setReminderNotice('Browser reminders enabled for upcoming deadlines.');
        }
      } catch {
        // Ignore notification permission errors in restricted contexts
      }
    }

    setTitle('');
    setNotes('');
    setDate(todayISO);
    setTime('09:00');
    setRecurrence('once');
    setIsDeadline(false);
    setReminderMinutes(15);
    setShowScheduleForm(false);
  };

  const handleCreateRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = routineStepsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (!routineName.trim() || lines.length === 0) return;

    addRoutine({
      name: routineName.trim(),
      cadence: routineCadence,
      preferredTime: routineTime,
      steps: lines.map((label, idx) => ({
        id: `step-${Date.now()}-${idx}`,
        label,
      })),
    });

    setRoutineName('');
    setRoutineStepsText('');
    setShowRoutineForm(false);
  };

  const filteredSchedules = schedules
    .filter((item) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'daily') return item.recurrence === 'daily' || doesScheduleOccurOnDate(item, todayISO);
      if (activeTab === 'weekly') return item.recurrence === 'weekly';
      if (activeTab === 'monthly') return item.recurrence === 'monthly';
      return false;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Schedule filters"
          className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-1"
        >
          {(
            [
              { id: 'all', label: 'All Schedules' },
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'routines', label: 'Personal Routines' },
            ] as Array<{ id: ScheduleTab; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-[#E5C158] dark:bg-[#131C31] dark:text-[#E5C158]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setShowRoutineForm(true);
              setShowScheduleForm(false);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#D4AF37]/60 whitespace-nowrap"
          >
            <Repeat className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>New Routine</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowScheduleForm(true);
              setShowRoutineForm(false);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-[#0F172A] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#06080D] hover:bg-slate-800 dark:hover:bg-[#E5C158] whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Schedule</span>
          </button>
        </div>
      </div>

      {reminderNotice && (
        <div className="flex items-center justify-between rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2.5 text-xs text-slate-800 dark:text-[#F8E7A2]">
          <span>{reminderNotice}</span>
          <button type="button" onClick={() => setReminderNotice(null)} aria-label="Dismiss notice">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Add Schedule Form */}
      {showScheduleForm && (
        <form
          onSubmit={handleCreateSchedule}
          className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1B263B]">
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Create Schedule or Deadline
            </h2>
            <button
              type="button"
              onClick={() => setShowScheduleForm(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Activity Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Architecture Review or Morning Study Block"
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Recurrence
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="once">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ScheduleItem['category'])}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="Work">Work</option>
                <option value="Study">Study</option>
                <option value="Health">Health</option>
                <option value="Finance">Finance</option>
                <option value="Personal">Personal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Reminder Lead Time
              </label>
              <select
                value={reminderMinutes === null ? '' : String(reminderMinutes)}
                onChange={(e) => setReminderMinutes(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="">No reminder</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="1440">1 day before</option>
              </select>
            </div>

            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isDeadline}
                  onChange={(e) => setIsDeadline(e.target.checked)}
                  className="h-4 w-4 accent-[#D4AF37] rounded"
                />
                <span>Mark as strict deadline</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional preparation details..."
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowScheduleForm(false)}
              className="rounded-lg border border-slate-200 dark:border-[#1B263B] px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#06080D] hover:bg-[#E5C158]"
            >
              Save Schedule
            </button>
          </div>
        </form>
      )}

      {/* Add Routine Form */}
      {showRoutineForm && (
        <form
          onSubmit={handleCreateRoutine}
          className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1B263B]">
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Create Personal Routine
            </h2>
            <button
              type="button"
              onClick={() => setShowRoutineForm(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Routine Name
              </label>
              <input
                type="text"
                required
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="e.g., Nightly Reset"
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Cadence
              </label>
              <select
                value={routineCadence}
                onChange={(e) => setRoutineCadence(e.target.value as 'daily' | 'weekly')}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Preferred Time
              </label>
              <input
                type="time"
                value={routineTime}
                onChange={(e) => setRoutineTime(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Routine Steps (one step per line)
              </label>
              <textarea
                rows={4}
                required
                value={routineStepsText}
                onChange={(e) => setRoutineStepsText(e.target.value)}
                placeholder={'Clear desk and close open tabs\nReview tomorrow top 3 tasks\n15 minutes reading'}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowRoutineForm(false)}
              className="rounded-lg border border-slate-200 dark:border-[#1B263B] px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#06080D] hover:bg-[#E5C158]"
            >
              Save Routine
            </button>
          </div>
        </form>
      )}

      {/* Content View */}
      {activeTab === 'routines' ? (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {routines.length === 0 ? (
            <div className="md:col-span-2 rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">No personal routines created yet.</p>
              <button
                type="button"
                onClick={() => setShowRoutineForm(true)}
                className="mt-3 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#06080D]"
              >
                Create First Routine
              </button>
            </div>
          ) : (
            routines.map((routine) => {
              const doneIds = routine.completedStepIdsByDate[todayISO] || [];
              const pct = routine.steps.length
                ? Math.round((doneIds.length / routine.steps.length) * 100)
                : 0;
              return (
                <div
                  key={routine.id}
                  className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6"
                >
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1B263B]">
                    <div>
                      <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                        {routine.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {routine.cadence} · <span className="font-mono">{routine.preferredTime}</span> ·{' '}
                        <span className="font-mono tabular-nums text-[#B8860B] dark:text-[#D4AF37]">
                          {pct}% today
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteRoutine(routine.id)}
                      aria-label={`Delete ${routine.name}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {routine.steps.map((step) => {
                      const done = doneIds.includes(step.id);
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => toggleRoutineStep(routine.id, step.id, todayISO)}
                          className="flex items-center gap-3 w-full text-left py-1 group"
                        >
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-400 group-hover:text-[#D4AF37] shrink-0" />
                          )}
                          <span
                            className={`text-sm ${
                              done
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-700 dark:text-slate-200'
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
            })
          )}
        </section>
      ) : (
        <section className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B]">
          {filteredSchedules.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No schedules match this view.
              </p>
              <button
                type="button"
                onClick={() => setShowScheduleForm(true)}
                className="mt-3 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#06080D]"
              >
                Add Schedule Item
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-[#1B263B]">
              {filteredSchedules.map((item) => {
                const checkDate = item.recurrence === 'once' ? item.date : todayISO;
                const completed = isScheduleCompletedOnDate(item, checkDate);
                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-slate-50/70 dark:hover:bg-[#101727]/60 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => toggleScheduleCompletion(item.id, checkDate)}
                      className="flex items-start gap-3.5 text-left flex-1 min-w-0 group"
                    >
                      {completed ? (
                        <CheckCircle2 className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-400 group-hover:text-[#D4AF37] shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              completed
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {item.title}
                          </span>
                          {item.isDeadline && (
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                              Deadline
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {item.notes}
                          </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-mono tabular-nums">
                            {formatReadableDate(item.date)} at {item.time}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{item.recurrence}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.category}</span>
                          {item.reminderMinutes !== null && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1">
                                <Bell className="h-3 w-3 text-[#D4AF37]" />
                                {item.reminderMinutes >= 1440
                                  ? '1 day prior'
                                  : `${item.reminderMinutes}m prior`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteSchedule(item.id)}
                      aria-label={`Delete ${item.title}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
