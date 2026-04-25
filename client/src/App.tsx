import React, { useState, useEffect } from 'react';
import { SWRConfig } from 'swr';
import { apiFetch } from './api';
import { AuthGate } from './components/shared/AuthGate';
import { ToastProvider } from './components/shared/Toast';
import { VaultDrawer } from './components/shared/VaultDrawer';
import { GardenModule } from './components/garden/GardenModule';
import { KitchenModule } from './components/kitchen/KitchenModule';
import { ProjectsModule } from './components/projects/ProjectsModule';
import { MaintenanceModule } from './components/maintenance/MaintenanceModule';
import { ShoppingModule } from './components/shopping/ShoppingModule';
import { AskModule } from './components/ask/AskModule';
import { MASTER_BG, SECTION_THEMES, SectionKey } from './colors';
import type { CompassState } from './components/kitchen/KitchenModule';

const TABS: { key: SectionKey; label: string; emoji: string }[] = [
  { key: 'garden', label: 'Garden', emoji: '🌿' },
  { key: 'kitchen', label: 'Kitchen', emoji: '🍽️' },
  { key: 'projects', label: 'Projects', emoji: '🪵' },
  { key: 'maintenance', label: 'Maintenance', emoji: '🔧' },
  { key: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { key: 'ask', label: 'Ask', emoji: '💬' },
];

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [section, setSection] = useState<SectionKey>('garden');
  const [vaultOpen, setVaultOpen] = useState(false);
  const [compassState, setCompassState] = useState<CompassState>({
    query: '', filters: {}, locked: [], results: null, screen: 'search', instructions: '',
  });

  useEffect(() => {
    apiFetch<{ authenticated: boolean }>('/auth/check')
      .then(d => setAuthed(d.authenticated))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <div style={{ minHeight: '100vh', background: MASTER_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (!authed) {
    return <AuthGate onAuthenticated={() => setAuthed(true)} />;
  }

  const theme = SECTION_THEMES[section];

  return (
    <SWRConfig value={{ fetcher: apiFetch, revalidateOnFocus: false }}>
      <ToastProvider>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
          select option { background: #1a100a; color: #f0ead6; }
        `}</style>

        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: MASTER_BG }}>
          {/* Master bar */}
          <div style={{
            background: MASTER_BG,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            height: 48,
            flexShrink: 0,
            gap: 4,
          }}>
            <span style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: 14,
              fontWeight: 700,
              color: '#f0ead6',
              marginRight: 12,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              🌿 RR
            </span>

            {TABS.map(tab => {
              const active = section === tab.key;
              const tabTheme = SECTION_THEMES[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={() => setSection(tab.key)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: 'Lora, Georgia, serif',
                    color: active ? tabTheme.accent : 'rgba(255,255,255,0.55)',
                    background: active ? tabTheme.accentDim : 'transparent',
                    border: 'none',
                    borderBottom: active ? `2px solid ${tabTheme.accent}` : '2px solid transparent',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.emoji} {tab.label}
                </button>
              );
            })}

            <div style={{ flex: 1 }} />

            <button
              onClick={() => setVaultOpen(v => !v)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontFamily: 'Lora, Georgia, serif',
                color: '#FDB47A',
                background: 'rgba(253,180,122,0.12)',
                border: '1px solid rgba(253,180,122,0.3)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              📖 Vault
            </button>
          </div>

          {/* Section content */}
          <div style={{ flex: 1, overflow: 'hidden', background: theme.gradient }}>
            {section === 'garden' && <GardenModule theme={SECTION_THEMES.garden} />}
            {section === 'kitchen' && (
              <KitchenModule
                theme={SECTION_THEMES.kitchen}
                compassState={compassState}
                onCompassStateChange={setCompassState}
              />
            )}
            {section === 'projects' && <ProjectsModule theme={SECTION_THEMES.projects} />}
            {section === 'maintenance' && <MaintenanceModule theme={SECTION_THEMES.maintenance} />}
            {section === 'shopping' && <ShoppingModule theme={SECTION_THEMES.shopping} />}
            {section === 'ask' && <AskModule theme={SECTION_THEMES.ask} />}
          </div>
        </div>

        <VaultDrawer open={vaultOpen} onClose={() => setVaultOpen(false)} />
      </ToastProvider>
    </SWRConfig>
  );
}
