import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api.js';

function heatmapColor(pct) {
  if (pct === 0) return '#e8f0e2';
  if (pct < 30) return '#ddecd4';
  if (pct < 60) return '#c4ddb8';
  if (pct < 85) return '#d4896a';
  return '#c4714a';
}

function Heatmap() {
  const [days, setDays] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const [dayDetail, setDayDetail] = useState(null);

  useEffect(() => { api.getHeatmap().then(setDays).catch(() => {}); }, []);

  const handleCellClick = async (day) => {
    const items = await api.getHeatmapDay(day.date);
    setDayDetail({ date: day.date, items });
  };

  return (
    <div style={{ padding: '0 12px 10px', background: 'var(--sidebar)' }}>
      <div className="heatmap-grid" style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {days.map(day => (
          <div
            key={day.date}
            className="heatmap-cell"
            style={{ background: heatmapColor(day.pct) }}
            title={`${day.date}: ${day.done}/${day.total}`}
            onClick={() => handleCellClick(day)}
          />
        ))}
      </div>
      {dayDetail && (
        <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--card)', borderRadius: 'var(--radius)', fontSize: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-mid)' }}>{dayDetail.date}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {dayDetail.items.map(item => (
              <span key={item.label} style={{ opacity: item.completed ? 1 : 0.35 }} title={item.label}>
                {item.emoji}
              </span>
            ))}
          </div>
          <button onClick={() => setDayDetail(null)} style={{ marginTop: 6, fontSize: 11, color: 'var(--text-light)', background: 'none', border: 'none', cursor: 'pointer' }}>close</button>
        </div>
      )}
    </div>
  );
}

export default function ChecklistBar() {
  const [items, setItems] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const load = useCallback(async () => {
    try {
      const { items: data } = await api.getChecklistToday();
      setItems(data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (item) => {
    await api.toggleChecklist(item.item_id);
    load();
  };

  return (
    <div className="checklist-bar">
      <div className="checklist-bubbles">
        {items.map(item => (
          <button
            key={item.item_id}
            className="bubble"
            onClick={() => toggle(item)}
            title={item.label}
          >
            <div className={`bubble-circle${item.completed ? ' done' : ''}`}>
              {item.emoji}
            </div>
            <div className="bubble-meta">
              <div>{item.pct}%</div>
              {item.streak > 0 && <div className="streak">🔥{item.streak}</div>}
            </div>
          </button>
        ))}
        <button
          onClick={() => setShowHeatmap(v => !v)}
          style={{ alignSelf: 'center', fontSize: 11, color: 'var(--text-light)', padding: '4px 8px', marginLeft: 4, flexShrink: 0 }}
          title={showHeatmap ? 'Hide heatmap' : 'Show 90-day view'}
        >
          {showHeatmap ? '▲' : '▼'}
        </button>
      </div>
      {showHeatmap && <Heatmap />}
    </div>
  );
}
