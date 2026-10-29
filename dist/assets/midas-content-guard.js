// Public-page convenience barrier only; this is not access control.
// Keep normal clicks, keyboard shortcuts and navigation controls unchanged.
document.addEventListener('contextmenu', event => {
  const target = event.target instanceof Element ? event.target : event.target?.parentElement;
  if (!target?.closest('main, .image-dialog')) return;
  if (target.closest('nav, button, input, textarea, select, [contenteditable="true"]')) return;
  event.preventDefault();
});
