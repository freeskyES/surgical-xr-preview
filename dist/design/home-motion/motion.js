const tour = document.querySelector('[data-tour]');
const scenes = [...tour.querySelectorAll('[data-scene]')];
const videos = scenes.map(scene => scene.querySelector('video'));
const initial = scenes.findIndex(scene=>`#${scene.id}`===location.hash);
const links = [...tour.querySelectorAll('[data-scene-link]')];
const toggle = tour.querySelector('.film-toggle');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let active = 0, pausedByUser = false, scheduled = false, step = 0, enhanced = false;

function load(video) {
  const source = video.querySelector('source');
  if (source.dataset.src) { source.src = source.dataset.src; delete source.dataset.src; video.load(); }
}
function setButton(paused) {
  toggle.classList.toggle('is-paused', paused);
  toggle.setAttribute('aria-label', paused ? toggle.dataset.playLabel : toggle.dataset.pauseLabel);
}
function syncPlayback() {
  const rect = tour.getBoundingClientRect();
  const showing = rect.top < innerHeight && rect.bottom > parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header')) + 80;
  videos.forEach((video, i) => {
    if (!enhanced || i !== active || pausedByUser || document.hidden || !showing) { video.pause(); return; }
    load(video);
    video.play().then(() => {
      if (i !== active || pausedByUser || document.hidden || !enhanced) video.pause();
      else setButton(false);
    }).catch(() => { if (i === active) setButton(true); });
  });
  if (pausedByUser) setButton(true);
}
function select(index) {
  const changed = active !== index;
  active = index;
  tour.dataset.activeScene = scenes[active].id;
  // replaceState does not emit hashchange; keep language links current too.
  document.querySelectorAll('[data-language-switch]').forEach(link => {
    const target = new URL(link.href);
    target.hash = scenes[active].id;
    link.href = target.href;
  });
  scenes.forEach((scene, i) => {
    scene.classList.toggle('is-active', i === active);
    scene.inert = i !== active;
    scene.setAttribute('aria-hidden', String(i !== active));
  });
  links.forEach((link,i) => { if (i === active) link.setAttribute('aria-current','step'); else link.removeAttribute('aria-current'); });
  if (changed) {
    // Keep links and browser back/forward aligned with the scene on screen.
    history.replaceState(null, '', `#${scenes[active].id}`);
    syncPlayback();
  }
}
function update() {
  scheduled = false;
  if (!enhanced) return;
  const rect = tour.getBoundingClientRect();
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header'));
  const index = Math.max(0, Math.min(scenes.length - 1, Math.floor((header - rect.top + step * .28) / step)));
  select(index);
  if (rect.bottom <= header + 80 || rect.top >= innerHeight) videos.forEach(v=>v.pause());
  else if (videos[active].paused && !pausedByUser) syncPlayback();
}
function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }
function jump(index, behavior='instant') {
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header'));
  scrollTo({top:tour.getBoundingClientRect().top + scrollY + step * index - header, behavior});
}
function configure() {
  enhanced = !motionPreference.matches && innerHeight >= (innerWidth <= 760 ? 740 : 620);
  document.documentElement.classList.toggle('motion-enabled', enhanced);
  step = innerHeight * (innerWidth <= 760 ? .95 : .9);
  document.documentElement.style.setProperty('--step', `${step}px`);
  if (enhanced) {
    videos.forEach(v=> { v.controls = false; v.muted = true; });
    update(); syncPlayback();
  } else {
    scenes.forEach(scene=>{scene.inert=false;scene.removeAttribute('aria-hidden');});
    videos.forEach(v=>{v.pause();v.controls=true;load(v);});
  }
}
links.forEach((link,i)=>link.addEventListener('click', event => {
  if (!enhanced || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  history.pushState(null, '', `#${scenes[i].id}`);
  jump(i);
}));
toggle.addEventListener('click', () => { pausedByUser = !videos[active].paused; setButton(pausedByUser); syncPlayback(); });
videos.forEach(video=>video.addEventListener('play',()=>videos.forEach(other=>{if(other!==video)other.pause();})));
addEventListener('scroll',schedule,{passive:true});
addEventListener('resize',configure);
addEventListener('hashchange',()=>{const i=scenes.findIndex(s=>`#${s.id}`===location.hash);if(enhanced&&i>=0)jump(i,'instant');});
document.addEventListener('visibilitychange',syncPlayback);
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (!entry.isIntersecting) entry.target.pause();
  });
  videos.forEach(video => observer.observe(video));
}
motionPreference.addEventListener('change',configure);
configure();
if(enhanced && initial>=0)jump(initial,'instant');
