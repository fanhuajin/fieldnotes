import { icons } from './vendor/karakeep/icons.js?v=8467716af3a8';
import { selectResources, collectTags, validateCatalog } from './lib/resources.js?v=8ed40f3d4745';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const store = {
  read(key, fallback) { try { return JSON.parse(localStorage.getItem('softshelf-' + key)) ?? fallback; } catch { return fallback; } },
  write(key, value) { try { localStorage.setItem('softshelf-' + key, JSON.stringify(value)); } catch { /* View state still works when browser storage is unavailable. */ } },
};
const saved = store.read('view-v2', {});
const state = {
  page: 'home', query: '', tag: '', preview: null,
  layout: ['masonry', 'grid', 'list', 'compact'].includes(saved.layout) ? saved.layout : 'masonry',
  columns: [2, 3, 4, 5].includes(saved.columns) ? saved.columns : 3,
  notes: saved.notes === true, tags: saved.tags !== false, title: saved.title !== false,
  fit: saved.fit === 'contain' ? 'contain' : 'cover',
  sort: saved.sort === 'newest' ? 'newest' : 'oldest',
  theme: ['light', 'dark', 'system'].includes(store.read('theme-v2', 'system')) ? store.read('theme-v2', 'system') : 'system',
  favourites: [], archived: [], selected: [],
};
const media = matchMedia('(prefers-color-scheme: dark)');
const btn = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50';
const badge = 'inline-flex items-center rounded-full border border-transparent bg-secondary px-2.5 py-0.5 text-xs font-light text-gray-700 transition-colors hover:bg-foreground hover:text-secondary dark:text-gray-400';
const mainNav = [['home', 'Home', 'house'], ['search', 'Search', 'search'], ['tags', 'Tags', 'tag'], ['highlights', 'Highlights', 'highlighter'], ['archive', 'Archive', 'archive']];
let catalog;
let returnHash = '#/home';
let menuTrigger;
let toastTimer;
let redrawTimer;

