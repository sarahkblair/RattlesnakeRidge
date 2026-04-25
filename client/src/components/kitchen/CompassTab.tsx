import React, { useState } from 'react';
import { CompassState } from './KitchenModule';
import { apiPost, streamSSE } from '../../api';
import { Btn, Input, Spinner } from '../shared/FormFields';

interface Theme { accent: string; accentDim: string; glass: string }

interface Props {
  theme: Theme;
  state: CompassState;
  onChange: (s: CompassState) => void;
}

const CUISINES = ['Mexican', 'Persian', 'Italian', 'Asian', 'Mediterranean', 'Middle Eastern', 'Moroccan', 'Levantine', 'Indonesian', 'French', 'American', 'Cajun', 'Indian', 'Greek'];
const PROTEINS = ['Beef', 'Chicken', 'Pork', 'Venison', 'Fish', 'Shrimp', 'Lamb', 'Vegetarian', 'Eggs'];
const METHODS = ['Braised', 'Grilled', 'Roasted', 'Pan-seared', 'Slow-cooked', 'Fried', 'Raw/Salad', 'Baked', 'Smoked'];
const COMPONENTS = ['Main dish', 'Side dish', 'Dessert', 'Appetizer', 'Cocktail', 'Bread', 'Baking', 'Sauce', 'Jam/jelly/chutney', 'Compound butter', 'Spice blend/rub', 'Pickle', 'Broth/stock', 'Dip/spread', 'Salad dressing', 'Condiment'];
const TIMES = ['Under 30 min', '30–60 min', '1–2 hours', 'All day'];
const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter', 'Year-round'];
const VIBES = ['Weeknight easy', 'Weekend project', 'Impressive/entertaining', 'Comfort food', 'Light and fresh', 'Hearty and warming'];

const FILTER_GROUPS = [
  { key: 'cuisine', label: 'Cuisine', options: CUISINES },
  { key: 'protein', label: 'Protein', options: PROTEINS },
  { key: 'method', label: 'Cooking Method', options: METHODS },
  { key: 'components', label: 'Components', options: COMPONENTS },
  { key: 'time', label: 'Time', options: TIMES },
  { key: 'season', label: 'Season', options: SEASONS },
  { key: 'vibe', label: 'Vibe', options: VIBES },
];

function PulsingDots() {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#FDB47A', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
}

