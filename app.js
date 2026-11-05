import { icons } from './vendor/karakeep/icons.js?v=8467716af3a8';
import { selectResources, collectTags, validateCatalog } from './lib/resources.js?v=33f35fdfc50e';

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
const mainNav = [['home', '首页', 'house'], ['search', '搜索', 'search'], ['tags', '标签', 'tag'], ['highlights', '摘录', 'highlighter'], ['archive', '归档', 'archive']];
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
  $('#theme-quick')?.setAttribute('aria-label', dark ? '切换浅色主题' : '切换深色主题');
  $('#theme-quick')?.setAttribute('aria-pressed', String(dark));
}
function href(item) { return item.type === 'software' && location.protocol === 'file:' ? './downloads/' + encodeURIComponent(item.fileName) : item.url; }
function visible() { return selectResources(catalog.items, state); }
function titleForPage() {
  if (state.page.startsWith('list/')) return catalog.collections.find(list => list.id === state.page.slice(5))?.name || '分类';
  return ({home: '首页', search: '搜索', tags: '全部标签', lists: '全部列表', favourites: '收藏夹', highlights: '摘录', archive: '归档'})[state.page] || '未找到';
}
function sidebarItem(page, label, mark, count = null, nested = false) {
  const active = state.page === page && !state.tag;
  return `<li class="relative flex justify-between rounded-lg text-sm transition-colors hover:bg-accent ${active ? 'bg-accent/50 text-foreground' : 'text-muted-foreground'}"><a href="${route(page)}" class="sidebar-link ${nested ? 'nested' : ''}" ${active ? 'aria-current="page"' : ''}>${icon(mark)}<span class="line-clamp-1">${esc(label)}</span>${count === null ? '' : `<span class="sidebar-count">${count}</span>`}</a></li>`;
}
function renderNav() {
  $('#primary-nav').innerHTML = mainNav.map(([page, label, mark]) => sidebarItem(page, label, mark)).join('');
  const counts = id => catalog.items.filter(item => item.lists.includes(id)).length;
  $('#list-nav').innerHTML = sidebarItem('lists', '全部列表', 'clipboard-list') + sidebarItem('favourites', '收藏夹', 'star', state.favourites.length) + catalog.collections.map(list => sidebarItem('list/' + list.id, list.name, list.icon, counts(list.id), !!list.parent)).join('');
  $('#mobile-nav').innerHTML = [...mainNav, ['lists', '全部列表', 'clipboard-list']].map(([page, label, mark]) => `<li class="flex w-full rounded-lg hover:bg-background ${state.page === page ? 'bg-background' : ''}"><a class="m-auto px-3 py-2" href="${route(page)}" aria-label="${label}" ${state.page === page ? 'aria-current="page"' : ''}>${icon(mark)}</a></li>`).join('');
  document.title = (state.page === 'home' ? '' : titleForPage() + ' | ') + catalog.title;
}
function shell() {
  $('#app').innerHTML = `<div class="app-shell">
    <a class="skip-link" href="#main-content">跳转到资源</a>
    <header class="sticky left-0 right-0 top-0 z-50 flex h-16 w-full items-center justify-between bg-background p-4 shadow">
      <a class="brand-slot" href="#/home" aria-label="SoftShelf 首页"><span class="brand-mark" aria-hidden="true">${$('#brand-source').innerHTML}</span><span class="brand-name">SoftShelf</span></a>
      <div class="header-search"><label class="search-field bg-muted rounded-md">${icon('search',16)}<input id="global-search" type="search" placeholder="搜索标题、内容、网址和标签…" aria-label="搜索资源" autocomplete="off"><kbd>/</kbd></label>
        <button id="view-trigger" class="${btn} header-button" data-menu="view" aria-label="显示设置" title="显示设置" aria-haspopup="menu" aria-expanded="false">${icon('settings')}</button>
        <button id="sort-trigger" class="${btn} header-button" data-menu="sort" aria-label="资源排序" title="排序" aria-haspopup="menu" aria-expanded="false">${icon('arrow-down-wide-narrow')}</button>
      </div>
      <button class="${btn} profile-button" data-menu="profile" aria-label="SoftShelf 偏好设置" title="偏好设置" aria-haspopup="menu" aria-expanded="false">S</button>
    </header>
    <div class="workspace">
      <aside class="desktop-sidebar"><nav aria-label="主导航"><ul id="primary-nav" class="space-y-2 text-sm"></ul></nav><div class="shrink-0 bg-border h-[1px] w-full"></div><nav class="collections-nav" aria-label="分类"><p class="pl-2 text-xs uppercase tracking-wider text-muted-foreground collections-label">列表</p><ul id="list-nav" class="text-sm"></ul></nav><div class="sidebar-footer"><span>SoftShelf</span><button id="theme-quick" class="theme-quick" data-action="theme" aria-label="切换主题">${icon('sun-moon',14)}</button></div></aside>
      <main id="main-content" class="main-panel bg-muted" tabindex="-1"><nav class="mobile-navigation" aria-label="移动导航"><ul id="mobile-nav" class="flex justify-between space-x-2 px-5 py-2 pt-5"></ul></nav><div id="content" class="content-area p-4" aria-live="polite"></div></main>
    </div>
    <div id="menu-layer"></div><dialog id="preview" aria-labelledby="preview-title"></dialog><dialog id="shortcut-dialog" class="small-dialog" aria-labelledby="shortcut-title"><div class="dialog-toolbar"><h2 id="shortcut-title">快捷键</h2><button class="${btn} header-button" data-close="shortcut-dialog" aria-label="关闭快捷键说明">${icon('x')}</button></div><dl class="shortcut-list"><dt>搜索</dt><dd><kbd>/</kbd></dd><dt>关闭菜单或预览</dt><dd><kbd>Esc</kbd></dd><dt>清空搜索</dt><dd><kbd>Esc</kbd></dd><dt>切换焦点</dt><dd><kbd>Tab</kbd></dd></dl></dialog><div id="toast" role="status" class="toast" hidden></div>
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
  const image = item.image ? `<a href="${esc(href(item))}" target="_blank" rel="noopener noreferrer" class="card-banner branded-banner" style="--cover-hue:${hue}" aria-label="${esc((isSoftware ? '下载 ' : '打开 ') + item.name)}" ${isSoftware ? `download="${esc(item.fileName)}"` : ''}><span class="cover-kind">${esc(isSoftware ? '软件' : item.type === 'project' ? '项目' : '网页收藏')}</span><span class="cover-logo"><img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy" decoding="async" class="resource-cover" data-fit="${state.fit}"></span></a>` : '';
  return `<article class="resource-card group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card hover:shadow-lg hover:transition-shadow ${state.selected.includes(item.id) ? 'is-selected' : ''}" data-resource="${esc(item.id)}" data-order="${index}">
    <button class="card-select" data-select="${esc(item.id)}" aria-label="选择 ${esc(item.name)}" aria-pressed="${state.selected.includes(item.id)}">${icon(state.selected.includes(item.id) ? 'check' : 'circle',18)}</button>${image}<div class="card-content flex h-full flex-col justify-between gap-2 overflow-hidden p-2"><div class="card-body flex flex-col gap-2 overflow-hidden">
      ${state.title ? `<div class="line-clamp-2 shrink-0 overflow-hidden text-ellipsis break-words text-lg"><a href="${esc(href(item))}" target="_blank" rel="noopener noreferrer" ${isSoftware ? `download="${esc(item.fileName)}"` : ''}>${esc(item.name)}</a></div>` : ''}
      ${state.notes ? `<p class="card-note text-sm text-muted-foreground">${esc(item.description || item.subtitle || '')}</p>` : ''}
      ${state.tags ? `<div class="card-tags flex shrink-0 flex-wrap gap-1 overflow-hidden">${tagPills(item.tags)}</div>` : ''}
    </div><div class="card-bottom flex w-full shrink-0 justify-between text-gray-500"><div class="card-meta flex items-center gap-2 overflow-hidden text-nowrap font-light"><a class="line-clamp-1 hover:text-foreground" href="${esc(href(item))}" target="_blank" rel="noopener noreferrer">${esc(isSoftware ? item.platform : domain)}</a>${isSoftware ? `<span aria-hidden="true">·</span><span>${esc(meta)}</span>` : ''}</div>
      <div class="card-actions flex text-gray-500">${archived ? `<span class="archive-indicator" title="已归档">${icon('archive',16)}</span>` : ''}${fav ? `<button class="${btn} card-action favourite-active" data-favourite="${esc(item.id)}" aria-label="取消收藏 ${esc(item.name)}" aria-pressed="true">${icon('star',20)}</button>` : ''}
      <a class="${btn} card-action" href="#/preview/${encodeURIComponent(item.id)}" data-preview="${esc(item.id)}" aria-label="预览 ${esc(item.name)}" title="预览">${icon('maximize2',16)}</a><button class="${btn} card-action" data-menu="item" data-id="${esc(item.id)}" aria-label="${esc(item.name)} 的操作" aria-haspopup="menu" aria-expanded="false">${icon('ellipsis',22)}</button></div>
    </div></div></article>`;
}
function emptyState(title = '未找到资源', message = '请尝试其他关键词、标签或分类。') {
  return `<div class="empty-state"><span class="text-muted-foreground">${icon('search-x',40)}</span><h2 class="text-lg font-medium">${esc(title)}</h2><p class="text-sm text-muted-foreground">${esc(message)}</p><a class="${btn} empty-home" href="#/home">查看全部资源</a></div>`;
}
function renderResources() {
  const items = visible();
  const collection = state.page.startsWith('list/') ? catalog.collections.find(list => list.id === state.page.slice(5)) : null;
  let heading = '';
  if (state.page !== 'home' || state.query || state.tag) heading = `<div class="collection-heading"><h1 class="text-2xl">${collection ? icon(collection.icon,24) : state.tag ? icon('tag',24) : ''}${esc(state.tag || (state.query ? '搜索' : titleForPage()))}</h1><p class="text-sm text-muted-foreground">${items.length} 项资源${state.query ? ' · ' + esc(state.query) : ''}</p>${state.tag ? `<a class="${btn}" href="${route(state.page)}" aria-label="清除标签筛选">${icon('x',16)} 清除标签</a>` : ''}</div>`;
  if (state.page === 'highlights') {
    const highlights = items.flatMap(item => (item.highlights || []).map(text => `<article class="highlight-card rounded-lg border bg-card p-4"><p>${esc(text)}</p><a href="#/preview/${encodeURIComponent(item.id)}" class="text-sm text-muted-foreground">${esc(item.name)}</a></article>`));
    $('#content').innerHTML = heading + (highlights.join('') || emptyState('暂无摘录','在资源配置中添加摘录后，将在这里显示。'));
    return;
  }
  const nodes = items.map(card);
  let body;
  if (state.layout === 'masonry') {
    // Distribute in reading order just like the source's responsive masonry columns.
    const columns = innerWidth < 640 ? 1 : Math.min(state.columns, innerWidth < 1000 ? 2 : state.columns);
    body = `<div class="resource-grid masonry-grid" style="--resource-columns:${columns}">${Array.from({length:columns},(_,index)=>`<div class="masonry-column">${nodes.filter((_,position)=>position % columns === index).join('')}</div>`).join('')}</div>`;
  } else body = `<div class="resource-grid ${state.layout}-grid" style="--resource-columns:${state.columns}">${nodes.join('')}</div>`;
  $('#content').innerHTML = heading + (items.length ? body : emptyState(state.page === 'favourites' ? '暂无收藏' : state.page === 'archive' ? '暂无归档' : undefined, state.page === 'favourites' ? '通过卡片的操作菜单添加收藏。' : state.page === 'archive' ? '归档后的资源将在这里显示。' : undefined));
  $('#content').dataset.layout = state.layout;
  renderSelection();
}
function renderSelection() {
  let bar = $('#selection-bar');
  if (!bar) { bar = document.createElement('div'); bar.id = 'selection-bar'; bar.className = 'selection-bar rounded-lg border bg-background shadow-md'; bar.setAttribute('role','toolbar'); bar.setAttribute('aria-label','已选资源'); document.body.append(bar); }
  bar.hidden = !state.selected.length;
  bar.innerHTML = [['copy','复制所选链接','link'],['favourite','收藏所选资源','star'],['archive',state.page === 'archive' ? '恢复所选资源' : '归档所选资源','archive'],['export','导出所选资源','download'],['all','全选当前资源','check'],['clear','取消选择','x']].map(([action,label,mark])=>`<button class="${btn} header-button" data-batch="${action}" aria-label="${label}" title="${label}">${icon(mark,18)}</button>`).join('') + `<span class="selection-count" role="status">已选 ${state.selected.length} 项</span>`;
}
async function batchAction(kind) {
  const selected = catalog.items.filter(item=>state.selected.includes(item.id));
  if (kind === 'copy') { try { await navigator.clipboard.writeText(selected.map(item=>item.url).join('\n')); toast('链接已复制'); } catch { toast('当前浏览器无法复制链接。'); } return; }
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
  $('#content').innerHTML = `<div class="collection-heading"><h1 class="text-2xl">全部标签</h1><p class="text-sm text-muted-foreground">${tags.length} 个标签</p></div><section class="tag-section rounded-lg border bg-card p-6"><h2 class="text-2xl font-semibold">资源标签 <span class="${badge}">${tags.length}</span></h2><p class="text-sm text-muted-foreground">查看资源使用的标签。</p><div class="tag-directory">${tags.map(tag=>`<a class="tag-count rounded border bg-card" href="${route('home',tag.name)}"><span>${esc(tag.name)}</span><span class="text-muted-foreground">${tag.count}</span></a>`).join('') || '<p class="text-muted-foreground">未找到匹配的标签。</p>'}</div></section>`;
}
function renderLists() {
  const row = (page, name, mark, description, count) => `<a class="collection-row" href="${route(page)}"><span class="collection-icon rounded-lg border bg-muted">${icon(mark,24)}</span><span class="collection-copy"><span class="text-lg">${esc(name)}</span><span class="text-sm text-muted-foreground">${esc(description)}</span></span><span class="text-sm text-muted-foreground">${count} 项</span></a>`;
  $('#content').innerHTML = `<div class="collection-heading"><h1 class="text-2xl">${icon('clipboard-list',24)} 全部列表</h1><p class="text-sm text-muted-foreground">${catalog.collections.length} 个列表 · ${catalog.items.length} 项资源</p></div><h2 class="section-label text-sm text-muted-foreground">常用</h2><div class="collection-directory rounded-lg border bg-card">${row('favourites','收藏夹','star','收藏常用的资源。',state.favourites.length)}${row('archive','归档','archive','暂时收起的资源。',state.archived.length)}</div><h2 class="section-label text-sm text-muted-foreground">全部</h2><div class="collection-directory rounded-lg border bg-card">${catalog.collections.map(list=>row('list/'+list.id,list.name,list.icon,list.description,catalog.items.filter(item=>item.lists.includes(list.id)).length)).join('')}</div>`;
}
function preview(item) {
  const isSoftware = item.type === 'software';
  $('#preview').innerHTML = `<div class="preview-layout"><section class="preview-reader"><div class="preview-toolbar"><span class="reader-label">${icon('book-open',16)} ${isSoftware ? '软件详情' : '资源详情'}</span><button class="${btn} header-button" data-close="preview" aria-label="关闭预览">${icon('x')}</button></div><div class="reader-content"><img class="preview-image" src="${esc(item.image || 'assets/logo.svg')}" alt="${esc(item.name)}"><h2 id="preview-title" class="text-2xl font-semibold">${esc(item.name)}</h2><p class="text-muted-foreground">${esc(item.subtitle || '')}</p><p>${esc(item.description || '')}</p>${item.tips ? `<h3 class="text-lg font-semibold">安装说明</h3><p>${esc(item.tips)}</p>` : ''}${item.note && isSoftware ? `<div class="download-notice rounded-lg border bg-muted">${esc(item.note)}</div>` : ''}<a class="${btn} primary-action bg-primary text-primary-foreground hover:bg-primary/90" href="${esc(href(item))}" target="_blank" rel="noopener noreferrer" ${isSoftware ? `download="${esc(item.fileName)}"` : ''}>${icon(isSoftware ? 'download' : 'external-link')}${isSoftware ? '下载压缩包' : '打开网站'}</a></div></section><aside class="preview-info bg-accent/50"><h2 class="text-lg font-medium">${esc(item.name)}</h2><a class="text-sm text-muted-foreground preview-original" href="${esc(href(item))}" target="_blank" rel="noopener noreferrer">${icon('external-link',14)} ${isSoftware ? '下载原文件' : '查看原网页'}</a><div class="preview-info-section text-sm text-muted-foreground">${icon(isSoftware ? 'file-archive' : 'globe',16)} ${esc(isSoftware ? item.platform+' · '+item.localSize : new URL(item.url).hostname)}</div><div class="preview-info-section"><h3 class="section-label text-xs text-muted-foreground">标签</h3><div class="flex flex-wrap gap-1">${tagPills(item.tags)}</div></div><div class="preview-info-section"><h3 class="section-label text-xs text-muted-foreground">备注</h3><p class="text-sm text-muted-foreground">${esc(item.description || item.note || '暂无备注。')}</p></div><div class="preview-info-section"><h3 class="section-label text-xs text-muted-foreground">${isSoftware ? '安装包' : '分类'}</h3><p class="text-sm">${esc(isSoftware ? item.fileName : item.lists.map(id=>catalog.collections.find(list=>list.id===id)?.name).join(', '))}</p></div><div class="preview-info-actions"><button class="${btn} header-button ${state.favourites.includes(item.id) ? 'favourite-active' : ''}" data-favourite="${esc(item.id)}" aria-label="切换收藏 ${esc(item.name)}" aria-pressed="${state.favourites.includes(item.id)}">${icon('star')}</button><button class="${btn} header-button" data-archive="${esc(item.id)}" aria-label="${state.archived.includes(item.id) ? '恢复' : '归档'} ${esc(item.name)}">${icon('archive')}</button><button class="${btn} header-button" data-copy="${esc(item.id)}" aria-label="复制 ${esc(item.name)} 的链接">${icon('copy')}</button></div></aside></div>`;
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
  else $('#content').innerHTML = emptyState('页面不存在','请从侧栏选择分类。');
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
    content = '<p class="menu-label">布局</p>' + [['masonry','瀑布流','layout-dashboard'],['grid','网格','layout-grid'],['list','列表','layout-list'],['compact','紧凑','list']].map(([value,label,mark])=>menuRow('layout',label,mark,state.layout===value,`data-value="${value}"`)).join('');
    content += `<div class="menu-divider"></div><label class="columns-control text-xs text-muted-foreground">列数 <output id="column-output">${state.columns}</output><input type="range" aria-label="列数" min="2" max="5" value="${state.columns}"></label><div class="menu-divider"></div><p class="menu-label">显示选项</p>`;
    content += [['notes','显示说明','notepad-text'],['tags','显示标签','tag'],['title','显示标题','heading']].map(([key,label,mark])=>`<button role="switch" class="menu-row text-sm rounded-sm hover:bg-accent" aria-checked="${state[key]}" data-action="display" data-value="${key}">${icon(mark,16)}<span>${label}</span><span class="switch-track ${state[key] ? 'checked' : ''}"><span></span></span></button>`).join('');
    content += '<div class="menu-divider"></div><p class="menu-label">图片选项</p>' + menuRow('fit','填充封面','image',state.fit==='cover','data-value="cover"') + menuRow('fit','完整显示','image',state.fit==='contain','data-value="contain"');
  } else if (type === 'sort') content = menuRow('sort','最新在前','arrow-down-wide-narrow',state.sort==='newest','data-value="newest"') + menuRow('sort','最早在前','arrow-up-narrow-wide',state.sort==='oldest','data-value="oldest"');
  else if (type === 'profile') {
    content = '<div class="profile-summary"><span class="profile-avatar">S</span><div><p>SoftShelf</p><p class="text-sm text-muted-foreground">我的资源收藏</p></div></div><div class="menu-divider"></div><p class="menu-label">主题</p>' + [['light','浅色模式','sun'],['dark','深色模式','moon'],['system','跟随系统','monitor']].map(([value,label,mark])=>menuRow('set-theme',label,mark,state.theme===value,`data-value="${value}"`)).join('');
    content += '<div class="menu-divider"></div>' + menuRow('shortcuts','快捷键','keyboard') + `<a role="menuitem" class="menu-row text-sm rounded-sm hover:bg-accent" href="https://github.com/fanhuajin/soft-shelf#软件与使用方式" target="_blank" rel="noopener noreferrer">${icon('book-open',16)}<span>使用说明</span></a><a role="menuitem" class="menu-row text-sm rounded-sm hover:bg-accent" href="https://github.com/fanhuajin/soft-shelf" target="_blank" rel="noopener noreferrer">${icon('code',16)}<span>源代码</span></a>`;
  } else {
    const item = catalog.items.find(item=>item.id===trigger.dataset.id); if (!item) { closeMenu(); return; }
    content = menuRow('open-preview','预览','maximize2',false,`data-value="${esc(item.id)}"`) + menuRow('favourite',state.favourites.includes(item.id)?'取消收藏':'添加收藏','star',false,`data-value="${esc(item.id)}"`) + menuRow('archive',state.archived.includes(item.id)?'取消归档':'归档','archive',false,`data-value="${esc(item.id)}"`) + menuRow('copy','复制链接','copy',false,`data-value="${esc(item.id)}"`);
  }
  $('#menu-layer').innerHTML = `<div role="menu" class="resource-menu ${type === 'view' ? 'view-menu' : ''} rounded-md border bg-popover p-1 text-popover-foreground shadow-md" aria-label="${type==='view'?'显示设置':type==='sort'?'排序':type==='profile'?'偏好设置':'资源操作'}">${content}</div>`;
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
  try { await navigator.clipboard.writeText(item.url); toast('链接已复制'); }
  catch { toast('无法复制，请打开资源后复制地址。'); }
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
  if (!response.ok) throw new Error('无法加载资源配置（'+response.status+').');
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
    if (['ArrowDown','ArrowUp','首页','End'].includes(event.key) && event.target.closest('[role=menu]') && event.target.type!=='range') {const elements=[...$('[role=menu]').querySelectorAll('button,a,input')];let index=elements.indexOf(document.activeElement);index=event.key==='首页'?0:event.key==='End'?elements.length-1:(index+(event.key==='ArrowDown'?1:-1)+elements.length)%elements.length;event.preventDefault();elements[index]?.focus();}
  });
  document.addEventListener('error',event=>{if(event.target.matches?.('.resource-cover')){event.target.hidden=true;event.target.parentElement.classList.add('image-failed');}},true);
}
init().catch(error=>{
  $('#app').innerHTML=`<main class="load-error rounded-lg border bg-card p-6"><h1 class="text-2xl">无法加载 SoftShelf</h1><p>${esc(error.message)}</p><p class="text-sm text-muted-foreground">请检查 assets/resources.json，并通过 HTTP 访问本站。</p><button class="primary-action bg-primary text-primary-foreground" id="reload-app">重新加载</button></main>`;
  $('#reload-app').addEventListener('click',()=>location.reload());
});
