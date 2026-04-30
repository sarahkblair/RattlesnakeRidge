import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../utils/api.js';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function RestTimer({ seconds, onDone }) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(intervalRef.current); onDone(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (remaining === 0) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880; gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start(); osc.stop(ctx.currentTime + 0.8);
      } catch (e) {}
    }
  }, [remaining]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--clay-pale)', borderRadius: 'var(--radius)', border: '1.5px solid var(--clay-light)' }}>
      <span style={{ fontSize: 13, color: 'var(--clay)', fontWeight: 700 }}>Rest</span>
      <span style={{ fontSize: 22, fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--clay)', minWidth: 52 }}>
        {mins}:{String(secs).padStart(2, '0')}
      </span>
      <button onClick={onDone} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'var(--clay)', color: '#fff', border: 'none' }}>Skip</button>
    </div>
  );
}

function SetRow({ plan, log, prevLog, onLog, setNum }) {
  const [reps, setReps] = useState(log?.reps ?? plan?.target_reps ?? '');
  const [weight, setWeight] = useState(log?.weight ?? prevLog?.weight ?? '');
  const [done, setDone] = useState(!!log);

  const handleDone = () => {
    if (done) return;
    setDone(true);
    onLog({ reps: Number(reps) || null, weight: Number(weight) || null });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-light)', minWidth: 20 }}>{setNum}</span>
      <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="lbs" style={{ width: 64, fontSize: 13, padding: '4px 8px' }} disabled={done} />
      <span style={{ fontSize: 12, color: 'var(--text-light)' }}>×</span>
      <input type="number" value={reps} onChange={e => setReps(e.target.value)} placeholder={plan?.target_reps || 'reps'} style={{ width: 56, fontSize: 13, padding: '4px 8px' }} disabled={done} />
      {prevLog && <span style={{ fontSize: 11, color: 'var(--text-light)', minWidth: 80 }}>last: {prevLog.weight}×{prevLog.reps}</span>}
      <button onClick={handleDone} disabled={done} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, background: done ? 'var(--sage-pale)' : 'var(--clay)', color: done ? 'var(--sage-dark)' : '#fff', border: 'none', marginLeft: 'auto' }}>
        {done ? '✓ Done' : 'Log'}
      </button>
    </div>
  );
}

function ExerciseBlock({ exercise, logs, prevLogs, onLog, restSecs }) {
  const [timer, setTimer] = useState(null);
  const setPlans = exercise.set_plans || [];

  const handleLog = (setNum, data) => {
    onLog(exercise.id, setNum, data);
    setTimer(restSecs || 90);
  };

  return (
    <div style={{ marginBottom: 20, padding: 16, background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 700, flex: 1 }}>{exercise.name}</span>
        {exercise.sets && <span style={{ fontSize: 11, color: 'var(--text-light)' }}>{exercise.sets} sets</span>}
        {exercise.notes && <span style={{ fontSize: 11, color: 'var(--text-light)', fontStyle: 'italic' }}>{exercise.notes}</span>}
      </div>
      {timer !== null && timer > 0 && <div style={{ marginBottom: 10 }}><RestTimer seconds={timer} onDone={() => setTimer(null)} /></div>}
      {setPlans.length > 0 ? setPlans.map((plan, i) => (
        <SetRow key={plan.id} setNum={i + 1} plan={plan}
          log={logs?.find(l => l.set_number === i + 1)}
          prevLog={prevLogs?.find(l => l.set_number === i + 1)}
          onLog={d => handleLog(i + 1, d)} />
      )) : Array.from({ length: exercise.sets || 3 }, (_, i) => (
        <SetRow key={i} setNum={i + 1} plan={null}
          log={logs?.find(l => l.set_number === i + 1)}
          prevLog={prevLogs?.find(l => l.set_number === i + 1)}
          onLog={d => handleLog(i + 1, d)} />
      ))}
    </div>
  );
}

