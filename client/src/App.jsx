import React, { useState, useEffect, useCallback } from 'react';
import { api } from './utils/api.js';
import TopBar from './components/TopBar.jsx';
import Navigation from './components/Navigation.jsx';
import DailyStrip from './components/DailyStrip.jsx';
import EntryList from './components/EntryList.jsx';
import EntryDetail from './components/EntryDetail.jsx';
import Settings from './components/Settings.jsx';
import FirstLaunch from './components/FirstLaunch.jsx';
import MobileNav from './components/MobileNav.jsx';

export default function App() {
  const [ready, setReady] = useState(false);
  const [firstLaunch, setFirstLaunch] = useState(false);
  const [activeSection, setActiveSection] = useState('vocabulary');
  const [activeTag, setActiveTag] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [tags, setTags] = useState([]);
  const [dailyData, setDailyData] = useState(null);
  const [entryListKey, setEntryListKey] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      const { settings } = await api.getSettings();
      if (settings.first_launch_complete !== 'true') {
        setFirstLaunch(true);
      }
      const [tagsData, daily] = await Promise.all([api.getTags(), api.getDaily()]);
      setTags(tagsData);
      setDailyData(daily);
      setReady(true);
    } catch (e) {
      console.error(e);
      setReady(true);
    }
  }

  const refreshTags = useCallback(async () => {
    const tagsData = await api.getTags();
    setTags(tagsData);
  }, []);

  const refreshDaily = useCallback(async () => {
    const daily = await api.getDaily();
    setDailyData(daily);
  }, []);

  const handleSelectSection = (section, tag = null) => {
    setActiveSection(section);
    setActiveTag(tag);
    setSelectedEntry(null);
    setSearchQuery('');
    setSearchResults(null);
    if (isMobile) setMobileView('list');
  };

  const handleSelectEntry = (entry) => {
    setSelectedEntry(entry);
    if (isMobile) setMobileView('detail');
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults(null); return; }
    try {
      const data = await api.search(q);
      setSearchResults(data.results);
    } catch (e) { console.error(e); }
  };

  const handleEntryChange = () => {
    setEntryListKey(k => k + 1);
    refreshTags();
    refreshDaily();
  };

  const handleFinishFirstLaunch = async () => {
    await api.updateSetting('first_launch_complete', 'true');
    setFirstLaunch(false);
    init();
  };

  if (!ready) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text-mid)', fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontStyle: 'italic' }}>
      Opening your library…
    </div>
  );

  if (firstLaunch) return <FirstLaunch onComplete={handleFinishFirstLaunch} onRefreshTags={refreshTags} />;

  if (showSettings) return (
    <div className="app-shell">
      <TopBar
        onSearch={handleSearch}
        onNewEntry={() => {}}
        onSettings={() => setShowSettings(false)}
        showingSettings
      />
      <Settings
        onClose={() => setShowSettings(false)}
        tags={tags}
        onRefreshTags={refreshTags}
      />
    </div>
  );

  const showDailyStrip = !selectedEntry || (isMobile && mobileView === 'list');

  return (
    <div className="app-shell">
      <TopBar
        onSearch={handleSearch}
        searchQuery={searchQuery}
        onNewEntry={() => {
          setSelectedEntry({ _new: true, section: activeSection });
          if (isMobile) setMobileView('detail');
        }}
        onSettings={() => setShowSettings(true)}
      />

      <Navigation
        activeSection={activeSection}
        activeTag={activeTag}
        tags={tags}
        onSelect={handleSelectSection}
        isMobile={isMobile}
      />

      <div className="app-body">
        {showDailyStrip && dailyData && (
          <DailyStrip
            data={dailyData}
            onSelectEntry={handleSelectEntry}
          />
        )}

        <div className="content-area">
          {/* On mobile: show list or detail, not both */}
          {(!isMobile || mobileView === 'list') && (
            <EntryList
              key={entryListKey}
              section={activeSection}
              activeTag={activeTag}
              selectedEntry={selectedEntry}
              searchQuery={searchQuery}
              searchResults={searchResults}
              onSelectEntry={handleSelectEntry}
              onNewEntry={() => {
                setSelectedEntry({ _new: true, section: activeSection });
                if (isMobile) setMobileView('detail');
              }}
            />
          )}

          {(!isMobile || mobileView === 'detail') && (
            <EntryDetail
              key={selectedEntry ? selectedEntry.id || 'new' : 'empty'}
              entry={selectedEntry}
              section={activeSection}
              allTags={tags}
              onBack={() => {
                setSelectedEntry(null);
                if (isMobile) setMobileView('list');
              }}
              onChange={handleEntryChange}
              onRefreshTags={refreshTags}
            />
          )}
        </div>
      </div>

      {isMobile && (
        <MobileNav
          activeSection={activeSection}
          onSelect={handleSelectSection}
        />
      )}
    </div>
  );
}
