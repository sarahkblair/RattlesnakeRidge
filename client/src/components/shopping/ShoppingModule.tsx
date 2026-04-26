import React, { useState, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { ShoppingItem } from '../../types';
import { apiFetch, apiPost, apiPatch, apiDelete, uploadImage } from '../../api';
import { Btn, Field, Input, Textarea, Spinner } from '../shared/FormFields';
import { useToast } from '../shared/Toast';

interface Theme { accent: string; accentDim: string; glass: string }

const ROOMS = ['Kitchen', 'Dining', 'Bar', 'Living Room', 'Library', 'Master Bedroom', 'Master Bathroom', 'Guest Bedroom', 'Guest Bathroom', 'Laundry', 'Outside'];
type AddMode = 'url' | 'manual' | 'photo';

export function ShoppingModule({ theme }: { theme: Theme }) {
  const [room, setRoom] = useState('Kitchen');
  const { data: allItems = [], mutate: mutateItems } = useSWR<ShoppingItem[]>('/shopping', apiFetch);
  const [addMode, setAddMode] = useState<AddMode | null>(null);
  const { showToast } = useToast();

  const items = allItems.filter(i => i.room === room).sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  const roomTotal = items.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
  const grandTotal = allItems.reduce((s, i) => s + (i.price || 0) * i.qty, 0);

  const handleDelete = (item: ShoppingItem) => {
    let committed = false;
    const tid = setTimeout(async () => { committed = true; await apiDelete(`/shopping/${item.id}`); mutateItems(); }, 5000);
    showToast(`Deleted "${item.name}"`, () => { if (!committed) clearTimeout(tid); });
  };

  const handleBought = async (item: ShoppingItem) => {
    await apiDelete(`/shopping/${item.id}`);
    mutateItems();
  };

  const handleMove = async (item: ShoppingItem, targetRoom: string) => {
    await apiPost(`/shopping/${item.id}/move`, { room: targetRoom });
    mutateItems();
  };

  const [moveTarget, setMoveTarget] = useState<ShoppingItem | null>(null);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Room tabs */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto', flexShrink: 0 }}>
        <div style={{ display: 'flex', padding: '0 12px' }}>
          {ROOMS.map(r => (
            <button key={r} onClick={() => setRoom(r)} style={{
              padding: '10px 14px', fontSize: 12, fontFamily: 'Lora, Georgia, serif', whiteSpace: 'nowrap',
              color: room === r ? theme.accent : 'rgba(255,255,255,0.5)',
              background: 'none', border: 'none',
              borderBottom: room === r ? `2px solid ${theme.accent}` : '2px solid transparent',
              cursor: 'pointer',
            }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Totals bar */}
      <div style={{ padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 20, fontSize: 13, background: 'rgba(0,0,0,0.15)', flexShrink: 0 }}>
        <span style={{ color: theme.accent, fontWeight: 600 }}>{room}: ${roomTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
        <span style={{ color: 'rgba(255,255,255,0.45)' }}>Grand Total: ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
      </div>

      {/* Add modes */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8, flexShrink: 0 }}>
        <Btn onClick={() => setAddMode(addMode === 'url' ? null : 'url')} variant={addMode === 'url' ? 'primary' : 'ghost'} accent={theme.accent} style={{ fontSize: 12 }}>🔗 From URL</Btn>
        <Btn onClick={() => setAddMode(addMode === 'manual' ? null : 'manual')} variant={addMode === 'manual' ? 'primary' : 'ghost'} accent={theme.accent} style={{ fontSize: 12 }}>✏️ Manual</Btn>
        <Btn onClick={() => setAddMode(addMode === 'photo' ? null : 'photo')} variant={addMode === 'photo' ? 'primary' : 'ghost'} accent={theme.accent} style={{ fontSize: 12 }}>📷 Photo</Btn>
      </div>

      {addMode && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          {addMode === 'url' && <UrlAdd room={room} theme={theme} onSaved={() => { setAddMode(null); mutateItems(); }} />}
          {addMode === 'manual' && <ManualAdd room={room} theme={theme} onSaved={() => { setAddMode(null); mutateItems(); }} />}
          {addMode === 'photo' && <PhotoAdd room={room} theme={theme} onSaved={() => { setAddMode(null); mutateItems(); }} />}
        </div>
      )}

      {/* Items grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {moveTarget && (
          <div onClick={() => setMoveTarget(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#1a100a', borderRadius: 12, padding: 20, minWidth: 240, border: '1px solid rgba(255,255,255,0.15)' }}>
              <p style={{ marginBottom: 12, fontWeight: 600 }}>Move "{moveTarget.name}" to:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ROOMS.filter(r => r !== room).map(r => (
                  <button key={r} onClick={async () => { await handleMove(moveTarget, r); setMoveTarget(null); mutateItems(); }} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#f0ead6', fontSize: 14, textAlign: 'left', cursor: 'pointer' }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 12 }}>
          {items.map(item => (
            <div key={item.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
              {/* Image area */}
              <div style={{ paddingTop: '75%', position: 'relative', background: 'rgba(0,0,0,0.2)' }}>
                {item.image_filename ? (
                  <img src={`/uploads/${item.image_filename}`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : item.image_url ? (
                  <img src={item.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'rgba(255,255,255,0.15)' }}>🛍️</div>
                )}
              </div>
              {/* Info */}
              <div style={{ padding: '10px 12px' }}>
                {item.brand && <div style={{ fontSize: 10, color: theme.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{item.brand}</div>}
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, lineHeight: 1.3 }}>{item.name}</div>
                {item.price && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>${item.price.toLocaleString()}{item.qty > 1 ? ` × ${item.qty}` : ''}</div>}
                {item.notes && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginTop: 4 }}>{item.notes}</div>}
                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button onClick={() => handleBought(item)} style={{ flex: 1, padding: '5px 6px', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 6, color: '#4ade80', fontSize: 11, fontFamily: 'Lora, Georgia, serif', cursor: 'pointer' }}>✓ Bought</button>
                  <button onClick={() => setMoveTarget(item)} style={{ flex: 1, padding: '5px 6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'Lora, Georgia, serif', cursor: 'pointer' }}>↗ Move</button>
                  <button onClick={() => handleDelete(item)} style={{ padding: '5px 8px', background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.2)', borderRadius: 6, color: '#fca5a5', fontSize: 11, cursor: 'pointer' }}>×</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.35)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🛍️</div>
            <p>Nothing in {room} yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ManualAdd({ room, theme, onSaved }: { room: string; theme: Theme; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', brand: '', price: '', qty: '1', notes: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPost('/shopping', { room, ...form, price: parseFloat(form.price) || null, qty: parseInt(form.qty) || 1 });
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <Field label="Name *"><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
        <Field label="Brand"><Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} /></Field>
        <Field label="Price"><Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></Field>
        <Field label="Qty"><Input type="number" min="1" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} /></Field>
        <div style={{ gridColumn: '1/-1' }}><Field label="Notes"><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Field></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Btn type="submit" disabled={saving} accent={theme.accent} style={{ fontSize: 13 }}>{saving ? 'Saving...' : 'Add Item'}</Btn>
      </div>
    </form>
  );
}

function UrlAdd({ room, theme, onSaved }: { room: string; theme: Theme; onSaved: () => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState<any>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', brand: '', price: '', qty: '1', notes: '', image_url: '' });
  const [saving, setSaving] = useState(false);

  const fetchUrl = async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    setFetched(null);
    try {
      const data = await apiPost<any>('/shopping/fetch-url', { url });
      setFetched(data);
      setForm(f => ({ ...f, name: data.name || '', brand: data.brand || '', price: data.price?.toString() || '', image_url: data.imageUrl || '' }));
    } catch (err: any) {
      setError(err.message || "Couldn't read this page — fill in the details below");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPost('/shopping', { room, ...form, price: parseFloat(form.price) || null, qty: parseInt(form.qty) || 1, source_url: url });
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Input placeholder="Paste product URL..." value={url} onChange={e => setUrl(e.target.value)} style={{ flex: 1 }} />
        <Btn onClick={fetchUrl} disabled={loading || !url} accent={theme.accent} style={{ fontSize: 13, flexShrink: 0 }}>
          {loading ? <Spinner size={14} /> : 'Fetch'}
        </Btn>
      </div>
      {error && <p style={{ color: '#fca5a5', fontSize: 13, marginBottom: 8 }}>{error}</p>}
      {(fetched || error) && (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {form.image_url && <div style={{ gridColumn: '1/-1' }}><img src={form.image_url} alt="" style={{ maxHeight: 80, objectFit: 'contain', borderRadius: 6 }} /></div>}
            <Field label="Name *"><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
            <Field label="Brand"><Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} /></Field>
            <Field label="Price"><Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></Field>
            <Field label="Qty"><Input type="number" min="1" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} /></Field>
            <div style={{ gridColumn: '1/-1' }}><Field label="Notes"><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Field></div>
          </div>
          <Btn type="submit" disabled={saving} accent={theme.accent} style={{ marginTop: 8, fontSize: 13 }}>{saving ? 'Saving...' : 'Add Item'}</Btn>
        </form>
      )}
    </div>
  );
}

function PhotoAdd({ room, theme, onSaved }: { room: string; theme: Theme; onSaved: () => void }) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [form, setForm] = useState({ name: '', brand: '', price: '', qty: '1', notes: '' });
  const [saving, setSaving] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;
    setSaving(true);
    try {
      const filename = await uploadImage(image);
      await apiPost('/shopping', { room, ...form, image_filename: filename, price: parseFloat(form.price) || null, qty: parseInt(form.qty) || 1 });
      onSaved();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally { setSaving(false); }
  };

  return (
    <div>
      {!image && (
        <label style={{ display: 'inline-block', padding: '10px 18px', background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 8, cursor: 'pointer', marginBottom: 12 }}>
          📷 Choose Photo
          <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        </label>
      )}
      {preview && <img src={preview} alt="" style={{ maxHeight: 100, objectFit: 'contain', borderRadius: 8, marginBottom: 12, display: 'block' }} />}
      {image && (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <Field label="Name *"><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
            <Field label="Brand"><Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} /></Field>
            <Field label="Price"><Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></Field>
            <Field label="Qty"><Input type="number" min="1" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} /></Field>
            <div style={{ gridColumn: '1/-1' }}><Field label="Notes"><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Field></div>
          </div>
          <Btn type="submit" disabled={saving} accent={theme.accent} style={{ marginTop: 8, fontSize: 13 }}>{saving ? 'Saving...' : 'Add Item'}</Btn>
        </form>
      )}
    </div>
  );
}
