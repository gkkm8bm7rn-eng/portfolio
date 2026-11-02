/* Navigation is usable without JavaScript. These enhancements preserve context. */
(() => {
  const menu = document.querySelector('.mobile-menu');
  if (menu) {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.open) {
        menu.open = false;
        menu.querySelector('summary').focus();
      }
    });
    document.addEventListener('click', event => {
      if (!menu.contains(event.target)) menu.open = false;
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { menu.open = false; }));
  }
  document.querySelectorAll('[data-language-switch]').forEach(a => {
    a.addEventListener('click', () => {
      if (location.hash) a.hash = location.hash;
    });
  });
})();
