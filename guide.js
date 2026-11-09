// Highlights the section being read in the table of contents; the page works without it.
(() => {
  const links = new Map([...document.querySelectorAll('.toc a')].map((link) => [link.getAttribute('href').slice(1), link]));
  if (!('IntersectionObserver' in window) || !links.size) return;
  const visible = new Set();
  const mark = () => {
    const current = [...links.keys()].find((id) => visible.has(id));
    for (const [id, link] of links) link.setAttribute('aria-current', String(id === current));
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) entry.isIntersecting ? visible.add(entry.target.id) : visible.delete(entry.target.id);
    mark();
  }, { rootMargin: '-80px 0px -60% 0px' });
  for (const id of links.keys()) { const section = document.getElementById(id); if (section) observer.observe(section); }
})();
