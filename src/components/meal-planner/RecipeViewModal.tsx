'use client'

import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import type { Recipe } from '@/types'

interface RecipeViewModalProps {
  recipe: Recipe | null
  onClose: () => void
}

export function RecipeViewModal({ recipe, onClose }: RecipeViewModalProps) {
  if (!recipe) return null

  return (
    <Modal open={!!recipe} onClose={onClose} title={`${recipe.emoji} ${recipe.name}`}>
      <div className="space-y-6">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <Badge label={recipe.category} variant="category" />
          <Badge label={recipe.cuisine}  variant="cuisine"  />
          <Badge label={recipe.source === 'google' ? '📄 Synced' : '✍️ Manual'} variant="source" />
        </div>

        {/* Divider */}
        <div className="ornament-divider text-gold/60 text-[10px]">Ingredients</div>

        {/* Ingredients */}
        {recipe.ingredients.length > 0 ? (
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-3 font-body text-sm text-brown">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-saddle flex-shrink-0" />
                {ing}
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body text-sm text-brown/50 italic">No ingredients listed.</p>
        )}

        {/* Divider */}
        <div className="ornament-divider text-gold/60 text-[10px]">Method</div>

        {/* Steps */}
        {recipe.steps.length > 0 ? (
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-4 font-body text-sm text-brown">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-saddle/20 border border-saddle/30 flex items-center justify-center text-xs font-semibold text-saddle">
                  {i + 1}
                </span>
                <p className="leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="font-body text-sm text-brown/50 italic">No steps listed.</p>
        )}
      </div>
    </Modal>
  )
}
