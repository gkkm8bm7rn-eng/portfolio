/* Render exactly the author's ten PDF pages; no generated slides or extra content. */
(() => {
  'use strict';
  const root = document.querySelector('[data-presentation-deck][data-pdf-src]');
  if (!root) return;
  const source = new URL(root.dataset.pdfSrc, document.baseURI).href;
  const libUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
  const workerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
  const slideCount = 10, thumbs = new Map(), full = new Map(), inFlight = new Map();
  let fullRequest = 0;
  function status(message) {
    root.querySelectorAll('.presentation-deck__loading').forEach(el => {
      if (!el.parentElement.classList.contains('is-ready')) el.textContent = message;
    });
  }
  function errorFallback() {
    status(document.documentElement.lang === 'en' ? 'Open the original PDF below.' : 'Откройте исходный PDF по ссылке ниже.');
    root.querySelectorAll('.presentation-deck__paper--pdf').forEach(el => el.classList.add('is-error'));
  }
  const pdfPromise = (async () => {
    const lib = await import(libUrl);
    lib.GlobalWorkerOptions.workerSrc = workerUrl;
    const pdf = await lib.getDocument({url:source,isEvalSupported:false}).promise;
    if (pdf.numPages !== slideCount) throw new Error('Expected exactly 10 pages, got '+pdf.numPages);
    root.dataset.pdfPages = String(pdf.numPages);
    return pdf;
  })();
  pdfPromise.catch(err => {console.error('Could not load original presentation PDF',err);errorFallback();});
  async function pageImage(number,width,format) {
    const doc = await pdfPromise;
    if (!Number.isInteger(number) || number < 1 || number > slideCount) throw new Error('Invalid PDF page');
    const page = await doc.getPage(number);
    const original = page.getViewport({scale:1});
    const viewport = page.getViewport({scale:width/original.width});
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1,Math.round(viewport.width));
    canvas.height = Math.max(1,Math.round(viewport.height));
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw new Error('Canvas unavailable');
    await page.render({canvasContext:ctx,viewport,background:'#ffffff'}).promise;
    const blob = await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image conversion failed')),format==='png'?'image/png':'image/webp',.97));
    canvas.width=canvas.height=0;
    page.cleanup();
    return URL.createObjectURL(blob);
  }
  function showThumb(number,url) {
    root.querySelectorAll('img[data-pdf-page="'+number+'"]').forEach(img=>{
      if(img.src===url)return;
      img.onload=()=>img.closest('.presentation-deck__paper--pdf')?.classList.add('is-ready');
      img.src=url;
      if(img.complete&&img.naturalWidth)img.closest('.presentation-deck__paper--pdf')?.classList.add('is-ready');
    });
  }
  function thumb(number) {
    if(thumbs.has(number))return Promise.resolve(thumbs.get(number));
    if(inFlight.has(number))return inFlight.get(number);
    const task=pageImage(number,1250,'webp').then(url=>{
      thumbs.set(number,url);inFlight.delete(number);showThumb(number,url);return url;
    }).catch(err=>{inFlight.delete(number);console.error('PDF page render failed',number,err);return null;});
    inFlight.set(number,task);
    return task;
  }
  async function highRes(number) {
    if(full.has(number))return full.get(number);
    const url=await pageImage(number,2200,'png');
    full.set(number,url);
    while(full.size>2){
      const oldest=full.keys().next().value;
      if(oldest===number)break;
      URL.revokeObjectURL(full.get(oldest));full.delete(oldest);
    }
    return url;
  }
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
    entries.forEach(ent=>{
      if(!ent.isIntersecting)return;
      const number=Number(ent.target.getAttribute('data-pdf-page'));
      if(number>=1&&number<=slideCount)void thumb(number);
    });
  },{root:root.querySelector('[data-deck-viewport]'),rootMargin:'100% 100%',threshold:0.01}):null;
  root.querySelectorAll('img[data-pdf-page]').forEach(img=>{if(observer)observer.observe(img);});
  void thumb(1);void thumb(2);void thumb(10);
  pdfPromise.then(async()=>{
    for(const n of [3,4,5,6,7,8,9]){
      await thumb(n);
      await new Promise(resolve=>setTimeout(resolve,35));
    }
  }).catch(()=>{});
  document.addEventListener('presentation:modalchange',async event=>{
    const index=event.detail?.index;
    if(!Number.isInteger(index)||index<0||index>=slideCount)return;
    const token=++fullRequest,number=index+1;
    const modalImg=document.querySelector('[data-modal-card] img[data-pdf-page]');
    if(!modalImg)return;
    if(thumbs.has(number))modalImg.src=thumbs.get(number);
    else void thumb(number).then(url=>{if(token===fullRequest&&url&&modalImg.isConnected)modalImg.src=url;});
    try{
      const large=await highRes(number);
      if(token===fullRequest&&modalImg.isConnected&&Number(modalImg.dataset.pdfPage)===number){
        modalImg.src=large;
        modalImg.closest('.presentation-deck__paper--pdf')?.classList.add('is-ready');
      }
    }catch(err){console.error('High-resolution page render failed',number,err);}
  });
  window.addEventListener('pagehide',()=>{
    for(const url of thumbs.values())URL.revokeObjectURL(url);
    for(const url of full.values())URL.revokeObjectURL(url);
  },{once:true});
})();
