// A small, one-time entrance for media. Text is never hidden or delayed.
const article = document.querySelector('.endoscope-overview .ei-article');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => preference.matches || document.documentElement.dataset.motion === 'reduce';
const running = new Set();
if (article && 'IntersectionObserver' in window && typeof Element.prototype.animate === 'function') {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (reduced()) continue;
      const animation = entry.target.animate(
        [{ opacity: .82, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
        { duration: 440, easing: 'cubic-bezier(.2,.65,.3,1)' }
      );
      running.add(animation);
      animation.finished.catch(() => {}).finally(() => running.delete(animation));
    }
  }, { threshold: .08 });
  article.querySelectorAll('.ei-opening > .media,.ei-diagram,.ei-stereo,.es-equipment-item > .media,.ei-case').forEach(element => observer.observe(element));
  preference.addEventListener('change', () => {
    if (reduced()) running.forEach(animation => animation.cancel());
  });
}

// Click/tap disclosures; hover and focus only highlight the interactive item.
const vision = article?.querySelector('[data-vision-directions]');
if (vision) {
  const triggers = [...vision.querySelectorAll('.ei-vision-trigger')];
  const panelFor = trigger => document.getElementById(trigger.getAttribute('aria-controls'));
  let active = null;
  function setExpanded(trigger, expanded) {
    const label = expanded ? vision.dataset.visionCloseLabel : vision.dataset.visionOpenLabel;
    trigger.setAttribute('aria-expanded', String(expanded));
    trigger.setAttribute('aria-label', `${trigger.querySelector('.ei-vision-name').textContent} · ${label}`);
    trigger.querySelector('.ei-vision-action-label').textContent = label;
  }

  function close({ restoreFocus = false } = {}) {
    if (!active) return;
    const trigger = active;
    const panel = panelFor(trigger);
    panel.getAnimations().forEach(animation => animation.cancel());
    panel.hidden = true;
    setExpanded(trigger, false);
    active = null;
    if (restoreFocus) trigger.focus();
  }
  triggers.forEach(trigger => trigger.addEventListener('click', () => {
    const same = active === trigger;
    close();
    if (same) return;
    const panel = panelFor(trigger);
    active = trigger;
    setExpanded(trigger, true);
    panel.hidden = false;
    if (!reduced() && typeof panel.animate === 'function') {
      const animation = panel.animate(
        [{ opacity: 0, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }],
        { duration: 220, easing: 'cubic-bezier(.2,.65,.3,1)' }
      );
      running.add(animation);
      animation.finished.catch(() => {}).finally(() => running.delete(animation));
    }
  }));
  vision.querySelectorAll('[data-vision-close]').forEach(button => button.addEventListener('click', () => close({ restoreFocus: true })));
  vision.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !active) return;
    event.preventDefault();
    close({ restoreFocus: true });
  });
}