function icon(name, size = 18) {
  const svg = icons['lucide-' + name] || icons['lucide-circle'];
  return svg.replace(/width="[^"]*"/, `width="${size}"`).replace(/height="[^"]*"/, `height="${size}"`).replace(/class="[^"]*"/, '').replace('<svg', '<svg class="resource-icon"');
}
function route(page, tag = '') { return '#/' + page + (tag ? '?tag=' + encodeURIComponent(tag) : ''); }
function saveView() { store.write('view-v2', Object.fromEntries(['layout', 'columns', 'notes', 'tags', 'title', 'fit', 'sort'].map(key => [key, state[key]]))); }
function applyTheme() {
  const dark = state.theme === 'dark' || (state.theme === 'system' && media.matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  $('#theme-quick')?.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  $('#theme-quick')?.setAttribute('aria-pressed', String(dark));
}
function href(item) { return item.type === 'software' && location.protocol === 'file:' ? './downloads/' + encodeURIComponent(item.fileName) : item.url; }
function visible() { return selectResources(catalog.items, state); }
function titleForPage() {
  if (state.page.startsWith('list/')) return catalog.collections.find(list => list.id === state.page.slice(5))?.name || 'Collection';
  return ({home: 'Home', search: 'Search', tags: 'All Tags', lists: 'All Lists', favourites: 'Favourites', highlights: 'Highlights', archive: 'Archive'})[state.page] || 'Not Found';
}
function sidebarItem(page, label, mark, count = null, nested = false) {
  const active = state.page === page && !state.tag;
  return `<li class="relative flex justify-between rounded-lg text-sm transition-colors hover:bg-accent ${active ? 'bg-accent/50 text-foreground' : 'text-muted-foreground'}"><a href="${route(page)}" class="sidebar-link ${nested ? 'nested' : ''}" ${active ? 'aria-current="page"' : ''}>${icon(mark)}<span class="line-clamp-1">${esc(label)}</span>${count === null ? '' : `<span class="sidebar-count">${count}</span>`}</a></li>`;
}
function renderNav() {
  $('#primary-nav').innerHTML = mainNav.map(([page, label, mark]) => sidebarItem(page, label, mark)).join('');
  const counts = id => catalog.items.filter(item => item.lists.includes(id)).length;
  $('#list-nav').innerHTML = sidebarItem('lists', 'All Lists', 'clipboard-list') + sidebarItem('favourites', 'Favourites', 'star', state.favourites.length) + catalog.collections.map(list => sidebarItem('list/' + list.id, list.name, list.icon, counts(list.id), !!list.parent)).join('');
  $('#mobile-nav').innerHTML = [...mainNav, ['lists', 'All Lists', 'clipboard-list']].map(([page, label, mark]) => `<li class="flex w-full rounded-lg hover:bg-background ${state.page === page ? 'bg-background' : ''}"><a class="m-auto px-3 py-2" href="${route(page)}" aria-label="${label}" ${state.page === page ? 'aria-current="page"' : ''}>${icon(mark)}</a></li>`).join('');
  document.title = (state.page === 'home' ? '' : titleForPage() + ' | ') + catalog.title;
}
function shell() {
  $('#app').innerHTML = `<div class="app-shell">
    <a class="skip-link" href="#main-content">Skip to resources</a>
    <header class="sticky left-0 right-0 top-0 z-50 flex h-16 w-full items-center justify-between bg-background p-4 shadow">
      <a class="brand-slot" href="#/home" aria-label="SoftShelf home"><span class="brand-mark" aria-hidden="true">${$('#brand-source').innerHTML}</span><span class="brand-name">SoftShelf</span></a>
      <div class="header-search"><label class="search-field bg-muted rounded-md">${icon('search',16)}<input id="global-search" type="search" placeholder="Search titles, text, URLs, and tags..." aria-label="Search resources" autocomplete="off"><kbd>/</kbd></label>
        <button id="view-trigger" class="${btn} header-button" data-menu="view" aria-label="View Options" title="View Options" aria-haspopup="menu" aria-expanded="false">${icon('settings')}</button>
        <button id="sort-trigger" class="${btn} header-button" data-menu="sort" aria-label="Sort resources" title="Sort" aria-haspopup="menu" aria-expanded="false">${icon('arrow-down-wide-narrow')}</button>
      </div>
      <button class="${btn} profile-button" data-menu="profile" aria-label="SoftShelf preferences" title="Preferences" aria-haspopup="menu" aria-expanded="false">S</button>
    </header>
    <div class="workspace">
      <aside class="desktop-sidebar"><nav aria-label="Main navigation"><ul id="primary-nav" class="space-y-2 text-sm"></ul></nav><div class="shrink-0 bg-border h-[1px] w-full"></div><nav class="collections-nav" aria-label="Collections"><p class="pl-2 text-xs uppercase tracking-wider text-muted-foreground collections-label">Lists</p><ul id="list-nav" class="text-sm"></ul></nav><div class="sidebar-footer"><span>SoftShelf</span><button id="theme-quick" class="theme-quick" data-action="theme" aria-label="Switch theme">${icon('sun-moon',14)}</button></div></aside>
      <main id="main-content" class="main-panel bg-muted" tabindex="-1"><nav class="mobile-navigation" aria-label="Mobile navigation"><ul id="mobile-nav" class="flex justify-between space-x-2 px-5 py-2 pt-5"></ul></nav><div id="content" class="content-area p-4" aria-live="polite"></div></main>
    </div>
    <div id="menu-layer"></div><dialog id="preview" aria-labelledby="preview-title"></dialog><dialog id="shortcut-dialog" class="small-dialog" aria-labelledby="shortcut-title"><div class="dialog-toolbar"><h2 id="shortcut-title">Keyboard Shortcuts</h2><button class="${btn} header-button" data-close="shortcut-dialog" aria-label="Close keyboard shortcuts">${icon('x')}</button></div><dl class="shortcut-list"><dt>Search</dt><dd><kbd>/</kbd></dd><dt>Close menu or preview</dt><dd><kbd>Esc</kbd></dd><dt>Clear search</dt><dd><kbd>Esc</kbd></dd><dt>Navigate</dt><dd><kbd>Tab</kbd></dd></dl></dialog><div id="toast" role="status" class="toast" hidden></div>
  </div>`;
  $('#global-search').addEventListener('input', () => {
    state.query = $('#global-search').value;
    if (state.page === 'tags') { renderTags(); return; }
    if (state.page === 'lists') { state.page = 'search'; renderNav(); }
    const params = new URLSearchParams();
    if (state.query) params.set('q', state.query);
    if (state.tag) params.set('tag', state.tag);
    history.replaceState(null, '', '#/' + state.page + (params.size ? '?' + params : ''));
    renderResources();
  });
  $('#preview').addEventListener('close', () => { if (state.preview) { state.preview = null; location.hash = returnHash; } });
  $('#preview').addEventListener('click', event => {
    if (event.target !== $('#preview')) return;
    const box = $('#preview').getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) $('#preview').close();
  });
  applyTheme();
}
function tagPills(tags) { return tags.map(tag => `<a class="${badge}" href="${route('home',tag)}">${esc(tag)}</a>`).join(''); }
function card(item, index) {
  const isSoftware = item.type === 'software';
  const fav = state.favourites.includes(item.id);
  const archived = state.archived.includes(item.id);
  const domain = new URL(item.url).hostname.replace(/^www\./, '');
  const meta = isSoftware ? item.localSize : domain;
  const hue = [...item.id.replace(/-website$/, '')].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  const image = item.image ? `<a href="${esc(href(item))}" target="_blank" rel="noopener noreferrer" class="card-banner branded-banner" style="--cover-hue:${hue}" aria-label="${esc((isSoftware ? 'Download ' : 'Open ') + item.name)}" ${isSoftware ? `download="${esc(item.fileName)}"` : ''}><span class="cover-kind">${esc(isSoftware ? 'SOFTWARE' : item.type === 'project' ? 'PROJECT' : 'BOOKMARK')}</span><span class="cover-logo"><img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy" decoding="async" class="resource-cover" data-fit="${state.fit}"></span></a>` : '';
  return `<article class="resource-card group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card hover:shadow-lg hover:transition-shadow ${state.selected.includes(item.id) ? 'is-selected' : ''}" data-resource="${esc(item.id)}" data-order="${index}">
    <button class="card-select" data-select="${esc(item.id)}" aria-label="Select ${esc(item.name)}" aria-pressed="${state.selected.includes(item.id)}">${icon(state.selected.includes(item.id) ? 'check' : 'circle',18)}</button>${image}<div class="card-content flex h-full flex-col justify-between gap-2 overflow-hidden p-2"><div class="card-body flex flex-col gap-2 overflow-hidden">
      ${state.title ? `<div class="line-clamp-2 shrink-0 overflow-hidden text-ellipsis break-words text-lg"><a href="${esc(href(item))}" target="_blank" rel="noopener noreferrer" ${isSoftware ? `download="${esc(item.fileName)}"` : ''}>${esc(item.name)}</a></div>` : ''}
      ${state.notes ? `<p class="card-note text-sm text-muted-foreground">${esc(item.description || item.subtitle || '')}</p>` : ''}
      ${state.tags ? `<div class="card-tags flex shrink-0 flex-wrap gap-1 overflow-hidden">${tagPills(item.tags)}</div>` : ''}
    </div><div class="card-bottom flex w-full shrink-0 justify-between text-gray-500"><div class="card-meta flex items-center gap-2 overflow-hidden text-nowrap font-light"><a class="line-clamp-1 hover:text-foreground" href="${esc(href(item))}" target="_blank" rel="noopener noreferrer">${esc(isSoftware ? item.platform : domain)}</a>${isSoftware ? `<span aria-hidden="true">·</span><span>${esc(meta)}</span>` : ''}</div>
      <div class="card-actions flex text-gray-500">${archived ? `<span class="archive-indicator" title="Archived">${icon('archive',16)}</span>` : ''}${fav ? `<button class="${btn} card-action favourite-active" data-favourite="${esc(item.id)}" aria-label="Remove ${esc(item.name)} from favourites" aria-pressed="true">${icon('star',20)}</button>` : ''}
      <a class="${btn} card-action" href="#/preview/${encodeURIComponent(item.id)}" data-preview="${esc(item.id)}" aria-label="Preview ${esc(item.name)}" title="Preview">${icon('maximize2',16)}</a><button class="${btn} card-action" data-menu="item" data-id="${esc(item.id)}" aria-label="Actions for ${esc(item.name)}" aria-haspopup="menu" aria-expanded="false">${icon('ellipsis',22)}</button></div>
    </div></div></article>`;
}
function emptyState(title = 'No bookmarks found', message = 'Try a different search, tag, or collection.') {
  return `<div class="empty-state"><span class="text-muted-foreground">${icon('search-x',40)}</span><h2 class="text-lg font-medium">${esc(title)}</h2><p class="text-sm text-muted-foreground">${esc(message)}</p><a class="${btn} empty-home" href="#/home">View all resources</a></div>`;
}
function renderResources() {
  const items = visible();
  const collection = state.page.startsWith('list/') ? catalog.collections.find(list => list.id === state.page.slice(5)) : null;
  let heading = '';
  if (state.page !== 'home' || state.query || state.tag) heading = `<div class="collection-heading"><h1 class="text-2xl">${collection ? icon(collection.icon,24) : state.tag ? icon('tag',24) : ''}${esc(state.tag || (state.query ? 'Search' : titleForPage()))}</h1><p class="text-sm text-muted-foreground">${items.length} ${items.length === 1 ? 'item' : 'items'}${state.query ? ' · ' + esc(state.query) : ''}</p>${state.tag ? `<a class="${btn}" href="${route(state.page)}" aria-label="Clear tag filter">${icon('x',16)} Clear tag</a>` : ''}</div>`;
  if (state.page === 'highlights') {
    const highlights = items.flatMap(item => (item.highlights || []).map(text => `<article class="highlight-card rounded-lg border bg-card p-4"><p>${esc(text)}</p><a href="#/preview/${encodeURIComponent(item.id)}" class="text-sm text-muted-foreground">${esc(item.name)}</a></article>`));
    $('#content').innerHTML = heading + (highlights.join('') || emptyState('No highlights yet','Highlights from your static resource configuration will appear here.'));
    return;
  }
  const nodes = items.map(card);
  let body;
  if (state.layout === 'masonry') {
    // Distribute in reading order just like the source's responsive masonry columns.
    const columns = innerWidth < 640 ? 1 : Math.min(state.columns, innerWidth < 1000 ? 2 : state.columns);
    body = `<div class="resource-grid masonry-grid" style="--resource-columns:${columns}">${Array.from({length:columns},(_,index)=>`<div class="masonry-column">${nodes.filter((_,position)=>position % columns === index).join('')}</div>`).join('')}</div>`;
  } else body = `<div class="resource-grid ${state.layout}-grid" style="--resource-columns:${state.columns}">${nodes.join('')}</div>`;
  $('#content').innerHTML = heading + (items.length ? body : emptyState(state.page === 'favourites' ? 'No favourites yet' : state.page === 'archive' ? 'Your archive is empty' : undefined, state.page === 'favourites' ? 'Use a resource’s actions menu to add it to favourites.' : state.page === 'archive' ? 'Archived resources will appear here.' : undefined));
  $('#content').dataset.layout = state.layout;
  renderSelection();
}
function renderSelection() {
  let bar = $('#selection-bar');
  if (!bar) { bar = document.createElement('div'); bar.id = 'selection-bar'; bar.className = 'selection-bar rounded-lg border bg-background shadow-md'; bar.setAttribute('role','toolbar'); bar.setAttribute('aria-label','Selected resources'); document.body.append(bar); }
  bar.hidden = !state.selected.length;
  bar.innerHTML = [['copy','Copy selected links','link'],['favourite','Add selected to favourites','star'],['archive',state.page === 'archive' ? 'Restore selected' : 'Archive selected','archive'],['export','Export selected resources','download'],['all','Select all visible resources','check'],['clear','Clear selection','x']].map(([action,label,mark])=>`<button class="${btn} header-button" data-batch="${action}" aria-label="${label}" title="${label}">${icon(mark,18)}</button>`).join('') + `<span class="selection-count" role="status">${state.selected.length} selected</span>`;
}
async function batchAction(kind) {
  const selected = catalog.items.filter(item=>state.selected.includes(item.id));
  if (kind === 'copy') { try { await navigator.clipboard.writeText(selected.map(item=>item.url).join('\n')); toast('Links copied'); } catch { toast('Copy is unavailable in this browser.'); } return; }
  if (kind === 'export') {
    const url = URL.createObjectURL(new Blob([JSON.stringify(selected,null,2)+'\n'],{type:'application/json'}));
    const link = document.createElement('a'); link.href=url; link.download='softshelf-resources.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
  }
  if (kind === 'all') state.selected = visible().map(item=>item.id);
  else {
    if (kind === 'favourite' || kind === 'archive') {
      const key = kind === 'favourite' ? 'favourites' : 'archived';
      state[key] = kind === 'archive' && state.page === 'archive' ? state[key].filter(id=>!state.selected.includes(id)) : [...new Set([...state[key],...state.selected])];
      store.write(key+'-v2',state[key]);renderNav();
    }
    state.selected=[];
  }
  renderResources();
}
function renderTags() {
  const tags = collectTags(catalog.items).filter(tag=>tag.name.toLocaleLowerCase().includes(state.query.trim().toLocaleLowerCase()));
  $('#content').innerHTML = `<div class="collection-heading"><h1 class="text-2xl">All Tags</h1><p class="text-sm text-muted-foreground">${tags.length} tags</p></div><section class="tag-section rounded-lg border bg-card p-6"><h2 class="text-2xl font-semibold">Your Tags <span class="${badge}">${tags.length}</span></h2><p class="text-sm text-muted-foreground">Tags attached to your resources.</p><div class="tag-directory">${tags.map(tag=>`<a class="tag-count rounded border bg-card" href="${route('home',tag.name)}"><span>${esc(tag.name)}</span><span class="text-muted-foreground">${tag.count}</span></a>`).join('') || '<p class="text-muted-foreground">No matching tags.</p>'}</div></section>`;
}
function renderLists() {
  const row = (page, name, mark, description, count) => `<a class="collection-row" href="${route(page)}"><span class="collection-icon rounded-lg border bg-muted">${icon(mark,24)}</span><span class="collection-copy"><span class="text-lg">${esc(name)}</span><span class="text-sm text-muted-foreground">${esc(description)}</span></span><span class="text-sm text-muted-foreground">${count} items</span></a>`;
  $('#content').innerHTML = `<div class="collection-heading"><h1 class="text-2xl">${icon('clipboard-list',24)} All Lists</h1><p class="text-sm text-muted-foreground">${catalog.collections.length} lists · ${catalog.items.length} resources</p></div><h2 class="section-label text-sm text-muted-foreground">Pinned</h2><div class="collection-directory rounded-lg border bg-card">${row('favourites','Favourites','star','Things I keep coming back to.',state.favourites.length)}${row('archive','Archive','archive','Cold storage, out of the way.',state.archived.length)}</div><h2 class="section-label text-sm text-muted-foreground">All</h2><div class="collection-directory rounded-lg border bg-card">${catalog.collections.map(list=>row('list/'+list.id,list.name,list.icon,list.description,catalog.items.filter(item=>item.lists.includes(list.id)).length)).join('')}</div>`;
}
function preview(item) {
  const isSoftware = item.type === 'software';
  $('#preview').innerHTML = `<div class="preview-layout"><section class="preview-reader"><div class="preview-toolbar"><span class="reader-label">${icon('book-open',16)} ${isSoftware ? 'Software Details' : 'Resource Details'}</span><button class="${btn} header-button" data-close="preview" aria-label="Close preview">${icon('x')}</button></div><div class="reader-content"><img class="preview-image" src="${esc(item.image || 'assets/logo.svg')}" alt="${esc(item.name)}"><h2 id="preview-title" class="text-2xl font-semibold">${esc(item.name)}</h2><p class="text-muted-foreground">${esc(item.subtitle || '')}</p><p>${esc(item.description || '')}</p>${item.tips ? `<h3 class="text-lg font-semibold">Installation</h3><p>${esc(item.tips)}</p>` : ''}${item.note && isSoftware ? `<div class="download-notice rounded-lg border bg-muted">${esc(item.note)}</div>` : ''}<a class="${btn} primary-action bg-primary text-primary-foreground hover:bg-primary/90" href="${esc(href(item))}" target="_blank" rel="noopener noreferrer" ${isSoftware ? `download="${esc(item.fileName)}"` : ''}>${icon(isSoftware ? 'download' : 'external-link')}${isSoftware ? 'Download ZIP' : 'Open Website'}</a></div></section><aside class="preview-info bg-accent/50"><h2 class="text-lg font-medium">${esc(item.name)}</h2><a class="text-sm text-muted-foreground preview-original" href="${esc(href(item))}" target="_blank" rel="noopener noreferrer">${icon('external-link',14)} ${isSoftware ? 'Download Original' : 'View Original'}</a><div class="preview-info-section text-sm text-muted-foreground">${icon(isSoftware ? 'file-archive' : 'globe',16)} ${esc(isSoftware ? item.platform+' · '+item.localSize : new URL(item.url).hostname)}</div><div class="preview-info-section"><h3 class="section-label text-xs text-muted-foreground">Tags</h3><div class="flex flex-wrap gap-1">${tagPills(item.tags)}</div></div><div class="preview-info-section"><h3 class="section-label text-xs text-muted-foreground">Note</h3><p class="text-sm text-muted-foreground">${esc(item.description || item.note || 'No note.')}</p></div><div class="preview-info-section"><h3 class="section-label text-xs text-muted-foreground">${isSoftware ? 'Package' : 'Collections'}</h3><p class="text-sm">${esc(isSoftware ? item.fileName : item.lists.map(id=>catalog.collections.find(list=>list.id===id)?.name).join(', '))}</p></div><div class="preview-info-actions"><button class="${btn} header-button ${state.favourites.includes(item.id) ? 'favourite-active' : ''}" data-favourite="${esc(item.id)}" aria-label="Toggle favourite for ${esc(item.name)}" aria-pressed="${state.favourites.includes(item.id)}">${icon('star')}</button><button class="${btn} header-button" data-archive="${esc(item.id)}" aria-label="${state.archived.includes(item.id) ? 'Restore' : 'Archive'} ${esc(item.name)}">${icon('archive')}</button><button class="${btn} header-button" data-copy="${esc(item.id)}" aria-label="Copy link for ${esc(item.name)}">${icon('copy')}</button></div></aside></div>`;
  if (!$('#preview').open) $('#preview').showModal();
}
function readLocation() {
  closeMenu(false);
  const [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  if (path.startsWith('preview/')) {
    let id; try { id = decodeURIComponent(path.slice(8)); } catch { location.hash='#/home';return; }
    const item = catalog.items.find(item=>item.id===id);
    if (item) { state.preview = id; preview(item); return; }
    location.hash = '#/home'; return;
  }
  state.preview = null;
  state.selected = []; renderSelection();
  if ($('#preview').open) $('#preview').close();
  const params = new URLSearchParams(query);
  state.page = path || 'home'; state.query = params.get('q') || ''; state.tag = params.get('tag') || '';
  $('#global-search').value = state.query;
  renderNav();
  if (state.page === 'tags') renderTags();
  else if (state.page === 'lists') renderLists();
  else if (mainNav.some(([page])=>page===state.page) || state.page === 'favourites' || catalog.collections.some(list=>'list/'+list.id===state.page)) renderResources();
  else $('#content').innerHTML = emptyState('Page not found','Choose a collection from the sidebar.');
  $('#main-content').scrollTop = 0;
  if (state.page === 'search') $('#global-search').focus();
}
function menuRow(action, text, mark, selected = false, attrs = '') {
  return `<button role="menuitem" class="menu-row text-sm rounded-sm hover:bg-accent" data-action="${action}" ${attrs}>${icon(mark,16)}<span>${text}</span>${selected ? icon('check',16) : ''}</button>`;
}
function closeMenu(restore = true) {
  const layer = $('#menu-layer'); if (!layer) return;
  layer.replaceChildren();
  menuTrigger?.setAttribute('aria-expanded','false');
  if (restore && menuTrigger?.isConnected) menuTrigger.focus();
  menuTrigger = null;
}
function openMenu(trigger, type) {
  if (menuTrigger === trigger) { closeMenu(); return; }
  closeMenu(false); menuTrigger = trigger; trigger.setAttribute('aria-expanded','true');
  let content = '';
  if (type === 'view') {
    content = '<p class="menu-label">Layout</p>' + [['masonry','Masonry','layout-dashboard'],['grid','Grid','layout-grid'],['list','List','layout-list'],['compact','Compact','list']].map(([value,label,mark])=>menuRow('layout',label,mark,state.layout===value,`data-value="${value}"`)).join('');
    content += `<div class="menu-divider"></div><label class="columns-control text-xs text-muted-foreground">Columns <output id="column-output">${state.columns}</output><input type="range" aria-label="Number of columns" min="2" max="5" value="${state.columns}"></label><div class="menu-divider"></div><p class="menu-label">Display Options</p>`;
    content += [['notes','Show Notes','notepad-text'],['tags','Show Tags','tag'],['title','Show Title','heading']].map(([key,label,mark])=>`<button role="switch" class="menu-row text-sm rounded-sm hover:bg-accent" aria-checked="${state[key]}" data-action="display" data-value="${key}">${icon(mark,16)}<span>${label}</span><span class="switch-track ${state[key] ? 'checked' : ''}"><span></span></span></button>`).join('');
    content += '<div class="menu-divider"></div><p class="menu-label">Image Options</p>' + menuRow('fit','Cover (Fill)','image',state.fit==='cover','data-value="cover"') + menuRow('fit','Contain (Fit)','image',state.fit==='contain','data-value="contain"');
  } else if (type === 'sort') content = menuRow('sort','Newest First','arrow-down-wide-narrow',state.sort==='newest','data-value="newest"') + menuRow('sort','Oldest First','arrow-up-narrow-wide',state.sort==='oldest','data-value="oldest"');
  else if (type === 'profile') {
    content = '<div class="profile-summary"><span class="profile-avatar">S</span><div><p>SoftShelf</p><p class="text-sm text-muted-foreground">My resource collection</p></div></div><div class="menu-divider"></div><p class="menu-label">Theme</p>' + [['light','Light Mode','sun'],['dark','Dark Mode','moon'],['system','System Mode','monitor']].map(([value,label,mark])=>menuRow('set-theme',label,mark,state.theme===value,`data-value="${value}"`)).join('');
    content += '<div class="menu-divider"></div>' + menuRow('shortcuts','Keyboard Shortcuts','keyboard') + `<a role="menuitem" class="menu-row text-sm rounded-sm hover:bg-accent" href="https://github.com/fanhuajin/soft-shelf#软件与使用方式" target="_blank" rel="noopener noreferrer">${icon('book-open',16)}<span>Usage Guide</span></a><a role="menuitem" class="menu-row text-sm rounded-sm hover:bg-accent" href="https://github.com/fanhuajin/soft-shelf" target="_blank" rel="noopener noreferrer">${icon('code',16)}<span>Source Code</span></a>`;
  } else {
    const item = catalog.items.find(item=>item.id===trigger.dataset.id); if (!item) { closeMenu(); return; }
    content = menuRow('open-preview','Preview','maximize2',false,`data-value="${esc(item.id)}"`) + menuRow('favourite',state.favourites.includes(item.id)?'Remove from favourites':'Add to favourites','star',false,`data-value="${esc(item.id)}"`) + menuRow('archive',state.archived.includes(item.id)?'Unarchive':'Archive','archive',false,`data-value="${esc(item.id)}"`) + menuRow('copy','Copy link','copy',false,`data-value="${esc(item.id)}"`);
  }
  $('#menu-layer').innerHTML = `<div role="menu" class="resource-menu ${type === 'view' ? 'view-menu' : ''} rounded-md border bg-popover p-1 text-popover-foreground shadow-md" aria-label="${type==='view'?'View Options':type==='sort'?'Sort':type==='profile'?'Preferences':'Resource Actions'}">${content}</div>`;
  const menu = $('#menu-layer > div'), box = trigger.getBoundingClientRect();
  menu.style.left = Math.max(8,Math.min(innerWidth-menu.offsetWidth-8,box.right-menu.offsetWidth))+'px';
  menu.style.top = Math.min(box.bottom+4,Math.max(8,innerHeight-menu.offsetHeight-8))+'px';
  menu.querySelector('button,a,input')?.focus();
  menu.querySelector('input[type=range]')?.addEventListener('input', event=>{state.columns=Number(event.target.value);$('#column-output').textContent=state.columns;saveView();renderResources();});
}
function toggleLocal(kind,id) {
  if (!catalog.items.some(item=>item.id===id)) return;
  state[kind] = state[kind].includes(id) ? state[kind].filter(value=>value!==id) : [...state[kind],id];
  store.write(kind+'-v2',state[kind]); renderNav();
  if (state.page === 'lists') renderLists(); else if (state.page === 'tags') renderTags(); else renderResources();
  if (state.preview) preview(catalog.items.find(item=>item.id===state.preview));
}
async function copyLink(id) {
  const item = catalog.items.find(item=>item.id===id);if(!item)return;
  try { await navigator.clipboard.writeText(item.url); toast('Link copied'); }
  catch { toast('Copy is unavailable. Open the resource and copy its address.'); }
}
function toast(text) { clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').hidden=false;toastTimer=setTimeout(()=>{$('#toast').hidden=true;},3000); }
function action(button) {
  const value = button.dataset.value;
  switch (button.dataset.action) {
    case 'layout': state.layout=value;saveView();renderResources();closeMenu();break;
    case 'fit': state.fit=value;saveView();renderResources();closeMenu();break;
    case 'sort': state.sort=value;saveView();renderResources();closeMenu();break;
    case 'display': state[value]=!state[value];saveView();renderResources();button.setAttribute('aria-checked',String(state[value]));button.querySelector('.switch-track').classList.toggle('checked',state[value]);break;
    case 'theme': state.theme=document.documentElement.classList.contains('dark')?'light':'dark';store.write('theme-v2',state.theme);applyTheme();break;
    case 'set-theme': state.theme=value;store.write('theme-v2',value);applyTheme();closeMenu();break;
    case 'shortcuts': closeMenu();$('#shortcut-dialog').showModal();break;
    case 'open-preview': closeMenu(false);returnHash=location.hash||'#/home';location.hash='#/preview/'+encodeURIComponent(value);break;
    case 'favourite': closeMenu(false);toggleLocal('favourites',value);break;
    case 'archive': closeMenu(false);toggleLocal('archived',value);break;
    case 'copy': closeMenu();void copyLink(value);break;
  }
}
async function init() {
  const response = await fetch('./assets/resources.json', {cache:'no-cache'});
  if (!response.ok) throw new Error('Unable to load resources.json ('+response.status+').');
  catalog = validateCatalog(await response.json());
  for (const kind of ['favourites','archived']) {
    const ids = store.read(kind+'-v2',[]);
    state[kind] = Array.isArray(ids) ? ids.filter(id=>catalog.items.some(item=>item.id===id)) : [];
  }
  shell();renderNav();renderResources();readLocation();
  window.addEventListener('hashchange',readLocation);
  media.addEventListener('change',applyTheme);
  window.addEventListener('resize',()=>{clearTimeout(redrawTimer);redrawTimer=setTimeout(()=>{closeMenu(false);if(!['tags','lists'].includes(state.page))renderResources();},100);});
  document.addEventListener('click',event=>{
    const button=event.target.closest('button,a');
    if (!button) {if(!event.target.closest('[role=menu]'))closeMenu(false);return;}
    if (button.dataset.menu) {openMenu(button,button.dataset.menu);return;}
    if (button.dataset.select) { const id=button.dataset.select;state.selected=state.selected.includes(id)?state.selected.filter(value=>value!==id):[...state.selected,id];renderResources();return; }
    if (button.dataset.batch) { void batchAction(button.dataset.batch); return; }
    if (!event.target.closest('[role=menu]'))closeMenu(false);
    if (button.dataset.preview) returnHash=location.hash||'#/home';
    if (button.dataset.close) $('#'+button.dataset.close).close();
    if (button.dataset.action) action(button);
    if (button.dataset.favourite) toggleLocal('favourites',button.dataset.favourite);
    if (button.dataset.archive) toggleLocal('archived',button.dataset.archive);
    if (button.dataset.copy) void copyLink(button.dataset.copy);
  });
  document.addEventListener('keydown',event=>{
    if (event.key==='Escape' && $('[role=menu]')) {event.preventDefault();closeMenu();return;}
    if (event.key==='Escape' && event.target===$('#global-search')) {$('#global-search').value='';state.query='';history.replaceState(null,'',route(state.page,state.tag));if(state.page==='tags')renderTags();else if(state.page==='lists')renderLists();else renderResources();$('#global-search').blur();}
    if (event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.target.closest('input,textarea,[contenteditable]')&&!$('dialog[open]')) {event.preventDefault();$('#global-search').focus();}
    if (['ArrowDown','ArrowUp','Home','End'].includes(event.key) && event.target.closest('[role=menu]') && event.target.type!=='range') {const elements=[...$('[role=menu]').querySelectorAll('button,a,input')];let index=elements.indexOf(document.activeElement);index=event.key==='Home'?0:event.key==='End'?elements.length-1:(index+(event.key==='ArrowDown'?1:-1)+elements.length)%elements.length;event.preventDefault();elements[index]?.focus();}
  });
  document.addEventListener('error',event=>{if(event.target.matches?.('.resource-cover')){event.target.hidden=true;event.target.parentElement.classList.add('image-failed');}},true);
}
init().catch(error=>{
  $('#app').innerHTML=`<main class="load-error rounded-lg border bg-card p-6"><h1 class="text-2xl">Unable to load SoftShelf</h1><p>${esc(error.message)}</p><p class="text-sm text-muted-foreground">Check assets/resources.json and serve this folder over HTTP.</p><button class="primary-action bg-primary text-primary-foreground" id="reload-app">Reload</button></main>`;
  $('#reload-app').addEventListener('click',()=>location.reload());
});
