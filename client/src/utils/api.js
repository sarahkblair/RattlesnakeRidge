const BASE = '/api';

async function req(method, path, body, isFormData = false) {
  const opts = { method };
  if (body !== undefined && !isFormData) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body);
  } else if (isFormData) {
    opts.body = body;
  }
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) { const txt = await res.text(); throw new Error(txt); }
  return res.json();
}

export const api = {
  // Entries
  getEntries: (p = {}) => req('GET', `/entries?${new URLSearchParams(p)}`),
  getEntry: id => req('GET', `/entries/${id}`),
  createEntry: d => req('POST', '/entries', d),
  updateEntry: (id, d) => req('PUT', `/entries/${id}`, d),
  patchStatus: (id, status) => req('PATCH', `/entries/${id}/status`, { status }),
  deleteEntry: id => req('DELETE', `/entries/${id}`),
  getEntriesByTag: tagId => req('GET', `/entries/by-tag/${tagId}`),
  getBookPairings: id => req('GET', `/entries/${id}/pairings`),
  setBookPairings: (id, pairs) => req('PUT', `/entries/${id}/pairings`, { pairs }),

  // Tags
  getTags: () => req('GET', '/tags'),
  createTag: name => req('POST', '/tags', { name }),
  renameTag: (id, name) => req('PUT', `/tags/${id}`, { name }),
  deleteTag: id => req('DELETE', `/tags/${id}`),

  // Search
  search: q => req('GET', `/search?q=${encodeURIComponent(q)}`),

  // Daily strip
  getDaily: () => req('GET', '/daily'),

  // Settings
  getSettings: () => req('GET', '/settings'),
  updateSetting: (key, value) => req('PUT', `/settings/${key}`, { value }),
  addBusinessSubsection: name => req('POST', '/settings/business-subsections', { name }),
  deleteBusinessSubsection: id => req('DELETE', `/settings/business-subsections/${id}`),
  exportData: () => fetch('/api/settings/export').then(r => r.json()),
  importData: data => req('POST', '/settings/import', data),

  // Show folders
  getShowFolders: () => req('GET', '/show-folders'),
  createShowFolder: name => req('POST', '/show-folders', { name }),
  updateShowFolder: (id, name) => req('PUT', `/show-folders/${id}`, { name }),
  deleteShowFolder: id => req('DELETE', `/show-folders/${id}`),

  // Images
  uploadImage: async (entryId, file) => {
    const fd = new FormData(); fd.append('image', file);
    const res = await fetch(`/api/images/${entryId}`, { method: 'POST', body: fd });
    return res.json();
  },
  deleteImage: (entryId, imgId) => req('DELETE', `/images/${entryId}/${imgId}`),

  // Checklist
  getChecklistToday: () => req('GET', '/checklist/today'),
  toggleChecklist: itemId => req('PATCH', `/checklist/${itemId}/toggle`),
  getHeatmap: () => req('GET', '/checklist/heatmap'),
  getHeatmapDay: date => req('GET', `/checklist/day/${date}`),

  // Workout
  getWorkoutBlocks: () => req('GET', '/workout/blocks'),
  getActiveBlock: () => req('GET', '/workout/blocks/active'),
  createBlock: d => req('POST', '/workout/blocks', d),
  updateBlock: (id, d) => req('PUT', `/workout/blocks/${id}`, d),
  deleteBlock: id => req('DELETE', `/workout/blocks/${id}`),
  getTodayWorkout: () => req('GET', '/workout/today'),
  logSets: d => req('POST', '/workout/log', d),
  getTodayLogs: () => req('GET', '/workout/log/today'),

  // Meditation
  getMeditationTechniques: () => req('GET', '/meditation/techniques'),
  createTechnique: d => req('POST', '/meditation/techniques', d),
  updateTechnique: (id, d) => req('PUT', `/meditation/techniques/${id}`, d),
  deleteTechnique: id => req('DELETE', `/meditation/techniques/${id}`),
  logSession: d => req('POST', '/meditation/sessions', d),

  // Beauty
  getBeauty: () => req('GET', '/beauty'),
  addProduct: d => req('POST', '/beauty', d),
  updateProduct: (id, d) => req('PUT', `/beauty/${id}`, d),
  deleteProduct: id => req('DELETE', `/beauty/${id}`),

  // Style
  getWishlistCategories: () => req('GET', '/style/categories'),
  getWishlist: (params = {}) => req('GET', `/style/wishlist?${new URLSearchParams(params)}`),
  addWishlistItem: d => req('POST', '/style/wishlist', d),
  updateWishlistItem: (id, d) => req('PUT', `/style/wishlist/${id}`, d),
  deleteWishlistItem: id => req('DELETE', `/style/wishlist/${id}`),
  getShopperHistory: () => req('GET', '/style/shopper/history'),

  // Cycles
  getPeriods: () => req('GET', '/cycles/periods'),
  addPeriod: d => req('POST', '/cycles/periods', d),
  updatePeriod: (id, d) => req('PUT', `/cycles/periods/${id}`, d),
  deletePeriod: id => req('DELETE', `/cycles/periods/${id}`),
  getTodayCheckin: () => req('GET', '/cycles/checkins/today'),
  logCheckin: d => req('POST', '/cycles/checkins', d),
  getCycleAnalysis: () => req('GET', '/cycles/analysis'),

  // Vision
  getVisionCards: () => req('GET', '/vision'),
  getVisionCard: id => req('GET', `/vision/${id}`),
  updateVisionCard: (id, d) => req('PUT', `/vision/${id}`, d),
  deleteVisionCard: id => req('DELETE', `/vision/${id}`),
  addVisionImage: async (cardId, file) => {
    const fd = new FormData(); fd.append('image', file);
    const res = await fetch(`/api/vision/${cardId}/images`, { method: 'POST', body: fd });
    return res.json();
  },
  deleteVisionImage: (cardId, imgId) => req('DELETE', `/vision/${cardId}/images/${imgId}`),
  reorderVisionImages: (cardId, order) => req('PUT', `/vision/${cardId}/images/reorder`, { order }),
  createVisionCard: async (formData) => {
    const res = await fetch('/api/vision', { method: 'POST', body: formData });
    return res.json();
  },

  // Favorites
  getFavorites: () => req('GET', '/favorites'),
  addFavoriteCategory: name => req('POST', '/favorites/categories', { name }),
  updateFavoriteCategory: (id, name) => req('PUT', `/favorites/categories/${id}`, { name }),
  deleteFavoriteCategory: id => req('DELETE', `/favorites/categories/${id}`),
  addFavorite: d => req('POST', '/favorites', d),
  updateFavorite: (id, d) => req('PUT', `/favorites/${id}`, d),
  deleteFavorite: id => req('DELETE', `/favorites/${id}`),

  // RSS
  getRssFeeds: () => req('GET', '/rss'),
  addRssFeed: d => req('POST', '/rss', d),
  deleteRssFeed: id => req('DELETE', `/rss/${id}`),
  getReadingSuggestions: () => req('GET', '/rss/suggestions'),
  rateSuggestion: (id, rating) => req('PATCH', `/rss/suggestions/${id}/rate`, { rating }),
  saveSuggestion: id => req('PATCH', `/rss/suggestions/${id}/save`),

  // AI
  aiMediaSearch: query => req('POST', '/ai/media-search', { query }),
  generateDailyReading: () => req('POST', '/ai/daily-reading', {}),
  aiShopper: query => req('POST', '/ai/shopper', { query }),

  // Spotify
  getSpotifyStatus: () => req('GET', '/spotify/status'),
  spotifyPlay: () => req('POST', '/spotify/play', {}),
  spotifyPause: () => req('POST', '/spotify/pause', {}),
};
