// Preserve the current feature anchor when switching languages. Plain links
// still work when JavaScript is unavailable; no content is fetched or hidden.
const languageLinks = document.querySelectorAll('[data-language-switch]');
function preserveSection() {
  for (const link of languageLinks) {
    const target = new URL(link.href);
    target.hash = location.hash;
    link.href = target.href;
  }
}
preserveSection();
addEventListener('hashchange', preserveSection);
