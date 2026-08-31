(() => {
  const markLoaded = (img) => {
    const media = img.closest('[data-media]');
    if (!media) return;
    const images = [...media.querySelectorAll('img[data-progressive]')];
    if (images.length && images.every((item) => item.complete && item.naturalWidth > 0)) {
      media.classList.add('is-loaded');
    }
  };

  document.querySelectorAll('img[data-progressive]').forEach((img) => {
    if (img.complete) markLoaded(img);
    img.addEventListener('load', () => markLoaded(img), { once: true });
    img.addEventListener('error', () => {
      const media = img.closest('[data-media]');
      if (media) media.classList.add('has-error');
    }, { once: true });
  });

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal-section').forEach((section) => observer.observe(section));
  } else {
    document.querySelectorAll('.reveal-section').forEach((section) => section.classList.add('is-visible'));
  }
})();
