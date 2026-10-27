(function () {
  'use strict';

  /* Dados de contato: troque pelos reais antes de publicar.
     whatsapp no formato internacional, só números (ex.: 5583999999999). Vazio = usa e-mail. */
  var CONTATO = {
    email: 'contato@latente.studio',
    whatsapp: ''
  };

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function tryPlay(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }

  /* ---------- Título do hero: cada letra numa largura própria ---------- */
  var title = $('[data-hero-title]');
  if (title) {
    title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
    var i = 0;
    Array.prototype.slice.call(title.childNodes).forEach(function (node) {
      if (node.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var word = document.createElement('span');
        word.className = 'word';
        word.setAttribute('aria-hidden', 'true');
        Array.prototype.forEach.call(part, function (ch) {
          var s = document.createElement('span');
          s.className = 'ch';
          s.style.setProperty('--i', i++);
          s.textContent = ch;
          word.appendChild(s);
        });
        frag.appendChild(word);
      });
      title.replaceChild(frag, node);
    });
  }

  /* ---------- Abertura: o quadro sai do ruído ---------- */
  var hero = $('.hero');
  var canvas = $('[data-latent-field]');
  var heroVideo = $('.hero__video');
  var readout = $('.readout');
  var fill = $('[data-readout-fill]');
  var stepEl = $('[data-readout-step]');
  var statusEl = $('[data-readout-status]');
  var seedEl = $('[data-readout-seed]');

  if (seedEl) seedEl.textContent = String(Math.floor(1000000 + Math.random() * 8999999));

  var field = null;
  if (canvas && window.LatentField) {
    try { field = window.LatentField.create(canvas, hero, { interactive: !reduce }); } catch (e) { field = null; }
  }
  if (!field && canvas) canvas.hidden = true;

  function setProgress(p) {
    if (field) field.setProgress(p);
    if (fill) fill.parentNode.style.setProperty('--p', p.toFixed(3));
    if (stepEl) stepEl.textContent = Math.round(p * 50);
  }

  function finishIntro() {
    setProgress(1);
    root.classList.remove('is-latent');
    if (statusEl) statusEl.textContent = 'Quadro pronto';
    if (readout) readout.classList.add('is-done');
  }

  if (reduce) {
    if (heroVideo) heroVideo.pause();
    finishIntro();
  } else {
    var DURATION = 2800;
    var start = performance.now();
    var released = false;
    (function tick(now) {
      var t = clamp((now - start) / DURATION, 0, 1);
      var p = easeInOutCubic(t);
      setProgress(p);
      if (!released && p > 0.42) { released = true; root.classList.remove('is-latent'); }
      if (t < 1) requestAnimationFrame(tick); else finishIntro();
    })(start);
  }

  /* ---------- Barra superior e menu ---------- */
  var topbar = $('[data-topbar]');
  var nav = $('.nav');
  var toggle = $('[data-nav-toggle]');

  function onScrollTopbar() {
    if (topbar) topbar.classList.toggle('is-solid', window.scrollY > 40);
  }

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Fechar' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    $all('a', nav).forEach(function (a) { a.addEventListener('click', function () { if (nav.classList.contains('is-open')) setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
  }

  /* ---------- Manifesto: as palavras entram em foco com a rolagem ---------- */
  var manifesto = $('[data-manifesto]');
  var words = [];
  var wordTops = [];
  if (manifesto && !reduce) {
    $all('[data-reveal-words]', manifesto).forEach(function (p) {
      var parts = p.textContent.trim().split(/\s+/);
      p.textContent = '';
      parts.forEach(function (w, k) {
        var s = document.createElement('span');
        s.className = 'w';
        s.textContent = w;
        p.appendChild(s);
        if (k < parts.length - 1) p.appendChild(document.createTextNode(' '));
        words.push(s);
      });
    });
    manifesto.classList.add('is-armed');
  }
  function measureWords() {
    var y = window.scrollY;
    wordTops = words.map(function (w) { return w.getBoundingClientRect().top + y; });
  }
  function onScrollManifesto() {
    if (!words.length) return;
    var line = window.scrollY + window.innerHeight * 0.72;
    for (var k = 0; k < words.length; k++) words[k].classList.toggle('is-on', wordTops[k] < line);
  }

  /* ---------- Processo: a barra de calor acompanha a leitura ---------- */
  var processEl = $('[data-process]');
  var ramp = processEl && $('.process__ramp', processEl);
  var steps = processEl ? $all('.process__steps li', processEl) : [];
  if (processEl && !reduce) processEl.classList.add('is-armed');
  function onScrollProcess() {
    if (!ramp || reduce) return;
    var vh = window.innerHeight;
    var top = ramp.getBoundingClientRect().top;
    var p = clamp((vh * 0.85 - top) / (vh * 0.45), 0, 1);
    ramp.style.setProperty('--p', p.toFixed(3));
    steps.forEach(function (li, k) { li.classList.toggle('is-hot', p >= k / steps.length + 0.04); });
  }

  /* ---------- Rolagem: um único laço ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      onScrollTopbar();
      onScrollManifesto();
      onScrollProcess();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { measureWords(); onScroll(); }, { passive: true });
  measureWords();
  onScroll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measureWords(); onScroll(); });
  window.addEventListener('load', function () { measureWords(); onScroll(); });

  /* ---------- Explorações: vídeos tocam quando estão na tela ---------- */
  function ensureSrc(v) {
    if (!v.getAttribute('src') && v.dataset.src) { v.src = v.dataset.src; }
  }
  var workVideos = $all('[data-work] video');
  if (reduce) {
    workVideos.forEach(function (v) {
      var fig = v.closest('[data-work]');
      fig.addEventListener('mouseenter', function () { ensureSrc(v); tryPlay(v); });
      fig.addEventListener('mouseleave', function () { v.pause(); });
    });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { ensureSrc(v); tryPlay(v); } else if (!v.paused) { v.pause(); }
      });
    }, { rootMargin: '120px 0px', threshold: 0.2 });
    workVideos.forEach(function (v) { io.observe(v); });
  } else {
    workVideos.forEach(function (v) { ensureSrc(v); tryPlay(v); });
  }

  /* ---------- Serviços: prévia em vídeo que segue o cursor ---------- */
  var list = $('[data-services]');
  var win = $('[data-preview-window]');
  if (list && win && finePointer) {
    var pv = $('video', win);
    var tx = 0, ty = 0, cx = 0, cy = 0, moving = false;
    function follow() {
      cx += (tx - cx) * (reduce ? 1 : 0.18);
      cy += (ty - cy) * (reduce ? 1 : 0.18);
      win.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5 && win.classList.contains('is-on')) requestAnimationFrame(follow);
      else moving = false;
    }
    function target(e) {
      var w = win.offsetWidth, h = win.offsetHeight;
      tx = clamp(e.clientX - w * 0.35, 16, window.innerWidth - w - 16);
      ty = clamp(e.clientY - h / 2, 16, window.innerHeight - h - 16);
      if (!moving) { moving = true; requestAnimationFrame(follow); }
    }
    $all('.service', list).forEach(function (row) {
      row.addEventListener('mouseenter', function (e) {
        var url = row.dataset.preview;
        if (pv.dataset.cur !== url) { pv.src = url; pv.dataset.cur = url; }
        if (!win.classList.contains('is-on')) {
          target(e);
          cx = tx; cy = ty;
          win.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
        }
        win.classList.add('is-on');
        tryPlay(pv);
      });
    });
    list.addEventListener('mousemove', target);
    list.addEventListener('mouseleave', function () { win.classList.remove('is-on'); pv.pause(); });
  }

  /* ---------- Contato ---------- */
  $all('[data-contact-email]').forEach(function (el) { el.textContent = CONTATO.email; });

  var form = $('[data-contact-form]');
  if (form) {
    var status = $('[data-form-status]', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var nome = String(data.get('nome') || '').trim();
      var empresa = String(data.get('empresa') || '').trim();
      var email = String(data.get('email') || '').trim();
      var formato = String(data.get('formato') || '');
      var msg = String(data.get('mensagem') || '').trim();

      var invalid = [];
      if (!nome) invalid.push(form.elements.nome);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid.push(form.elements.email);
      if (!msg) invalid.push(form.elements.mensagem);
      $all('input, textarea', form).forEach(function (el) { el.removeAttribute('aria-invalid'); });
      if (invalid.length) {
        invalid.forEach(function (el) { el.setAttribute('aria-invalid', 'true'); });
        invalid[0].focus();
        status.textContent = 'Preencha nome, um e-mail válido e a ideia para enviar.';
        status.classList.add('is-error');
        return;
      }
      status.classList.remove('is-error');

      var text = 'Olá, Latente! Sou ' + nome + (empresa ? ', da ' + empresa : '') + '.\n' +
        'Formato: ' + formato + '\n\n' + msg + '\n\nResposta para: ' + email;

      if (CONTATO.whatsapp) {
        window.open('https://wa.me/' + CONTATO.whatsapp + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
        status.textContent = 'Abrimos o WhatsApp com a sua mensagem pronta. Falta só tocar em enviar.';
      } else {
        window.location.href = 'mailto:' + CONTATO.email +
          '?subject=' + encodeURIComponent('Novo projeto: ' + formato) +
          '&body=' + encodeURIComponent(text);
        status.textContent = 'Abrimos o seu e-mail com a mensagem pronta. Se nada abrir, escreva para ' + CONTATO.email + '.';
      }
    });
  }
})();
