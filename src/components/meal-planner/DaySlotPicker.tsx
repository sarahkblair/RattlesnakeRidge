'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { DAY_NAMES, SLOTS } from '@/types'

interface DaySlotPickerProps {
  onConfirm: (dayOfWeek: number, slot: 'main' | 'also') => void
  onCancel: () => void
  loading?: boolean
}

export function DaySlotPicker({ onConfirm, onCancel, loading }: DaySlotPickerProps) {
  const [day, setDay]   = useState<number>(0)
  const [slot, setSlot] = useState<'main' | 'also'>('main')

  return (
    <div className="mt-3 p-4 bg-parchment border border-gold/40 rounded-xl shadow-warm space-y-4">
      {/* Day selector */}
      <div>
        <label className="block text-xs font-body font-semibold text-brown/70 uppercase tracking-wide mb-1.5">
          Day
        </label>
        <select
          value={day}
          onChange={e => setDay(parseInt(e.target.value))}
          className="w-full px-3 py-2 bg-cream border border-gold/50 rounded-lg text-sm text-brown font-body focus:outline-none focus:ring-2 focus:ring-saddle/40"
        >
          {DAY_NAMES.map((name, i) => (
            <option key={name} value={i}>{name}</option>
          ))}
        </select>
      </div>

      {/* Slot selector */}
      <div>
        <label className="block text-xs font-body font-semibold text-brown/70 uppercase tracking-wide mb-1.5">
          Slot
        </label>
        <div className="flex gap-2">
          {SLOTS.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSlot(s.key)}
              className={[
                'flex-1 py-2 px-3 rounded-lg text-sm font-body border transition-all duration-150',
                slot === s.key
                  ? 'bg-saddle text-parchment border-saddle-dark shadow-warm'
                  : 'bg-cream text-brown border-gold/50 hover:bg-gold/20',
              ].join(' ')}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant="primary"
          loading={loading}
          onClick={() => onConfirm(day, slot)}
          className="flex-1"
        >
          Add to Plan
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
