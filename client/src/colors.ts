export const MASTER_BG = '#100806';

export const SECTION_THEMES = {
  garden: {
    gradient: 'linear-gradient(165deg, #1a6b38, #124d28, #073018)',
    accent: '#4ade80',
    accentDim: 'rgba(74,222,128,0.15)',
    glass: 'rgba(7,48,24,0.35)',
  },
  kitchen: {
    gradient: 'linear-gradient(165deg, #c2541c, #9a3812, #78240a)',
    accent: '#FDB47A',
    accentDim: 'rgba(253,180,122,0.15)',
    glass: 'rgba(120,36,10,0.35)',
  },
  projects: {
    gradient: 'linear-gradient(165deg, #4DC0EE, #1A88D4, #1060B0)',
    accent: '#A8DEFF',
    accentDim: 'rgba(168,222,255,0.15)',
    glass: 'rgba(16,96,176,0.35)',
  },
  maintenance: {
    gradient: 'linear-gradient(165deg, #c8920a, #a07200, #785200)',
    accent: '#FFD93D',
    accentDim: 'rgba(255,217,61,0.15)',
    glass: 'rgba(120,82,0,0.35)',
  },
  shopping: {
    gradient: 'linear-gradient(165deg, #3d1040, #28082c, #16041a)',
    accent: '#e879f9',
    accentDim: 'rgba(232,121,249,0.15)',
    glass: 'rgba(22,4,26,0.35)',
  },
  ask: {
    gradient: 'linear-gradient(165deg, #1a1a2e, #16213e, #0f3460)',
    accent: '#93c5fd',
    accentDim: 'rgba(147,197,253,0.15)',
    glass: 'rgba(15,52,96,0.35)',
  },
} as const;

export type SectionKey = keyof typeof SECTION_THEMES;

export function glassCard(section: SectionKey): React.CSSProperties {
  const t = SECTION_THEMES[section];
  return {
    background: t.glass,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.17)',
    borderRadius: 12,
  };
}
