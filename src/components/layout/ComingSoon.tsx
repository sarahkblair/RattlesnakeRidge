interface ComingSoonProps {
  emoji: string
  title: string
  description: string
}

export function ComingSoon({ emoji, title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      {/* Ornamental ring */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full border-2 border-dashed border-gold/50 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-cream border border-gold/30 shadow-warm flex items-center justify-center">
            <span className="text-4xl">{emoji}</span>
          </div>
        </div>
      </div>

      {/* Text */}
      <h1 className="font-display text-3xl text-brown mb-3">{title}</h1>
      <p className="font-body text-brown/70 text-base max-w-sm leading-relaxed mb-6">
        {description}
      </p>

      {/* Ornamental divider */}
      <div className="ornament-divider w-48 text-gold/60 text-[10px]">
        Coming Soon
      </div>

      {/* Decorative text */}
      <p className="mt-8 font-body text-sm text-brown/40 italic">
        "The land will provide when the time is right."
      </p>
    </div>
  )
}
