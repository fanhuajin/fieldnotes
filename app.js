const $ = (selector) => document.querySelector(selector);
const storage = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
};
const categoryNames = {'写作':'写作记录','截图':'截图贴图','远程':'远程连接','录屏':'屏幕录制','开发':'开发测试','网络':'网络工具','视频':'视频工具','浏览器':'浏览器扩展'};
const selectedDownloads = new Set();
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
// 保留卡片节点，筛选时只切换显示，避免图标重建和焦点丢失。
$('#cards').innerHTML = software.map(app => `<article class="card" data-app="${escapeHTML(app.id)}"><div class="card-top">${icon(app)}<div><h3>${escapeHTML(app.name)}</h3></div>${app.fileName && !app.downloadNote ? `<label class="download-choice"><input type="checkbox" data-select="${escapeHTML(app.id)}" aria-label="选择下载 ${escapeHTML(app.name)}"></label>` : ''}</div><p class="description">${escapeHTML(app.description)}</p><div class="tags">${app.tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}</div><div class="card-bottom"><div class="file-meta"><span>${escapeHTML(app.platform)} · ${escapeHTML(app.usage)}</span><span>${app.downloadNote ? '百度网盘' : app.localSize ? '加密包 ' + escapeHTML(app.localSize) : '官网下载'}</span></div><div class="card-actions"><button class="details-button" data-detail="${app.id}">详情</button>${downloadLink(app)}</div></div></article>`).join('');
function render() {
  const query = $('#search').value.trim().toLocaleLowerCase();
  const apps = software.filter(app => (filter === 'all' || app.category === filter) && [app.name, app.category, app.description, ...app.tags].join(' ').toLocaleLowerCase().includes(query));
  $('#total').textContent = `${software.length} 款`;
  $('#total').setAttribute('aria-label', `共 ${software.length} 款软件`);
  const visibleIds = new Set(apps.map(app => app.id));
  document.querySelectorAll('#cards .card').forEach(card => {
    card.hidden = !visibleIds.has(card.dataset.app);
  });
  $('#empty').hidden = apps.length > 0;
  $('#empty-text').textContent = query ? '没有匹配的结果，试试其他关键词。' : '这个分类暂时没有软件，试试其他分类。';
  document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
}
function updateSelection() {
  $('#selection-count').textContent = `已选 ${selectedDownloads.size} 项`;
  $('#download-selected').disabled = selectedDownloads.size === 0;
  $('#clear-selection').disabled = selectedDownloads.size === 0;
}
$('#cards').addEventListener('change', event => {
  const input = event.target.closest('[data-select]');
  if (!input) return;
  input.checked ? selectedDownloads.add(input.dataset.select) : selectedDownloads.delete(input.dataset.select);
  input.closest('.card').classList.toggle('selected', input.checked);
  updateSelection();
});
$('#clear-selection').addEventListener('click', () => {
  selectedDownloads.clear();
  document.querySelectorAll('[data-select]').forEach(input => {
    input.checked = false;
    input.closest('.card').classList.remove('selected');
  });
  updateSelection();
});
$('#download-selected').addEventListener('click', () => {
  const apps = software.filter(app => selectedDownloads.has(app.id) && app.fileName && !app.downloadNote);
  if (!apps.length) return;
  apps.forEach(app => {
    const link = document.createElement('a');
    link.href = destination(app);
    link.download = app.fileName;
    document.body.append(link);
    link.click();
    link.remove();
  });
  toast(`已请求下载 ${apps.length} 个安装包；如有提示，请允许多个文件下载`);
});
function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3000);
}
function showDetail(app) {
  $('#dialog-content').innerHTML = `${icon(app)}<h2 id="dialog-title">${escapeHTML(app.name)}</h2><p>${escapeHTML(app.description)}</p><p>${escapeHTML(app.tips)}</p><p class="notice">${escapeHTML(app.note)}</p><div class="dialog-actions">${downloadLink(app)}</div>`;
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
document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !$('#detail').open && !event.target.closest('input, textarea, [contenteditable]')) { event.preventDefault(); $('#search').focus(); }
});
$('#back-top').addEventListener('click', event => { event.preventDefault(); window.scrollTo({top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}); $('.brand').focus({preventScroll:true}); });
render();
