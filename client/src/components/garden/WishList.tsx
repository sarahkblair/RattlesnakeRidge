import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { WishListItem } from '../../types';
import { apiFetch, apiPost, apiDelete } from '../../api';
import { Btn, Field, Input, Textarea, Select } from '../shared/FormFields';
import { useToast } from '../shared/Toast';

interface Props {
  theme: { accent: string; accentDim: string };
  onAddToPlants: (wish: WishListItem) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#FF6228',
  medium: '#FFD020',
  low: '#0FD4B0',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: 'This Season',
  medium: 'This Year',
  low: 'Eventually',
};

export function WishList({ theme, onAddToPlants }: Props) {
  const { data: items = [], mutate: mutateItems } = useSWR<WishListItem[]>('/wish-list', apiFetch);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ class: '', species: '', variety: '', reason: '', priority: 'medium' as 'high' | 'medium' | 'low' });
  const { showToast } = useToast();

  const grouped: Record<string, WishListItem[]> = {};
  items.forEach(i => {
    const cls = i.class || 'Other';
    if (!grouped[cls]) grouped[cls] = [];
    grouped[cls].push(i);
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiPost('/wish-list', form);
    mutateItems();
    setShowAdd(false);
    setForm({ class: '', species: '', variety: '', reason: '', priority: 'medium' });
  };

  const handleDelete = (item: WishListItem) => {
    let committed = false;
    const tid = setTimeout(async () => { committed = true; await apiDelete(`/wish-list/${item.id}`); mutateItems(); }, 5000);
    showToast(`Removed "${item.variety}" from wish list`, () => { if (!committed) clearTimeout(tid); });
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Btn onClick={() => setShowAdd(v => !v)} accent={theme.accent}>{showAdd ? 'Cancel' : '+ Add Wish List Item'}</Btn>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <Field label="Class"><Input value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))} placeholder="e.g. Citrus" /></Field>
          <Field label="Species"><Input value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))} placeholder="e.g. Lemon" /></Field>
          <Field label="Variety *"><Input required value={form.variety} onChange={e => setForm(f => ({ ...f, variety: e.target.value }))} placeholder="e.g. Meyer Lemon" /></Field>
          <Field label="Reason"><Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} /></Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as any }))}>
              <option value="high">This Season (High)</option>
              <option value="medium">This Year (Medium)</option>
              <option value="low">Eventually (Low)</option>
            </Select>
          </Field>
          <Btn type="submit" accent={theme.accent}>Add to Wish List</Btn>
        </form>
      )}

      {Object.entries(grouped).map(([cls, clsItems]) => (
        <div key={cls} style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>{cls}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {clsItems.map(item => (
              <div key={item.id} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{item.variety}</span>
                    {item.species && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginLeft: 8 }}>{item.species}</span>}
                  </div>
                  {item.priority && (
                    <span style={{ background: `${PRIORITY_COLORS[item.priority]}22`, color: PRIORITY_COLORS[item.priority], padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                      {PRIORITY_LABELS[item.priority]}
                    </span>
                  )}
                </div>
                {item.reason && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>{item.reason}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn onClick={() => onAddToPlants(item)} accent={theme.accent} style={{ fontSize: 12, padding: '5px 12px' }}>+ Add to Plants</Btn>
                  <Btn onClick={() => handleDelete(item)} variant="danger" style={{ fontSize: 12, padding: '5px 12px' }}>Remove</Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
          <p>Your wish list is empty.</p>
        </div>
      )}
    </div>
  );
}
