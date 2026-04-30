import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../utils/api.js';
import LearnNav from '../learn/LearnNav.jsx';
import DailyStrip from '../learn/DailyStrip.jsx';
import EntryList from '../learn/EntryList.jsx';
import EntryDetail from '../learn/EntryDetail.jsx';

export default function LearnTab({ searchQuery, searchResults, searchMode, tags, onRefreshTags, onEntryChange, isMobile, entryRefreshKey }) {
  const [activeSection, setActiveSection] = useState('vocabulary');
  const [activeTag, setActiveTag] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [dailyData, setDailyData] = useState(null);
  const [podcastFolder, setPodcastFolder] = useState(null);

  useEffect(() => {
    api.getDaily().then(setDailyData).catch(() => {});
  }, [entryRefreshKey]);

  const handleSelectSection = (section, tag = null) => {
    setActiveSection(section);
    setActiveTag(tag);
    setSelectedEntry(null);
    setIsNew(false);
    setPodcastFolder(null);
  };

  const handleSelectEntry = (entry) => {
    setSelectedEntry(entry);
    setIsNew(false);
  };

  const handleNewEntry = () => {
    setSelectedEntry(null);
    setIsNew(true);
  };

  const handleSaved = () => {
    onEntryChange();
    setIsNew(false);
    onRefreshTags();
    api.getDaily().then(setDailyData).catch(() => {});
  };

  const showStrip = !selectedEntry && !isNew;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <LearnNav
        activeSection={activeSection}
        activeTag={activeTag}
        tags={tags}
        onSelect={handleSelectSection}
        isMobile={isMobile}
      />

      {showStrip && dailyData && (
        <DailyStrip data={dailyData} onSelectEntry={handleSelectEntry} />
      )}

      <div className="content-area">
        <EntryList
          key={`${activeSection}-${activeTag?.id}-${entryRefreshKey}`}
          section={activeSection}
          activeTag={activeTag}
          selectedEntry={selectedEntry}
          searchQuery={searchQuery}
          searchResults={searchResults}
          searchMode={searchMode}
          podcastFolder={podcastFolder}
          onPodcastFolder={setPodcastFolder}
          onSelectEntry={handleSelectEntry}
          onNewEntry={handleNewEntry}
          isMobile={isMobile}
        />

        <EntryDetail
          key={selectedEntry ? `entry-${selectedEntry.id}` : isNew ? 'new' : 'empty'}
          entry={selectedEntry}
          isNew={isNew}
          section={activeSection}
          podcastFolderId={podcastFolder?.id}
          allTags={tags}
          onBack={() => { setSelectedEntry(null); setIsNew(false); }}
          onSaved={handleSaved}
          onRefreshTags={onRefreshTags}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}
