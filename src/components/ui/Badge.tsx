interface BadgeProps {
  label: string
  variant?: 'category' | 'cuisine' | 'source'
  className?: string
}

const variantClasses = {
  category: 'bg-gold/25 text-brown border border-gold/40',
  cuisine:  'bg-saddle/15 text-saddle-dark border border-saddle/30',
  source:   'bg-brown/10 text-brown/70 border border-brown/20',
}

export function Badge({ label, variant = 'category', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-block px-2 py-0.5 rounded-full text-xs font-body font-medium
        ${variantClasses[variant]} ${className}
      `}
    >
      {label}
    </span>
  )
}
