import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Project, ProjectMaterial, ProjectLabor, ProjectNote, ProjectResource } from '../../types';
import { apiFetch, apiPost, apiPatch, apiDelete, uploadImage } from '../../api';
import { Btn, Field, Input, Textarea, Select, Spinner } from '../shared/FormFields';
import { useToast } from '../shared/Toast';

interface Theme { accent: string; accentDim: string; glass: string }

const STATUSES: Project['status'][] = ['active', 'todo', 'completed'];
const STATUS_LABELS = { active: '🔨 Active', todo: '📋 To Do', completed: '✅ Completed' };
const STATUS_ICONS = { active: '🔨', todo: '📋', completed: '✅' };

export function ProjectsModule({ theme }: { theme: Theme }) {
  const { data: projects = [] } = useSWR<Project[]>('/api/projects', apiFetch);
  const [selected, setSelected] = useState<Project | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', owner: 'Both', category: 'House', budget: '', next_action: '' });
  const { showToast } = useToast();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const proj = await apiPost<Project>('/projects', { ...form, budget: parseFloat(form.budget) || null, status: 'todo' });
    mutate('/api/projects');
    setShowAdd(false);
    setSelected(proj);
    setForm({ title: '', owner: 'Both', category: 'House', budget: '', next_action: '' });
  };

  const grouped = STATUSES.map(s => ({ status: s, items: projects.filter(p => p.status === s) }));

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ padding: '16px 20px' }}>
        <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 22, marginBottom: 16 }}>🪵 Projects</h2>

        {grouped.map(({ status, items }) => (
          <div key={status} style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              {STATUS_LABELS[status]}
            </h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {items.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelected(selected?.id === p.id ? null : p)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13,
                    background: selected?.id === p.id ? theme.accentDim : 'rgba(0,0,0,0.3)',
                    color: selected?.id === p.id ? theme.accent : '#f0ead6',
                    border: `1px solid ${selected?.id === p.id ? theme.accent : 'rgba(255,255,255,0.15)'}`,
                  }}
                >
                  {STATUS_ICONS[status]} {p.title}
                </button>
              ))}
              {items.length === 0 && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No {status} projects yet</span>}
            </div>
          </div>
        ))}

        {!showAdd && (
          <Btn onClick={() => setShowAdd(true)} accent={theme.accent} style={{ marginBottom: 20, fontSize: 13 }}>+ New Project</Btn>
        )}

        {showAdd && (
          <form onSubmit={handleAdd} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <Field label="Title"><Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Field>
              </div>
              <Field label="Owner">
                <Select value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}>
                  {['Sarah', 'Kyle', 'Both', 'Hire Out'].map(o => <option key={o}>{o}</option>)}
                </Select>
              </Field>
              <Field label="Category">
                <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {['House', 'Land', 'Kitchen', 'Shop', 'Garden', 'Other'].map(c => <option key={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Budget ($)"><Input type="number" step="0.01" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} /></Field>
              <div style={{ gridColumn: '1/-1' }}>
                <Field label="Next Action"><Textarea value={form.next_action} onChange={e => setForm(f => ({ ...f, next_action: e.target.value }))} rows={2} /></Field>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn type="submit" accent={theme.accent}>Create Project</Btn>
              <Btn type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
            </div>
          </form>
        )}

        {selected && (
          <ProjectDetail
            key={selected.id}
            project={selected}
            theme={theme}
            onUpdate={(updated) => { mutate('/api/projects'); setSelected(updated); }}
            onDelete={() => {
              const proj = selected;
              setSelected(null);
              let committed = false;
              const tid = setTimeout(async () => { committed = true; await apiDelete(`/projects/${proj.id}`); mutate('/api/projects'); }, 5000);
              showToast(`Deleted "${proj.title}"`, () => { if (!committed) clearTimeout(tid); });
            }}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
}

function ProjectDetail({ project, theme, onUpdate, onDelete, showToast }: {
  project: Project; theme: Theme;
  onUpdate: (p: Project) => void; onDelete: () => void;
  showToast: (msg: string, undo?: () => void) => void;
}) {
  const { data: materials = [], mutate: mutateMaterials } = useSWR<ProjectMaterial[]>(`/api/projects/${project.id}/materials`, apiFetch);
  const { data: labor = [], mutate: mutateLabor } = useSWR<ProjectLabor[]>(`/api/projects/${project.id}/labor`, apiFetch);
  const { data: notes = [], mutate: mutateNotes } = useSWR<ProjectNote[]>(`/api/projects/${project.id}/notes`, apiFetch);
  const { data: resources = [], mutate: mutateResources } = useSWR<ProjectResource[]>(`/api/projects/${project.id}/resources`, apiFetch);
  const { data: images = [], mutate: mutateImages } = useSWR<{ id: string; filename: string }[]>(`/api/projects/${project.id}/images`, apiFetch);

  const [editTitle, setEditTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(project.title);
  const [editNextAction, setEditNextAction] = useState(false);
  const [nextActionVal, setNextActionVal] = useState(project.next_action || '');
  const [uploading, setUploading] = useState(false);

  const matTotal = materials.reduce((s, m) => s + (m.cost || 0), 0);
  const laborTotal = labor.reduce((s, l) => s + (l.cost || 0), 0);
  const stillNeeded = (project.budget || 0) - (matTotal + laborTotal);

  const [matForm, setMatForm] = useState({ name: '', cost: '', where_buy: '' });
  const [laborForm, setLaborForm] = useState({ description: '', cost: '', contractor: '' });
  const [noteText, setNoteText] = useState('');
  const [resForm, setResForm] = useState({ label: '', url: '' });

  const sectionHeader = (label: string) => (
    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, marginTop: 24 }}>{label}</h3>
  );

  const tileStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' };

  return (
    <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 12, padding: '20px', marginTop: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
      {/* Title + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          {editTitle ? (
            <form onSubmit={async (e) => { e.preventDefault(); const updated = await apiPatch<Project>(`/projects/${project.id}`, { title: titleVal }); onUpdate(updated); setEditTitle(false); }} style={{ display: 'flex', gap: 8 }}>
              <Input value={titleVal} onChange={e => setTitleVal(e.target.value)} style={{ fontSize: 20 }} autoFocus />
              <Btn type="submit" accent={theme.accent} style={{ fontSize: 13 }}>Save</Btn>
            </form>
          ) : (
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 22, cursor: 'pointer' }} onClick={() => setEditTitle(true)}>
              {project.title} <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>✏️</span>
            </h2>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <select
              value={project.status}
              onChange={async (e) => { const updated = await apiPatch<Project>(`/projects/${project.id}`, { status: e.target.value }); onUpdate(updated); }}
              style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: theme.accent, fontSize: 12, fontFamily: 'Lora, Georgia, serif' }}
            >
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            {project.owner && <span style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '3px 10px', borderRadius: 12, fontSize: 12 }}>{project.owner}</span>}
            {project.category && <span style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '3px 10px', borderRadius: 12, fontSize: 12 }}>{project.category}</span>}
            {project.start_date && <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', padding: '3px 10px', borderRadius: 12, fontSize: 12 }}>Started {project.start_date}</span>}
          </div>
        </div>
        <Btn variant="danger" onClick={onDelete} style={{ fontSize: 12, padding: '5px 12px' }}>Delete</Btn>
      </div>

      {/* Next Action */}
      <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>⚡ Next Action</div>
        {editNextAction ? (
          <form onSubmit={async (e) => { e.preventDefault(); const updated = await apiPatch<Project>(`/projects/${project.id}`, { next_action: nextActionVal }); onUpdate(updated); setEditNextAction(false); }} style={{ display: 'flex', gap: 8 }}>
            <Textarea value={nextActionVal} onChange={e => setNextActionVal(e.target.value)} rows={2} style={{ flex: 1 }} autoFocus />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Btn type="submit" accent="#4ade80" style={{ fontSize: 12 }}>Save</Btn>
              <Btn type="button" variant="ghost" style={{ fontSize: 12 }} onClick={() => setEditNextAction(false)}>Cancel</Btn>
            </div>
          </form>
        ) : (
          <div onClick={() => setEditNextAction(true)} style={{ cursor: 'pointer', fontSize: 14 }}>
            {project.next_action || <span style={{ color: 'rgba(255,255,255,0.3)' }}>Click to set next action...</span>}
            <span style={{ marginLeft: 8, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>✏️</span>
          </div>
        )}
      </div>

      {/* Cost tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 8 }}>
        <div style={tileStyle}><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>Budget</div><div style={{ fontSize: 18, fontWeight: 700 }}>${(project.budget || 0).toLocaleString()}</div></div>
        <div style={tileStyle}><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>Materials</div><div style={{ fontSize: 18, fontWeight: 700 }}>${matTotal.toLocaleString()}</div></div>
        <div style={tileStyle}><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>Labor</div><div style={{ fontSize: 18, fontWeight: 700 }}>${laborTotal.toLocaleString()}</div></div>
        <div style={{ ...tileStyle, background: stillNeeded < 0 ? 'rgba(255,50,50,0.15)' : 'rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>Still Needed</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: stillNeeded < 0 ? '#fca5a5' : '#f0ead6' }}>${Math.abs(stillNeeded).toLocaleString()}{stillNeeded < 0 ? ' over' : ''}</div>
        </div>
      </div>

      {/* Materials */}
      {sectionHeader('🔩 Materials')}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 10 }}>
        <thead>
          <tr style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase' }}>
            <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600 }}>Item</th>
            <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>Cost</th>
            <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600 }}>Where</th>
            <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 600 }}>Bought</th>
            <th style={{ width: 30 }} />
          </tr>
        </thead>
        <tbody>
          {materials.map(m => (
            <tr key={m.id} style={{ background: m.bought ? 'rgba(74,222,128,0.04)' : 'transparent' }}>
              <td style={{ padding: '6px 8px', textDecoration: m.bought ? 'line-through' : 'none', color: m.bought ? 'rgba(255,255,255,0.4)' : '#f0ead6' }}>{m.name}</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{m.cost ? `$${m.cost.toLocaleString()}` : '—'}</td>
              <td style={{ padding: '6px 8px', color: 'rgba(255,255,255,0.5)' }}>{m.where_buy || '—'}</td>
              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                <input type="checkbox" checked={!!m.bought} onChange={async () => { await apiPatch(`/projects/${project.id}/materials/${m.id}`, { bought: !m.bought }); mutateMaterials(); }} style={{ accentColor: '#4ade80' }} />
              </td>
              <td>
                <button onClick={() => {
                  let committed = false;
                  const tid = setTimeout(async () => { committed = true; await apiDelete(`/projects/${project.id}/materials/${m.id}`); mutateMaterials(); }, 5000);
                  showToast(`Deleted "${m.name}"`, () => { if (!committed) clearTimeout(tid); });
                }} style={{ color: 'rgba(255,100,100,0.6)', fontSize: 16 }}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={async (e) => { e.preventDefault(); await apiPost(`/projects/${project.id}/materials`, { ...matForm, cost: parseFloat(matForm.cost) || null }); mutateMaterials(); setMatForm({ name: '', cost: '', where_buy: '' }); }} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Input required placeholder="Item name" value={matForm.name} onChange={e => setMatForm(f => ({ ...f, name: e.target.value }))} style={{ flex: 2 }} />
        <Input type="number" placeholder="Cost" value={matForm.cost} onChange={e => setMatForm(f => ({ ...f, cost: e.target.value }))} style={{ flex: 1 }} />
        <Input placeholder="Where to buy" value={matForm.where_buy} onChange={e => setMatForm(f => ({ ...f, where_buy: e.target.value }))} style={{ flex: 1 }} />
        <Btn type="submit" accent={theme.accent} style={{ flexShrink: 0, fontSize: 12 }}>Add</Btn>
      </form>

      {/* Labor */}
      {sectionHeader('👷 Labor & Contractors')}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 10 }}>
        <thead>
          <tr style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase' }}>
            <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600 }}>Description</th>
            <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>Cost</th>
            <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600 }}>Contractor</th>
            <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 600 }}>Paid</th>
            <th style={{ width: 30 }} />
          </tr>
        </thead>
        <tbody>
          {labor.map(l => (
            <tr key={l.id}>
              <td style={{ padding: '6px 8px', textDecoration: l.paid ? 'line-through' : 'none', color: l.paid ? 'rgba(255,255,255,0.4)' : '#f0ead6' }}>{l.description}</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{l.cost ? `$${l.cost.toLocaleString()}` : '—'}</td>
              <td style={{ padding: '6px 8px', color: 'rgba(255,255,255,0.5)' }}>{l.contractor || '—'}</td>
              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                <input type="checkbox" checked={!!l.paid} onChange={async () => { await apiPatch(`/projects/${project.id}/labor/${l.id}`, { paid: !l.paid }); mutateLabor(); }} style={{ accentColor: '#4ade80' }} />
              </td>
              <td>
                <button onClick={() => {
                  let committed = false;
                  const tid = setTimeout(async () => { committed = true; await apiDelete(`/projects/${project.id}/labor/${l.id}`); mutateLabor(); }, 5000);
                  showToast(`Deleted labor entry`, () => { if (!committed) clearTimeout(tid); });
                }} style={{ color: 'rgba(255,100,100,0.6)', fontSize: 16 }}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={async (e) => { e.preventDefault(); await apiPost(`/projects/${project.id}/labor`, { ...laborForm, cost: parseFloat(laborForm.cost) || null }); mutateLabor(); setLaborForm({ description: '', cost: '', contractor: '' }); }} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Input required placeholder="Description" value={laborForm.description} onChange={e => setLaborForm(f => ({ ...f, description: e.target.value }))} style={{ flex: 2 }} />
        <Input type="number" placeholder="Cost" value={laborForm.cost} onChange={e => setLaborForm(f => ({ ...f, cost: e.target.value }))} style={{ flex: 1 }} />
        <Input placeholder="Contractor" value={laborForm.contractor} onChange={e => setLaborForm(f => ({ ...f, contractor: e.target.value }))} style={{ flex: 1 }} />
        <Btn type="submit" accent={theme.accent} style={{ flexShrink: 0, fontSize: 12 }}>Add</Btn>
      </form>

      {/* Notes */}
      {sectionHeader('📝 Notes Log')}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Textarea placeholder="Add a note..." value={noteText} onChange={e => setNoteText(e.target.value)} rows={2} style={{ flex: 1 }} />
        <Btn onClick={async () => { if (!noteText.trim()) return; await apiPost(`/projects/${project.id}/notes`, { date: new Date().toISOString().slice(0, 10), text: noteText }); mutateNotes(); setNoteText(''); }} accent={theme.accent} style={{ alignSelf: 'flex-end', flexShrink: 0, fontSize: 12 }}>Add</Btn>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notes.map(n => (
          <div key={n.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between' }}>
            <div><span style={{ fontSize: 11, color: theme.accent, marginRight: 8 }}>{n.date}</span><span style={{ fontSize: 14 }}>{n.text}</span></div>
            <button onClick={() => {
              let committed = false;
              const tid = setTimeout(async () => { committed = true; await apiDelete(`/projects/${project.id}/notes/${n.id}`); mutateNotes(); }, 5000);
              showToast('Deleted note', () => { if (!committed) clearTimeout(tid); });
            }} style={{ color: 'rgba(255,100,100,0.5)', fontSize: 16, flexShrink: 0 }}>×</button>
          </div>
        ))}
      </div>

      {/* Resources */}
      {sectionHeader('🔗 Resources')}
      <form onSubmit={async (e) => { e.preventDefault(); await apiPost(`/projects/${project.id}/resources`, resForm); mutateResources(); setResForm({ label: '', url: '' }); }} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <Input required placeholder="Label" value={resForm.label} onChange={e => setResForm(f => ({ ...f, label: e.target.value }))} style={{ flex: 1 }} />
        <Input type="url" required placeholder="URL" value={resForm.url} onChange={e => setResForm(f => ({ ...f, url: e.target.value }))} style={{ flex: 2 }} />
        <Btn type="submit" accent={theme.accent} style={{ flexShrink: 0, fontSize: 12 }}>Add</Btn>
      </form>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {resources.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href={r.url || '#'} target="_blank" rel="noopener noreferrer" style={{ color: theme.accent, fontSize: 14, flex: 1 }}>🔗 {r.label}</a>
            <button onClick={() => {
              let committed = false;
              const tid = setTimeout(async () => { committed = true; await apiDelete(`/projects/${project.id}/resources/${r.id}`); mutateResources(); }, 5000);
              showToast('Deleted resource', () => { if (!committed) clearTimeout(tid); });
            }} style={{ color: 'rgba(255,100,100,0.5)', fontSize: 16 }}>×</button>
          </div>
        ))}
      </div>

      {/* Project Images */}
      {sectionHeader('📷 Project Photos')}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {images.map(img => (
          <div key={img.id} style={{ position: 'relative', width: 120, height: 90 }}>
            <img src={`/uploads/${img.filename}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
            <button onClick={() => {
              let committed = false;
              const tid = setTimeout(async () => { committed = true; await apiDelete(`/projects/${project.id}/images/${img.id}`); mutateImages(); }, 5000);
              showToast('Deleted image', () => { if (!committed) clearTimeout(tid); });
            }} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%', width: 20, height: 20, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        ))}
        <label style={{ width: 120, height: 90, border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexDirection: 'column', gap: 4 }}>
          {uploading ? <Spinner size={20} color={theme.accent} /> : <><span style={{ fontSize: 20 }}>📷</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Add</span></>}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            try { const fn = await uploadImage(file); await apiPost(`/projects/${project.id}/images`, { filename: fn }); mutateImages(); }
            catch (err: any) { alert(`Upload error: ${err.message}`); }
            finally { setUploading(false); }
          }} />
        </label>
      </div>
    </div>
  );
}
