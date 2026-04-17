const BASE = '/api';

async function req(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  // Entries
  getEntries: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/entries${qs ? '?' + qs : ''}`);
  },
  getEntry: (id) => req('GET', `/entries/${id}`),
  createEntry: (data) => req('POST', '/entries', data),
  updateEntry: (id, data) => req('PUT', `/entries/${id}`, data),
  patchStatus: (id, status) => req('PATCH', `/entries/${id}/status`, { status }),
  deleteEntry: (id) => req('DELETE', `/entries/${id}`),
  getEntriesByTag: (tagId) => req('GET', `/entries/by-tag/${tagId}`),

  // Tags
  getTags: () => req('GET', '/tags'),
  createTag: (name) => req('POST', '/tags', { name }),
  renameTag: (id, name) => req('PUT', `/tags/${id}`, { name }),
  deleteTag: (id) => req('DELETE', `/tags/${id}`),

  // Search
  search: (q) => req('GET', `/search?q=${encodeURIComponent(q)}`),

  // Daily
  getDaily: () => req('GET', '/daily'),

  // Settings
  getSettings: () => req('GET', '/settings'),
  updateSetting: (key, value) => req('PUT', `/settings/${key}`, { value }),
  addBusinessSubsection: (name) => req('POST', '/settings/business-subsections', { name }),
  deleteBusinessSubsection: (id) => req('DELETE', `/settings/business-subsections/${id}`),
  exportData: () => fetch('/api/settings/export').then(r => r.json()),

  // Show Folders
  getShowFolders: () => req('GET', '/show-folders'),
  createShowFolder: (name) => req('POST', '/show-folders', { name }),
  updateShowFolder: (id, name) => req('PUT', `/show-folders/${id}`, { name }),
  deleteShowFolder: (id) => req('DELETE', `/show-folders/${id}`),

  // Images
  uploadImage: async (entryId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`/api/images/${entryId}`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  deleteImage: (entryId, imageId) => req('DELETE', `/images/${entryId}/${imageId}`)
};
