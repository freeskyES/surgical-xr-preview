// Public-page convenience barrier only; this is not access control.
// Keep normal clicks, scrolling, keyboard shortcuts and media controls unchanged.
for (const type of ['contextmenu', 'selectstart', 'dragstart']) {
  document.addEventListener(type, event => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    if (target?.closest('input, textarea, [contenteditable]:not([contenteditable="false"])')) return;
    event.preventDefault();
  });
}
