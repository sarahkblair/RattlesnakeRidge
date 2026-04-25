import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { MaintenanceTask, MaintenanceHistory } from '../../types';
import { apiFetch, apiPost, apiPatch, apiDelete } from '../../api';
import { Btn, Field, Input, Textarea, Select, Spinner } from '../shared/FormFields';
import { Modal } from '../shared/Modal';
import { useToast } from '../shared/Toast';

interface Theme { accent: string; accentDim: string; glass: string }

type SubNav = 'due' | 'library' | 'history';

export function MaintenanceModule({ theme }: { theme: Theme }) {
  const [sub, setSub] = useState<SubNav>('due');

  const navStyle = (s: SubNav): React.CSSProperties => ({
    padding: '8px 18px', fontSize: 14, fontFamily: 'Lora, Georgia, serif',
    color: sub === s ? theme.accent : 'rgba(255,255,255,0.6)',
    background: sub === s ? theme.accentDim : 'transparent',
    border: 'none', borderBottom: sub === s ? `2px solid ${theme.accent}` : '2px solid transparent',
    cursor: 'pointer',
  });

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      <div style={{ width: 168, flexShrink: 0, background: 'rgba(0,0,0,0.2)', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', padding: '12px 0' }}>
        <button style={navStyle('due')} onClick={() => setSub('due')}>📅 Due Soon</button>
        <button style={navStyle('library')} onClick={() => setSub('library')}>📋 Task Library</button>
        <button style={navStyle('history')} onClick={() => setSub('history')}>📊 History</button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {sub === 'due' && <DueSoon theme={theme} />}
        {sub === 'library' && <TaskLibrary theme={theme} />}
        {sub === 'history' && <HistoryView theme={theme} />}
      </div>
    </div>
  );
}

function DueSoon({ theme }: { theme: Theme }) {
  const { data: tasks = [] } = useSWR<MaintenanceTask[]>('/api/maintenance/tasks', apiFetch);
  const [completing, setCompleting] = useState<MaintenanceTask | null>(null);
  const [completeForm, setCompleteForm] = useState({ who: 'Both', notes: '' });
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const taskColor = (task: MaintenanceTask): React.CSSProperties => {
    if (!task.next_due_at) return {};
    const days = Math.round((new Date(task.next_due_at).getTime() - new Date(today).getTime()) / 86400000);
    if (days < 0) return { background: 'rgba(255,50,50,0.12)', borderLeft: '3px solid #ef4444' };
    if (days <= 7) return { background: 'rgba(255,217,61,0.08)', borderLeft: '3px solid #FFD93D' };
    return { background: 'rgba(74,222,128,0.05)', borderLeft: '3px solid rgba(74,222,128,0.3)' };
  };

  const daysLabel = (task: MaintenanceTask) => {
    if (!task.next_due_at) return 'No due date';
    const days = Math.round((new Date(task.next_due_at).getTime() - new Date(today).getTime()) / 86400000);
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    return `Due in ${days} days`;
  };

  const handleComplete = async () => {
    if (!completing) return;
    setLoading(true);
    try {
      await apiPost(`/maintenance/tasks/${completing.id}/complete`, completeForm);
      mutate('/api/maintenance/tasks');
      mutate('/api/maintenance/history');
      setCompleting(null);
      setCompleteForm({ who: 'Both', notes: '' });
    } finally {
      setLoading(false);
    }
  };

  const sorted = [...tasks].sort((a, b) => (a.next_due_at || '').localeCompare(b.next_due_at || ''));

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 20 }}>
      <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 20, marginBottom: 16 }}>📅 Due Soon</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map(task => (
          <div key={task.id} style={{ borderRadius: 10, padding: '12px 16px', ...taskColor(task), background: taskColor(task).background, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{task.name}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {task.category && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{task.category}</span>}
                <span style={{ fontSize: 12, color: task.next_due_at && new Date(task.next_due_at) < new Date(today) ? '#fca5a5' : 'rgba(255,255,255,0.55)' }}>
                  {task.next_due_at} · {daysLabel(task)}
                </span>
              </div>
            </div>
            <Btn onClick={() => setCompleting(task)} accent={theme.accent} style={{ fontSize: 12, padding: '6px 14px', flexShrink: 0 }}>
              Mark Complete
            </Btn>
          </div>
        ))}
        {tasks.length === 0 && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>No tasks yet. Add some in Task Library.</p>}
      </div>

      {completing && (
        <Modal title={`Complete: ${completing.name}`} onClose={() => setCompleting(null)}>
          <Field label="Who completed it?">
            <Select value={completeForm.who} onChange={e => setCompleteForm(f => ({ ...f, who: e.target.value }))}>
              <option>Sarah</option><option>Kyle</option><option>Both</option>
            </Select>
          </Field>
          <Field label="Notes (optional)">
            <Textarea value={completeForm.notes} onChange={e => setCompleteForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
          </Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={handleComplete} disabled={loading} accent={theme.accent}>
              {loading ? <Spinner size={14} color="#fff" /> : '✓ Mark Complete'}
            </Btn>
            <Btn variant="ghost" onClick={() => setCompleting(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TaskLibrary({ theme }: { theme: Theme }) {
  const { data: tasks = [] } = useSWR<MaintenanceTask[]>('/api/maintenance/tasks', apiFetch);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'House', frequency_days: '30', notes: '' });
  const { showToast } = useToast();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiPost('/maintenance/tasks', { ...form, frequency_days: parseInt(form.frequency_days) });
    mutate('/api/maintenance/tasks');
    setShowAdd(false);
    setForm({ name: '', category: 'House', frequency_days: '30', notes: '' });
  };

  const handleDelete = (task: MaintenanceTask) => {
    let committed = false;
    const tid = setTimeout(async () => { committed = true; await apiDelete(`/maintenance/tasks/${task.id}`); mutate('/api/maintenance/tasks'); }, 5000);
    showToast(`Deleted "${task.name}"`, () => { if (!committed) clearTimeout(tid); });
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 20 }}>📋 Task Library</h2>
        <Btn onClick={() => setShowAdd(v => !v)} accent={theme.accent} style={{ fontSize: 13 }}>
          {showAdd ? 'Cancel' : '+ Add Task'}
        </Btn>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <Field label="Task Name"><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Category">
              <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['House', 'Land', 'Systems', 'Animals', 'Other'].map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Every (days)"><Input type="number" required min="1" value={form.frequency_days} onChange={e => setForm(f => ({ ...f, frequency_days: e.target.value }))} /></Field>
          </div>
          <Field label="Notes"><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></Field>
          <Btn type="submit" accent={theme.accent}>Add Task</Btn>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map(task => (
          <div key={task.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{task.name}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                {task.category && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{task.category}</span>}
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Every {task.frequency_days} days</span>
                {task.last_done_at && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Last done {task.last_done_at}</span>}
              </div>
            </div>
            <button onClick={() => handleDelete(task)} style={{ color: 'rgba(255,100,100,0.6)', fontSize: 20 }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryView({ theme }: { theme: Theme }) {
  const { data: history = [] } = useSWR<MaintenanceHistory[]>('/api/maintenance/history', apiFetch);
  const [search, setSearch] = useState('');

  const filtered = history.filter(h =>
    !search || h.task_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 20 }}>
      <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 20, marginBottom: 16 }}>📊 Completion History</h2>
      <div style={{ marginBottom: 16 }}>
        <Input placeholder="Filter by task name..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(h => (
          <div key={h.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{h.task_name}</span>
                {h.who && <span style={{ marginLeft: 8, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>by {h.who}</span>}
              </div>
              <span style={{ fontSize: 12, color: theme.accent, flexShrink: 0 }}>{h.completed_at.slice(0, 10)}</span>
            </div>
            {h.notes && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{h.notes}</p>}
          </div>
        ))}
        {filtered.length === 0 && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>No history yet.</p>}
      </div>
    </div>
  );
}
