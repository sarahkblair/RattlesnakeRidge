import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api.js';

const PHASE_COLORS = {
  inhale: 'var(--sage-mid)',
  hold: 'var(--clay)',
  exhale: 'var(--sage-dark)',
  hold_out: 'var(--clay-light)',
};

function BreathingCircle({ pattern, running }) {
  const [phase, setPhase] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [scale, setScale] = useState(1);
  const timerRef = useRef(null);
  const phaseRef = useRef(0);

  const phases = pattern ? [
    { name: 'inhale', dur: pattern.inhale_seconds, label: 'Inhale' },
    { name: 'hold', dur: pattern.hold_in_seconds, label: 'Hold' },
    { name: 'exhale', dur: pattern.exhale_seconds, label: 'Exhale' },
    { name: 'hold_out', dur: pattern.hold_out_seconds, label: 'Hold' },
  ].filter(p => p.dur > 0) : [];

  useEffect(() => {
    if (!running || phases.length === 0) { clearTimeout(timerRef.current); return; }
    phaseRef.current = 0;
    setPhase(0);
    setCountdown(phases[0].dur);
    tick(0, phases[0].dur);
    return () => clearTimeout(timerRef.current);
  }, [running, pattern]);

  function tick(phaseIdx, remaining) {
    if (!running) return;
    const cur = phases[phaseIdx];
    setPhase(phaseIdx);
    setScale(cur.name === 'inhale' ? 1.4 : cur.name === 'exhale' ? 0.7 : scale);
    setCountdown(remaining);
    if (remaining <= 0) {
      const next = (phaseIdx + 1) % phases.length;
      timerRef.current = setTimeout(() => tick(next, phases[next].dur), 100);
    } else {
      timerRef.current = setTimeout(() => tick(phaseIdx, remaining - 1), 1000);
    }
  }

  if (!pattern) return null;
  const curPhase = phases[phase] || phases[0];
  const color = PHASE_COLORS[curPhase?.name] || 'var(--sage-mid)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '30px 0' }}>
      <div style={{
        width: 160, height: 160, borderRadius: '50%',
        background: color, opacity: 0.85,
        transform: `scale(${running ? scale : 1})`,
        transition: `transform ${curPhase?.dur || 4}s ease-in-out, background ${0.5}s ease`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 40px ${color}44`,
      }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{running ? curPhase?.label : 'Ready'}</span>
        {running && <span style={{ color: '#fff', fontSize: 28, fontFamily: 'var(--font-serif)', fontWeight: 700 }}>{countdown}</span>}
      </div>
      {pattern.description && <p style={{ fontSize: 13, color: 'var(--text-mid)', textAlign: 'center', maxWidth: 280, fontStyle: 'italic' }}>{pattern.description}</p>}
    </div>
  );
}

function ActiveSession({ technique, duration, ambientEnabled, onEnd }) {
  const [elapsed, setElapsed] = useState(0);
  const [breathing, setBreathing] = useState(false);
  const [spotifyStatus, setSpotifyStatus] = useState(null);
  const intervalRef = useRef(null);
  const total = duration * 60;

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= total) { clearInterval(intervalRef.current); handleEnd(); return e + 1; }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    api.getSpotifyStatus().then(setSpotifyStatus).catch(() => {});
    if (ambientEnabled) { api.spotifyPlay().catch(() => {}); }
    return () => { if (ambientEnabled) api.spotifyPause().catch(() => {}); };
  }, []);

  async function handleEnd() {
    clearInterval(intervalRef.current);
    if (ambientEnabled) api.spotifyPause().catch(() => {});
    try { await api.logSession({ technique_id: technique.id, duration_minutes: Math.ceil(elapsed / 60) }); } catch (e) {}
    onEnd();
  }

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const pct = Math.min((elapsed / total) * 100, 100);
  const hasPattern = technique.inhale_seconds || technique.exhale_seconds;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32, maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 4, textAlign: 'center' }}>{technique.name}</h2>
      <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 24, textAlign: 'center' }}>{duration} min session</div>

      {hasPattern && <BreathingCircle pattern={technique} running={breathing} />}

      {/* Progress bar */}
      <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 99, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--sage-mid)', borderRadius: 99, transition: 'width 1s linear' }} />
      </div>
      <div style={{ fontSize: 18, fontFamily: 'var(--font-serif)', color: 'var(--text-mid)', marginBottom: 24 }}>
        {mins}:{String(secs).padStart(2, '0')} / {duration}:00
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {hasPattern && (
          <button onClick={() => setBreathing(b => !b)} style={{ padding: '8px 20px', borderRadius: 'var(--radius)', fontWeight: 700, fontSize: 13, background: breathing ? 'var(--sage-pale)' : 'var(--sage-mid)', color: breathing ? 'var(--sage-dark)' : '#fff', border: 'none' }}>
            {breathing ? 'Pause Breathing' : 'Start Breathing'}
          </button>
        )}
        <button className="btn-danger btn-ghost" onClick={handleEnd} style={{ fontSize: 13 }}>End Session</button>
      </div>

      {spotifyStatus?.connected && (
        <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-light)' }}>
          {ambientEnabled ? '♫ Spotify playing' : ''}
        </div>
      )}
    </div>
  );
}

function TechniqueCard({ technique, onStart }) {
  return (
    <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--shadow)', border: '1.5px solid var(--border)' }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{technique.name}</div>
      {technique.description && <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 8, lineHeight: 1.5 }}>{technique.description}</div>}
      {(technique.inhale_seconds || technique.exhale_seconds) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {[['In', technique.inhale_seconds], ['Hold', technique.hold_in_seconds], ['Out', technique.exhale_seconds], ['Hold', technique.hold_out_seconds]].filter(([, v]) => v > 0).map(([lbl, v], i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'var(--sage-pale)', color: 'var(--sage-dark)' }}>{lbl} {v}s</span>
          ))}
        </div>
      )}
      <button className="btn-sage" onClick={() => onStart(technique)} style={{ fontSize: 12, padding: '5px 14px' }}>Begin</button>
    </div>
  );
}

function SessionSetup({ technique, onStart, onCancel }) {
  const [duration, setDuration] = useState(10);
  const [ambient, setAmbient] = useState(false);

  return (
    <div style={{ maxWidth: 380, margin: '40px auto', padding: 28, background: 'var(--card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
      <h2 style={{ marginBottom: 4, fontSize: 18 }}>{technique.name}</h2>
      <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 24 }}>Session Setup</div>

      <div className="form-field">
        <label className="form-label">Duration (minutes)</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[5, 10, 15, 20, 30].map(d => (
            <button key={d} onClick={() => setDuration(d)} style={{ padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700, background: duration === d ? 'var(--clay)' : 'var(--sage-pale)', color: duration === d ? '#fff' : 'var(--text-mid)', border: `1.5px solid ${duration === d ? 'var(--clay)' : 'var(--border)'}` }}>
              {d}m
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, marginTop: 16 }}>
        <input type="checkbox" id="ambient" checked={ambient} onChange={e => setAmbient(e.target.checked)} style={{ width: 'auto' }} />
        <label htmlFor="ambient" style={{ fontSize: 13, cursor: 'pointer' }}>Play Spotify meditation playlist</label>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn-primary" onClick={() => onStart(duration, ambient)} style={{ flex: 1 }}>Start Session</button>
        <button className="btn-ghost" onClick={onCancel} style={{ flex: 0 }}>Cancel</button>
      </div>
    </div>
  );
}

export default function MeditationTab() {
  const [techniques, setTechniques] = useState([]);
  const [selected, setSelected] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setTechniques(await api.getMeditationTechniques()); } catch (e) {}
    setLoading(false);
  }

  if (session) {
    return <ActiveSession technique={session.technique} duration={session.duration} ambientEnabled={session.ambient} onEnd={() => { setSession(null); setSelected(null); }} />;
  }

  if (selected) {
    return <SessionSetup technique={selected} onStart={(dur, amb) => setSession({ technique: selected, duration: dur, ambient: amb })} onCancel={() => setSelected(null)} />;
  }

  const breathing = techniques.filter(t => t.category === 'breathing');
  const meditation = techniques.filter(t => t.category !== 'breathing');

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-light)', fontStyle: 'italic', padding: 40 }}>Loading…</div>
      ) : (
        <>
          {breathing.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 10 }}>Breathing Techniques</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {breathing.map(t => <TechniqueCard key={t.id} technique={t} onStart={setSelected} />)}
              </div>
            </div>
          )}
          {meditation.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 10 }}>Meditation Sessions</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {meditation.map(t => <TechniqueCard key={t.id} technique={t} onStart={setSelected} />)}
              </div>
            </div>
          )}
          {techniques.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-light)', fontStyle: 'italic', padding: 40 }}>No techniques found.</div>
          )}
        </>
      )}
    </div>
  );
}
