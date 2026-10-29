const hero = document.querySelector('.hero-light .hero-surface');
if (hero) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let visible = true;
  let running = false;
  let frame = 0;
  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;

  function resetPointer() {
    cancelAnimationFrame(frame);
    frame = 0;
    x = y = targetX = targetY = 0;
    hero.style.setProperty('--light-x', '0px');
    hero.style.setProperty('--light-y', '0px');
  }

  function syncMotion() {
    running = !reducedMotion.matches && visible && !document.hidden;
    hero.dataset.motion = running ? 'running' : 'paused';
    if (!running || !finePointer.matches) resetPointer();
  }

  function moveLight() {
    frame = 0;
    if (!running || !finePointer.matches) return;
    x += (targetX - x) * .075;
    y += (targetY - y) * .075;
    hero.style.setProperty('--light-x', `${x.toFixed(2)}px`);
    hero.style.setProperty('--light-y', `${y.toFixed(2)}px`);
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > .15) frame = requestAnimationFrame(moveLight);
  }

  hero.addEventListener('pointermove', event => {
    if (!running || !finePointer.matches || event.pointerType === 'touch') return;
    const rect = hero.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - .5) * 150;
    targetY = ((event.clientY - rect.top) / rect.height - .5) * 72;
    if (!frame) frame = requestAnimationFrame(moveLight);
  }, {passive: true});
  hero.addEventListener('pointerleave', () => {
    targetX = targetY = 0;
    if (running && finePointer.matches && !frame) frame = requestAnimationFrame(moveLight);
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    syncMotion();
  }).observe(hero);
  document.addEventListener('visibilitychange', syncMotion);
  reducedMotion.addEventListener('change', syncMotion);
  finePointer.addEventListener('change', syncMotion);
  syncMotion();
}
