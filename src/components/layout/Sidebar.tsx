'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/meal-planner', emoji: '🍽️', label: 'Meal Planner',  comingSoon: false },
  { href: '/garden',       emoji: '🌱', label: 'Garden',         comingSoon: true  },
  { href: '/pantry',       emoji: '🥫', label: 'Pantry',         comingSoon: true  },
  { href: '/maintenance',  emoji: '🔧', label: 'Maintenance',    comingSoon: true  },
  { href: '/butcher',      emoji: '🥩', label: 'Butcher',        comingSoon: true  },
  { href: '/projects',     emoji: '📋', label: 'Projects',       comingSoon: true  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 z-40 flex flex-col bg-brown text-cream shadow-deep overflow-y-auto">
      {/* ── Logo / Brand ────────────────────────────────────── */}
      <div className="px-4 pt-6 pb-5 border-b border-cream/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-saddle flex items-center justify-center flex-shrink-0 shadow-warm">
            <span className="text-lg leading-none">🐍</span>
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold leading-tight text-cream truncate">
              Rattlesnake Ridge
            </p>
            <p className="text-xs text-gold/80 font-body truncate">Homestead Hub</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4">
        <p className="px-2 mb-2 text-[10px] uppercase tracking-widest text-gold/60 font-body font-medium">
          Modules
        </p>
        <ul className="space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname.startsWith(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    'sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body',
                    isActive
                      ? 'bg-saddle text-parchment shadow-warm'
                      : 'text-cream/80 hover:bg-cream/10 hover:text-cream',
                  ].join(' ')}
                >
                  <span className="text-base leading-none w-5 flex-shrink-0 text-center">
                    {item.emoji}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.comingSoon && (
                    <span className="text-[9px] uppercase tracking-wide text-gold/60 bg-cream/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      Soon
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-cream/10">
        <p className="text-[10px] text-gold/50 font-body text-center leading-relaxed">
          Sarah & Kyle<br />44 acres · West Texas
        </p>
      </div>
    </aside>
  )
}
