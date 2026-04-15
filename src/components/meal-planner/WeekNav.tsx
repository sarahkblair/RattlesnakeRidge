'use client'

import { Button } from '@/components/ui/Button'
import { formatWeekRange, parseWeekStart } from '@/lib/week-utils'

interface WeekNavProps {
  weekStart: string          // "YYYY-MM-DD"
  onPrev: () => void
  onNext: () => void
  onClear: () => void
  clearing?: boolean
}

export function WeekNav({ weekStart, onPrev, onNext, onClear, clearing }: WeekNavProps) {
  const weekMonday = parseWeekStart(weekStart)
  const range = formatWeekRange(weekMonday)

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Prev / range / Next */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          className="w-8 h-8 rounded-lg border border-gold/50 bg-cream hover:bg-gold/20 flex items-center justify-center text-brown transition-colors duration-150"
          aria-label="Previous week"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center min-w-[180px]">
          <p className="font-display text-base text-brown">{range}</p>
        </div>

        <button
          onClick={onNext}
          className="w-8 h-8 rounded-lg border border-gold/50 bg-cream hover:bg-gold/20 flex items-center justify-center text-brown transition-colors duration-150"
          aria-label="Next week"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Clear week */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        loading={clearing}
        className="text-brown/60 hover:text-red-700 hover:border-red-300"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Clear Week
      </Button>
    </div>
  )
}
