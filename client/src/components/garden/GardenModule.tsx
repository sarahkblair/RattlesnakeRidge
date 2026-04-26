import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Plant, WishListItem } from '../../types';
import { apiFetch, apiPost, apiPatch, apiDelete } from '../../api';
import { glassCard } from '../../colors';
import { useToast } from '../shared/Toast';
import { Modal } from '../shared/Modal';
import { Btn, Field, Input, Textarea, Select } from '../shared/FormFields';
import { PlantDetail } from './PlantDetail';
import { WishList } from './WishList';

interface Props { theme: { gradient: string; accent: string; accentDim: string; glass: string } }

type GroupedPlants = Record<string, Record<string, Record<string, Plant[]>>>;

export function GardenModule({ theme }: Props) {
  const { data: plants = [] } = useSWR<Plant[]>('/plants', apiFetch);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [showWishList, setShowWishList] = useState(false);
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ class: '', species: '', variety: '', plant_name: '', location: '', unconfirmed: false });
  const { showToast } = useToast();

  // Group plants: Class → Species → Variety → Plants
  const grouped: GroupedPlants = {};
  plants.forEach(p => {
    if (!grouped[p.class]) grouped[p.class] = {};
    if (!grouped[p.class][p.species]) grouped[p.class][p.species] = {};
    if (!grouped[p.class][p.species][p.variety]) grouped[p.class][p.species][p.variety] = [];
    grouped[p.class][p.species][p.variety].push(p);
  });

  const toggle = (key: string) => setCollapsed(c => ({ ...c, [key]: !c[key] }));

  const handleAddPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiPost('/plants', form);
    mutate('/plants');
    setShowAddPlant(false);
    setForm({ class: '', species: '', variety: '', plant_name: '', location: '', unconfirmed: false });
  };

  const handleDelete = async (plant: Plant) => {
    const doDelete = async () => {
      await apiDelete(`/plants/${plant.id}`);
      mutate('/plants');
      if (selectedPlant?.id === plant.id) setSelectedPlant(null);
    };
    showToast(`Deleted "${plant.plant_name}"`, doDelete);
    // Commit after 5s via toast undo mechanism — actually we need to delay the delete
    // We'll show the toast and execute after delay
    const tid = setTimeout(doDelete, 5000);
    showToast(`Deleted "${plant.plant_name}"`, () => clearTimeout(tid));
  };

  const sidebarStyle: React.CSSProperties = {
    width: 200,
    flexShrink: 0,
    background: 'rgba(0,0,0,0.25)',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  if (showWishList) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setShowWishList(false)} style={{ color: theme.accent, fontSize: 13 }}>← Back to Garden</button>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 18, color: '#f0ead6' }}>✨ Wish List</h2>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <WishList theme={theme} onAddToPlants={(wish) => {
            setShowWishList(false);
            setForm({ class: wish.class || '', species: wish.species || '', variety: wish.variety, plant_name: `${wish.variety} #1`, location: '', unconfirmed: false });
            setShowAddPlant(true);
          }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Btn onClick={() => setShowAddPlant(true)} accent={theme.accent} style={{ width: '100%', fontSize: 13, padding: '7px 12px' }}>
            + Add Plant
          </Btn>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {Object.entries(grouped).map(([cls, speciesMap]) => (
            <div key={cls}>
              <button
                onClick={() => toggle(cls)}
                style={{ width: '100%', textAlign: 'left', padding: '5px 12px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {collapsed[cls] ? '▶' : '▼'} {cls}
              </button>
              {!collapsed[cls] && Object.entries(speciesMap).map(([species, varMap]) => (
                <div key={species}>
                  <button
                    onClick={() => toggle(`${cls}/${species}`)}
                    style={{ width: '100%', textAlign: 'left', padding: '4px 20px', fontSize: 12, color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {collapsed[`${cls}/${species}`] ? '▶' : '▼'} {species}
                  </button>
                  {!collapsed[`${cls}/${species}`] && Object.entries(varMap).map(([variety, varPlants]) => (
                    <div key={variety}>
                      <div style={{ padding: '3px 28px', fontSize: 11, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>{variety}</div>
                      {varPlants.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPlant(p)}
                          style={{
                            width: '100%', textAlign: 'left', padding: '5px 36px',
                            fontSize: 13, color: selectedPlant?.id === p.id ? theme.accent : '#f0ead6',
                            background: selectedPlant?.id === p.id ? theme.accentDim : 'transparent',
                            border: 'none', cursor: 'pointer',
                          }}
                        >
                          {p.unconfirmed ? '❓' : '🌱'} {p.plant_name}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
          {plants.length === 0 && (
            <div style={{ padding: '20px 12px', color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center' }}>
              No plants yet.<br />Add your first plant above.
            </div>
          )}
        </div>

        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Btn variant="ghost" onClick={() => setShowWishList(true)} style={{ width: '100%', fontSize: 13, padding: '7px 12px' }}>
            ✨ Wish List
          </Btn>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {selectedPlant ? (
          <PlantDetail
            plant={selectedPlant}
            theme={theme}
            onPlantUpdate={(updated) => {
              mutate('/plants');
              setSelectedPlant(updated);
            }}
            onDelete={() => {
              const plant = selectedPlant;
              setSelectedPlant(null);
              const doDelete = async () => { await apiDelete(`/plants/${plant.id}`); mutate('/plants'); };
              let committed = false;
              const tid = setTimeout(() => { committed = true; doDelete(); }, 5000);
              showToast(`Deleted "${plant.plant_name}"`, () => { if (!committed) clearTimeout(tid); });
            }}
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'rgba(255,255,255,0.35)' }}>
            <div style={{ fontSize: 48 }}>🌱</div>
            <div style={{ fontSize: 15 }}>Select a plant from the roster</div>
          </div>
        )}
      </div>

      {showAddPlant && (
        <Modal title="Add Plant" onClose={() => setShowAddPlant(false)}>
          <form onSubmit={handleAddPlant}>
            <Field label="Class"><Input required value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))} placeholder="e.g. Fig" /></Field>
            <Field label="Species"><Input required value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))} placeholder="e.g. Common Fig" /></Field>
            <Field label="Variety"><Input required value={form.variety} onChange={e => setForm(f => ({ ...f, variety: e.target.value }))} placeholder="e.g. Black Madeira" /></Field>
            <Field label="Plant Name"><Input required value={form.plant_name} onChange={e => setForm(f => ({ ...f, plant_name: e.target.value }))} placeholder="e.g. Black Madeira #1" /></Field>
            <Field label="Location"><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. 3-gallon pot" /></Field>
            <Field label="">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                <input type="checkbox" checked={form.unconfirmed} onChange={e => setForm(f => ({ ...f, unconfirmed: e.target.checked }))} />
                Variety unconfirmed
              </label>
            </Field>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Btn type="submit" accent={theme.accent}>Add Plant</Btn>
              <Btn type="button" variant="ghost" onClick={() => setShowAddPlant(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
