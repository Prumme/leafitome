import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDate,
  getDay,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Day } from '@/shared/types/common.types'

const DAY_INDEX: Record<Day, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
}

const INDEX_TO_DAY: Record<number, Day> = {
  0: 'SUN',
  1: 'MON',
  2: 'TUE',
  3: 'WED',
  4: 'THU',
  5: 'FRI',
  6: 'SAT',
}

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function parseDateString(value: string): Date {
  // Accepte "YYYY-MM-DD" ou un ISO plus long ; ignore le reste.
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/)
  const normalized = match?.[1] ?? value.trim().slice(0, 10)
  return startOfDay(parseISO(normalized))
}

export function todayString(): string {
  return toDateString(new Date())
}

export function formatDisplayDate(date: Date | string): string {
  const value = typeof date === 'string' ? parseDateString(date) : date
  return format(value, 'EEEE d MMMM yyyy', { locale: fr })
}

export function formatShortDate(date: Date | string): string {
  const value = typeof date === 'string' ? parseDateString(date) : date
  return format(value, 'd MMM yyyy', { locale: fr })
}

export function getDayFromDate(date: Date): Day {
  return INDEX_TO_DAY[getDay(date)] ?? 'MON'
}

export function dayMatches(days: Day[] | undefined, date: Date): boolean {
  if (!days || days.length === 0) return false
  const current = getDayFromDate(date)
  return days.includes(current)
}

export function dayIndex(day: Day): number {
  return DAY_INDEX[day]
}

export function isPastDate(date: Date | string, reference = new Date()): boolean {
  const value = typeof date === 'string' ? parseDateString(date) : startOfDay(date)
  return isBefore(value, startOfDay(reference))
}

export function isFutureDate(date: Date | string, reference = new Date()): boolean {
  const value = typeof date === 'string' ? parseDateString(date) : startOfDay(date)
  return isAfter(value, startOfDay(reference))
}

export function isToday(date: Date | string, reference = new Date()): boolean {
  const value = typeof date === 'string' ? parseDateString(date) : date
  return isSameDay(value, reference)
}

export function getWeekRange(reference = new Date()): { start: Date; end: Date } {
  return {
    start: startOfWeek(reference, { weekStartsOn: 1 }),
    end: endOfWeek(reference, { weekStartsOn: 1 }),
  }
}

export function getMonthRange(reference = new Date()): { start: Date; end: Date } {
  return {
    start: startOfMonth(reference),
    end: endOfMonth(reference),
  }
}

export function getDatesInRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end })
}

export function getDayOfMonth(date: Date): number {
  return getDate(date)
}

export function addDaysTo(date: Date, amount: number): Date {
  return addDays(date, amount)
}

export const DAY_LABELS: Record<Day, string> = {
  MON: 'Lun',
  TUE: 'Mar',
  WED: 'Mer',
  THU: 'Jeu',
  FRI: 'Ven',
  SAT: 'Sam',
  SUN: 'Dim',
}

export const ALL_DAYS: Day[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
