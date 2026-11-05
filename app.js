const $ = (selector) => document.querySelector(selector);
const storage = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
};
const categoryNames = {'写作':'写作记录','截图':'截图贴图','远程':'远程连接','录屏':'屏幕录制','开发':'开发测试','网络':'网络工具','视频':'视频工具','浏览器':'浏览器扩展'};
let filter = 'all';
let toastTimer;
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
$('.filters').innerHTML = '<button data-filter="all" aria-pressed="true">全部软件</button>' + [...new Set(software.map(app => app.category))].map(category => `<button data-filter="${escapeHTML(category)}" aria-pressed="false">${escapeHTML(categoryNames[category] || category)}</button>`).join('');
// 官网图标随页面本地保存；意外加载失败时保留文字标识。
document.addEventListener('error', event => {
  if (event.target.matches?.('.app-icon img')) event.target.classList.add('failed');
}, true);
function destination(app) {
  if (app.releaseUrl && window.location.protocol !== 'file:') return app.releaseUrl;
  return app.fileName ? `./downloads/${encodeURIComponent(app.fileName)}` : app.website;
}
function icon(app) { return `<span class="app-icon ${escapeHTML(app.id)}" aria-hidden="true"><span class="icon-fallback">${escapeHTML(app.name.slice(0, 1))}</span><img src="${escapeHTML(app.icon)}" alt="" width="48" height="48"></span>`; }
function downloadLink(app) {
  if (app.downloadNote) return `<span class="text-button">${escapeHTML(app.downloadNote)}</span>`;
  if (!app.fileName) return `<a class="primary" href="${escapeHTML(destination(app))}" target="_blank" rel="noopener noreferrer">前往官网下载 <span aria-hidden="true">↗</span></a>`;
  return `<a class="primary" href="${escapeHTML(destination(app))}" download="${escapeHTML(app.fileName)}" data-download="${app.id}">${app.fileName.endsWith('.zip') ? '下载 ZIP' : '下载安装包'} <span aria-hidden="true">↓</span></a>`;
}
// 分组与卡片只生成一次，筛选时保留节点和键盘焦点。
const categories = [...new Set(software.map(app => app.category))];
function card(app) {
  const content = icon(app) + '<span class="card-copy"><span class="card-title">' + escapeHTML(app.name) + '</span><span class="description">' + escapeHTML(app.subtitle || app.description) + '</span></span>';
  const label = escapeHTML(app.name + (app.fileName ? '，下载 ' + app.fileName : '，前往官网下载'));
  const main = app.downloadNote
    ? '<button class="card-main" data-detail="' + escapeHTML(app.id) + '">' + content + '</button>'
    : '<a class="card-main" href="' + escapeHTML(destination(app)) + '" aria-label="' + label + '" ' + (app.fileName ? 'download="' + escapeHTML(app.fileName) + '" data-download="' + escapeHTML(app.id) + '"' : 'target="_blank" rel="noopener noreferrer"') + '>' + content + '</a>';
  return '<article class="card" data-app="' + escapeHTML(app.id) + '">' + main + '<button class="details-button" data-detail="' + escapeHTML(app.id) + '" aria-label="' + escapeHTML(app.name) + ' 详情" title="查看详情">ⓘ</button></article>';
}
$('#cards').innerHTML = categories.map((category, index) => '<section class="software-group" aria-labelledby="group-' + index + '"><h2 id="group-' + index + '"><span class="group-icon" aria-hidden="true">→</span>' + escapeHTML(categoryNames[category] || category) + '</h2><div class="cards">' + software.filter(app => app.category === category).map(card).join('') + '</div></section>').join('');
function render() {
  const query = $('#search').value.trim().toLocaleLowerCase();
  const apps = software.filter(app => (filter === 'all' || app.category === filter) && [app.name, app.category, app.description, ...app.tags].join(' ').toLocaleLowerCase().includes(query));
  $('#total').textContent = `${software.length} 款`;
  $('#total').setAttribute('aria-label', `共 ${software.length} 款软件`);
  const visibleIds = new Set(apps.map(app => app.id));
  document.querySelectorAll('#cards .card').forEach(card => {
    card.hidden = !visibleIds.has(card.dataset.app);
  });
  document.querySelectorAll('.software-group').forEach(group => {
    group.hidden = !group.querySelector('.card:not([hidden])');
  });
  $('#results').textContent = '找到 ' + apps.length + ' 款软件';
  $('#empty').hidden = apps.length > 0;
  $('#empty-text').textContent = query ? '没有匹配的结果，试试其他关键词。' : '这个分类暂时没有软件，试试其他分类。';
  document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
}
function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3000);
}
function showDetail(app) {
  $('#dialog-content').innerHTML = `${icon(app)}<h2 id="dialog-title">${escapeHTML(app.name)}</h2><p>${escapeHTML(app.description)}</p><p class="file-meta">${escapeHTML(app.platform)} · ${escapeHTML(app.usage)}${app.localSize ? ' · ' + escapeHTML(app.localSize) : ''}</p><p>${escapeHTML(app.tips)}</p><p class="notice">${escapeHTML(app.note)}</p><div class="dialog-actions">${downloadLink(app)}</div>`;
  $('#detail').showModal();
}
document.addEventListener('click', event => {
  const button = event.target.closest('button, a');
  if (!button) return;
  if (button.dataset.filter) { filter = button.dataset.filter; render(); }
  if (button.dataset.detail) showDetail(software.find(app => app.id === button.dataset.detail));
  if (button.dataset.download) {
    toast('已请求下载安装包，请查看浏览器下载列表');
  }
});
$('#search').addEventListener('input', render);
$('#reset').addEventListener('click', () => { filter = 'all'; $('#search').value = ''; render(); $('#search').focus(); });
$('#close-dialog').addEventListener('click', () => $('#detail').close());
$('#detail').addEventListener('click', event => {
  const rect = $('#detail').getBoundingClientRect();
  if (event.target === $('#detail') && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) $('#detail').close();
});
$('#about').addEventListener('click', () => {
  $('#dialog-content').innerHTML = '<p class="eyebrow">ABOUT SOFT SHELF</p><h2 id="dialog-title">关于 SoftShelf</h2><p>SoftShelf，是我的个人软件架。这里整理常用的软件与工具，方便查找和下载。</p><p class="notice">软件属于各自作者。这里提供本站保存的软件包，点击即可下载。</p>';
  $('#detail').showModal();
});
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $('#theme').setAttribute('aria-label', theme === 'dark' ? '切换浅色主题' : '切换深色主题');
  $('#theme').setAttribute('aria-pressed', String(theme === 'dark'));
}
const savedTheme = storage.get('shelf-theme', null);
applyTheme(['dark','light'].includes(savedTheme) ? savedTheme : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
$('#theme').addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme); storage.set('shelf-theme', theme);
});
function applyLayout(columns) {
  $('#cards').classList.toggle('columns', columns);
  $('#layout').setAttribute('aria-pressed', String(columns));
  $('#layout').setAttribute('aria-label', columns ? '切换为横排布局' : '切换为分栏布局');
}
applyLayout(storage.get('shelf-columns', true) === true);
$('#layout').addEventListener('click', () => {
  const columns = !$('#cards').classList.contains('columns');
  applyLayout(columns); storage.set('shelf-columns', columns);
});
$('#menu').addEventListener('click', () => {
  const expanded = $('#menu').getAttribute('aria-expanded') !== 'true';
  $('#menu').setAttribute('aria-expanded', String(expanded));
  $('#menu').setAttribute('aria-label', expanded ? '收起导航菜单' : '展开导航菜单');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && event.target === $('#search')) { $('#search').value = ''; render(); }

  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !$('#detail').open && !event.target.closest('input, textarea, [contenteditable]')) { event.preventDefault(); $('#menu').setAttribute('aria-expanded', 'true'); $('#menu').setAttribute('aria-label', '收起导航菜单'); $('#search').focus(); }
});
$('#back-top').addEventListener('click', event => { event.preventDefault(); window.scrollTo({top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}); $('.brand').focus({preventScroll:true}); });
render();
