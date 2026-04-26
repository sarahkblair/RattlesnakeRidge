import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Recipe } from '../../types';
import { apiFetch, apiPost } from '../../api';
import { Btn, Field, Input, Textarea, Select } from './FormFields';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = ['All', 'Bread', 'Main', 'Breakfast', 'Dessert', 'Sauce', 'Other'];
const TYPES = ['All', 'Baking', 'Cooking'];

export function VaultDrawer({ open, onClose }: Props) {
  const { data: recipes = [] } = useSWR<Recipe[]>('/recipes', apiFetch);
  const [catFilter, setCatFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [form, setForm] = useState({ name: '', category: 'Main', type: 'Cooking' as 'Baking' | 'Cooking', emoji: '🍽️', ingredients: '', method: '', notes: '', source_url: '' });
  const [saving, setSaving] = useState(false);

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
      mutate('/recipes');
      setShowAdd(false);
      setForm({ name: '', category: 'Main', type: 'Cooking', emoji: '🍽️', ingredients: '', method: '', notes: '', source_url: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {open && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.4)' }} />
      )}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 320,
        background: '#2A1608',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRight: 'none',
        zIndex: 900,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 18, color: '#f0ead6' }}>📖 Recipe Vault</h2>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 20 }}>×</button>
        </div>

        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8 }}>
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            style={{ flex: 1, padding: '6px 8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#f0ead6', fontSize: 12, fontFamily: 'Lora, Georgia, serif' }}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ flex: 1, padding: '6px 8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#f0ead6', fontSize: 12, fontFamily: 'Lora, Georgia, serif' }}
          >
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          {selected ? (
            <div>
              <button onClick={() => setSelected(null)} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 12 }}>← Back</button>
              <div style={{ fontSize: 32, marginBottom: 4 }}>{selected.emoji || '🍽️'}</div>
              <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 18, marginBottom: 4 }}>{selected.name}</h3>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {selected.category && <span style={{ background: 'rgba(253,180,122,0.2)', color: '#FDB47A', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>{selected.category}</span>}
                {selected.type && <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>{selected.type}</span>}
              </div>
              {selected.ingredients && (
                <>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Ingredients</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 12, whiteSpace: 'pre-line' }}>{selected.ingredients}</p>
                </>
              )}
              {selected.method && (
                <>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Method</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-line' }}>{selected.method}</p>
                </>
              )}
            </div>
          ) : showAdd ? (
            <form onSubmit={handleAdd}>
              <Field label="Name"><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
              <Field label="Category">
                <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {['Bread', 'Main', 'Breakfast', 'Dessert', 'Sauce', 'Other'].map(c => <option key={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Type">
                <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'Baking' | 'Cooking' }))}>
                  <option>Baking</option><option>Cooking</option>
                </Select>
              </Field>
              <Field label="Emoji"><Input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} /></Field>
              <Field label="Ingredients"><Textarea value={form.ingredients} onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))} rows={4} /></Field>
              <Field label="Method"><Textarea value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} rows={4} /></Field>
              <Field label="Notes"><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></Field>
              <Field label="Source URL"><Input type="url" value={form.source_url} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))} /></Field>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn type="submit" disabled={saving} accent="#FDB47A">{saving ? 'Saving...' : 'Save'}</Btn>
                <Btn type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
              </div>
            </form>
          ) : (
            filtered.map(r => (
              <div key={r.id} onClick={() => setSelected(r)} style={{
                padding: '10px 12px', borderRadius: 8, marginBottom: 8, cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{r.emoji || '🍽️'}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f0ead6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                    {r.category && <span style={{ background: 'rgba(253,180,122,0.2)', color: '#FDB47A', padding: '1px 6px', borderRadius: 10, fontSize: 10 }}>{r.category}</span>}
                    {r.type && <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '1px 6px', borderRadius: 10, fontSize: 10 }}>{r.type}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!showAdd && !selected && (
          <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Btn onClick={() => setShowAdd(true)} accent="#FDB47A" style={{ width: '100%' }}>+ Add Recipe</Btn>
          </div>
        )}
      </div>
    </>
  );
}
