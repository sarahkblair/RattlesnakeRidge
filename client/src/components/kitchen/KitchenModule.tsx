import React, { useState } from 'react';
import { CompassTab } from './CompassTab';
import { VaultTab } from './VaultTab';
import { GroceryTab } from './GroceryTab';

interface Theme { gradient: string; accent: string; accentDim: string; glass: string }

export interface CompassState {
  query: string;
  filters: Record<string, string[]>;
  locked: string[];
  results: { groups: { type: string; items: { name: string; desc: string; fromVault: boolean }[] }[] } | null;
  screen: 'search' | 'results' | 'instructions';
  instructions: string;
}

interface Props {
  theme: Theme;
  compassState: CompassState;
  onCompassStateChange: (s: CompassState) => void;
}

type SubNav = 'compass' | 'vault' | 'grocery';

export function KitchenModule({ theme, compassState, onCompassStateChange }: Props) {
  const [sub, setSub] = useState<SubNav>('compass');

  const navStyle = (s: SubNav): React.CSSProperties => ({
    padding: '8px 18px', fontSize: 14, fontFamily: 'Lora, Georgia, serif',
    color: sub === s ? theme.accent : 'rgba(255,255,255,0.6)',
    background: sub === s ? theme.accentDim : 'transparent',
    border: 'none', borderBottom: sub === s ? `2px solid ${theme.accent}` : '2px solid transparent',
    cursor: 'pointer',
  });

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      {/* Left subnav */}
      <div style={{ width: 168, flexShrink: 0, background: 'rgba(0,0,0,0.2)', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', padding: '12px 0' }}>
        <button style={navStyle('compass')} onClick={() => setSub('compass')}>🧭 Compass</button>
        <button style={navStyle('vault')} onClick={() => setSub('vault')}>📖 Vault</button>
        <button style={navStyle('grocery')} onClick={() => setSub('grocery')}>🛒 Grocery</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {sub === 'compass' && <CompassTab theme={theme} state={compassState} onChange={onCompassStateChange} />}
        {sub === 'vault' && <VaultTab theme={theme} />}
        {sub === 'grocery' && <GroceryTab theme={theme} />}
      </div>
    </div>
  );
}
