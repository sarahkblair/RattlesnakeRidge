import React, { useState, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { Plant, PlantHistory, PlantPhoto, CarePlan, BotanicalProfile, Harvest, WeatherDay } from '../../types';
import { apiFetch, apiPost, apiPatch, apiDelete, uploadImage, streamSSE } from '../../api';
import { Btn, Field, Input, Textarea, Spinner } from '../shared/FormFields';
import { useToast } from '../shared/Toast';
import { glassCard } from '../../colors';

interface Props {
  plant: Plant;
  theme: { accent: string; accentDim: string; glass: string };
  onPlantUpdate: (p: Plant) => void;
  onDelete: () => void;
}

type Tab = 'care' | 'history' | 'data' | 'diagnose';

export function PlantDetail({ plant, theme, onPlantUpdate, onDelete }: Props) {
  const [tab, setTab] = useState<Tab>('care');
  const { showToast } = useToast();

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: '8px 16px', fontSize: 13, fontFamily: 'Lora, Georgia, serif',
    color: tab === t ? theme.accent : 'rgba(255,255,255,0.55)',
    background: 'none', border: 'none',
    borderBottom: tab === t ? `2px solid ${theme.accent}` : '2px solid transparent',
    cursor: 'pointer',
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 22, color: '#f0ead6', marginBottom: 2 }}>
              {plant.plant_name} {plant.unconfirmed ? <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>❓ unconfirmed</span> : ''}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{plant.class} / {plant.species} / {plant.variety}</p>
          </div>
          <Btn variant="danger" onClick={onDelete} style={{ fontSize: 12, padding: '5px 12px' }}>Delete</Btn>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          <button style={tabStyle('care')} onClick={() => setTab('care')}>🌱 Care + Weather</button>
          <button style={tabStyle('history')} onClick={() => setTab('history')}>📋 History</button>
          <button style={tabStyle('data')} onClick={() => setTab('data')}>📊 Data</button>
          <button style={tabStyle('diagnose')} onClick={() => setTab('diagnose')}>📷 Diagnose</button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {tab === 'care' && <CareTab plant={plant} theme={theme} />}
        {tab === 'history' && <HistoryTab plant={plant} theme={theme} showToast={showToast} />}
        {tab === 'data' && <DataTab plant={plant} theme={theme} showToast={showToast} />}
        {tab === 'diagnose' && <DiagnoseTab plant={plant} theme={theme} />}
      </div>
    </div>
  );
}

