import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { MealPoolItem, GroceryItem } from '../../types';
import { apiFetch, apiPost, apiPatch, apiDelete } from '../../api';
import { Btn, Field, Input } from '../shared/FormFields';
import { useToast } from '../shared/Toast';

interface Theme { accent: string; accentDim: string }

const RATINGS = [
  { value: 'sarah_fav', label: "⭐ Sarah's favorite" },
  { value: 'kyle_fav', label: '🤠 Kyle\'s favorite' },
  { value: 'liked', label: '👍 We liked it' },
  { value: 'fine', label: '😐 It was fine' },
  { value: 'no', label: "❌ Won't make again" },
];

export function GroceryTab({ theme }: { theme: Theme }) {
  const { data: pool = [], mutate: mutatePool } = useSWR<MealPoolItem[]>('/meal-pool', apiFetch);
  const { data: groceries = [], mutate: mutateGroceries } = useSWR<GroceryItem[]>('/grocery', apiFetch);
  const [ratingTarget, setRatingTarget] = useState<MealPoolItem | null>(null);
  const [showAddPool, setShowAddPool] = useState(false);
  const [poolForm, setPoolForm] = useState({ name: '', components: '', time_estimate: '', season: '' });
  const [showAddGrocery, setShowAddGrocery] = useState(false);
  const [groceryForm, setGroceryForm] = useState({ section: '', item: '' });
  const { showToast } = useToast();

  const handleRate = async (meal: MealPoolItem, rating: string) => {
    await apiPost(`/meal-pool/${meal.id}/rate`, { rating });
    mutatePool();
    setRatingTarget(null);
  };

  const handleDeletePool = (meal: MealPoolItem) => {
    let committed = false;
    const tid = setTimeout(async () => { committed = true; await apiDelete(`/meal-pool/${meal.id}`); mutatePool(); }, 5000);
    showToast(`Removed "${meal.name}"`, () => { if (!committed) clearTimeout(tid); });
  };

  const handleAddPool = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiPost('/meal-pool', poolForm);
    mutatePool();
    setShowAddPool(false);
    setPoolForm({ name: '', components: '', time_estimate: '', season: '' });
  };

  const handleAddGrocery = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiPost('/grocery', groceryForm);
    mutateGroceries();
    setGroceryForm({ section: '', item: '' });
  };

  const toggleGrocery = async (item: GroceryItem) => {
    await apiPatch(`/grocery/${item.id}`, { purchased: !item.purchased });
    mutateGroceries();
  };

  const deleteGrocery = async (item: GroceryItem) => {
    let committed = false;
    const tid = setTimeout(async () => { committed = true; await apiDelete(`/grocery/${item.id}`); mutateGroceries(); }, 5000);
    showToast(`Removed "${item.item}"`, () => { if (!committed) clearTimeout(tid); });
  };

  // Group grocery items by section
  const sections: Record<string, GroceryItem[]> = {};
  groceries.forEach(g => {
    if (!sections[g.section]) sections[g.section] = [];
    sections[g.section].push(g);
  });

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      {/* Rating overlay */}
      {ratingTarget && (
        <div onClick={() => setRatingTarget(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1a100a', borderRadius: 12, padding: 24, width: 320, border: '1px solid rgba(255,255,255,0.15)' }}>
            <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 18, marginBottom: 4 }}>Rate: {ratingTarget.name}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>How did it go?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {RATINGS.map(r => (
                <button key={r.value} onClick={() => handleRate(ratingTarget, r.value)} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#f0ead6', fontSize: 14, textAlign: 'left', cursor: 'pointer' }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '16px 20px' }}>
        <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 20, marginBottom: 16 }}>🛒 Grocery Cycle</h2>

        {/* Meal Pool */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Meal Pool</h3>
            <Btn onClick={() => setShowAddPool(v => !v)} accent={theme.accent} style={{ fontSize: 12, padding: '5px 12px' }}>
              {showAddPool ? 'Cancel' : '+ Add Meal'}
            </Btn>
          </div>

          {showAddPool && (
            <form onSubmit={handleAddPool} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 14, marginBottom: 12 }}>
              <Field label="Meal Name"><Input required value={poolForm.name} onChange={e => setPoolForm(f => ({ ...f, name: e.target.value }))} /></Field>
              <Field label="Components"><Input value={poolForm.components} onChange={e => setPoolForm(f => ({ ...f, components: e.target.value }))} placeholder="e.g. Main dish, Side dish" /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Time"><Input value={poolForm.time_estimate} onChange={e => setPoolForm(f => ({ ...f, time_estimate: e.target.value }))} placeholder="e.g. 45 min" /></Field>
                <Field label="Season"><Input value={poolForm.season} onChange={e => setPoolForm(f => ({ ...f, season: e.target.value }))} placeholder="e.g. Year-round" /></Field>
              </div>
              <Btn type="submit" accent={theme.accent} style={{ fontSize: 13 }}>Add to Pool</Btn>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pool.map(meal => (
              <div key={meal.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{meal.name}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                    {meal.components && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{meal.components}</span>}
                    {meal.time_estimate && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>⏱ {meal.time_estimate}</span>}
                    {meal.season && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>🌱 {meal.season}</span>}
                  </div>
                </div>
                <Btn onClick={() => setRatingTarget(meal)} accent={theme.accent} style={{ fontSize: 12, padding: '5px 10px' }}>✓ Made It</Btn>
                <button onClick={() => handleDeletePool(meal)} style={{ color: 'rgba(255,100,100,0.6)', fontSize: 16, padding: '4px' }}>×</button>
              </div>
            ))}
            {pool.length === 0 && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Meal pool empty.</p>}
          </div>
        </div>

        {/* Grocery List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grocery List</h3>
          </div>

          <form onSubmit={handleAddGrocery} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Input required placeholder="Section (e.g. Produce)" value={groceryForm.section} onChange={e => setGroceryForm(f => ({ ...f, section: e.target.value }))} style={{ flex: 1 }} />
            <Input required placeholder="Item" value={groceryForm.item} onChange={e => setGroceryForm(f => ({ ...f, item: e.target.value }))} style={{ flex: 2 }} />
            <Btn type="submit" accent={theme.accent} style={{ flexShrink: 0, fontSize: 13 }}>Add</Btn>
          </form>

          {Object.entries(sections).map(([section, items]) => (
            <div key={section} style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{section}</h4>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 6, marginBottom: 4 }}>
                  <input
                    type="checkbox"
                    checked={!!item.purchased}
                    onChange={() => toggleGrocery(item)}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: theme.accent }}
                  />
                  <span style={{ flex: 1, fontSize: 14, textDecoration: item.purchased ? 'line-through' : 'none', color: item.purchased ? 'rgba(255,255,255,0.35)' : '#f0ead6' }}>
                    {item.item}
                    {item.recipes && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>({item.recipes})</span>}
                  </span>
                  <button onClick={() => deleteGrocery(item)} style={{ color: 'rgba(255,100,100,0.5)', fontSize: 14 }}>×</button>
                </div>
              ))}
            </div>
          ))}
          {groceries.length === 0 && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Grocery list empty.</p>}
        </div>
      </div>
    </div>
  );
}
