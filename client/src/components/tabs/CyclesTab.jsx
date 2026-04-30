import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';
import ConfirmDialog from '../ConfirmDialog.jsx';

const PHASES = [
  { key: 'menstrual',  label: 'Menstrual',  color: '#c4714a', desc: 'Rest, reflect, and restore. Honor this phase with gentle movement and warmth.' },
  { key: 'follicular', label: 'Follicular', color: '#5a7a4a', desc: 'Energy builds. Great time to start new projects, learn, and be social.' },
  { key: 'ovulatory',  label: 'Ovulatory',  color: '#d4896a', desc: 'Peak energy and confidence. Communicate, collaborate, and shine.' },
  { key: 'luteal',     label: 'Luteal',     color: '#3d5c30', desc: 'Focus inward. Great for detail work, nesting, and finishing tasks.' },
];

function CycleWheel({ analysis }) {
  if (!analysis) return null;
  const { phase, phaseDay, dayInCycle, phaseBoundaries, cycle_length } = analysis;
  const total = cycle_length || 28;
  const cx = 120, cy = 120, r = 90, strokeW = 28;

  const circumference = 2 * Math.PI * r;

  function phaseArc(startDay, endDay) {
    const startAngle = ((startDay - 1) / total) * 360 - 90;
    const endAngle = (endDay / total) * 360 - 90;
    const largeArc = (endDay - startDay) / total > 0.5 ? 1 : 0;
    const s = toXY(startAngle); const e = toXY(endAngle);
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  function toXY(angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const dotAngle = ((dayInCycle - 1) / total) * 360 - 90;
  const dot = toXY(dotAngle);

  const bounds = phaseBoundaries || { menstrual: [1,5], follicular: [6,13], ovulatory: [14,16], luteal: [17,28] };
  const phaseObj = PHASES.find(p => p.key === phase);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={240} height={240} viewBox="0 0 240 240">
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeW} />
        {/* Phase arcs */}
        {PHASES.map(ph => {
          const [start, end] = bounds[ph.key] || [1, 1];
          if (end < start) return null;
          return (
            <path key={ph.key} d={phaseArc(start, end)} fill="none" stroke={ph.color} strokeWidth={strokeW} strokeOpacity={phase === ph.key ? 1 : 0.3} strokeLinecap="round" />
          );
        })}
        {/* Current day dot */}
        <circle cx={dot.x} cy={dot.y} r={8} fill="white" stroke={phaseObj?.color || 'var(--clay)'} strokeWidth={3} />
        {/* Center text */}
        <text x={cx} y={cy - 10} textAnchor="middle" fontFamily="Georgia, serif" fontSize={13} fontWeight={700} fill={phaseObj?.color || 'var(--text-dark)'}>{phaseObj?.label || phase}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontFamily="Georgia, serif" fontSize={11} fill="var(--text-mid)">Day {dayInCycle}</text>
        <text x={cx} y={cy + 24} textAnchor="middle" fontFamily="sans-serif" fontSize={10} fill="var(--text-light)">of {total}</text>
      </svg>
      {phaseObj && (
        <div style={{ maxWidth: 200, textAlign: 'center', fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5, marginTop: 4, fontStyle: 'italic' }}>{phaseObj.desc}</div>
      )}
    </div>
  );
}

function MoodCheckin({ today, onSave }) {
  const [mood, setMood] = useState(today?.mood_score || null);
  const [notes, setNotes] = useState(today?.notes || '');
  const [saved, setSaved] = useState(!!today);

  async function handleSave(score) {
    setMood(score);
    try {
      await api.logCheckin({ mood_score: score, notes, date: new Date().toISOString().slice(0, 10) });
      setSaved(true);
      onSave?.();
    } catch (e) {}
  }

  return (
    <div style={{ padding: 16, background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Today's Mood</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => handleSave(n)} style={{ width: 28, height: 28, borderRadius: '50%', fontWeight: 700, fontSize: 11, background: mood === n ? 'var(--clay)' : 'var(--sage-pale)', color: mood === n ? '#fff' : 'var(--text-mid)', border: `1.5px solid ${mood === n ? 'var(--clay)' : 'var(--border)'}` }}>
            {n}
          </button>
        ))}
      </div>
      {mood && !saved && (
        <>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="How are you feeling? (optional)" rows={2} style={{ fontSize: 13, marginBottom: 8 }} />
          <button className="btn-primary" onClick={() => handleSave(mood)} style={{ fontSize: 12 }}>Save Check-in</button>
        </>
      )}
      {saved && <div style={{ fontSize: 12, color: 'var(--sage-mid)', fontStyle: 'italic' }}>✓ Logged: {mood}/10</div>}
    </div>
  );
}

