// Gallery content is rendered into an inert template; only page-specific web media is included.
const dialog = document.querySelector('[data-equipment-dialog]');
const data = document.querySelector('#equipment-gallery-data');
if (dialog && data) {
  const labels = {image:data.dataset.imageLabel,video:data.dataset.videoLabel};
  const galleries = Object.fromEntries([...data.content.querySelectorAll('[data-gallery-key]')].map(section => [section.dataset.galleryKey, {
    title:section.dataset.title,
    items:[...section.querySelectorAll('a')].map(link => ({
      type:link.dataset.type, src:link.getAttribute('href'), duration:link.dataset.duration,
      poster:link.querySelector('img').getAttribute('src'), alt:link.querySelector('img').alt,
      title:link.querySelector('h3').textContent, caption:link.querySelector('p').textContent,
    })),
  }]));
  const find = selector => dialog.querySelector(selector);
  const image = find('[data-gallery-image]');
  const video = find('[data-gallery-video]');
  const error = find('[data-gallery-error]');
  const thumbs = find('[data-gallery-thumbs]');
  let current, index = 0, trigger, previousOverflow = '';

  function stopVideo() {
    video.pause();
    video.removeAttribute('src');
    video.removeAttribute('poster');
    video.load();
  }

  function show(next) {
    index = (next + current.items.length) % current.items.length;
    const item = current.items[index];
    stopVideo();
    error.hidden = true;
    image.hidden = video.hidden = true;
    image.removeAttribute('src');
    if (item.type === 'video') {
      video.poster = item.poster;
      video.src = item.src;
      video.setAttribute('aria-label', item.title);
      video.hidden = false;
    } else {
      image.alt = item.alt;
      image.src = item.src;
      image.hidden = false;
    }
    find('[data-gallery-title]').textContent = item.title;
    find('[data-gallery-caption]').textContent = item.caption;
    find('[data-gallery-count]').textContent = `${index + 1} / ${current.items.length}`;
    find('[data-gallery-prev]').disabled = find('[data-gallery-next]').disabled = current.items.length < 2;
    [...thumbs.children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    const selected = thumbs.children[index];
    if (selected) {
      const strip = thumbs.getBoundingClientRect();
      const itemBounds = selected.getBoundingClientRect();
      const style = getComputedStyle(thumbs);
      const left = strip.left + (parseFloat(style.paddingLeft) || 0);
      const right = strip.right - (parseFloat(style.paddingRight) || 0);
      if (itemBounds.left < left) thumbs.scrollLeft += itemBounds.left - left;
      else if (itemBounds.right > right) thumbs.scrollLeft += itemBounds.right - right;
    }
  }

  function open(key, source) {
    if (!galleries[key]) return;
    current = galleries[key];
    trigger = source;
    find('#equipment-gallery-title').textContent = current.title;
    thumbs.replaceChildren(...current.items.map((item, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `${i + 1}. ${item.title} · ${labels[item.type]}`);
      const thumb = document.createElement('img');
      thumb.src = item.poster || item.src;
      thumb.alt = '';
      thumb.loading = 'lazy';
      button.append(thumb);
      if (item.type === 'video') {
        const badge = document.createElement('span');
        badge.textContent = `▶ ${item.duration}`;
        badge.setAttribute('aria-hidden', 'true');
        button.append(badge);
      }
      button.addEventListener('click', () => show(i));
      return button;
    }));
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    dialog.showModal();
    thumbs.scrollLeft = 0;
    show(0);
  }

  document.querySelectorAll('[data-equipment-gallery]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open(link.dataset.equipmentGallery, link);
    });
  });
  find('[data-gallery-close]').addEventListener('click', () => dialog.close());
  find('[data-gallery-prev]').addEventListener('click', () => show(index - 1));
  find('[data-gallery-next]').addEventListener('click', () => show(index + 1));
  dialog.addEventListener('keydown', event => {
    // Leave the native video keyboard controls intact.
    if (event.target.closest('video')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  let backdropDown = false;
  const outside = event => {
    const r = dialog.getBoundingClientRect();
    return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
  };
  dialog.addEventListener('pointerdown', event => { backdropDown = event.target === dialog && outside(event); });
  dialog.addEventListener('click', event => { if (backdropDown && event.target === dialog && outside(event)) dialog.close(); backdropDown = false; });
  dialog.addEventListener('close', () => {
    stopVideo();
    image.removeAttribute('src');
    document.documentElement.style.overflow = previousOverflow;
    trigger?.focus({ preventScroll: true });
  });
  image.addEventListener('error', () => { if (dialog.open && !image.hidden && image.getAttribute('src')) error.hidden = false; });
  video.addEventListener('error', () => { if (dialog.open && !video.hidden && video.getAttribute('src')) error.hidden = false; });
}
