const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
    });
  });
}

const pricingToggles = document.querySelectorAll('.pricing-toggle');
const storageLabels = document.querySelectorAll('.storage-label');
const priceValues = document.querySelectorAll('[data-local][data-cloud]');

pricingToggles.forEach((button) => {
  button.addEventListener('click', () => {
    const storage = button.dataset.storage;

    pricingToggles.forEach((toggle) => {
      const active = toggle === button;
      toggle.classList.toggle('active', active);
      toggle.setAttribute('aria-pressed', String(active));
    });

    storageLabels.forEach((label) => {
      label.textContent = storage === 'cloud' ? 'Cloud-based storage' : 'Local-based storage';
    });

    priceValues.forEach((value) => {
      value.textContent = storage === 'cloud' ? value.dataset.cloud : value.dataset.local;
    });
  });
});

// This is a portfolio concept, not a commercial Linked Helper site.
// Keep every commercial CTA inside the concept instead of sending visitors
// to Linked Helper's live pricing / purchase flow.
const officialLinkedHelperCtas = document.querySelectorAll('a[href^="https://www.linkedhelper.com/"]');

officialLinkedHelperCtas.forEach((link) => {
  link.removeAttribute('target');
  link.removeAttribute('rel');
  link.setAttribute('href', '#pricing');
  link.setAttribute('title', 'Portfolio concept — no external purchase flow');

  if (link.closest('#pricing')) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
    });
  }
});

// Public portfolio attribution: transparent about ownership and AI-assisted production.
const siteFooter = document.querySelector('.site-footer');
if (siteFooter) {
  const credit = document.createElement('div');
  credit.className = 'portfolio-credit';
  credit.innerHTML = '<span>Case by <strong>Svetlana Chukova</strong></span><span>Product marketing direction, QA & final decisions · AI-assisted research and front-end implementation</span><a href="https://gkkm8bm7rn-eng.github.io/portfolio/" target="_blank" rel="noopener noreferrer">View portfolio ↗</a>';
  siteFooter.before(credit);

  const creditStyle = document.createElement('style');
  creditStyle.textContent = '.portfolio-credit{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 18px;padding:18px 24px;background:#0d0e16;color:#aeb2c0;border-top:1px solid rgba(255,255,255,.08);font-size:10px;line-height:1.45;text-align:center}.portfolio-credit strong{color:#fff}.portfolio-credit a{color:#c3b8ff;font-weight:750}.portfolio-credit a:hover{text-decoration:underline}@media(max-width:720px){.portfolio-credit{align-items:flex-start;flex-direction:column;text-align:left;padding:18px 20px}}';
  document.head.appendChild(creditStyle);
}
