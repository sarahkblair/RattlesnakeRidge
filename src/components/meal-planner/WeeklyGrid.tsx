'use client'

import { DayCell } from './DayCell'
import { DAY_LABELS, SLOTS } from '@/types'
import { getDayDate, formatDayHeader, parseWeekStart } from '@/lib/week-utils'
import type { WeekPlan } from '@/types'

interface WeeklyGridProps {
  weekStart: string
  weekPlan: WeekPlan
  onCellClick: (dayOfWeek: number, slot: 'main' | 'also') => void
  onCellRemove: (dayOfWeek: number, slot: 'main' | 'also') => void
}

export function WeeklyGrid({ weekStart, weekPlan, onCellClick, onCellRemove }: WeeklyGridProps) {
  const weekMonday = parseWeekStart(weekStart)

  const getEntry = (day: number, slot: 'main' | 'also') =>
    weekPlan.find(e => e.dayOfWeek === day && e.slot === slot) ?? null

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[700px]">

        {/* ── Column headers ──────────────────────────────── */}
        <div className="grid gap-1.5" style={{ gridTemplateColumns: '5.5rem repeat(7, 1fr)' }}>
          {/* Label column spacer */}
          <div />

          {/* Day headers */}
          {DAY_LABELS.map((label, i) => {
            const date = getDayDate(weekMonday, i)
            const header = formatDayHeader(date)
            const [dayAbbr, ...rest] = header.split(' ')
            const dateStr = rest.join(' ')

            return (
              <div
                key={label}
                className="bg-brown rounded-xl px-2 py-2.5 text-center shadow-warm"
              >
                <p className="font-display text-cream text-sm font-semibold leading-tight">
                  {dayAbbr}
                </p>
                <p className="font-body text-gold text-xs mt-0.5">
                  {dateStr}
                </p>
              </div>
            )
          })}
        </div>

        {/* ── Rows ────────────────────────────────────────── */}
        {SLOTS.map(slotDef => (
          <div
            key={slotDef.key}
            className="mt-1.5 grid gap-1.5"
            style={{ gridTemplateColumns: '5.5rem repeat(7, 1fr)' }}
          >
            {/* Row label */}
            <div className="flex items-center justify-center bg-saddle/20 border border-saddle/30 rounded-xl px-2 py-2">
              <p className="font-body text-saddle-dark text-xs font-semibold text-center leading-tight writing-mode-vertical">
                {slotDef.label}
              </p>
            </div>

            {/* Day cells */}
            {DAY_LABELS.map((label, dayIndex) => {
              const entry = getEntry(dayIndex, slotDef.key)
              return (
                <DayCell
                  key={`${dayIndex}-${slotDef.key}`}
                  recipe={entry?.recipe ? {
                    id: entry.recipe.id,
                    name: entry.recipe.name,
                    emoji: entry.recipe.emoji,
                  } : null}
                  slot={slotDef.key}
                  dayLabel={label}
                  onClick={() => onCellClick(dayIndex, slotDef.key)}
                  onRemove={() => onCellRemove(dayIndex, slotDef.key)}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
