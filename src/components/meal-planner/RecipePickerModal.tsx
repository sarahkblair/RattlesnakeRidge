'use client'

import { useState, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { DAY_NAMES, SLOTS } from '@/types'
import type { Recipe } from '@/types'

interface RecipePickerModalProps {
  open: boolean
  onClose: () => void
  dayOfWeek: number
  slot: 'main' | 'also'
  recipes: Recipe[]
  onSelect: (recipe: Recipe) => Promise<void>
}

export function RecipePickerModal({
  open,
  onClose,
  dayOfWeek,
  slot,
  recipes,
  onSelect,
}: RecipePickerModalProps) {
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('All')
  const [cuisine,  setCuisine]  = useState('All')
  const [selecting, setSelecting] = useState<number | null>(null)

  const categories = useMemo(() => {
    const cats = Array.from(new Set(recipes.map(r => r.category))).sort()
    return ['All', ...cats]
  }, [recipes])

  const cuisines = useMemo(() => {
    const cuiss = Array.from(new Set(recipes.map(r => r.cuisine))).sort()
    return ['All', ...cuiss]
  }, [recipes])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return recipes.filter(r => {
      if (category !== 'All' && r.category !== category) return false
      if (cuisine  !== 'All' && r.cuisine  !== cuisine)  return false
      if (q && !r.name.toLowerCase().includes(q) && !r.category.toLowerCase().includes(q)) return false
      return true
    })
  }, [recipes, search, category, cuisine])

  const slotLabel = SLOTS.find(s => s.key === slot)?.label ?? slot
  const title = `Pick a recipe — ${DAY_NAMES[dayOfWeek]} · ${slotLabel}`

  const handleSelect = async (recipe: Recipe) => {
    setSelecting(recipe.id)
    try {
      await onSelect(recipe)
      onClose()
    } finally {
      setSelecting(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-lg">
      <div className="space-y-4">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search recipes..."
          autoFocus
          className="w-full px-3 py-2.5 bg-cream border border-gold/50 rounded-lg text-sm text-brown font-body placeholder-brown/40 focus:outline-none focus:ring-2 focus:ring-saddle/40"
        />

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="flex-1 px-3 py-2 bg-cream border border-gold/50 rounded-lg text-sm text-brown font-body focus:outline-none focus:ring-2 focus:ring-saddle/40"
          >
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select
            value={cuisine}
            onChange={e => setCuisine(e.target.value)}
            className="flex-1 px-3 py-2 bg-cream border border-gold/50 rounded-lg text-sm text-brown font-body focus:outline-none focus:ring-2 focus:ring-saddle/40"
          >
            {cuisines.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Recipe list */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto -mr-2 pr-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-brown/50 font-body text-sm">
              {recipes.length === 0
                ? 'No recipes in the vault yet. Add some!'
                : 'No recipes match your search.'}
            </div>
          ) : (
            filtered.map(recipe => (
              <button
                key={recipe.id}
                onClick={() => handleSelect(recipe)}
                disabled={selecting === recipe.id}
                className="w-full flex items-center gap-3 p-3 bg-cream hover:bg-gold/20 border border-gold/40 hover:border-saddle/50 rounded-xl text-left transition-all duration-150 disabled:opacity-60"
              >
                <span className="text-xl flex-shrink-0">{recipe.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-brown font-medium truncate">{recipe.name}</p>
                  <div className="flex gap-1.5 mt-1">
                    <Badge label={recipe.category} variant="category" />
                    <Badge label={recipe.cuisine}  variant="cuisine"  />
                  </div>
                </div>
                {selecting === recipe.id ? (
                  <Spinner size="sm" className="text-saddle flex-shrink-0" />
                ) : (
                  <svg className="w-4 h-4 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>

        <p className="text-xs text-brown/40 font-body text-center">
          {filtered.length} of {recipes.length} recipes shown
        </p>
      </div>
    </Modal>
  )
}