export function CompassTab({ theme, state, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [streamText, setStreamText] = useState('');
  const [streaming, setStreaming] = useState(false);

  const update = (patch: Partial<CompassState>) => onChange({ ...state, ...patch });

  const toggleFilter = (key: string, value: string) => {
    const current = state.filters[key] || [];
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    update({ filters: { ...state.filters, [key]: next } });
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const results = await apiPost<CompassState['results']>('/compass/search', {
        query: state.query,
        filters: state.filters,
        lockedMeals: state.locked,
      });
      update({ results, screen: 'results' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleLock = (name: string) => {
    const locked = state.locked.includes(name)
      ? state.locked.filter(l => l !== name)
      : [...state.locked, name];
    update({ locked });
  };

  const handleGetInstructions = async (type: 'technique' | 'exact') => {
    setStreaming(true);
    setStreamText('');
    update({ screen: 'instructions' });
    try {
      await streamSSE('/compass/instructions', { meals: state.locked, type }, (text) => {
        setStreamText(prev => prev + text);
      });
    } catch (err: any) {
      setStreamText(`Error: ${err.message}`);
    } finally {
      setStreaming(false);
    }
  };

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer',
    background: active ? theme.accentDim : 'rgba(255,255,255,0.07)',
    color: active ? theme.accent : 'rgba(255,255,255,0.6)',
    border: `1px solid ${active ? theme.accent : 'rgba(255,255,255,0.12)'}`,
  });

  if (state.screen === 'instructions') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => { update({ screen: 'results' }); setStreamText(''); }} style={{ color: theme.accent, fontSize: 13 }}>← Back</button>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 18 }}>Cooking Instructions</h2>
        </div>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {state.locked.map(m => (
            <span key={m} style={{ background: theme.accentDim, color: theme.accent, padding: '3px 12px', borderRadius: 14, fontSize: 12 }}>{m}</span>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {!streamText && !streaming && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <Btn onClick={() => handleGetInstructions('technique')} accent={theme.accent}>How to Cook This</Btn>
              <Btn onClick={() => handleGetInstructions('exact')} variant="secondary">Get Exact Recipe</Btn>
            </div>
          )}
          {streaming && !streamText && <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><PulsingDots /><span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Writing instructions...</span></div>}
          {streamText && (
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.9)' }}>
              {streamText}
              {streaming && <span style={{ animation: 'pulse 1s infinite' }}>▍</span>}
            </div>
          )}
          {!streaming && streamText && (
            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              <Btn onClick={() => { setStreamText(''); handleGetInstructions('technique'); }} variant="secondary" style={{ fontSize: 12 }}>How to Cook This</Btn>
              <Btn onClick={() => { setStreamText(''); handleGetInstructions('exact'); }} variant="secondary" style={{ fontSize: 12 }}>Get Exact Recipe</Btn>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (state.screen === 'results' && state.results) {
    const allItems = state.results.groups.flatMap(g => g.items.map(i => ({ ...i, groupType: g.type })));
    const unlockedItems = allItems.filter(i => !state.locked.includes(i.name));

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => update({ screen: 'search' })} style={{ color: theme.accent, fontSize: 13 }}>← Back</button>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 18 }}>Meal Suggestions</h2>
          <div style={{ flex: 1 }} />
          <Btn onClick={handleSearch} disabled={loading} variant="ghost" style={{ fontSize: 12 }}>{loading ? <Spinner size={14} /> : '⟳ Refresh'}</Btn>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {state.locked.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: theme.accent, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Selected</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {state.locked.map(name => {
                  const item = allItems.find(i => i.name === name);
                  return (
                    <div key={name} onClick={() => toggleLock(name)} style={{ padding: '10px 14px', background: theme.accentDim, border: `1px solid ${theme.accent}`, borderRadius: 10, cursor: 'pointer', display: 'flex', gap: 10 }}>
                      <span style={{ color: theme.accent, fontWeight: 600, flex: 1, fontSize: 14 }}>🔒 {name}</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>tap to unlock</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <Btn onClick={() => handleGetInstructions('technique')} accent={theme.accent} style={{ fontSize: 13 }}>Get Cooking Instructions →</Btn>
              </div>
            </div>
          )}

          {state.results.groups.map(group => {
            const groupItems = group.items.filter(i => !state.locked.includes(i.name));
            if (groupItems.length === 0) return null;
            return (
              <div key={group.type} style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>{group.type}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {groupItems.map(item => (
                    <div key={item.name} onClick={() => toggleLock(item.name)} style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>
                            {item.name}
                            {item.fromVault && <span style={{ marginLeft: 8, fontSize: 10, color: theme.accent, background: theme.accentDim, padding: '1px 6px', borderRadius: 10 }}>📖 In Vault</span>}
                          </div>
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{item.desc}</div>
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>+</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 20 }}>
      <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 22, marginBottom: 4 }}>🧭 Meal Compass</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>Find inspiration for your next homestead meal.</p>

      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search query (optional)..."
          value={state.query}
          onChange={e => update({ query: e.target.value })}
          style={{ fontSize: 15 }}
        />
      </div>

      {FILTER_GROUPS.map(group => (
        <div key={group.key} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{group.label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {group.options.map(opt => (
              <button key={opt} style={chipStyle((state.filters[group.key] || []).includes(opt))} onClick={() => toggleFilter(group.key, opt)}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(255,0,0,0.1)', borderRadius: 8, color: '#fca5a5', fontSize: 13 }}>
          {error} <button onClick={handleSearch} style={{ color: theme.accent, marginLeft: 8 }}>Retry</button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
          <PulsingDots />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Searching your recipes and the web — this takes about 15 seconds...</p>
        </div>
      ) : (
        <Btn onClick={handleSearch} accent={theme.accent} style={{ fontSize: 15, padding: '12px 28px' }}>
          Find My Meal →
        </Btn>
      )}
    </div>
  );
}
