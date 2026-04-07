/* ============================================================
   galaxy.js — Shaan Basu Portfolio
   · Galaxy warp-speed intro animation (canvas)
   · Page reveal
   · Scroll reveal via IntersectionObserver
   · Scroll-driven vine growth (SVG stroke-dashoffset)
   · Constellation dots (skills page)
   ============================================================ */
(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     1. GALAXY INTRO ANIMATION
  ────────────────────────────────────────────────────────── */
  var canvas = document.getElementById('galaxy-canvas');
  if (!canvas) {
    /* No canvas on this page — skip intro, just init other modules */
    initScrollReveal();
    initVine();
    initConstellationDots();
    return;
  }

  var ctx    = canvas.getContext('2d');
  var W, H, cx, cy;
  var stars  = [];
  var speed  = 0.6;
  var frame  = 0;
  var RAF_ID;

  var STAR_COUNT = 1800;
  var TOTAL_FRAMES = 200; /* ~3.3 s at 60 fps */

  function resize() {
    W  = canvas.width  = window.innerWidth;
    H  = canvas.height = window.innerHeight;
    cx = W / 2;
    cy = H / 2;
  }

  function makeStar(init) {
    var angle = Math.random() * Math.PI * 2;
    var r     = init
      ? Math.random() * Math.hypot(W, H) * 0.55
      : (Math.random() * 4 + 1);
    return {
      x:      Math.cos(angle) * r,
      y:      Math.sin(angle) * r,
      size:   Math.random() * 1.6 + 0.4,
      bright: Math.random() * 0.5 + 0.5,
      spd:    Math.random() * 0.7 + 0.3
    };
  }

  function initStars() {
    stars = [];
    for (var i = 0; i < STAR_COUNT; i++) {
      stars.push(makeStar(true));
    }
  }

  function tick() {
    frame++;

    /* Accelerate then decelerate */
    if (frame < TOTAL_FRAMES * 0.6) {
      speed = Math.min(speed + 0.045, 16);
    } else {
      speed = Math.max(speed - 0.25, 0.4);
    }

    /* Trail effect — semi-transparent fill */
    ctx.fillStyle = frame < 15
      ? 'rgba(0,0,0,1)'
      : 'rgba(3,4,10,0.16)';
    ctx.fillRect(0, 0, W, H);

    /* Draw streaking stars */
    for (var i = 0; i < stars.length; i++) {
      var s     = stars[i];
      var angle = Math.atan2(s.y, s.x);
      var move  = speed * s.spd;

      var ox = cx + s.x;
      var oy = cy + s.y;

      s.x += Math.cos(angle) * move;
      s.y += Math.sin(angle) * move;

      var nx = cx + s.x;
      var ny = cy + s.y;

      var alpha = Math.min(s.bright * (speed / 16 + 0.12), 1);
      var rr    = Math.floor(185 + alpha * 70);
      var gg    = Math.floor(205 + alpha * 50);

      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = 'rgba(' + rr + ',' + gg + ',255,' + alpha + ')';
      ctx.lineWidth   = s.size + speed * 0.04;
      ctx.lineCap     = 'round';
      ctx.stroke();

      /* Reset star if off-screen */
      if (nx < -5 || nx > W + 5 || ny < -5 || ny > H + 5) {
        stars[i] = makeStar(false);
      }
    }

    /* Planet emerging in final frames */
    if (frame > TOTAL_FRAMES * 0.68) {
      var prog   = (frame - TOTAL_FRAMES * 0.68) / (TOTAL_FRAMES * 0.32);
      var pr     = prog * 88;
      var palpha = Math.min(prog, 1);

      /* Glow halo */
      var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, pr * 3);
      glow.addColorStop(0,   'rgba(53,210,255,' + (palpha * 0.35) + ')');
      glow.addColorStop(0.5, 'rgba(79,124,255,' + (palpha * 0.15) + ')');
      glow.addColorStop(1,   'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, pr * 3, 0, Math.PI * 2);
      ctx.fill();

      /* Planet body */
      var grad = ctx.createRadialGradient(
        cx - pr * 0.3, cy - pr * 0.3, 0,
        cx, cy, pr
      );
      grad.addColorStop(0,    'rgba(125,211,252,' + palpha + ')');
      grad.addColorStop(0.25, 'rgba(45,143,224,'  + palpha + ')');
      grad.addColorStop(0.55, 'rgba(26,93,181,'   + palpha + ')');
      grad.addColorStop(0.82, 'rgba(13,56,120,'   + palpha + ')');
      grad.addColorStop(1,    'rgba(6,26,64,'     + palpha + ')');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    if (frame < TOTAL_FRAMES) {
      RAF_ID = requestAnimationFrame(tick);
    } else {
      beginFadeOut();
    }
  }

  function beginFadeOut() {
    var opacity = 1;
    function fade() {
      opacity -= 0.02;
      canvas.style.opacity = opacity;
      if (opacity > 0) {
        requestAnimationFrame(fade);
      } else {
        canvas.style.display = 'none';
        var pg = document.getElementById('page-content');
        if (pg) pg.classList.add('visible');
        /* Init other modules after reveal */
        initScrollReveal();
        initVine();
        initConstellationDots();
      }
    }
    requestAnimationFrame(fade);
  }

  /* Init */
  resize();
  initStars();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  RAF_ID = requestAnimationFrame(tick);

  window.addEventListener('resize', function () {
    resize();
    initStars();
  });

  /* ──────────────────────────────────────────────────────────
     2. SCROLL REVEAL (Intersection Observer)
  ────────────────────────────────────────────────────────── */
  function initScrollReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ──────────────────────────────────────────────────────────
     3. SCROLL-DRIVEN VINE GROWTH (centred vine)
  ────────────────────────────────────────────────────────── */
  function initVine() {
    var stem     = document.getElementById('vine-stem');
    var branches = document.querySelectorAll('.vine-branch');
    var leaves   = document.querySelectorAll('.vine-leaf');

    /* Legacy side vine (kept for skills/education pages) */
    var legacyVine = document.getElementById('main-vine');
    if (legacyVine) {
      var legLen = legacyVine.getTotalLength ? legacyVine.getTotalLength() : 2640;
      legacyVine.style.strokeDasharray  = legLen;
      legacyVine.style.strokeDashoffset = legLen;
    }

    if (!stem) return;

    /* Total length of the centre stem */
    var STEM_LEN = 3500; /* matches stroke-dasharray in CSS */

    /* Branch / leaf reveal thresholds (progress 0–1) */
    var BRANCH_COUNT = branches.length;
    var LEAF_COUNT   = leaves.length;

    function onScroll() {
      var scrolled  = window.scrollY;
      var docH      = document.documentElement.scrollHeight - window.innerHeight;
      var prog      = docH > 0 ? Math.min(scrolled / docH, 1) : 0;

      stem.style.strokeDashoffset = STEM_LEN * (1 - prog);

      if (legacyVine) {
        legacyVine.style.strokeDashoffset = (legacyVine._len || 2640) * (1 - prog);
      }

      /* Reveal branches as stem grows past them */
      branches.forEach(function (b, i) {
        var threshold = (i + 1) / (BRANCH_COUNT + 1) * 0.85;
        b.style.opacity = prog >= threshold ? '0.65' : '0';
      });

      /* Reveal leaves slightly after their branch */
      leaves.forEach(function (l, i) {
        var threshold = (i + 1) / (LEAF_COUNT + 1) * 0.88;
        l.style.opacity = prog >= threshold ? '0.75' : '0';
      });
    }

    /* Store length on legacy vine for reuse */
    if (legacyVine && legacyVine.getTotalLength) {
      legacyVine._len = legacyVine.getTotalLength();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ──────────────────────────────────────────────────────────
     4. CONSTELLATION DOTS (skills page)
  ────────────────────────────────────────────────────────── */
  function initConstellationDots() {
    var wrap = document.querySelector('.constellation-wrap');
    if (!wrap) return;

    var dotDefs = [
      { top: '8%',  left: '12%', delay: '0s'   },
      { top: '18%', left: '82%', delay: '0.6s'  },
      { top: '42%', left: '5%',  delay: '1.1s'  },
      { top: '68%', left: '88%', delay: '0.3s'  },
      { top: '85%', left: '22%', delay: '1.7s'  },
      { top: '55%', left: '92%', delay: '0.9s'  },
      { top: '28%', left: '72%', delay: '1.4s'  },
      { top: '74%', left: '52%', delay: '0.2s'  },
      { top: '14%', left: '48%', delay: '2s'    },
      { top: '38%', left: '35%', delay: '1.6s'  }
    ];

    var wrapW = wrap.offsetWidth  || 352;
    var wrapH = wrap.offsetHeight || 352;

    /* Create dots */
    dotDefs.forEach(function (d) {
      var dot       = document.createElement('div');
      dot.className = 'c-dot';
      dot.style.top              = d.top;
      dot.style.left             = d.left;
      dot.style.animationDelay   = d.delay;
      wrap.appendChild(dot);
    });

    /* Create SVG lines between nearby dots */
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;';

    var edges = [[0,1],[0,8],[1,6],[2,4],[2,7],[3,5],[3,7],[4,7],[6,8],[5,9]];
    edges.forEach(function (e) {
      var a  = dotDefs[e[0]];
      var b  = dotDefs[e[1]];
      var x1 = parseFloat(a.left) / 100 * wrapW;
      var y1 = parseFloat(a.top)  / 100 * wrapH;
      var x2 = parseFloat(b.left) / 100 * wrapW;
      var y2 = parseFloat(b.top)  / 100 * wrapH;
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      line.setAttribute('stroke', 'rgba(139,92,246,0.22)');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    });

    wrap.appendChild(svg);
  }

})();
