const browser = document.querySelector('[data-history-browser]');
if (browser) {
  const filters = [...browser.querySelectorAll('[data-history-filter]')];
  const rows = [...browser.querySelectorAll('[data-history-track]')];
  const months = [...browser.querySelectorAll('[data-history-month-link]')];
  const count = browser.querySelector('[data-history-count]');
  const controls = browser.querySelector('.history-controls');
  const filterBar = browser.querySelector('.filter-bar');
  const monthBar = browser.querySelector('.history-months');
  const header = document.querySelector('.site-header');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 'all';
  let frame;
  const visibleRows = () => rows.filter(row => !row.hidden);
  function revealInBar(element, bar) {
    if (!element) return;
    const item = element.getBoundingClientRect(), bounds = bar.getBoundingClientRect();
    if (item.left < bounds.left || item.right > bounds.right) bar.scrollTo({ left: bar.scrollLeft + item.left - bounds.left - (bounds.width - item.width) / 2, behavior: 'instant' });
  }
  for (const bar of [filterBar, monthBar]) bar.addEventListener('focusin', event => {
    const item = event.target.closest('[data-history-filter], [data-history-month-link]');
    if (item) revealInBar(item, bar);
  });
  function markRow(row) {
    for (const candidate of rows) candidate.toggleAttribute('data-history-current', candidate === row);
  }
  const hashRow = () => rows.find(row => `#${row.id}` === location.hash);
  function updateCurrentMonth() {
    frame = null;
    const visible = visibleRows();
    const boundary = (header?.getBoundingClientRect().height || 0) + controls.getBoundingClientRect().height + 28;
    const current = visible.find(row => row.getBoundingClientRect().bottom > boundary) || visible.at(-1);
    const previous = monthBar.querySelector('[aria-current]');
    for (const link of months) {
      if (current && link.dataset.historyMonthLink === current.dataset.historyMonth) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
    const active = monthBar.querySelector('[aria-current]');
    if (active !== previous) revealInBar(active, monthBar);
  }
  function applyFilter(value) {
    selected = filters.some(button => button.dataset.historyFilter === value) ? value : 'all';
    for (const row of rows) row.hidden = selected !== 'all' && row.dataset.historyTrack !== selected;
    for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.historyFilter === selected));
    const visible = visibleRows();
    count.textContent = (visible.length === 1 ? count.dataset.countOne : count.dataset.countMany).replace('{count}', String(visible.length));
    for (const link of months) {
      const first = visible.find(row => row.dataset.historyMonth === link.dataset.historyMonthLink);
      if (first) {
        link.setAttribute('href', `#${first.id}`);
        link.removeAttribute('aria-disabled');
        link.removeAttribute('tabindex');
      } else {
        link.removeAttribute('href');
        link.setAttribute('aria-disabled', 'true');
        link.setAttribute('tabindex', '-1');
      }
    }
    markRow(null);
    revealInBar(filters.find(button => button.dataset.historyFilter === selected), filterBar);
    updateCurrentMonth();
  }
  function scrollToRow(row, smooth = false) {
    markRow(row);
    row.querySelector('details').open = true;
    row.scrollIntoView({ behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant', block: 'start' });
  }
  function restore() {
    const topic = new URL(location.href).searchParams.get('topic');
    const row = hashRow();
    // Direct links must reveal their target, including old links without a topic.
    applyFilter(row && topic && topic !== row.dataset.historyTrack ? 'all' : topic);
    if (row) scrollToRow(row);
  }
  for (const button of filters) button.addEventListener('click', () => {
    applyFilter(button.dataset.historyFilter);
    const url = new URL(location.href);
    selected === 'all' ? url.searchParams.delete('topic') : url.searchParams.set('topic', selected);
    url.hash = 'timeline';
    history.pushState(null, '', url);
    // Keep the controls in place when switching topics from farther down the list.
    browser.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  for (const link of months) link.addEventListener('click', event => {
    if (link.hasAttribute('aria-disabled')) { event.preventDefault(); return; }
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const row = rows.find(row => `#${row.id}` === link.getAttribute('href'));
    if (!row) return;
    event.preventDefault();
    const url = new URL(location.href); url.hash = row.id;
    history.pushState(null, '', url);
    scrollToRow(row, true);
    row.querySelector('summary').focus({ preventScroll: true });
  });
  function updateOffsets() {
    document.body.style.setProperty('--history-header-height', `${header?.getBoundingClientRect().height || 0}px`);
    document.body.style.setProperty('--history-controls-height', `${controls.getBoundingClientRect().height}px`);
    revealInBar(filters.find(button => button.dataset.historyFilter === selected), filterBar);
    revealInBar(monthBar.querySelector('[aria-current]'), monthBar);
    updateCurrentMonth();
  }
  const resize = new ResizeObserver(updateOffsets);
  if (header) resize.observe(header);
  resize.observe(controls);
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(updateCurrentMonth); }, { passive: true });
  addEventListener('popstate', restore);
  addEventListener('hashchange', restore);
  updateOffsets();
  restore();
}
