import { readFile, readdir, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// A static-site baseline, not authentication or copy protection. Inline styles
// support existing diagrams/motion; scripts have no unsafe-inline/eval exception.
// Meta CSP cannot enforce frame-ancestors or report-only policies.
export const publicContentSecurityPolicy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://i.ytimg.com; media-src 'self'; font-src 'self'; frame-src https://www.youtube-nocookie.com; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
export const publicSecurityMeta = `<meta http-equiv="Content-Security-Policy" content="${publicContentSecurityPolicy}">`;
export function addPublicSecurityPolicy(html) {
  return html.replace(/<head>/i, `<head>${publicSecurityMeta}`);
}

const allowedExtensions = new Set(['.html', '.css', '.js', '.mjs', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.mp4', '.woff2', '.pdf', '.txt']);
const forbiddenText = [
  /sourceMappingURL|sourcesContent/,
  /(?:\/Users\/|\/home\/|file:\/\/|research\/(?:raw|wiki|metrics|outputs)\/)/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16})\b/,
];

// This is an accidental-publication gate, not encryption or authentication.
// Reject unknown files, modified artifacts, symlinks and private source payloads.
export async function validatePublication(directory, hashes, pages) {
  const root = path.resolve(directory);
  const allowedPages = new Set(pages);
  const expected = new Map(Object.entries(hashes).map(([name, hash]) => [name.replace(/^dist\//, ''), hash]));
  if (expected.size !== Object.keys(hashes).length) throw Error('Publication rejected: duplicate manifest path');
  for (const [name, hash] of expected) {
    if (path.posix.normalize(name) !== name || /^(?:\/|\.\.)/.test(name) || name.includes('\\') || !/^[a-f0-9]{64}$/.test(hash)) throw Error('Publication rejected: malformed manifest');
  }
  for (const page of pages) if (!expected.has(page) || !page.endsWith('.html')) throw Error('Publication rejected: malformed page policy');
  const found = [];
  async function walk(dir) {
    for (const entry of await readdir(dir)) {
      const absolute = path.join(dir, entry);
      const name = path.relative(root, absolute).split(path.sep).join('/');
      const info = await lstat(absolute);
      if (info.isSymbolicLink()) throw Error(`Publication rejected: symlink ${name}`);
      if (info.isDirectory()) {
        if (entry.startsWith('.') || /^(?:research|locales|node_modules|src)$/.test(entry)) throw Error(`Publication rejected: source directory ${name}`);
        await walk(absolute);
        continue;
      }
      if (!expected.has(name)) throw Error(`Publication rejected: unlisted file ${name}`);
      if (name !== '.nojekyll' && (entry.startsWith('.') || !allowedExtensions.has(path.extname(name)))) throw Error(`Publication rejected: file type ${name}`);
      if (/\.html$/.test(name) && !allowedPages.has(name)) throw Error(`Publication rejected: unapproved page ${name}`);
      if (/\.txt$/.test(name) && !['robots.txt', 'assets/midas-fonts/OFL.txt'].includes(name)) throw Error(`Publication rejected: text source ${name}`);
      const data = await readFile(absolute);
      if (createHash('sha256').update(data).digest('hex') !== expected.get(name)) throw Error(`Publication rejected: hash mismatch ${name}`);
      if (/\.(?:html|css|js|mjs|svg|txt)$/.test(name)) {
        const text = data.toString('utf8');
        if (forbiddenText.some(pattern => pattern.test(text))) throw Error(`Publication rejected: private-source marker ${name}`);
        if (/\.html$/.test(name)) {
          if (!text.includes(`<head>${publicSecurityMeta}`)) throw Error(`Publication rejected: missing or changed CSP ${name}`);
          if (!/<meta name="robots" content="noindex, nofollow">/.test(text)) throw Error(`Publication rejected: missing noindex policy ${name}`);
          if (/type=["']application\/(?:json|ld\+json)["']/.test(text)) throw Error(`Publication rejected: embedded data ${name}`);
          for (const anchor of text.matchAll(/<a\b[^>]*>/g)) {
            if (/publication-locked/.test(anchor[0]) && /\shref=/.test(anchor[0])) throw Error(`Publication rejected: navigable lock ${name}`);
            const href = anchor[0].match(/\shref=["']([^"']+)["']/)?.[1];
            if (!href) continue;
            const url = new URL(href.replaceAll('&amp;', '&'), `https://publication.invalid/${name}`);
            const target = decodeURIComponent(url.pathname.slice(1)) || 'index.html';
            if (url.origin === 'https://publication.invalid' && target.endsWith('.html') && !allowedPages.has(target)) throw Error(`Publication rejected: unapproved destination in ${name}`);
          }
        }
      }
      found.push(name);
    }
  }
  await walk(root);
  for (const name of expected.keys()) if (!found.includes(name)) throw Error(`Publication rejected: missing file ${name}`);
  for (const name of allowedPages) if (!found.includes(name)) throw Error(`Publication rejected: missing approved page ${name}`);
  return { files: found.length, pages: allowedPages.size };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [directory, hashFile, policyFile] = process.argv.slice(2);
  if (!directory || !hashFile || !policyFile) throw Error('Usage: node check-publication.mjs dist asset-hashes.json publication-policy.json');
  const hashes = JSON.parse(await readFile(hashFile, 'utf8'));
  const policy = JSON.parse(await readFile(policyFile, 'utf8'));
  const result = await validatePublication(directory, hashes.files, policy.pages);
  console.log(`Publication verified: ${result.pages} pages, ${result.files} files.`);
}
