/* Native swipe carousel with circular navigation and an accessible fullscreen viewer. */
(() => {
  const deck = document.querySelector('[data-presentation-deck]');
  if (!deck) return;
  const viewport = deck.querySelector('[data-deck-viewport]');
  const track = deck.querySelector('[data-deck-track]');
  const prev = deck.querySelector('[data-deck-prev]');
  const next = deck.querySelector('[data-deck-next]');
  const currentLabel = deck.querySelector('[data-deck-current]');
  const progress = deck.querySelector('[data-deck-progress]');
  const modal = document.querySelector('[data-deck-modal]');
  const modalCard = modal.querySelector('[data-modal-card]');
  const modalCount = modal.querySelector('[data-modal-count]');
  const stage = modal.querySelector('[data-modal-stage]');
  const slides = Array.from(track.querySelectorAll('.presentation-deck__item'));
  const count = slides.length;
  if (count !== 10) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0, modalIndex = 0, scrollTimer, resizeTimer, settling = false;
  let zoom = 1, panX = 0, panY = 0, touchStart = null, pinchStart = null;
  let lastFocus = null;

  function cloneSlide(node) {
    const clone = node.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('button, a, [tabindex]').forEach(el => el.setAttribute('tabindex', '-1'));
    return clone;
  }
  track.insertBefore(cloneSlide(slides[count - 1]), track.firstElementChild);
  track.appendChild(cloneSlide(slides[0]));

  function slot(index) { return Math.max(0, Math.min(count + 1, index)); }
  function position(index) { return slot(index) * viewport.clientWidth; }
  function snap(index) {
    const old = viewport.style.scrollBehavior;
    viewport.style.scrollBehavior = 'auto';
    viewport.scrollLeft = position(index);
    viewport.style.scrollBehavior = old;
  }
  function renderCount() {
    const value = String(current + 1).padStart(2, '0');
    currentLabel.textContent = value + ' / ' + count;
    progress.style.width = ((current + 1) / count * 100) + '%';
  }
  function go(index) {
    current = (index + count) % count;
    renderCount();
    // Clones make the last-to-first transition look like a normal adjacent swipe.
    const actualSlot = index < 0 ? 0 : index >= count ? count + 1 : current + 1;
    viewport.scrollTo({left: position(actualSlot), behavior: reduceMotion.matches ? 'instant' : 'smooth'});
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(settle, 360);
  }
  function settle() {
    if (settling) return;
    settling = true;
    let n = Math.round(viewport.scrollLeft / viewport.clientWidth);
    if (n <= 0) { current = count - 1; snap(count); }
    else if (n >= count + 1) { current = 0; snap(1); }
    else current = n - 1;
    renderCount();
    settling = false;
  }
  function onScroll() {
    if (settling) return;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(settle, 140);
    const n = Math.round(viewport.scrollLeft / viewport.clientWidth);
    current = n <= 0 ? count - 1 : n >= count + 1 ? 0 : n - 1;
    renderCount();
  }
  viewport.addEventListener('scroll', onScroll, {passive:true});
  if ('onscrollend' in viewport) viewport.addEventListener('scrollend', () => {clearTimeout(scrollTimer);settle();});
  prev.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  viewport.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {event.preventDefault();go(current - 1);}
    if (event.key === 'ArrowRight') {event.preventDefault();go(current + 1);}
  });
  // Initialize without a visible jump. CSS is usable before JS; clones are added only here.
  requestAnimationFrame(() => {snap(1);renderCount();});
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => snap(current + 1), 100);
  }, {passive:true});

  function updateTransform() {
    modalCard.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')';
  }
  function resetZoom() {
    zoom = 1; panX = 0; panY = 0;
    modalCard.style.transition = 'transform .15s';
    updateTransform();
    setTimeout(() => {modalCard.style.transition = '';}, 170);
  }
  function setZoom(value) {
    zoom = Math.min(4, Math.max(1, value));
    if (zoom === 1) {panX = 0; panY = 0;}
    updateTransform();
  }
  function openSlide(index) {
    lastFocus = document.activeElement;
    modalIndex = (index + count) % count;
    showModalSlide();
    if (!modal.open) modal.showModal();
    modal.querySelector('[data-modal-close]').focus();
  }
  function showModalSlide() {
    const paper = slides[modalIndex].querySelector('.presentation-deck__paper').cloneNode(true);
    paper.querySelectorAll('img').forEach(img => {img.loading = 'eager'; img.decoding = 'async';});
    modalCard.replaceChildren(paper);
    modalCount.textContent = String(modalIndex + 1).padStart(2, '0') + ' / ' + count;
    resetZoom();
    document.dispatchEvent(new CustomEvent('presentation:modalchange', {detail:{index:modalIndex}}));
  }
  function modalStep(dir) {
    modalIndex = (modalIndex + dir + count) % count;
    current = modalIndex;
    snap(current + 1);
    renderCount();
    showModalSlide();
  }
  track.addEventListener('click', event => {
    const open = event.target.closest('[data-open-slide]');
    if (!open) return;
    const index = Number(open.getAttribute('data-open-slide'));
    if (Number.isInteger(index) && index >= 0 && index < count) openSlide(index);
  });
  modal.querySelector('[data-modal-prev]').addEventListener('click', () => modalStep(-1));
  modal.querySelector('[data-modal-next]').addEventListener('click', () => modalStep(1));
  modal.querySelector('[data-modal-close]').addEventListener('click', () => modal.close());
  modal.querySelector('[data-modal-zoom-in]').addEventListener('click', () => setZoom(zoom + .5));
  modal.querySelector('[data-modal-zoom-out]').addEventListener('click', () => setZoom(zoom - .5));
  modal.addEventListener('close', () => {
    resetZoom();
    if (lastFocus && lastFocus.isConnected && lastFocus.focus) lastFocus.focus({preventScroll:true});
  });
  modal.addEventListener('click', event => {if (event.target === modal) modal.close();});
  document.addEventListener('keydown', event => {
    if (!modal.open) return;
    if (event.key === 'ArrowLeft') {event.preventDefault();modalStep(-1);}
    if (event.key === 'ArrowRight') {event.preventDefault();modalStep(1);}
    if (event.key === '+' || event.key === '=') {event.preventDefault();setZoom(zoom + .5);}
    if (event.key === '-') {event.preventDefault();setZoom(zoom - .5);}
  });

  const dist = touches => Math.hypot(touches[0].clientX-touches[1].clientX, touches[0].clientY-touches[1].clientY);
  stage.addEventListener('touchstart', event => {
    if (event.touches.length === 2) {
      pinchStart = {distance:dist(event.touches),zoom};
      touchStart = null;
    } else if (event.touches.length === 1) {
      touchStart = {x:event.touches[0].clientX,y:event.touches[0].clientY,panX,panY,time:Date.now()};
      pinchStart = null;
    }
  }, {passive:true});
  stage.addEventListener('touchmove', event => {
    if (event.touches.length === 2 && pinchStart) {
      event.preventDefault();
      setZoom(pinchStart.zoom * dist(event.touches) / Math.max(1,pinchStart.distance));
    } else if (event.touches.length === 1 && touchStart && zoom > 1.02) {
      event.preventDefault();
      panX = touchStart.panX + event.touches[0].clientX - touchStart.x;
      panY = touchStart.panY + event.touches[0].clientY - touchStart.y;
      updateTransform();
    }
  }, {passive:false});
  stage.addEventListener('touchend', event => {
    if (pinchStart) {if (event.touches.length < 2) pinchStart = null;return;}
    if (touchStart && event.changedTouches.length && zoom <= 1.02) {
      const diffX = event.changedTouches[0].clientX - touchStart.x;
      const diffY = event.changedTouches[0].clientY - touchStart.y;
      if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.4) modalStep(diffX < 0 ? 1 : -1);
    }
    touchStart = null;
  }, {passive:true});
  stage.addEventListener('dblclick', () => setZoom(zoom === 1 ? 2 : 1));
  stage.addEventListener('wheel', event => {
    if (!event.ctrlKey) return;
    event.preventDefault();setZoom(zoom + (event.deltaY < 0 ? .25 : -.25));
  }, {passive:false});
})();
