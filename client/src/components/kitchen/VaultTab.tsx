import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Recipe } from '../../types';
import { apiFetch, apiPost, apiDelete } from '../../api';
import { Btn, Field, Input, Textarea, Select } from '../shared/FormFields';
import { Modal } from '../shared/Modal';
import { useToast } from '../shared/Toast';

interface Theme { accent: string; accentDim: string; glass: string }

const CATEGORIES = ['All', 'Bread', 'Main', 'Breakfast', 'Dessert', 'Sauce', 'Other'];
const TYPES = ['All', 'Baking', 'Cooking'];

export function VaultTab({ theme }: { theme: Theme }) {
  const { data: recipes = [] } = useSWR<Recipe[]>('/api/recipes', apiFetch);
  const [catFilter, setCatFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Main', type: 'Cooking' as 'Baking' | 'Cooking', emoji: '🍽️', ingredients: '', method: '', notes: '', source_url: '' });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const filtered = recipes.filter(r => {
    if (catFilter !== 'All' && r.category !== catFilter) return false;
    if (typeFilter !== 'All' && r.type !== typeFilter) return false;
    return true;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPost('/recipes', form);
      mutate('/api/recipes');
      setShowAdd(false);
      setForm({ name: '', category: 'Main', type: 'Cooking', emoji: '🍽️', ingredients: '', method: '', notes: '', source_url: '' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (r: Recipe) => {
    let committed = false;
    const tid = setTimeout(async () => { committed = true; await apiDelete(`/recipes/${r.id}`); mutate('/api/recipes'); setSelected(null); }, 5000);
    showToast(`Deleted "${r.name}"`, () => { if (!committed) clearTimeout(tid); });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: '6px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#f0ead6', fontSize: 12, fontFamily: 'Lora, Georgia, serif' }}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '6px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#f0ead6', fontSize: 12, fontFamily: 'Lora, Georgia, serif' }}>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <Btn onClick={() => setShowAdd(true)} accent={theme.accent} style={{ fontSize: 13, padding: '6px 14px' }}>+ Add Recipe</Btn>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {filtered.map(r => (
            <div key={r.id} onClick={() => setSelected(r)} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '14px 14px', cursor: 'pointer' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{r.emoji || '🍽️'}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{r.name}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {r.category && <span style={{ background: `${theme.accentDim}`, color: theme.accent, padding: '1px 8px', borderRadius: 10, fontSize: 11 }}>{r.category}</span>}
                {r.type && <span style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '1px 8px', borderRadius: 10, fontSize: 11 }}>{r.type}</span>}
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.35)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📖</div>
            <p>No recipes found.</p>
          </div>
        )}
      </div>

      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)} width={560}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{selected.emoji || '🍽️'}</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {selected.category && <span style={{ background: 'rgba(253,180,122,0.2)', color: '#FDB47A', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>{selected.category}</span>}
            {selected.type && <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>{selected.type}</span>}
          </div>
          {selected.ingredients && (
            <><p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Ingredients</p>
              <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16, whiteSpace: 'pre-line' }}>{selected.ingredients}</p></>
          )}
          {selected.method && (
            <><p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Method</p>
              <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 16, whiteSpace: 'pre-line' }}>{selected.method}</p></>
          )}
          {selected.notes && (
            <><p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Notes</p>
              <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{selected.notes}</p></>
          )}
          {selected.source_url && (
            <a href={selected.source_url} target="_blank" rel="noopener noreferrer" style={{ color: theme.accent, fontSize: 13, display: 'block', marginBottom: 16 }}>🔗 Source</a>
          )}
          <Btn variant="danger" onClick={() => handleDelete(selected)} style={{ fontSize: 13 }}>Delete Recipe</Btn>
        </Modal>
      )}

      {showAdd && (
        <Modal title="Add Recipe" onClose={() => setShowAdd(false)} width={560}>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <Field label="Name"><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
              </div>
              <Field label="Category">
                <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {['Bread', 'Main', 'Breakfast', 'Dessert', 'Sauce', 'Other'].map(c => <option key={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Type">
                <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                  <option>Baking</option><option>Cooking</option>
                </Select>
              </Field>
              <Field label="Emoji"><Input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} /></Field>
              <div />
              <div style={{ gridColumn: '1/-1' }}>
                <Field label="Ingredients"><Textarea value={form.ingredients} onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))} rows={5} /></Field>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <Field label="Method"><Textarea value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} rows={5} /></Field>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <Field label="Notes"><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></Field>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <Field label="Source URL"><Input type="url" value={form.source_url} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))} /></Field>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Btn type="submit" disabled={saving} accent={theme.accent}>{saving ? 'Saving...' : 'Save Recipe'}</Btn>
              <Btn type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
