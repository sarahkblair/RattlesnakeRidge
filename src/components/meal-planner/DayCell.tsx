'use client'

interface DayCellProps {
  recipe: { id: number; name: string; emoji: string } | null
  slot: 'main' | 'also'
  dayLabel: string
  onClick: () => void
  onRemove: () => void
}

export function DayCell({ recipe, slot, dayLabel, onClick, onRemove }: DayCellProps) {
  const isMain = slot === 'main'

  if (recipe) {
    return (
      <div
        className={[
          'planner-cell group relative flex flex-col justify-between',
          'bg-cream border border-gold/50 rounded-xl cursor-pointer select-none',
          isMain ? 'min-h-[90px] p-3' : 'min-h-[72px] p-2.5',
          'hover:border-saddle/60 hover:bg-gold/10',
        ].join(' ')}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick()}
        aria-label={`${dayLabel} ${isMain ? 'Main Meal' : 'Also Making'}: ${recipe.name}`}
      >
        {/* Remove button */}
        <button
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brown/0 hover:bg-brown/10 text-brown/40 hover:text-saddle flex items-center justify-center transition-all duration-150 opacity-0 group-hover:opacity-100 z-10"
          onClick={e => {
            e.stopPropagation()
            onRemove()
          }}
          aria-label={`Remove ${recipe.name}`}
          tabIndex={0}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="pr-4">
          <span className={isMain ? 'text-xl leading-none' : 'text-base leading-none'}>
            {recipe.emoji}
          </span>
          <p className={[
            'font-body text-brown leading-tight mt-1.5',
            isMain ? 'text-sm' : 'text-xs',
            'line-clamp-2',
          ].join(' ')}>
            {recipe.name}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={[
        'planner-cell flex items-center justify-center',
        'border-2 border-dashed border-gold/40 rounded-xl cursor-pointer select-none',
        'text-brown/30 hover:text-brown/50 hover:border-gold/70 hover:bg-cream/60',
        isMain ? 'min-h-[90px]' : 'min-h-[72px]',
        'transition-all duration-150',
      ].join(' ')}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      aria-label={`Add recipe to ${dayLabel} ${isMain ? 'Main Meal' : 'Also Making'}`}
    >
      <div className="flex flex-col items-center gap-1">
        <span className="text-lg">+</span>
        <span className="text-[10px] font-body uppercase tracking-wide">
          Add
        </span>
      </div>
    </div>
  )
}
