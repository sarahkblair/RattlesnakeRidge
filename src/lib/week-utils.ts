import {
  startOfWeek,
  addWeeks,
  subWeeks,
  format,
  parse,
  addDays,
} from 'date-fns'

/**
 * Return the Monday of the week containing `date`.
 */
export function getMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}

/**
 * Format a Date as "YYYY-MM-DD" for use as a weekStart key.
 */
export function formatWeekStart(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Parse a "YYYY-MM-DD" weekStart string back to a Date.
 */
export function parseWeekStart(s: string): Date {
  return parse(s, 'yyyy-MM-dd', new Date())
}

/**
 * Move the week forward by n weeks.
 */
export function nextWeek(date: Date, n = 1): Date {
  return addWeeks(date, n)
}

/**
 * Move the week backward by n weeks.
 */
export function prevWeek(date: Date, n = 1): Date {
  return subWeeks(date, n)
}

/**
 * Get the Date for a specific day index (0=Mon … 6=Sun) within a week
 * identified by its Monday start date.
 */
export function getDayDate(weekMonday: Date, dayIndex: number): Date {
  return addDays(weekMonday, dayIndex)
}

/**
 * Format a day's date as "Mon Apr 14".
 */
export function formatDayHeader(date: Date): string {
  return format(date, 'EEE MMM d')
}

/**
 * Format a week range like "Apr 14 – Apr 20, 2026".
 */
export function formatWeekRange(weekMonday: Date): string {
  const sunday = addDays(weekMonday, 6)
  const startStr = format(weekMonday, 'MMM d')
  const endStr = format(sunday, 'MMM d, yyyy')
  return `${startStr} – ${endStr}`
}