function CareTab({ plant, theme }: { plant: Plant; theme: any }) {
  const { data: plan, mutate: mutatePlan } = useSWR<CarePlan>(`/api/plants/${plant.id}/care-plan`, apiFetch);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherDay[]>([]);
  const [timeAgo, setTimeAgo] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    apiFetch<{ days: WeatherDay[] }>('/weather').then(d => setWeather(d.days)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!plan?.generated_at) return;
    const update = () => {
      const diff = Math.round((Date.now() - new Date(plan.generated_at).getTime()) / 1000);
      if (diff < 60) setTimeAgo(`${diff}s ago`);
      else if (diff < 3600) setTimeAgo(`${Math.floor(diff / 60)}m ago`);
      else setTimeAgo(`${Math.floor(diff / 3600)}h ago`);
    };
    update();
    timerRef.current = setInterval(update, 30000);
    return () => clearInterval(timerRef.current);
  }, [plan?.generated_at]);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await apiPost<CarePlan>(`/plants/${plant.id}/care-plan/refresh`, {});
      mutatePlan(result);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 16 }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No care plan generated yet.</p>
        <Btn onClick={generate} disabled={loading} accent={theme.accent} style={{ fontSize: 15, padding: '10px 24px' }}>
          {loading ? <><Spinner size={16} /> Generating...</> : '✨ Generate Care Plan'}
        </Btn>
      </div>
    );
  }

  return (
    <div>
      {weather.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {weather.map(d => (
            <div key={d.date} style={{ flexShrink: 0, textAlign: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, minWidth: 72 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div style={{ fontSize: 20 }}>{d.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{d.high}°</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{d.low}°</div>
              {d.precip > 0 && <div style={{ fontSize: 10, color: '#93c5fd' }}>{d.precip}"</div>}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Updated {timeAgo}</span>
        <Btn onClick={generate} disabled={loading} variant="ghost" style={{ fontSize: 12, padding: '5px 12px' }}>
          {loading ? <Spinner size={14} /> : '⟳ Refresh'}
        </Btn>
      </div>

      <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.9)' }}>
        {plan.text}
      </div>
    </div>
  );
}

function HistoryTab({ plant, theme, showToast }: { plant: Plant; theme: any; showToast: any }) {
  const { data: history = [], mutate: mutateHistory } = useSWR<PlantHistory[]>(`/api/plants/${plant.id}/history`, apiFetch);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), event: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ date: '', event: '' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiPost(`/plants/${plant.id}/history`, form);
    mutateHistory();
    setShowAdd(false);
    setForm({ date: new Date().toISOString().slice(0, 10), event: '' });
  };

  const handleDelete = (entry: PlantHistory) => {
    let committed = false;
    const tid = setTimeout(async () => { committed = true; await apiDelete(`/plants/${plant.id}/history/${entry.id}`); mutateHistory(); }, 5000);
    showToast(`Deleted history entry`, () => { if (!committed) clearTimeout(tid); });
  };

  // Quick stats
  const earliest = history.length > 0 ? [...history].sort((a, b) => a.date.localeCompare(b.date))[0] : null;

  return (
    <div>
      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>📍 {plant.location || 'Location not set'}</span>
        {earliest && <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 16 }}>Since {earliest.date}</span>}
      </div>

      <Btn onClick={() => setShowAdd(v => !v)} accent={theme.accent} style={{ marginBottom: 16, fontSize: 13 }}>
        {showAdd ? 'Cancel' : '+ Add History Entry'}
      </Btn>

      {showAdd && (
        <form onSubmit={handleAdd} style={{ marginBottom: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 14 }}>
          <Field label="Date"><Input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Field>
          <Field label="Event"><Textarea required value={form.event} onChange={e => setForm(f => ({ ...f, event: e.target.value }))} rows={2} /></Field>
          <Btn type="submit" accent={theme.accent} style={{ fontSize: 13 }}>Save Entry</Btn>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {history.map(h => (
          <div key={h.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 14px' }}>
            {editingId === h.id ? (
              <form onSubmit={async (e) => {
                e.preventDefault();
                await apiPatch(`/plants/${plant.id}/history/${h.id}`, editForm);
                mutateHistory();
                setEditingId(null);
              }}>
                <Field label="Date"><Input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} /></Field>
                <Field label="Event"><Textarea value={editForm.event} onChange={e => setEditForm(f => ({ ...f, event: e.target.value }))} rows={2} /></Field>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn type="submit" accent={theme.accent} style={{ fontSize: 12 }}>Save</Btn>
                  <Btn type="button" variant="ghost" style={{ fontSize: 12 }} onClick={() => setEditingId(null)}>Cancel</Btn>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: 11, color: theme.accent, marginRight: 8 }}>{h.date}</span>
                  <span style={{ fontSize: 14 }}>{h.event}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => { setEditingId(h.id); setEditForm({ date: h.date, event: h.event }); }} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: '2px 6px' }}>✏️</button>
                  <button onClick={() => handleDelete(h)} style={{ color: 'rgba(255,100,100,0.6)', fontSize: 12, padding: '2px 6px' }}>×</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {history.length === 0 && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>No history entries yet.</p>}
      </div>
    </div>
  );
}

function DataTab({ plant, theme, showToast }: { plant: Plant; theme: any; showToast: any }) {
  const { data: photos = [], mutate: mutatePhotos } = useSWR<PlantPhoto[]>(`/api/plants/${plant.id}/photos`, apiFetch);
  const { data: profile, mutate: mutateProfile } = useSWR<BotanicalProfile>(`/api/plants/${plant.id}/botanical-profile`, apiFetch);
  const { data: harvests = [], mutate: mutateHarvests } = useSWR<Harvest[]>(`/api/plants/${plant.id}/harvests`, apiFetch);
  const [uploading, setUploading] = useState(false);
  const [genProfile, setGenProfile] = useState(false);
  const [harvestForm, setHarvestForm] = useState({ date: new Date().toISOString().slice(0, 10), amount: '', notes: '' });
  const [showHarvest, setShowHarvest] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const filename = await uploadImage(file);
      await apiPost(`/plants/${plant.id}/photos`, { filename });
      mutatePhotos();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = (photo: PlantPhoto) => {
    let committed = false;
    const tid = setTimeout(async () => { committed = true; await apiDelete(`/plants/${plant.id}/photos/${photo.id}`); mutatePhotos(); }, 5000);
    showToast('Deleted photo', () => { if (!committed) clearTimeout(tid); });
  };

  const generateProfile = async () => {
    setGenProfile(true);
    try {
      const result = await apiPost<BotanicalProfile>(`/plants/${plant.id}/botanical-profile/generate`, {});
      mutateProfile(result);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setGenProfile(false);
    }
  };

  const handleAddHarvest = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiPost(`/plants/${plant.id}/harvests`, harvestForm);
    mutateHarvests();
    setShowHarvest(false);
    setHarvestForm({ date: new Date().toISOString().slice(0, 10), amount: '', notes: '' });
  };

  return (
    <div>
      {/* Photos */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Photos</h3>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {photos.map(p => (
          <div key={p.id} style={{ position: 'relative', width: 120, height: 90 }}>
            <img src={`/uploads/${p.filename}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
            <button onClick={() => handleDeletePhoto(p)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%', width: 20, height: 20, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        ))}
        {photos.length < 3 && (
          <label style={{ width: 120, height: 90, border: '1px dashed rgba(255,255,255,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexDirection: 'column', gap: 4 }}>
            {uploading ? <Spinner size={20} color={theme.accent} /> : <><span style={{ fontSize: 20 }}>📷</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Add photo</span></>}
            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
          </label>
        )}
      </div>

      {/* Botanical Profile */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Botanical Profile</h3>
      {profile ? (
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 14, marginBottom: 20 }}>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>{profile.text}</div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>Generated {profile.generated_at.slice(0, 10)}</p>
        </div>
      ) : (
        <Btn onClick={generateProfile} disabled={genProfile} accent={theme.accent} style={{ marginBottom: 20, fontSize: 13 }}>
          {genProfile ? <><Spinner size={14} /> Generating...</> : '🔬 Load Botanical Profile'}
        </Btn>
      )}

      {/* Harvests */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Harvest Log</h3>
      <Btn onClick={() => setShowHarvest(v => !v)} accent={theme.accent} style={{ marginBottom: 12, fontSize: 13 }}>
        {showHarvest ? 'Cancel' : '+ Add Harvest'}
      </Btn>
      {showHarvest && (
        <form onSubmit={handleAddHarvest} style={{ marginBottom: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 14 }}>
          <Field label="Date"><Input type="date" required value={harvestForm.date} onChange={e => setHarvestForm(f => ({ ...f, date: e.target.value }))} /></Field>
          <Field label="Amount"><Input value={harvestForm.amount} onChange={e => setHarvestForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 2 lbs" /></Field>
          <Field label="Notes"><Textarea value={harvestForm.notes} onChange={e => setHarvestForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></Field>
          <Btn type="submit" accent={theme.accent} style={{ fontSize: 13 }}>Save</Btn>
        </form>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {harvests.map(h => (
          <div key={h.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 11, color: theme.accent, marginRight: 8 }}>{h.date}</span>
              {h.amount && <span style={{ fontSize: 14, fontWeight: 600 }}>{h.amount}</span>}
              {h.notes && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginLeft: 8 }}>{h.notes}</span>}
            </div>
            <button onClick={() => apiDelete(`/plants/${plant.id}/harvests/${h.id}`).then(() => mutateHarvests())} style={{ color: 'rgba(255,100,100,0.6)', fontSize: 13 }}>×</button>
          </div>
        ))}
        {harvests.length === 0 && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>No harvests recorded yet.</p>}
      </div>
    </div>
  );
}

function DiagnoseTab({ plant, theme }: { plant: Plant; theme: any }) {
  const [image, setImage] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const diagnose = async () => {
    if (!image) return;
    setLoading(true);
    setDiagnosis('');
    setError('');
    try {
      const base64 = image.split(',')[1];
      const res = await fetch('/api/ai/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          imageBase64: base64,
          prompt: `Diagnose any issues with this ${plant.plant_name} (${plant.class} / ${plant.species} / ${plant.variety}). Be specific about what you see and recommend treatment. Consider West Texas conditions.`,
        }),
      });
      if (!res.ok) throw new Error('Diagnosis failed');
      const data = await res.json();
      setDiagnosis(data.content);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
        Upload a photo of your plant to get an AI diagnosis of any issues.
      </p>

      <label style={{ display: 'inline-block', padding: '10px 20px', background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.25)', borderRadius: 8, cursor: 'pointer', marginBottom: 16 }}>
        📷 Choose Photo
        <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
      </label>

      {image && (
        <div style={{ marginBottom: 16 }}>
          <img src={image} alt="" style={{ maxWidth: 300, maxHeight: 200, objectFit: 'contain', borderRadius: 8, display: 'block', marginBottom: 10 }} />
          <Btn onClick={diagnose} disabled={loading} accent={theme.accent}>
            {loading ? <><Spinner size={14} /> Diagnosing...</> : '🔬 Diagnose'}
          </Btn>
        </div>
      )}

      {error && <p style={{ color: '#fca5a5', fontSize: 14, marginBottom: 12 }}>{error} <button onClick={diagnose} style={{ color: theme.accent, fontSize: 13 }}>Retry</button></p>}

      {diagnosis && (
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 16, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.9)' }}>
          {diagnosis}
        </div>
      )}
    </div>
  );
}
