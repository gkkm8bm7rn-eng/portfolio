/* Native navigation and progressive enhancements; the site works without JS. */
(() => {
  const root = document.documentElement;
  const body = document.body;
  const fallbackMenu = document.querySelector('.mobile-menu');
  const menuButton = document.querySelector('[data-menu-open]');
  const dialog = document.querySelector('#site-menu');
  const wideScreen = window.matchMedia('(min-width: 901px)');

  // Only the matching language edition inherits the current page's anchor.
  const routeKey = path => path.replace(/\/en(?=\/)/, '').replace(/\/$/, '/index.html');
  document.querySelectorAll('[data-language-switch]').forEach(link => {
    const originalHref = link.getAttribute('href');
    link.addEventListener('click', () => {
      const destination = new URL(originalHref, location.href);
      if (destination.origin === location.origin &&
          routeKey(destination.pathname) === routeKey(location.pathname)) {
        destination.hash = location.hash;
        link.href = destination.href;
      }
    });
  });

  if (menuButton && dialog && typeof dialog.showModal === 'function') {
    root.classList.add('js');
    menuButton.hidden = false;
    let scrollState = null;
    let opener = menuButton;

    const saveInline = (element, properties) => properties.map(property => [
      property, element.style.getPropertyValue(property),
      element.style.getPropertyPriority(property)
    ]);
    const restoreInline = (element, entries) => entries.forEach(([property, value, priority]) => {
      if (value) element.style.setProperty(property, value, priority);
      else element.style.removeProperty(property);
    });

    const lockScroll = () => {
      if (scrollState) return;
      scrollState = {
        x: window.scrollX,
        y: window.scrollY,
        body: saveInline(body, ['position', 'top', 'left', 'right', 'width', 'overflow', 'padding-right']),
        root: saveInline(root, ['overflow', 'scroll-behavior'])
      };
      const scrollbarWidth = window.innerWidth - root.clientWidth;
      const currentPadding = parseFloat(getComputedStyle(body).paddingRight) || 0;
      body.style.position = 'fixed';
      body.style.top = `${-scrollState.y}px`;
      body.style.left = `${-scrollState.x}px`;
      body.style.right = '0';
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
      root.style.overflow = 'hidden';
      root.classList.add('menu-is-open');
    };

    const unlockScroll = () => {
      if (!scrollState) return;
      const saved = scrollState;
      scrollState = null;
      restoreInline(body, saved.body);
      restoreInline(root, saved.root.filter(([property]) => property !== 'scroll-behavior'));
      root.style.scrollBehavior = 'auto';
      window.scrollTo(saved.x, saved.y);
      restoreInline(root, saved.root.filter(([property]) => property === 'scroll-behavior'));
      root.classList.remove('menu-is-open');
    };

    const closeMenu = (restoreFocus = true) => {
      if (!dialog.open) return;
      // Unlock before an anchor's default action so it can scroll to its target.
      unlockScroll();
      dialog.close();
      menuButton.setAttribute('aria-expanded', 'false');
      if (restoreFocus && opener && opener.isConnected && !wideScreen.matches) {
        opener.focus({ preventScroll: true });
      }
    };

    menuButton.addEventListener('click', () => {
      if (wideScreen.matches || dialog.open) return;
      opener = document.activeElement;
      lockScroll();
      dialog.showModal();
      menuButton.setAttribute('aria-expanded', 'true');
      dialog.querySelector('[data-menu-close]')?.focus({ preventScroll: true });
    });
    dialog.querySelectorAll('[data-menu-close]').forEach(button => {
      button.addEventListener('click', () => closeMenu());
    });
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      closeMenu();
    });
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab' || event.ctrlKey || event.altKey || event.metaKey) return;
      const focusable = [...dialog.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      )].filter(element => element.getClientRects().length && !element.closest('[inert]'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    });
    dialog.addEventListener('close', () => {
      // Also clean up if another caller closes the native dialog directly.
      unlockScroll();
      menuButton.setAttribute('aria-expanded', 'false');
    });
    dialog.querySelectorAll('a[href]').forEach(link => {
      link.addEventListener('click', () => closeMenu(false));
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) closeMenu();
    });
    wideScreen.addEventListener('change', event => {
      if (event.matches) closeMenu(false);
    });
    window.addEventListener('pagehide', unlockScroll);
  } else if (fallbackMenu) {
    // Older browsers retain the native details menu and visible links.
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && fallbackMenu.open) {
        fallbackMenu.open = false;
        fallbackMenu.querySelector('summary')?.focus();
      }
    });
    document.addEventListener('click', event => {
      if (!fallbackMenu.contains(event.target)) fallbackMenu.open = false;
    });
    fallbackMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => { fallbackMenu.open = false; });
    });
  }

  if (body.classList.contains('art-home') && 'IntersectionObserver' in window) {
    const header = document.querySelector('.site-header');
    const portfolio = document.querySelector('.portfolio-body');
    const cover = document.querySelector('.art-cover');
    let themeObserver;
    let resizeFrame;
    const observeHeaderTheme = () => {
      if (!header || !cover) return;
      themeObserver?.disconnect();
      // A narrow reading line detects the dark section even over a sticky cover.
      // Cache the boundary per viewport, rather than reacting to compact-header
      // height changes, which could otherwise make the theme oscillate.
      const boundary = Math.ceil(header.getBoundingClientRect().height);
      const bottomMargin = Math.max(0, window.innerHeight - boundary - 1);
      themeObserver = new IntersectionObserver(entries => {
        const entry = entries[0];
        const isDark = portfolio
          ? entry.boundingClientRect.top <= boundary
          : entry.boundingClientRect.bottom <= boundary;
        header.classList.toggle('is-over-portfolio', isDark);
        // A fully covered artwork must leave keyboard and assistive navigation.
        cover.inert = isDark;
      }, { rootMargin: `-${boundary}px 0px -${bottomMargin}px 0px`, threshold: 0 });
      themeObserver.observe(portfolio || cover);
    };
    observeHeaderTheme();
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(observeHeaderTheme);
    }, { passive: true });

    const sectionLinks = [...document.querySelectorAll('a[data-nav-section]')];
    const sections = [...new Set(sectionLinks.map(link =>
      document.getElementById(link.dataset.navSection)
    ).filter(Boolean))];
    if (sections.length) {
      const visibleSections = new Map();
      const activeObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) visibleSections.set(entry.target.id, entry.boundingClientRect.top);
          else visibleSections.delete(entry.target.id);
        });
        const active = [...visibleSections.entries()].sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]))[0]?.[0];
        sectionLinks.forEach(link => {
          if (link.dataset.navSection === active) link.setAttribute('aria-current', 'location');
          else if (link.getAttribute('aria-current') === 'location') link.removeAttribute('aria-current');
        });
      }, { rootMargin: '-12% 0px -55% 0px', threshold: 0 });
      sections.forEach(section => activeObserver.observe(section));
    }
  }
})();
