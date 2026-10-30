// Preserve the current section and history topic when switching languages. Plain links
// still work when JavaScript is unavailable; no content is fetched or hidden.
const languageLinks = document.querySelectorAll('[data-language-switch]');
function preserveSection() {
  for (const link of languageLinks) {
    const target = new URL(link.href);
    target.hash = location.hash;
    if (target.pathname.endsWith('/history.html')) {
      const topic = new URLSearchParams(location.search || '').get('topic');
      if (topic) target.searchParams.set('topic', topic);
      else target.searchParams.delete('topic');
    }
    link.href = target.href;
  }
}
preserveSection();
addEventListener('hashchange', preserveSection);
addEventListener('popstate', preserveSection);
// History filters use pushState, so refresh links just before navigation too.
for (const link of languageLinks) link.addEventListener('click', preserveSection);
