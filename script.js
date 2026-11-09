// Install tabs, copy buttons and the latest release; the page works without it.
(() => {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const select = (tab, focus) => {
    for (const other of tabs) {
      const active = other === tab;
      other.setAttribute('aria-selected', String(active));
      other.tabIndex = active ? 0 : -1;
      document.getElementById(other.getAttribute('aria-controls')).hidden = !active;
    }
    if (focus) tab.focus();
    try { localStorage.setItem('anvildroid-distro', tab.dataset.distro); } catch { /* private mode */ }
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (step) { event.preventDefault(); select(tabs[(index + step + tabs.length) % tabs.length], true); }
      if (event.key === 'Home') { event.preventDefault(); select(tabs[0], true); }
      if (event.key === 'End') { event.preventDefault(); select(tabs[tabs.length - 1], true); }
    });
  });
  try {
    const saved = tabs.find((tab) => tab.dataset.distro === localStorage.getItem('anvildroid-distro'));
    if (saved) select(saved, false);
  } catch { /* storage unavailable */ }

  for (const button of document.querySelectorAll('.copy')) {
    button.addEventListener('click', async () => {
      const text = button.parentElement.querySelector('code').textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = 'Copied';
        button.classList.add('done');
      } catch {
        const range = document.createRange();
        range.selectNodeContents(button.parentElement.querySelector('code'));
        getSelection().removeAllRanges();
        getSelection().addRange(range);
        button.textContent = 'Press Ctrl+C';
      }
      setTimeout(() => { button.textContent = 'Copy'; button.classList.remove('done'); }, 1800);
    });
  }

  // Latest version and a direct AppImage link (GitHub API, cached for an hour).
  const show = (release) => {
    if (!release || !release.tag_name) return;
    for (const node of document.querySelectorAll('[data-version]')) node.textContent = `Latest ${release.tag_name} · Linux x86_64`;
    const image = (release.assets || []).find((asset) => /^AnvilDroid-.*-x86_64\.AppImage$/.test(asset.name));
    if (!image) return;
    for (const link of document.querySelectorAll('[data-release-link]')) link.href = image.browser_download_url;
    const command = document.querySelector('[data-appimage-cmd]');
    if (command) command.textContent = `chmod +x ${image.name} && ./${image.name}`;
    const download = document.querySelector('[data-appimage-link]');
    if (download) download.textContent = `Download ${image.name}`;
  };
  const key = 'anvildroid-release';
  try {
    const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (cached && Date.now() - cached.at < 3600e3) return show(cached.release);
  } catch { /* ignore */ }
  fetch('https://api.github.com/repos/anvildroid/anvildroid/releases/latest', { headers: { Accept: 'application/vnd.github+json' } })
    .then((response) => (response.ok ? response.json() : null))
    .then((release) => {
      if (!release) return;
      const slim = { tag_name: release.tag_name, assets: (release.assets || []).map(({ name, browser_download_url }) => ({ name, browser_download_url })) };
      try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), release: slim })); } catch { /* ignore */ }
      show(slim);
    })
    .catch(() => {});
})();