function PeriodLog({ periods, onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function handleAdd() {
    if (!startDate) return;
    await api.addPeriod({ start_date: startDate, end_date: endDate || null });
    setAdding(false); setStartDate(''); setEndDate('');
    onRefresh();
  }

  return (
    <div style={{ padding: 16, background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Period Log</span>
        <button onClick={() => setAdding(v => !v)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'var(--clay)', color: '#fff', border: 'none' }}>+ Log</button>
      </div>
      {adding && (
        <div style={{ marginBottom: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ flex: 1, minWidth: 120, fontSize: 13 }} />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ flex: 1, minWidth: 120, fontSize: 13 }} placeholder="End date (optional)" />
          <button className="btn-primary" onClick={handleAdd} disabled={!startDate} style={{ fontSize: 12 }}>Save</button>
          <button className="btn-ghost" onClick={() => setAdding(false)} style={{ fontSize: 12 }}>Cancel</button>
        </div>
      )}
      <div style={{ maxHeight: 180, overflowY: 'auto' }}>
        {periods.slice(0, 10).map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
            <span style={{ flex: 1 }}>{p.start_date}{p.end_date ? ` → ${p.end_date}` : ''}</span>
            <button onClick={() => setConfirmDelete(p)} className="btn-danger btn-ghost" style={{ fontSize: 11, padding: '2px 6px' }}>✕</button>
          </div>
        ))}
        {periods.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-light)', fontStyle: 'italic' }}>No periods logged yet.</div>}
      </div>
      {confirmDelete && (
        <ConfirmDialog
          message="Delete this period log?"
          detail="This cannot be undone."
          onConfirm={async () => { await api.deletePeriod(confirmDelete.id); setConfirmDelete(null); onRefresh(); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

export default function CyclesTab() {
  const [analysis, setAnalysis] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [anal, perds, checkin] = await Promise.all([
        api.getCycleAnalysis().catch(() => null),
        api.getPeriods().catch(() => []),
        api.getTodayCheckin().catch(() => null),
      ]);
      setAnalysis(anal);
      setPeriods(perds);
      setTodayCheckin(checkin);
    } catch (e) {}
    setLoading(false);
  }

  if (loading) return <div style={{ textAlign: 'center', color: 'var(--text-light)', fontStyle: 'italic', padding: 40 }}>Loading…</div>;

  const phaseObj = PHASES.find(p => p.key === analysis?.phase);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left: wheel + phase info */}
        <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CycleWheel analysis={analysis} />
          {analysis && (
            <div style={{ padding: 14, background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', maxWidth: 240 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: phaseObj?.color }}>Phase {analysis.phaseDay} of {analysis.phase}</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Cycle day {analysis.dayInCycle} · Avg {analysis.average_cycle_length || 28} days</div>
              {!analysis.personalized && <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4, fontStyle: 'italic' }}>Log 3+ cycles to personalize your phases.</div>}
            </div>
          )}
          {!analysis && <div style={{ fontSize: 13, color: 'var(--text-light)', fontStyle: 'italic', maxWidth: 240, textAlign: 'center' }}>Log your first period to see your cycle analysis.</div>}
        </div>

        {/* Right: checkin + log */}
        <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MoodCheckin today={todayCheckin} onSave={load} />
          <PeriodLog periods={periods} onRefresh={load} />

          {/* Phase breakdown */}
          <div style={{ padding: 16, background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Your Phases</div>
            {PHASES.map(ph => (
              <div key={ph.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: ph.color, marginTop: 3, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: ph.color }}>{ph.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.5 }}>{ph.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
