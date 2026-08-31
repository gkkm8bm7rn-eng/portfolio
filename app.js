(() => {
  document.querySelectorAll('[data-media]').forEach((block) => {
    const images = [...block.querySelectorAll('img[data-progressive]')];
    if (!images.length) {
      block.classList.add('is-loaded');
      return;
    }

    let settled = 0;
    let failed = 0;

    const finish = (image, ok) => {
      if (image.dataset.loadSettled === 'true') return;
      image.dataset.loadSettled = 'true';
      settled += 1;
      if (!ok) failed += 1;

      block.style.setProperty('--media-progress', String(settled / images.length));
      block.dataset.progress = `${settled}/${images.length}`;

      if (settled === images.length) {
        if (failed === images.length) block.classList.add('has-error');
        else block.classList.add('is-loaded');
      }
    };

    images.forEach((image) => {
      if (image.complete) {
        finish(image, image.naturalWidth > 0);
        return;
      }
      image.addEventListener('load', () => finish(image, true), { once: true });
      image.addEventListener('error', () => finish(image, false), { once: true });
    });
  });

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    document.querySelectorAll('.reveal-section').forEach((section) => observer.observe(section));
  } else {
    document.querySelectorAll('.reveal-section').forEach((section) => section.classList.add('is-visible'));
  }

  const languages = [
    ['ru', 'RU', 'Русский'],
    ['en', 'EN', 'English'],
    ['de', 'DE', 'Deutsch'],
    ['it', 'IT', 'Italiano'],
    ['fr', 'FR', 'Français'],
    ['zh', '中文', '中文']
  ];
  const supported = new Set(languages.map(([code]) => code));
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  const localeCache = new Map();
  const metaDescription = document.querySelector('meta[name="description"]');
  const originalMeta = {
    title: document.title,
    description: metaDescription ? metaDescription.getAttribute('content') : ''
  };

  const pageKey = (() => {
    const file = location.pathname.split('/').pop();
    if (file === 'otutto.html') return 'otutto';
    if (file === 'forma-home.html') return 'forma';
    return 'home';
  })();

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const textNodes = [];
  let currentNode;
  while ((currentNode = walker.nextNode())) {
    const match = currentNode.nodeValue.match(/^(\s*)(.*?)(\s*)$/s);
    if (!match || !match[2]) continue;
    textSources.set(currentNode, { prefix: match[1], source: match[2], suffix: match[3] });
    textNodes.push(currentNode);
  }

  const attributeElements = [...document.querySelectorAll('[aria-label], [alt], [title]')];
  attributeElements.forEach((element) => {
    const values = {};
    ['aria-label', 'alt', 'title'].forEach((name) => {
      if (element.hasAttribute(name)) values[name] = element.getAttribute(name);
    });
    attributeSources.set(element, values);
  });

  const style = document.createElement('style');
  style.textContent = `
    .language-switcher{position:relative;display:flex;align-items:center;margin-left:auto}
    .language-current{appearance:none;border:1px solid rgba(242,237,230,.2);background:rgba(255,255,255,.04);color:inherit;border-radius:999px;padding:8px 10px;min-width:48px;font:600 9px/1 var(--sans,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif);letter-spacing:.08em;cursor:pointer}
    .language-current:hover,.language-current:focus-visible{border-color:rgba(242,237,230,.48);outline:none}
    .language-menu{position:absolute;right:0;top:calc(100% + 9px);display:none;min-width:138px;padding:6px;background:#0c1522;border:1px solid rgba(242,237,230,.16);box-shadow:0 14px 40px rgba(0,0,0,.32);z-index:80}
    .forma-header .language-menu{background:#211914}
    .language-switcher.is-open .language-menu{display:block}
    .language-option{display:flex;width:100%;justify-content:space-between;gap:20px;border:0;background:transparent;color:#d8d0c7;padding:9px 10px;text-align:left;font:500 10px/1.2 var(--sans,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif);cursor:pointer}
    .language-option:hover,.language-option:focus-visible{background:rgba(255,255,255,.07);outline:none}.language-option[aria-current="true"]{color:#d4b187}
    .language-option small{font:500 8px/1.2 var(--mono,monospace);opacity:.62}
    @media(max-width:640px){.site-header{gap:10px}.site-header nav{margin-left:auto}.language-switcher{margin-left:0}.language-current{min-width:42px;padding:7px 8px}.language-menu{right:0}}
  `;
  document.head.appendChild(style);

  const header = document.querySelector('.site-header');
  if (!header) return;

  const switcher = document.createElement('div');
  switcher.className = 'language-switcher';
  switcher.innerHTML = `
    <button class="language-current" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Выбрать язык">RU</button>
    <div class="language-menu" role="menu" aria-label="Язык сайта"></div>
  `;
  const currentButton = switcher.querySelector('.language-current');
  const menu = switcher.querySelector('.language-menu');
  languages.forEach(([code, short, label]) => {
    const button = document.createElement('button');
    button.className = 'language-option';
    button.type = 'button';
    button.dataset.lang = code;
    button.setAttribute('role', 'menuitem');
    button.innerHTML = `<span>${label}</span><small>${short}</small>`;
    menu.appendChild(button);
  });
  header.appendChild(switcher);

  const closeMenu = () => {
    switcher.classList.remove('is-open');
    currentButton.setAttribute('aria-expanded', 'false');
  };
  currentButton.addEventListener('click', () => {
    const open = !switcher.classList.contains('is-open');
    switcher.classList.toggle('is-open', open);
    currentButton.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (event) => {
    if (!switcher.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  async function getLocale(lang) {
    if (lang === 'ru') return null;
    if (localeCache.has(lang)) return localeCache.get(lang);
    const response = await fetch(`locales/${lang}.json`, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Locale ${lang} failed: ${response.status}`);
    const locale = await response.json();
    localeCache.set(lang, locale);
    return locale;
  }

  function restoreRussian() {
    textNodes.forEach((node) => {
      const original = textSources.get(node);
      if (original) node.nodeValue = original.prefix + original.source + original.suffix;
    });
    attributeElements.forEach((element) => {
      const originals = attributeSources.get(element) || {};
      Object.entries(originals).forEach(([name, value]) => element.setAttribute(name, value));
    });
    document.title = originalMeta.title;
    if (metaDescription) metaDescription.setAttribute('content', originalMeta.description);
  }

  function applyDictionary(locale) {
    const dictionary = { ...(locale.common || {}), ...((locale.pages && locale.pages[pageKey]) || {}) };
    const attrs = { ...(locale.attributes || {}), ...((locale.pageAttributes && locale.pageAttributes[pageKey]) || {}) };

    textNodes.forEach((node) => {
      const original = textSources.get(node);
      if (!original) return;
      const translated = dictionary[original.source];
      node.nodeValue = original.prefix + (translated || original.source) + original.suffix;
    });

    attributeElements.forEach((element) => {
      const originals = attributeSources.get(element) || {};
      Object.entries(originals).forEach(([name, value]) => {
        element.setAttribute(name, attrs[value] || value);
      });
    });

    const meta = locale.meta && locale.meta[pageKey];
    if (meta) {
      if (meta.title) document.title = meta.title;
      if (meta.description && metaDescription) metaDescription.setAttribute('content', meta.description);
    }
  }

  function updateSwitcher(lang) {
    const selected = languages.find(([code]) => code === lang) || languages[0];
    currentButton.textContent = selected[1];
    currentButton.setAttribute('aria-label', lang === 'ru' ? 'Выбрать язык' : 'Change language');
    menu.querySelectorAll('.language-option').forEach((button) => {
      button.setAttribute('aria-current', button.dataset.lang === lang ? 'true' : 'false');
    });
  }

  async function setLanguage(lang, remember = true) {
    if (!supported.has(lang)) lang = 'ru';
    try {
      if (lang === 'ru') {
        restoreRussian();
      } else {
        const locale = await getLocale(lang);
        applyDictionary(locale);
      }
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
      updateSwitcher(lang);
      if (remember) localStorage.setItem('portfolio-language', lang);
    } catch (error) {
      console.warn(error);
      restoreRussian();
      document.documentElement.lang = 'ru';
      updateSwitcher('ru');
    }
  }

  menu.addEventListener('click', (event) => {
    const button = event.target.closest('.language-option');
    if (!button) return;
    setLanguage(button.dataset.lang);
    closeMenu();
  });

  const savedLanguage = localStorage.getItem('portfolio-language');
  setLanguage(savedLanguage && supported.has(savedLanguage) ? savedLanguage : 'ru', false);
})();
