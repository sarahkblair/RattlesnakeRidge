import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';

function timeAgo(ts) {
  if (!ts) return 'never opened';
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return '1 day ago';
  if (d < 30) return `${d} days ago`;
  return `${Math.floor(d / 30)} months ago`;
}

function Card({ accent, label, children, onClick }) {
  return (
    <div onClick={onClick} className="daily-card" style={{ borderTopColor: accent, cursor: onClick ? 'pointer' : 'default', flex: '0 0 auto', width: 210 }}>
      <div className="daily-card-label" style={{ color: accent }}>{label}</div>
      {children}
    </div>
  );
}

export default function DailyStrip({ data, onSelectEntry }) {
  const [suggestions, setSuggestions] = useState([]);
  const [currentMedia, setCurrentMedia] = useState([]);
  const [loadingReading, setLoadingReading] = useState(false);

  useEffect(() => {
    loadSuggestions();
    loadCurrentMedia();
  }, []);

  const loadSuggestions = async () => {
    try {
      const data = await api.getReadingSuggestions();
      setSuggestions(data);
    } catch (e) {}
  };

  const loadCurrentMedia = async () => {
    try {
      const [books, podcasts, videos, articles, docs] = await Promise.all([
        api.getEntries({ section: 'books', status: 'not-consumed' }),
        api.getEntries({ section: 'podcasts', status: 'not-consumed' }),
        api.getEntries({ section: 'videos', status: 'not-consumed' }),
        api.getEntries({ section: 'articles', status: 'not-consumed' }),
        api.getEntries({ section: 'documentaries', status: 'not-consumed' }),
      ]);
      setCurrentMedia([...books, ...podcasts, ...videos, ...articles, ...docs].slice(0, 12));
    } catch (e) {}
  };

  const generateReading = async () => {
    setLoadingReading(true);
    try {
      await api.generateDailyReading();
      await loadSuggestions();
    } catch (e) {}
    setLoadingReading(false);
  };

  const openLink = url => {
    if (!url) return;
    if (window.electronAPI?.openExternal) window.electronAPI.openExternal(url);
    else window.open(url, '_blank', 'noopener');
  };

  const { vocab, wisdom, deepDive } = data;

  return (
    <div className="daily-strip">
      {/* Card 1: Word of the Day */}
      <Card accent="var(--clay)" label="Word of the Day" onClick={vocab ? () => onSelectEntry(vocab) : undefined}>
        {vocab ? (
          <>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, marginBottom: 3 }}>{vocab.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{vocab.definition}</div>
          </>
        ) : <div style={{ fontSize: 12, color: 'var(--text-light)', fontStyle: 'italic' }}>Add vocabulary entries to see your word of the day.</div>}
      </Card>

      {/* Card 2: Wisdom Today */}
      <Card accent="var(--sage-mid)" label="Wisdom Today" onClick={wisdom ? () => onSelectEntry(wisdom) : undefined}>
        {wisdom ? (
          <>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', marginBottom: 4 }}>"{wisdom.body}"</div>
            {wisdom.author && <div style={{ fontSize: 11, color: 'var(--text-light)' }}>— {wisdom.author}</div>}
          </>
        ) : <div style={{ fontSize: 12, color: 'var(--text-light)', fontStyle: 'italic' }}>Add wisdom entries to see today's insight.</div>}
      </Card>

      {/* Card 3: Deep Dive Revisit */}
      <Card accent="var(--clay-light)" label="Deep Dive Revisit" onClick={deepDive ? () => onSelectEntry(deepDive) : undefined}>
        {deepDive ? (
          <>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600, marginBottom: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{deepDive.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>Last visited {timeAgo(deepDive.last_opened)}</div>
          </>
        ) : <div style={{ fontSize: 12, color: 'var(--text-light)', fontStyle: 'italic' }}>Add deep dive entries to revisit old topics.</div>}
      </Card>

      {/* Card 4: Today's Reading */}
      <Card accent="var(--sage-dark)" label="Today's Reading">
        {suggestions.length === 0 ? (
          <div style={{ fontSize: 12 }}>
            <div style={{ color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 8 }}>No reading suggestions yet.</div>
            <button onClick={generateReading} disabled={loadingReading} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, background: 'var(--sage-pale)', color: 'var(--sage-dark)', border: '1px solid var(--sage-muted)', cursor: 'pointer' }}>
              {loadingReading ? 'Generating…' : '✦ Generate with Claude'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {suggestions.slice(0, 4).map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <button onClick={() => openLink(s.url)} style={{ fontSize: 12, color: 'var(--clay)', textAlign: 'left', flex: 1, padding: 0, background: 'none', border: 'none', cursor: s.url ? 'pointer' : 'default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.title}
                </button>
                <button onClick={() => api.rateSuggestion(s.id, 1)} title="👍" style={{ fontSize: 11, padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}>👍</button>
                <button onClick={() => api.rateSuggestion(s.id, -1)} title="👎" style={{ fontSize: 11, padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}>👎</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Card 5: Currently Doing */}
      <Card accent="var(--clay-mid)" label="Currently In Progress">
        {currentMedia.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-light)', fontStyle: 'italic' }}>No active media commitments.</div>
        ) : (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {currentMedia.slice(0, 8).map(m => (
              <button key={m.id} onClick={() => onSelectEntry(m)} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--sage-pale)', color: 'var(--sage-dark)', border: 'none', cursor: 'pointer', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.title}
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
