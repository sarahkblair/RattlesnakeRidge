import React, { useState, useEffect, useCallback } from 'react';
import { api } from './utils/api.js';
import ChecklistBar from './components/ChecklistBar.jsx';
import Header from './components/Header.jsx';
import QuickAdd from './components/QuickAdd.jsx';
import FavoritesManager from './components/FavoritesManager.jsx';
import LearnTab from './components/tabs/LearnTab.jsx';
import WorkoutTab from './components/tabs/WorkoutTab.jsx';
import MeditationTab from './components/tabs/MeditationTab.jsx';
import BeautyTab from './components/tabs/BeautyTab.jsx';
import StyleTab from './components/tabs/StyleTab.jsx';
import CyclesTab from './components/tabs/CyclesTab.jsx';
import VisionTab from './components/tabs/VisionTab.jsx';
import Settings from './components/Settings.jsx';
import FirstLaunch from './components/FirstLaunch.jsx';

const TABS = [
  { id: 'learn', label: 'Learn' },
  { id: 'workout', label: 'Workout' },
  { id: 'meditation', label: 'Meditation & Breathing' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'style', label: 'Style' },
  { id: 'cycles', label: 'Cycles' },
  { id: 'vision', label: 'This Is What I Want' },
];

export default function App() {
  const [ready, setReady] = useState(false);
  const [firstLaunch, setFirstLaunch] = useState(false);
  const [activeTab, setActiveTab] = useState('learn');
  const [showSettings, setShowSettings] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchMode, setSearchMode] = useState('standard'); // 'standard' | 'ai'
  const [tags, setTags] = useState([]);
  const [entryRefreshKey, setEntryRefreshKey] = useState(0);
  const [isMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const { settings } = await api.getSettings();
      if (settings.first_launch_complete !== 'true') { setFirstLaunch(true); }
      const savedTab = settings.active_tab || 'learn';
      setActiveTab(savedTab);
    } catch (e) { /* first time, no settings yet */ }
    try {
      const tagsData = await api.getTags();
      setTags(tagsData);
    } catch (e) {}
    setReady(true);
  }

  const refreshTags = useCallback(async () => {
    const data = await api.getTags();
    setTags(data);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    api.updateSetting('active_tab', tab).catch(() => {});
  };

  // Natural language detection
  const isNaturalLanguage = q => q.length > 20 && /\b(find|show|get|recommend|article|podcast|video|about|related to|on the topic)\b/i.test(q);

  const handleSearch = useCallback(async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults(null); setSearchMode('standard'); return; }

    if (isNaturalLanguage(q)) {
      setSearchMode('ai');
      try {
        const data = await api.aiMediaSearch(q);
        setSearchResults({ ai: true, results: data.results, query: q });
      } catch (e) {
        // Fall back to standard
        const data = await api.search(q);
        setSearchResults({ ai: false, ...data });
      }
    } else {
      setSearchMode('standard');
      try {
        const data = await api.search(q);
        setSearchResults({ ai: false, ...data });
      } catch (e) { console.error(e); }
    }
  }, []);

  const handleEntryChange = () => setEntryRefreshKey(k => k + 1);

  const handleFinishFirstLaunch = async () => {
    await api.updateSetting('first_launch_complete', 'true');
    setFirstLaunch(false);
    init();
  };

  if (!ready) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text-light)', fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontStyle: 'italic' }}>
      Opening your library…
    </div>
  );

  if (firstLaunch) return <FirstLaunch onComplete={handleFinishFirstLaunch} onRefreshTags={refreshTags} />;

  if (showSettings) return (
    <div className="app-shell">
      <ChecklistBar />
      <Header onSearch={() => {}} searchQuery="" onNewEntry={() => {}} onSettings={() => setShowSettings(false)} onFavorites={() => {}} onQuickAdd={() => {}} showingSettings />
      <Settings onClose={() => setShowSettings(false)} tags={tags} onRefreshTags={refreshTags} />
    </div>
  );

  const tabProps = { searchQuery, searchResults, searchMode, tags, onRefreshTags: refreshTags, onEntryChange: handleEntryChange, isMobile, entryRefreshKey };

  return (
    <div className="app-shell">
      <ChecklistBar />

      <Header
        onSearch={handleSearch}
        searchQuery={searchQuery}
        onNewEntry={() => {/* tab handles new entry */}}
        onSettings={() => setShowSettings(true)}
        onFavorites={() => setShowFavorites(true)}
        onQuickAdd={() => setShowQuickAdd(true)}
      />

      {/* Tab row */}
      <div className="tab-row">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn${activeTab === t.id ? ' active' : ''}`} onClick={() => handleTabChange(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div className="app-body">
        {activeTab === 'learn'      && <LearnTab {...tabProps} />}
        {activeTab === 'workout'    && <WorkoutTab {...tabProps} />}
        {activeTab === 'meditation' && <MeditationTab {...tabProps} />}
        {activeTab === 'beauty'     && <BeautyTab {...tabProps} />}
        {activeTab === 'style'      && <StyleTab {...tabProps} />}
        {activeTab === 'cycles'     && <CyclesTab {...tabProps} />}
        {activeTab === 'vision'     && <VisionTab {...tabProps} />}
      </div>

      {showFavorites && <FavoritesManager onClose={() => setShowFavorites(false)} />}
      {showQuickAdd  && <QuickAdd onClose={() => setShowQuickAdd(false)} allTags={tags} onRefresh={handleEntryChange} />}
    </div>
  );
}
