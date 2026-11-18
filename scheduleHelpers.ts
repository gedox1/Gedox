import { Routine, ScheduleItem } from '../types/vault';
import { addDaysISO, getTodayISO } from './storage';

export function doesScheduleOccurOnDate(item: ScheduleItem, targetDateISO: string): boolean {
  if (item.date === targetDateISO) return true;
  if (targetDateISO < item.date) return false;

  if (item.recurrence === 'daily') return true;

  if (item.recurrence === 'weekly') {
    const [sy, sm, sd] = item.date.split('-').map(Number);
    const [ty, tm, td] = targetDateISO.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const target = new Date(ty, tm - 1, td);
    return start.getDay() === target.getDay();
  }

  if (item.recurrence === 'monthly') {
    const startDay = Number(item.date.split('-')[2]);
    const targetDay = Number(targetDateISO.split('-')[2]);
    return startDay === targetDay;
  }

  return false;
}

export function isScheduleCompletedOnDate(item: ScheduleItem, dateISO: string): boolean {
  return item.completedDates.includes(dateISO);
}

export function doesRoutineOccurOnDate(routine: Routine, dateISO: string): boolean {
  if (routine.cadence === 'daily') return true;
  // weekly routines default to appearing every day or matching created day; treat weekly as active on Mondays & Sundays or created weekday
  const createdDay = new Date(routine.createdAt).getDay();
  const [y, m, d] = dateISO.split('-').map(Number);
  const targetDay = new Date(y, m - 1, d).getDay();
  return createdDay === targetDay;
}

export function getDaysRemaining(targetDateISO: string, fromDateISO = getTodayISO()): number {
  const [fy, fm, fd] = fromDateISO.split('-').map(Number);
  const [ty, tm, td] = targetDateISO.split('-').map(Number);
  const from = new Date(fy, fm - 1, fd).getTime();
  const to = new Date(ty, tm - 1, td).getTime();
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

export function formatDaysRemainingLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `${days}d left`;
}

export function formatReadableDate(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function calculateProductivityForDate(
  dateISO: string,
  schedules: ScheduleItem[],
  routines: Routine[]
): { completed: number; total: number; percent: number } {
  const daySchedules = schedules.filter((s) => doesScheduleOccurOnDate(s, dateISO));
  const completedSchedules = daySchedules.filter((s) => isScheduleCompletedOnDate(s, dateISO)).length;

  let routineTotal = 0;
  let routineCompleted = 0;
  for (const r of routines) {
    if (r.cadence === 'daily' || doesRoutineOccurOnDate(r, dateISO)) {
      routineTotal += r.steps.length;
      const doneIds = r.completedStepIdsByDate[dateISO] || [];
      routineCompleted += r.steps.filter((st) => doneIds.includes(st.id)).length;
    }
  }

  const total = daySchedules.length + routineTotal;
  const completed = completedSchedules + routineCompleted;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

export function getLast7DaysProductivity(
  schedules: ScheduleItem[],
  routines: Routine[]
): Array<{ dateISO: string; label: string; percent: number; completed: number; total: number }> {
  const today = getTodayISO();
  const days: Array<{ dateISO: string; label: string; percent: number; completed: number; total: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const dateISO = addDaysISO(today, -i);
    const [y, m, d] = dateISO.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const label = dt.toLocaleDateString('en-US', { weekday: 'short' });
    const stats = calculateProductivityForDate(dateISO, schedules, routines);
    days.push({ dateISO, label, ...stats });
  }
  return days;
}
