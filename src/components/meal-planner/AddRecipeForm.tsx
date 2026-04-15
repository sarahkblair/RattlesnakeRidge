'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import type { CreateRecipeBody } from '@/types'

interface AddRecipeFormProps {
  onSave: (data: CreateRecipeBody) => Promise<void>
}

export function AddRecipeForm({ onSave }: AddRecipeFormProps) {
  const [name,        setName]        = useState('')
  const [category,    setCategory]    = useState('')
  const [cuisine,     setCuisine]     = useState('')
  const [emoji,       setEmoji]       = useState('🍽️')
  const [ingredients, setIngredients] = useState('')
  const [steps,       setSteps]       = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !category.trim() || !cuisine.trim()) {
      setError('Name, category, and cuisine are required.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave({
        name: name.trim(),
        category: category.trim(),
        cuisine: cuisine.trim(),
        emoji: emoji.trim() || '🍽️',
        ingredients: ingredients.split('\n').map(s => s.trim()).filter(Boolean),
        steps: steps.split('\n').map(s => s.trim()).filter(Boolean),
      })

      // Reset form on success
      setName('')
      setCategory('')
      setCuisine('')
      setEmoji('🍽️')
      setIngredients('')
      setSteps('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-1">
      <div className="ornament-divider text-gold/60 text-[10px]">New Recipe</div>

      {/* Name + Emoji */}
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-20">
          <label className="block text-xs font-body font-semibold text-brown/70 uppercase tracking-wide mb-1">
            Emoji
          </label>
          <input
            type="text"
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            maxLength={4}
            className="w-full px-3 py-2.5 bg-cream border border-gold/50 rounded-lg text-center text-lg focus:outline-none focus:ring-2 focus:ring-saddle/40"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-body font-semibold text-brown/70 uppercase tracking-wide mb-1">
            Recipe Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Sourdough Boule"
            className="w-full px-3 py-2.5 bg-cream border border-gold/50 rounded-lg text-sm text-brown font-body placeholder-brown/40 focus:outline-none focus:ring-2 focus:ring-saddle/40"
          />
        </div>
      </div>

      {/* Category + Cuisine */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-body font-semibold text-brown/70 uppercase tracking-wide mb-1">
            Category <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="e.g. Bread"
            className="w-full px-3 py-2.5 bg-cream border border-gold/50 rounded-lg text-sm text-brown font-body placeholder-brown/40 focus:outline-none focus:ring-2 focus:ring-saddle/40"
          />
        </div>
        <div>
          <label className="block text-xs font-body font-semibold text-brown/70 uppercase tracking-wide mb-1">
            Cuisine <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={cuisine}
            onChange={e => setCuisine(e.target.value)}
            placeholder="e.g. American"
            className="w-full px-3 py-2.5 bg-cream border border-gold/50 rounded-lg text-sm text-brown font-body placeholder-brown/40 focus:outline-none focus:ring-2 focus:ring-saddle/40"
          />
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-xs font-body font-semibold text-brown/70 uppercase tracking-wide mb-1">
          Ingredients <span className="text-brown/40">(one per line)</span>
        </label>
        <textarea
          value={ingredients}
          onChange={e => setIngredients(e.target.value)}
          rows={5}
          placeholder={"500g bread flour\n350ml warm water\n10g salt\n5g active dry yeast"}
          className="w-full px-3 py-2.5 bg-cream border border-gold/50 rounded-lg text-sm text-brown font-body placeholder-brown/30 focus:outline-none focus:ring-2 focus:ring-saddle/40 resize-none"
        />
      </div>

      {/* Steps */}
      <div>
        <label className="block text-xs font-body font-semibold text-brown/70 uppercase tracking-wide mb-1">
          Steps <span className="text-brown/40">(one per line)</span>
        </label>
        <textarea
          value={steps}
          onChange={e => setSteps(e.target.value)}
          rows={5}
          placeholder={"Combine flour, water, and yeast in a large bowl\nKnead for 10 minutes until smooth\nLet rise for 1 hour in a warm spot"}
          className="w-full px-3 py-2.5 bg-cream border border-gold/50 rounded-lg text-sm text-brown font-body placeholder-brown/30 focus:outline-none focus:ring-2 focus:ring-saddle/40 resize-none"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-700 font-body bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={saving}
        className="w-full"
      >
        Save Recipe
      </Button>

      <p className="text-xs text-brown/50 font-body text-center">
        Saved to your vault and written back to the Google Doc.
      </p>
    </form>
  )
}
