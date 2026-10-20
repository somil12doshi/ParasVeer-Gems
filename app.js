'use strict';
(() => {
  const $ = (s) => document.querySelector(s);
  const storageKey = 'parasveer-saved-v1';
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-pending');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' }) : null;
  function observeReveals(elements) {
    if (!revealObserver || motionPreference.matches) return;
    elements.forEach((el, index) => {
      if (el.getBoundingClientRect().top > window.innerHeight - 20) {
        el.style.setProperty('--reveal-delay', `${(index % 4) * 55}ms`);
        el.classList.add('reveal-pending');
        revealObserver.observe(el);
      }
    });
  }
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) {
      revealObserver?.disconnect();
      document.querySelectorAll('.reveal-pending').forEach(el => el.classList.remove('reveal-pending'));
    }
  });
  const pageSize = 24;
  let products = [], category = 'All pieces', query = '', limit = pageSize, activeProduct = null;
  let saved = new Set();
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(value)) saved = new Set(value.filter(v => typeof v === 'string'));
  } catch (_) { /* Catalog remains usable if browser storage is unavailable. */ }
  const priority = [64, 103, 99, 79, 105, 158, 49, 85, 67, 93, 80, 35, 75, 147, 78, 133, 77, 52, 71, 116, 40, 65, 98, 122];
  const categoryOrder = ['Necklaces', 'Earrings', 'Rings', 'Bracelets', 'Bangles', 'Pendants & Charms', 'Jewelry Sets', 'Brooches', 'Cufflinks', 'Lock'];
  const categoryLabel = c => c === 'Lock' ? 'Clasps' : c;
  const imageUrl = p => {
    const base = String(window.PARASVEER_CONFIG?.imageBaseUrl || '').trim().replace(/\/+$/, '');
    return `${base ? base + '/' : './'}${p.image.split('/').map(encodeURIComponent).join('/')}`;
  };
  function create(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function photo(p, lazy = true) {
    const img = create('img');
    img.src = imageUrl(p); img.alt = `${p.name} — ${categoryLabel(p.category)}, reference ${p.id}`;
    img.loading = lazy ? 'lazy' : 'eager'; img.decoding = 'async';
    return img;
  }
  let toastTimer;
  function toast(message) {
    $('#toast').textContent = message; $('#toast').classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2600);
  }
  function persistSaved() {
    try { localStorage.setItem(storageKey, JSON.stringify([...saved])); }
    catch (_) { toast('Saved for this visit. Browser storage is unavailable.'); }
  }
  function saveButtonState(button, p) {
    const isSaved = saved.has(p.id);
    button.textContent = isSaved ? '♥' : '♡';
    button.setAttribute('aria-pressed', String(isSaved));
    button.setAttribute('aria-label', `${isSaved ? 'Remove' : 'Save'} ${p.name}${isSaved ? ' from saved pieces' : ''}`);
  }
  function updateSavedUI() {
    $('#saved-count').textContent = saved.size;
    $('#open-shortlist').setAttribute('aria-label', `Open saved pieces, ${saved.size} saved`);
    document.querySelectorAll('.save-button').forEach(button => {
      const p = products.find(p => p.id === button.dataset.id);
      if (p) saveButtonState(button, p);
    });
    if (activeProduct) {
      $('#detail-save').textContent = saved.has(activeProduct.id) ? '♥  Remove from saved pieces' : '♡  Save this piece';
      $('#detail-save').setAttribute('aria-pressed', String(saved.has(activeProduct.id)));
    }
  }
  function toggleSaved(p) {
    const had = saved.has(p.id);
    had ? saved.delete(p.id) : saved.add(p.id);
    persistSaved(); updateSavedUI();
    toast(had ? 'Removed from saved pieces' : 'Added to your saved pieces');
  }
  function openDialog(dialog) {
    dialog.showModal(); document.body.classList.add('modal-open');
  }
  function showProduct(p) {
    activeProduct = p;
    $('#modal-image').src = imageUrl(p); $('#modal-image').alt = `${p.name} — ${categoryLabel(p.category)}`;
    $('#detail-title').textContent = p.name;
    $('#detail-category').textContent = categoryLabel(p.category).toUpperCase();
    $('#detail-reference').textContent = `REFERENCE ${p.id}`;
    updateSavedUI(); openDialog($('#product-dialog'));
  }
  function renderCategories() {
    const categories = ['All pieces', ...categoryOrder.filter(c => products.some(p => p.category === c)), ...new Set(products.map(p => p.category).filter(c => !categoryOrder.includes(c)))];
    $('#category-tabs').replaceChildren();
    categories.forEach(c => {
      const button = create('button', 'category-tab', categoryLabel(c));
      button.type = 'button'; button.dataset.category = c;
      button.setAttribute('aria-pressed', String(c === category));
      button.addEventListener('click', () => {
        category = c; limit = pageSize;
        document.querySelectorAll('.category-tab').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.category === category)));
        renderProducts();
      });
      $('#category-tabs').append(button);
    });
  }
  function filteredProducts() {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const list = products.filter(p => (category === 'All pieces' || p.category === category) && words.every(w => `${p.name} ${categoryLabel(p.category)} ${p.id}`.toLowerCase().includes(w)));
    if ($('#sort').value === 'name') list.sort((a,b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    if ($('#sort').value === 'category') list.sort((a,b) => categoryLabel(a.category).localeCompare(categoryLabel(b.category)) || a.name.localeCompare(b.name));
    return list;
  }
  function renderProducts() {
    const list = filteredProducts(); const fragment = document.createDocumentFragment();
    list.slice(0, limit).forEach(p => {
      const card = create('article', 'product-card');
      const imageButton = create('button', 'product-image-button');
      imageButton.type = 'button'; imageButton.setAttribute('aria-label', `View ${p.name}, ${p.id}`);
      imageButton.append(photo(p), create('span', 'product-open-hint', 'A closer look ↗'));
      imageButton.addEventListener('click', () => showProduct(p));
      const heart = create('button', 'save-button'); heart.type = 'button'; heart.dataset.id = p.id;
      saveButtonState(heart,p); heart.addEventListener('click', () => toggleSaved(p));
      const meta = create('div', 'product-meta');
      meta.append(create('span', 'product-category', categoryLabel(p.category)), create('span', 'product-ref', p.id));
      const title = create('h3', 'product-title'); const titleButton = create('button', '', p.name);
      titleButton.type = 'button'; titleButton.addEventListener('click', () => showProduct(p)); title.append(titleButton);
      card.append(imageButton, heart, meta, title); fragment.append(card);
    });
    revealObserver?.disconnect();
    document.querySelectorAll('.reveal-pending').forEach(el => el.classList.remove('reveal-pending'));
    $('#product-grid').replaceChildren(fragment);
    observeReveals(document.querySelectorAll('.product-card, .section-heading, .inquiry-section > div'));
    $('#empty-state').hidden = list.length !== 0;
    $('#load-more').hidden = list.length <= limit;
    $('#results-count').textContent = list.length === 0 ? 'No matching collection views' : `${Math.min(limit, list.length)} of ${list.length} collection views${category !== 'All pieces' ? ' · ' + categoryLabel(category) : ''}`;
  }
  function renderShortlist() {
    const selected = products.filter(p => saved.has(p.id));
    const container = $('#shortlist-items'); container.replaceChildren();
    if (!selected.length) {
      const empty = create('div','empty-state');
      empty.append(create('span','','♡'), create('h3','','Your story starts here'), create('p','','Tap a heart in the collection to save your first piece.'));
      const browse = create('button','text-button','Explore the collection ↗');
      browse.addEventListener('click',()=> { $('#shortlist-dialog').close(); $('#collection').scrollIntoView({behavior:motionPreference.matches ? 'instant' : 'smooth'}); });
      empty.append(browse); container.append(empty);
    }
    selected.forEach(p => {
      const row = create('div','shortlist-row'), copy = create('div');
      copy.append(create('h3','',p.name), create('p','',`${categoryLabel(p.category)} · ${p.id}`));
      const remove = create('button','remove-saved','Remove'); remove.setAttribute('aria-label', `Remove ${p.name}`);
      remove.addEventListener('click',()=>{ toggleSaved(p); renderShortlist(); });
      row.append(photo(p),copy,remove); container.append(row);
    });
  }
  function showShortlist() { renderShortlist(); openDialog($('#shortlist-dialog')); }
  $('#open-shortlist').addEventListener('click',showShortlist);
  $('#view-selection').addEventListener('click',showShortlist);
  $('#detail-save').addEventListener('click',()=> { if(activeProduct) toggleSaved(activeProduct); });
  $('#search').addEventListener('input', e=>{query=e.target.value;limit=pageSize;renderProducts();});
  $('#sort').addEventListener('change',()=>{limit=pageSize;renderProducts();});
  $('#load-more').addEventListener('click',()=>{
    const previousCount = Math.min(limit, filteredProducts().length);
    limit += pageSize; renderProducts();
    const firstNew = $('#product-grid').children[previousCount]?.querySelector('.product-image-button');
    if (firstNew) firstNew.focus({preventScroll:true});
  });
  $('#reset-filters').addEventListener('click',()=>{category='All pieces';query='';$('#search').value='';limit=pageSize;renderCategories();renderProducts();});
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.close).close()));
  document.querySelectorAll('dialog').forEach(dialog=>{
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-open');});
  });
  $('#year').textContent=new Date().getFullYear();
  fetch('./catalog.json').then(r=>{if(!r.ok)throw new Error('Catalog unavailable');return r.json();}).then(data=>{
    if (!Array.isArray(data) || !data.length) throw new Error('Catalog is empty');
    products=data.sort((a,b)=>{
      const ai=priority.indexOf(a.reference),bi=priority.indexOf(b.reference);
      return (ai<0?999:ai)-(bi<0?999:bi)||a.reference-b.reference;
    });
    saved=new Set([...saved].filter(id=>products.some(p=>p.id===id)));
    for(const [selector,reference] of [['#hero-image',64],['#detail-image',103]]){
      const p=products.find(p=>p.reference===reference)||products[0];$(selector).src=imageUrl(p);
    }
    renderCategories();renderProducts();updateSavedUI();
  }).catch(()=>{
    document.body.dataset.error='true';
    $('#results-count').textContent='The collection could not load. Please refresh the page. If opening files directly, use the local preview described in README.md.';
  });
})();
