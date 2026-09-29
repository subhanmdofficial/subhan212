/* subhan212 — M Subhan Ali · portfolio script (no dependencies) */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const root = document.documentElement;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isMobile = () => matchMedia('(max-width: 760px)').matches;
  const lowPower = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  if (lowPower) root.classList.add('lite');

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Missing-image fallback ---------- */
  $$('img.ph').forEach(img => {
    const mark = () => img.parentElement.classList.add('img-missing');
    if (img.complete && img.naturalWidth === 0) mark();
    img.addEventListener('error', mark, { once: true });
  });

  /* ---------- Text splitting ---------- */
  function split(el) {
    const mode = el.dataset.split;
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    el.classList.add('split');
    let i = 0;
    text.split(/\s+/).forEach((w, wi, arr) => {
      const word = document.createElement('span');
      word.className = 'word';
      word.setAttribute('aria-hidden', 'true');
      if (mode === 'letters') {
        [...w].forEach(ch => {
          const s = document.createElement('span');
          s.className = 'ch';
          s.style.setProperty('--i', i++);
          s.textContent = ch;
          word.appendChild(s);
        });
      } else {
        const s = document.createElement('span');
        s.className = 'ch';
        s.style.setProperty('--i', i * 3);
        i++;
        s.textContent = w;
        word.appendChild(s);
      }
      el.appendChild(word);
      if (wi < arr.length - 1) {
        const sp = document.createElement('span');
        sp.className = 'sp';
        sp.setAttribute('aria-hidden', 'true');
        el.appendChild(sp);
        if (mode === 'letters') i++;
      }
    });
  }
  $$('[data-split]').forEach(split);

  // Loader word (letters)
  const ld = $('#ldWord');
  if (ld) {
    const t = ld.textContent;
    ld.textContent = '';
    [...t].forEach((c, i) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--i', i);
      s.setAttribute('aria-hidden', 'true');
      s.textContent = c;
      ld.appendChild(s);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function startReveals() {
    $$('[data-stagger]').forEach(group => {
      $$(':scope > [data-reveal]', group).forEach((el, i) => {
        if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (i * 0.08).toFixed(2) + 's');
      });
    });

    const targets = $$('[data-reveal], [data-split]');
    if (!('IntersectionObserver' in window) || reduced) {
      targets.forEach(el => el.classList.add('in'));
      return;
    }
    // Elements clipped by their own clip-path can't be observed directly (their visible area is zero),
    // so clip-style reveals are observed through their parent and revealed together.
    const clipped = new Map();
    const direct = [];
    targets.forEach(el => {
      if (/^(mask|arch|clip)$/.test(el.dataset.reveal || '')) {
        const p = el.parentElement;
        if (!clipped.has(p)) clipped.set(p, []);
        clipped.get(p).push(el);
      } else direct.push(el);
    });

    const reveal = (el) => {
      el.classList.add('in');
      if (el.hasAttribute('data-reveal')) {
        const d = parseFloat(el.style.getPropertyValue('--d')) || 0;
        setTimeout(() => {
          if (!el.matches('.frame, .ap-frame') && !el.closest('.hero-title')) el.removeAttribute('data-reveal');
        }, (d + 1.2) * 1000);
      }
    };
    const mk = (threshold) => new IntersectionObserver((entries, o) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        o.unobserve(e.target);
        (clipped.get(e.target) || [e.target]).forEach(reveal);
      });
    }, { threshold, rootMargin: '0px 0px -6% 0px' });
    const ioMain = mk(0.14), ioClip = mk(0.05);
    direct.forEach(el => ioMain.observe(el));
    clipped.forEach((_, p) => ioClip.observe(p));
  }

  /* ---------- Loader ---------- */
  function finishLoading() {
    const loader = $('#loader');
    if (!loader || loader.classList.contains('done')) return;
    loader.classList.add('done');
    document.body.classList.remove('is-loading');
    startReveals();
    setTimeout(() => loader.remove(), 800);
  }
  if (reduced) {
    finishLoading();
  } else {
    setTimeout(finishLoading, 2050);
    window.addEventListener('load', () => { /* loader has a fixed short duration; nothing to wait for */ });
  }

  /* ---------- Navigation ---------- */
  const nav = $('#nav');
  const burger = $('#burger');
  const menu = $('#menu');
  const links = $$('.nav-links a');
  const ind = $('#navInd');

  function moveIndicator(name) {
    const a = links.find(l => l.dataset.link === name);
    if (!a || !ind) { ind && ind.classList.remove('on'); return; }
    ind.classList.add('on');
    ind.style.width = a.offsetWidth + 'px';
    ind.style.transform = `translateX(${a.offsetLeft}px)`;
  }
  let currentNav = 'home';
  function setActive(name) {
    currentNav = name;
    $$('[data-link]').forEach(a => a.classList.toggle('active', a.dataset.link === name));
    moveIndicator(name);
  }

  function toggleMenu(open) {
    const state = open ?? !menu.classList.contains('open');
    menu.classList.toggle('open', state);
    burger.classList.toggle('open', state);
    burger.setAttribute('aria-expanded', String(state));
    burger.setAttribute('aria-label', state ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!state));
    document.body.style.overflow = state ? 'hidden' : '';
    if (state) $('a', menu).focus({ preventScroll: true });
  }
  burger.addEventListener('click', () => toggleMenu());
  $$('a', menu).forEach(a => a.addEventListener('click', () => toggleMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) { toggleMenu(false); burger.focus(); } });
  matchMedia('(min-width: 900px)').addEventListener('change', e => { if (e.matches) toggleMenu(false); });

  if ('IntersectionObserver' in window) {
    const navIO = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.dataset.nav); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('section[data-nav]').forEach(s => navIO.observe(s));
  }
  window.addEventListener('resize', () => moveIndicator(currentNav));
  setTimeout(() => moveIndicator(currentNav), 400);

  /* ---------- Scroll-linked effects (single rAF-throttled handler) ---------- */
  const progress = $('#progress');
  const toTop = $('#toTop');
  const timeline = $('#timeline');
  const tlItems = timeline ? $$('.tl-item', timeline) : [];
  const qLines = $$('[data-q]');
  const glyphs = $$('.vibe-glyphs span');
  const vibe = $('#vibe');
  const aboutImg = $('[data-parallax-img]');
  let ticking = false;

  function onScroll() {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;

    nav.classList.toggle('scrolled', y > 24);
    progress.style.transform = `scaleX(${max > 0 ? clamp(y / max) : 0})`;
    toTop.classList.toggle('show', y > 700);
    root.style.setProperty('--sy', y);

    if (reduced) return;

    if (timeline) {
      const r = timeline.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        const p = clamp((vh * 0.6 - r.top) / r.height);
        timeline.style.setProperty('--tp', p.toFixed(4));
        const line = vh * 0.62;
        tlItems.forEach(li => li.classList.toggle('lit', li.getBoundingClientRect().top + 30 < line));
      }
    }

    qLines.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      const p = clamp((vh * 0.88 - r.top) / (vh * 0.42));
      el.style.setProperty('--fill', (p * 100).toFixed(1) + '%');
    });

    if (aboutImg) {
      const r = aboutImg.parentElement.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        const c = (r.top + r.height / 2 - vh / 2) / vh;
        aboutImg.style.setProperty('--pp', (c * -34).toFixed(1) + 'px');
      }
    }

    if (vibe) {
      const r = vibe.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        const c = (r.top + r.height / 2 - vh / 2);
        glyphs.forEach(g => g.style.setProperty('--gy', (c * parseFloat(g.style.getPropertyValue('--sp'))).toFixed(1) + 'px'));
      }
    }
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  /* ---------- Pointer effects (desktop only) ---------- */
  if (finePointer && !reduced) {
    const glow = $('#cursorGlow');
    const bgMouse = $('#bgMouse');
    const portrait = $('#portrait');
    let mx = innerWidth / 2, my = innerHeight / 2, gx = mx, gy = my, bx = mx, by = my, raf = 0;

    function loop() {
      gx += (mx - gx) * 0.22; gy += (my - gy) * 0.22;
      bx += (mx - bx) * 0.06; by += (my - by) * 0.06;
      glow.style.transform = `translate3d(${gx}px,${gy}px,0)`;
      bgMouse.style.transform = `translate3d(${bx}px,${by}px,0)`;
      if (Math.abs(mx - gx) + Math.abs(my - gy) > 0.3 || Math.abs(mx - bx) + Math.abs(my - by) > 0.3) raf = requestAnimationFrame(loop);
      else raf = 0;
    }
    window.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      glow.style.opacity = 1; bgMouse.style.opacity = 1;
      if (!raf) raf = requestAnimationFrame(loop);
      if (portrait) {
        portrait.style.setProperty('--px', ((mx / innerWidth - 0.5) * 16).toFixed(1) + 'px');
        portrait.style.setProperty('--py', ((my / innerHeight - 0.5) * 12).toFixed(1) + 'px');
      }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { glow.style.opacity = 0; bgMouse.style.opacity = 0; });
    $$('a, button, .node, .chip').forEach(el => {
      el.addEventListener('pointerenter', () => glow.classList.add('hot'));
      el.addEventListener('pointerleave', () => glow.classList.remove('hot'));
    });

    // 3D tilt + light-follow
    $$('[data-tilt]').forEach(el => {
      const max = parseFloat(el.dataset.tilt) || 8;
      let f = 0;
      el.addEventListener('pointermove', e => {
        if (f) return;
        f = requestAnimationFrame(() => {
          f = 0;
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          el.style.setProperty('--ry', ((x - 0.5) * max * 2).toFixed(2) + 'deg');
          el.style.setProperty('--rx', ((0.5 - y) * max * 2).toFixed(2) + 'deg');
          el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
          el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        });
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });

    // Magnetic buttons
    $$('[data-magnetic]').forEach(el => {
      const strength = 0.28;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transition = 'translate .12s ease-out, box-shadow .3s, background .3s, border-color .3s';
        el.style.translate = `${(x * strength).toFixed(1)}px ${(y * strength).toFixed(1)}px`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'translate .5s var(--spring), box-shadow .3s, background .3s, border-color .3s';
        el.style.translate = '0 0';
      });
    });
  }

  /* ---------- Ripple on press ---------- */
  $$('.btn, .soc, [data-ripple]').forEach(el => {
    el.addEventListener('pointerdown', e => {
      const r = el.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2;
      const s = document.createElement('span');
      s.className = 'ripple';
      s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      el.appendChild(s);
      s.addEventListener('animationend', () => s.remove());
    });
  });

  /* ---------- Identity equation ---------- */
  const eq = $('#eq');
  if (eq) {
    $$('.node', eq).forEach(n => {
      ['pointerenter', 'focus'].forEach(t => n.addEventListener(t, () => eq.classList.add('link-on')));
      ['pointerleave', 'blur'].forEach(t => n.addEventListener(t, () => eq.classList.remove('link-on')));
      n.addEventListener('pointerdown', () => eq.classList.add('link-on'));
    });
  }

  /* ---------- Particles + stars ---------- */
  const canvas = $('#fx');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, parts = [], running = true, raf2 = 0;

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.5);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const mobile = isMobile();
    const n = reduced ? 40 : (mobile || lowPower) ? 26 : 70;
    parts = Array.from({ length: n }, (_, i) => {
      const star = i % 3 !== 0;
      return {
        x: Math.random() * W, y: Math.random() * H,
        r: star ? Math.random() * 1 + 0.3 : Math.random() * 1.8 + 0.8,
        vx: (Math.random() - 0.5) * 0.08,
        vy: star ? -0.02 - Math.random() * 0.03 : -0.08 - Math.random() * 0.14,
        a: Math.random() * 0.6 + 0.2, t: Math.random() * 6.28, ts: 0.01 + Math.random() * 0.02, star
      };
    });
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      if (!reduced) {
        p.x += p.vx; p.y += p.vy; p.t += p.ts;
        if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
        if (p.x < -6) p.x = W + 6; else if (p.x > W + 6) p.x = -6;
      }
      const a = p.a * (0.55 + 0.45 * Math.sin(p.t));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fillStyle = p.star ? `rgba(235,228,255,${a * 0.8})` : `rgba(167,139,250,${a})`;
      ctx.fill();
    }
    if (!reduced && running) raf2 = requestAnimationFrame(draw);
  }
  build(); draw();
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { build(); if (reduced) draw(); }, 200); });
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running && !reduced) { cancelAnimationFrame(raf2); raf2 = requestAnimationFrame(draw); }
  });

  /* ---------- Small easter egg: type "vibe" ---------- */
  let buf = '';
  window.addEventListener('keydown', e => {
    if (e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-4);
    if (buf === 'vibe') {
      root.style.setProperty('--p', '#ec4899');
      root.style.setProperty('--p2', '#f9a8d4');
      root.style.setProperty('--p3', '#fbcfe8');
      setTimeout(() => { root.style.removeProperty('--p'); root.style.removeProperty('--p2'); root.style.removeProperty('--p3'); }, 3500);
    }
  });

  console.log('%csubhan212 %c— M Subhan Ali · SUBHAN MD', 'color:#a78bfa;font-weight:800;font-size:14px', 'color:#aaa');
})();
