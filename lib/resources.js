// Static data adapter for the Karakeep-style client. No API or account is needed.
export function selectResources(items, { page = 'home', query = '', tag = '', sort = 'oldest', favourites = [], archived = [] } = {}) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const selected = items.filter(item => {
    if (page === 'archive' ? !archived.includes(item.id) : archived.includes(item.id)) return false;
    if (page === 'favourites' && !favourites.includes(item.id)) return false;
    if (page.startsWith('list/') && !item.lists.includes(page.slice(5))) return false;
    if (page === 'highlights' && !item.highlights?.length) return false;
    if (tag && !item.tags.includes(tag)) return false;
    const text = [item.name, item.subtitle, item.description, item.category, item.url, item.note, item.usage, item.platform, item.keywords, ...item.tags].filter(Boolean).join(' ').toLocaleLowerCase();
    return terms.every(term => text.includes(term));
  });
  return sort === 'newest' ? selected.reverse() : selected;
}

export function collectTags(items) {
  const counts = new Map();
  for (const item of items) for (const tag of new Set(item.tags)) counts.set(tag, (counts.get(tag) || 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function validateCatalog(data) {
  if (!Array.isArray(data.items) || !Array.isArray(data.collections)) throw new Error('resources.json must contain items and collections arrays.');
  const ids = new Set();
  const lists = new Set(data.collections.map(list => list.id));
  for (const item of data.items) {
    if (!item.id || ids.has(item.id)) throw new Error(`Missing or duplicate resource ID: ${item.id}`);
    ids.add(item.id);
    if (!item.name || !['software', 'bookmark', 'project'].includes(item.type)) throw new Error(`Invalid name or type: ${item.id}`);
    if (!Array.isArray(item.tags) || !item.tags.every(tag => typeof tag === 'string') || !Array.isArray(item.lists) || !item.lists.every(id => lists.has(id))) throw new Error(`Invalid tags or lists: ${item.id}`);
    if (!/^https?:$/.test(new URL(item.url).protocol)) throw new Error(`Invalid resource URL: ${item.id}`);
    if (item.image && !/^(?:\.\/)?assets\/[a-z\d/_.-]+\.(?:svg|png|ico|webp|jpg|jpeg)$/i.test(item.image)) throw new Error(`Image must be a local assets/ file: ${item.id}`);
  }
  return data;
}
