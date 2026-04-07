/* ============================================================
   solar.js — Interactive Solar System
   Shaan Basu Portfolio · Projects page
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('solar-canvas');
  if (!canvas) return;

  var ctx    = canvas.getContext('2d');
  var panel  = document.getElementById('project-panel');
  var pTitle = document.getElementById('panel-title');
  var pDesc  = document.getElementById('panel-desc');
  var pTags  = document.getElementById('panel-tags');
  var pLink  = document.getElementById('panel-link');
  var pGH    = document.getElementById('panel-github');
  var pClose = document.getElementById('panel-close');

  /* ── Project data ───────────────────────────────────────── */
  var PROJECTS = [
    {
      name:   'Instant Checkout Link',
      desc:   "A full-stack project combining Algorand's Algokit with blockchain and smart contracts to make transactions seamless and easier.",
      tags:   ['Algorand', 'HTML5', 'CSS', 'Algokit', 'Python'],
      link:   'https://github.com/ShaanBasu/Instant-Checkout-Link',
      github: 'https://github.com/ShaanBasu',
      color:  '#35d2ff',
      size:   28,
      orbit:  140,
      speed:  0.0050
    },
    {
      name:   'PDF Data Extractor',
      desc:   'A full-stack data-extractor which extracts structured information from resumes, contracts, invoices and research papers locally with no API cost.',
      tags:   ['Python', 'Llama 3.2', 'LangChain'],
      link:   'https://github.com/ShaanBasu/PDF-Data-Extractor',
      github: 'https://github.com/ShaanBasu',
      color:  '#8b5cf6',
      size:   24,
      orbit:  215,
      speed:  0.0035
    },
    {
      name:   'Task Management App',
      desc:   'A collaborative task management app with real-time updates, user roles, project organisation, and deadline tracking for team productivity. (In Progress)',
      tags:   ['JavaScript', 'Firebase', 'Material-UI', 'REST API'],
      link:   '#',
      github: 'https://github.com/ShaanBasu',
      color:  '#f59e0b',
      size:   22,
      orbit:  290,
      speed:  0.0022
    }
  ];

  /* ── State ──────────────────────────────────────────────── */
  var W, H, cx, cy;
  var angles         = PROJECTS.map(function () { return Math.random() * Math.PI * 2; });
  var planetPos      = [];  /* {x,y,r} per planet, updated each frame */
  var selectedPlanet = null;
  var hoveredPlanet  = null;
  var bgStars        = [];
  var lastTime       = 0;
  var paused         = false;

  /* ── Resize ─────────────────────────────────────────────── */
  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width = rect.width || 900;
    H = canvas.height = Math.max(520, Math.min(680, window.innerHeight * 0.72));
    canvas.style.height = H + 'px';
    cx = W / 2;
    cy = H / 2;
    genBgStars();
  }

  function genBgStars() {
    bgStars = [];
    var count = Math.floor(W * H / 3500);
    for (var i = 0; i < count; i++) {
      bgStars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.2 + 0.2,
        a: Math.random() * 0.7 + 0.2
      });
    }
  }

  /* ── Drawing ────────────────────────────────────────────── */
  function drawBg() {
    ctx.fillStyle = '#03040a';
    ctx.fillRect(0, 0, W, H);
    bgStars.forEach(function (s) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(232,238,252,' + s.a + ')';
      ctx.fill();
    });
  }

  function drawOrbit(p) {
    var rgb = hexRgb(p.color);
    ctx.beginPath();
    ctx.arc(cx, cy, p.orbit, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(' + rgb + ',0.13)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 9]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawSun() {
    /* Corona glow layers */
    [100, 72, 52].forEach(function (r, i) {
      var a = [0.12, 0.2, 0.3][i];
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0,   'rgba(255,220,60,' + (a * 1.5) + ')');
      g.addColorStop(0.6, 'rgba(255,140,20,' + a + ')');
      g.addColorStop(1,   'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    });

    /* Sun body */
    var sunG = ctx.createRadialGradient(cx - 14, cy - 14, 0, cx, cy, 42);
    sunG.addColorStop(0,    '#fffbe0');
    sunG.addColorStop(0.25, '#ffd700');
    sunG.addColorStop(0.65, '#ff9500');
    sunG.addColorStop(1,    '#cc4400');
    ctx.fillStyle = sunG;
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, Math.PI * 2);
    ctx.fill();

    /* Label */
    ctx.font = '700 11px "Space Mono", monospace';
    ctx.fillStyle = 'rgba(255,230,100,0.75)';
    ctx.textAlign = 'center';
    ctx.fillText('SB:// SOLAR SYSTEM', cx, cy + 62);
  }

  function drawPlanet(p, angle, idx) {
    var x = cx + Math.cos(angle) * p.orbit;
    var y = cy + Math.sin(angle) * p.orbit;

    var isHov = hoveredPlanet === idx;
    var isSel = selectedPlanet === idx;
    var r = p.size + (isHov || isSel ? 5 : 0);
    var rgb = hexRgb(p.color);

    /* Glow */
    var gAlpha = isHov ? 0.55 : (isSel ? 0.45 : 0.22);
    var glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.8);
    glow.addColorStop(0, 'rgba(' + rgb + ',' + gAlpha + ')');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.8, 0, Math.PI * 2);
    ctx.fill();

    /* Planet body */
    var bg = ctx.createRadialGradient(x - r * 0.32, y - r * 0.32, 0, x, y, r);
    bg.addColorStop(0, lighten(p.color, 65));
    bg.addColorStop(0.5, p.color);
    bg.addColorStop(1, darken(p.color, 65));
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    /* Atmosphere rim */
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(' + rgb + ',0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Selection ring */
    if (isSel) {
      ctx.beginPath();
      ctx.arc(x, y, r + 7, 0, Math.PI * 2);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    /* Label */
    var shortName = p.name.length > 20 ? p.name.slice(0, 18) + '…' : p.name;
    ctx.font = '600 10px "Space Grotesk", sans-serif';
    ctx.fillStyle = 'rgba(232,238,252,0.88)';
    ctx.textAlign = 'center';
    ctx.fillText(shortName, x, y + r + 15);

    return { x: x, y: y, r: r };
  }

  /* ── Helpers ────────────────────────────────────────────── */
  function hexRgb(hex) {
    return (
      parseInt(hex.slice(1,3), 16) + ',' +
      parseInt(hex.slice(3,5), 16) + ',' +
      parseInt(hex.slice(5,7), 16)
    );
  }

  function lighten(hex, amt) {
    return 'rgb(' +
      Math.min(255, parseInt(hex.slice(1,3),16) + amt) + ',' +
      Math.min(255, parseInt(hex.slice(3,5),16) + amt) + ',' +
      Math.min(255, parseInt(hex.slice(5,7),16) + amt) + ')';
  }

  function darken(hex, amt) {
    return 'rgb(' +
      Math.max(0, parseInt(hex.slice(1,3),16) - amt) + ',' +
      Math.max(0, parseInt(hex.slice(3,5),16) - amt) + ',' +
      Math.max(0, parseInt(hex.slice(5,7),16) - amt) + ')';
  }

  /* ── Render loop ────────────────────────────────────────── */
  function render(ts) {
    var dt = Math.min((ts - lastTime) / 1000, 0.05); /* cap at 50 ms */
    lastTime = ts;

    drawBg();
    PROJECTS.forEach(function (p) { drawOrbit(p); });
    drawSun();

    planetPos = [];
    PROJECTS.forEach(function (p, i) {
      if (!paused) {
        angles[i] += p.speed;
      }
      planetPos.push(drawPlanet(p, angles[i], i));
    });

    requestAnimationFrame(render);
  }

  /* ── Hit detection ──────────────────────────────────────── */
  function hitPlanet(mx, my) {
    for (var i = 0; i < planetPos.length; i++) {
      var pp = planetPos[i];
      var dx = mx - pp.x;
      var dy = my - pp.y;
      if (Math.sqrt(dx * dx + dy * dy) <= pp.r + 12) return i;
    }
    return -1;
  }

  /* ── Events ─────────────────────────────────────────────── */
  canvas.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = W / rect.width;
    var scaleY = H / rect.height;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top)  * scaleY;
    var hit = hitPlanet(mx, my);
    hoveredPlanet = hit >= 0 ? hit : null;
    canvas.style.cursor = hit >= 0 ? 'pointer' : 'default';
  });

  canvas.addEventListener('mouseleave', function () {
    hoveredPlanet = null;
    canvas.style.cursor = 'default';
  });

  canvas.addEventListener('click', function (e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = W / rect.width;
    var scaleY = H / rect.height;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top)  * scaleY;
    var hit = hitPlanet(mx, my);

    if (hit >= 0) {
      selectedPlanet = hit;
      paused = true;
      showPanel(hit, e.clientX, e.clientY);
    } else {
      selectedPlanet = null;
      paused = false;
      hidePanel();
    }
  });

  /* Touch support */
  canvas.addEventListener('touchend', function (e) {
    var touch = e.changedTouches[0];
    var rect  = canvas.getBoundingClientRect();
    var scaleX = W / rect.width;
    var scaleY = H / rect.height;
    var mx = (touch.clientX - rect.left) * scaleX;
    var my = (touch.clientY - rect.top)  * scaleY;
    var hit = hitPlanet(mx, my);

    if (hit >= 0) {
      selectedPlanet = hit;
      paused = true;
      showPanel(hit, touch.clientX, touch.clientY);
    } else {
      selectedPlanet = null;
      paused = false;
      hidePanel();
    }
    e.preventDefault();
  }, { passive: false });

  /* ── Panel ──────────────────────────────────────────────── */
  function showPanel(idx, clientX, clientY) {
    var p = PROJECTS[idx];
    pTitle.textContent = p.name;
    pDesc.textContent  = p.desc;
    pTags.innerHTML    = p.tags.map(function (t) {
      return '<span class="tag">' + t + '</span>';
    }).join('');
    pLink.href   = p.link;
    pGH.href     = p.github;
    pLink.style.display = p.link === '#' ? 'none' : 'inline-flex';

    var wrap = canvas.parentElement.getBoundingClientRect();
    var left = clientX - wrap.left + 18;
    var top  = clientY - wrap.top  - 18;

    /* Keep inside the canvas container */
    if (left + 370 > wrap.width)  left = left - 390;
    if (top  + 280 > wrap.height) top  = wrap.height - 300;
    if (top  < 0)                 top  = 10;
    if (left < 0)                 left = 10;

    panel.style.left = left + 'px';
    panel.style.top  = top  + 'px';
    panel.classList.add('visible');
  }

  function hidePanel() {
    panel.classList.remove('visible');
  }

  if (pClose) {
    pClose.addEventListener('click', function () {
      selectedPlanet = null;
      paused = false;
      hidePanel();
    });
  }

  /* ── Bootstrap ──────────────────────────────────────────── */
  window.addEventListener('resize', function () {
    resize();
  });

  resize();
  requestAnimationFrame(render);

})();
