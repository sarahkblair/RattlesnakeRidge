'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DaySlotPicker } from './DaySlotPicker'
import { RecipeViewModal } from './RecipeViewModal'
import type { Recipe } from '@/types'

interface RecipeCardProps {
  recipe: Recipe
  onAddToWeek: (dayOfWeek: number, slot: 'main' | 'also') => Promise<void>
}

export function RecipeCard({ recipe, onAddToWeek }: RecipeCardProps) {
  const [pickerOpen,  setPickerOpen]  = useState(false)
  const [viewOpen,    setViewOpen]    = useState(false)
  const [adding,      setAdding]      = useState(false)

  const handleConfirm = async (day: number, slot: 'main' | 'also') => {
    setAdding(true)
    try {
      await onAddToWeek(day, slot)
      setPickerOpen(false)
    } finally {
      setAdding(false)
    }
  }

  return (
    <>
      <div className="bg-cream border border-gold/40 rounded-xl shadow-warm p-4 hover:shadow-card transition-shadow duration-200">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl leading-none flex-shrink-0">{recipe.emoji}</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base text-brown leading-tight mb-1.5 truncate" title={recipe.name}>
              {recipe.name}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              <Badge label={recipe.category} variant="category" />
              <Badge label={recipe.cuisine}  variant="cuisine"  />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-gold/20">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewOpen(true)}
            className="flex-1"
          >
            View
          </Button>
          <Button
            size="sm"
            variant={pickerOpen ? 'secondary' : 'primary'}
            onClick={() => setPickerOpen(v => !v)}
            className="flex-1"
          >
            {pickerOpen ? 'Close ↑' : '+ Add to Week'}
          </Button>
        </div>

        {/* Inline day/slot picker */}
        {pickerOpen && (
          <DaySlotPicker
            onConfirm={handleConfirm}
            onCancel={() => setPickerOpen(false)}
            loading={adding}
          />
        )}
      </div>

      {/* Full recipe view modal */}
      <RecipeViewModal
        recipe={viewOpen ? recipe : null}
        onClose={() => setViewOpen(false)}
      />
    </>
  )
}