function TodayWorkout({ todayData, onLog }) {
  const { day, exercises, logs, prev_logs } = todayData;

  if (!exercises || exercises.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)', fontStyle: 'italic' }}>Rest day — no exercises today.</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-light)' }}>{day?.name || 'Today'}</span>
        {day?.focus && <span style={{ fontSize: 12, color: 'var(--clay)', fontWeight: 600 }}>{day.focus}</span>}
      </div>
      {exercises.map(ex => (
        <ExerciseBlock key={ex.id} exercise={ex}
          logs={(logs || []).filter(l => l.exercise_id === ex.id)}
          prevLogs={(prev_logs || []).filter(l => l.exercise_id === ex.id)}
          onLog={(exId, setNum, data) => onLog(exId, setNum, data)}
          restSecs={day?.rest_seconds || 90} />
      ))}
    </div>
  );
}

function BlockBuilder({ block, onSave, onClose }) {
  const [name, setName] = useState(block?.name || '');
  const [days, setDays] = useState(block?.days || []);
  const [saving, setSaving] = useState(false);

  const addDay = () => setDays(d => [...d, { day_of_week: 'Monday', name: '', focus: '', exercises: [], rest_seconds: 90 }]);
  const removeDay = i => setDays(d => d.filter((_, j) => j !== i));
  const updateDay = (i, field, val) => setDays(d => d.map((day, j) => j === i ? { ...day, [field]: val } : day));
  const addExercise = dayIdx => setDays(d => d.map((day, j) => j === dayIdx ? { ...day, exercises: [...(day.exercises || []), { name: '', sets: 3, notes: '' }] } : day));
  const removeExercise = (dayIdx, exIdx) => setDays(d => d.map((day, j) => j === dayIdx ? { ...day, exercises: day.exercises.filter((_, k) => k !== exIdx) } : day));
  const updateExercise = (dayIdx, exIdx, field, val) => setDays(d => d.map((day, j) => j === dayIdx ? { ...day, exercises: day.exercises.map((ex, k) => k === exIdx ? { ...ex, [field]: val } : ex) } : day));

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (block?.id) {
        await api.updateBlock(block.id, { name, days, is_active: block.is_active });
      } else {
        await api.createBlock({ name, days, is_active: 1 });
      }
      onSave();
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onClose} className="btn-ghost" style={{ fontSize: 13 }}>← Back</button>
        <h2 style={{ flex: 1, fontSize: 18 }}>{block ? 'Edit Block' : 'New Training Block'}</h2>
        <button className="btn-primary" onClick={handleSave} disabled={saving || !name.trim()}>{saving ? 'Saving…' : 'Save Block'}</button>
      </div>

      <div className="form-field">
        <label className="form-label">Block Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Strength Phase 1" />
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Training Days</span>
          <button className="btn-outline" onClick={addDay} style={{ fontSize: 12 }}>+ Add Day</button>
        </div>
        {days.map((day, i) => (
          <div key={i} style={{ marginBottom: 16, padding: 14, background: 'var(--card)', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <select value={day.day_of_week} onChange={e => updateDay(i, 'day_of_week', e.target.value)} style={{ flex: 1, minWidth: 110, fontSize: 13 }}>
                {DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
              <input value={day.name} onChange={e => updateDay(i, 'name', e.target.value)} placeholder="Day name (optional)" style={{ flex: 2, minWidth: 140, fontSize: 13 }} />
              <input value={day.focus} onChange={e => updateDay(i, 'focus', e.target.value)} placeholder="Focus (e.g. Upper Body)" style={{ flex: 2, minWidth: 140, fontSize: 13 }} />
              <input type="number" value={day.rest_seconds} onChange={e => updateDay(i, 'rest_seconds', e.target.value)} placeholder="Rest (s)" style={{ width: 80, fontSize: 13 }} />
              <button onClick={() => removeDay(i)} style={{ color: '#c0392b', fontSize: 12, padding: '4px 8px' }}>✕</button>
            </div>
            <div style={{ marginLeft: 4 }}>
              {(day.exercises || []).map((ex, j) => (
                <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                  <input value={ex.name} onChange={e => updateExercise(i, j, 'name', e.target.value)} placeholder="Exercise name" style={{ flex: 3, fontSize: 13 }} />
                  <input type="number" value={ex.sets} onChange={e => updateExercise(i, j, 'sets', e.target.value)} placeholder="Sets" style={{ width: 60, fontSize: 13 }} />
                  <input value={ex.notes} onChange={e => updateExercise(i, j, 'notes', e.target.value)} placeholder="Notes" style={{ flex: 2, fontSize: 13 }} />
                  <button onClick={() => removeExercise(i, j)} style={{ color: '#c0392b', fontSize: 12 }}>✕</button>
                </div>
              ))}
              <button onClick={() => addExercise(i)} style={{ fontSize: 12, color: 'var(--clay)', marginTop: 4, padding: 0 }}>+ Add Exercise</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorkoutTab() {
  const [view, setView] = useState('today'); // 'today' | 'blocks' | 'builder'
  const [todayData, setTodayData] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [editingBlock, setEditingBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const wakeLockRef = useRef(null);

  useEffect(() => {
    load();
    acquireWakeLock();
    return () => releaseWakeLock();
  }, []);

  async function acquireWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (e) {}
  }

  function releaseWakeLock() {
    if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
  }

  async function load() {
    setLoading(true);
    try {
      const [today, allBlocks] = await Promise.all([
        api.getTodayWorkout().catch(() => null),
        api.getWorkoutBlocks().catch(() => []),
      ]);
      setTodayData(today);
      setBlocks(allBlocks);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleLog(exerciseId, setNumber, data) {
    try {
      await api.logSets({ exercise_id: exerciseId, set_number: setNumber, ...data });
    } catch (e) { console.error(e); }
  }

  async function handleDeleteBlock(id) {
    if (!confirm('Delete this training block?')) return;
    await api.deleteBlock(id);
    load();
  }

  if (view === 'builder') {
    return <BlockBuilder block={editingBlock} onSave={() => { setView('blocks'); setEditingBlock(null); load(); }} onClose={() => { setView('blocks'); setEditingBlock(null); }} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--panel)', flexShrink: 0 }}>
        {[['today',"Today's Workout"],['blocks','Training Blocks']].map(([v, lbl]) => (
          <button key={v} onClick={() => setView(v)} style={{ fontSize: 12, padding: '4px 14px', borderRadius: 99, fontWeight: 700, background: view === v ? 'var(--clay)' : 'transparent', color: view === v ? '#fff' : 'var(--text-light)', border: `1px solid ${view === v ? 'var(--clay)' : 'var(--border)'}` }}>
            {lbl}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-light)', fontStyle: 'italic', padding: 40 }}>Loading…</div>
        ) : view === 'today' ? (
          todayData ? <TodayWorkout todayData={todayData} onLog={handleLog} /> : (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 14, color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 16 }}>No active training block. Set one up to start tracking your workouts.</div>
              <button className="btn-primary" onClick={() => setView('blocks')}>Set Up Training Block</button>
            </div>
          )
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Training Blocks</span>
              <button className="btn-primary" onClick={() => { setEditingBlock(null); setView('builder'); }} style={{ fontSize: 12 }}>+ New Block</button>
            </div>
            {blocks.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-light)', fontStyle: 'italic', padding: 30 }}>No training blocks yet.</div>
            ) : blocks.map(block => (
              <div key={block.id} style={{ marginBottom: 12, padding: '12px 16px', background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{block.name}</span>
                  {block.is_active ? <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'var(--sage-pale)', color: 'var(--sage-dark)' }}>ACTIVE</span> : null}
                </div>
                <button onClick={() => { setEditingBlock(block); setView('builder'); }} className="btn-ghost" style={{ fontSize: 12 }}>Edit</button>
                <button onClick={() => handleDeleteBlock(block.id)} className="btn-danger btn-ghost" style={{ fontSize: 12 }}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
