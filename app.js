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
})();
