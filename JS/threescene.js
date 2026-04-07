/* ============================================================
   threescene.js — Shaan Basu Portfolio
   Three.js HD 3D scene: procedural planets, starfield,
   atmospheric glow, scroll-driven transitions.
   ============================================================ */
(function () {
  'use strict';

  if (typeof THREE === 'undefined') return;

  var canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  /* ── Renderer ────────────────────────────────────────────── */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  /* ── Scene & Camera ──────────────────────────────────────── */
  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 5.5);

  /* ── Lighting ────────────────────────────────────────────── */
  var sunLight = new THREE.DirectionalLight(0xfff8e0, 3.8);
  sunLight.position.set(8, 5, 6);
  scene.add(sunLight);

  var rimLight = new THREE.DirectionalLight(0x334466, 0.6);
  rimLight.position.set(-7, -3, -5);
  scene.add(rimLight);

  var ambLight = new THREE.AmbientLight(0x07091a, 1.2);
  scene.add(ambLight);

  /* ── Noise Helpers ───────────────────────────────────────── */
  /*
   * hash2 — fast pseudo-random hash for (x,y) integer lattice points.
   * Uses standard noise-generation constants:
   *   127.1 / 311.7  — large primes that scatter nearby inputs widely
   *   43758.5453      — large multiplier to push fractional parts into
   *                     a well-distributed 0–1 range after fmod.
   */
  function hash2(x, y) {
    return (((Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1) + 1) % 1;
  }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function vNoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi,        yf = y - yi;
    return lerp(
      lerp(hash2(xi, yi),   hash2(xi + 1, yi),   smooth(xf)),
      lerp(hash2(xi, yi+1), hash2(xi+1, yi+1), smooth(xf)),
      smooth(yf)
    );
  }

  function fbm(x, y, oct) {
    var v = 0, a = 0.5, f = 1, m = 0;
    for (var i = 0; i < oct; i++) {
      v += vNoise(x * f, y * f) * a;
      m += a; a *= 0.5; f *= 2.1;
    }
    return v / m;
  }

  /* ── Texture Factory ─────────────────────────────────────── */
  function makeTex(colorFn, size) {
    var cvs = document.createElement('canvas');
    cvs.width = cvs.height = size;
    var ctx = cvs.getContext('2d');
    var img = ctx.createImageData(size, size);
    var d   = img.data;
    for (var py = 0; py < size; py++) {
      for (var px = 0; px < size; px++) {
        var u = px / size;
        var v = py / size;
        var n = fbm(u * 5.6, v * 2.8, 6);
        var c = colorFn(n, u, v);
        var idx = (py * size + px) * 4;
        d[idx]   = c[0];
        d[idx+1] = c[1];
        d[idx+2] = c[2];
        d[idx+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    var tex = new THREE.CanvasTexture(cvs);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeNormalTex(size) {
    var cvs = document.createElement('canvas');
    cvs.width = cvs.height = size;
    var ctx = cvs.getContext('2d');
    var img = ctx.createImageData(size, size);
    var d   = img.data;
    var s   = 1 / size;
    for (var py = 0; py < size; py++) {
      for (var px = 0; px < size; px++) {
        var u = px / size, v = py / size;
        var h  = fbm(u * 5.6, v * 2.8, 5);
        var hx = fbm((u + s) * 5.6, v * 2.8, 5);
        var hy = fbm(u * 5.6, (v + s) * 2.8, 5);
        var nx = Math.max(0, Math.min(255, (h - hx) * 10 * 255 + 128));
        var ny = Math.max(0, Math.min(255, (h - hy) * 10 * 255 + 128));
        var i4 = (py * size + px) * 4;
        d[i4]   = nx;
        d[i4+1] = ny;
        d[i4+2] = 200;
        d[i4+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return new THREE.CanvasTexture(cvs);
  }

  function makeCloudTex(size) {
    var cvs = document.createElement('canvas');
    cvs.width = cvs.height = size;
    var ctx = cvs.getContext('2d');
    var img = ctx.createImageData(size, size);
    var d   = img.data;
    for (var py = 0; py < size; py++) {
      for (var px = 0; px < size; px++) {
        var u = px / size, v = py / size;
        var n = fbm(u * 7 + 200, v * 3.5 + 100, 6);
        var a = n > 0.52 ? Math.floor((n - 0.52) / 0.48 * 210) : 0;
        var i4 = (py * size + px) * 4;
        d[i4] = 255; d[i4+1] = 255; d[i4+2] = 255; d[i4+3] = a;
      }
    }
    ctx.putImageData(img, 0, 0);
    var tex = new THREE.CanvasTexture(cvs);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeRingTex() {
    var cvs = document.createElement('canvas');
    cvs.width = 512; cvs.height = 1;
    var ctx  = cvs.getContext('2d');
    var grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0,    'rgba(215,190,125,0)');
    grad.addColorStop(0.04, 'rgba(215,190,125,0.45)');
    grad.addColorStop(0.10, 'rgba(195,170,110,0.82)');
    grad.addColorStop(0.16, 'rgba(175,150,100,0.55)');
    grad.addColorStop(0.22, 'rgba(210,185,120,0.92)');
    grad.addColorStop(0.30, 'rgba(160,140,88,0.4)');
    grad.addColorStop(0.38, 'rgba(205,180,115,0.75)');
    grad.addColorStop(0.46, 'rgba(180,160,105,0.5)');
    grad.addColorStop(0.54, 'rgba(215,192,125,0.85)');
    grad.addColorStop(0.62, 'rgba(188,166,108,0.42)');
    grad.addColorStop(0.72, 'rgba(210,188,120,0.62)');
    grad.addColorStop(0.84, 'rgba(172,152,98,0.3)');
    grad.addColorStop(0.95, 'rgba(195,175,112,0.18)');
    grad.addColorStop(1,    'rgba(195,175,112,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 1);
    return new THREE.CanvasTexture(cvs);
  }

  /* ── Color Functions ─────────────────────────────────────── */
  function earthColor(n, u, v) {
    var lat = Math.abs((v - 0.5) * 2);
    if (lat > 0.80) {
      var t = Math.min(1, (lat - 0.80) / 0.20);
      var c = Math.floor(210 + t * 45);
      return [c, c, Math.min(255, c + 15)];
    }
    if (n < 0.46) {
      var d = n / 0.46;
      return [Math.floor(6 + d*14), Math.floor(48 + d*68), Math.floor(135 + d*90)];
    }
    if (n < 0.52) { return [20, 125, 175]; } // shallow
    if (n < 0.57) { return [195, 180, 135]; } // beach
    var h = (n - 0.57) / 0.43;
    if (h < 0.25) return [55, 125, 42];
    if (h < 0.55) return [68, 108, 36];
    if (h < 0.78) return [105, 85, 58];
    return [188, 183, 178];
  }

  function marsColor(n, u, v) {
    var lat = Math.abs((v - 0.5) * 2);
    if (lat > 0.84) { return [205, 205, 218]; }
    if (n < 0.26) { return [75, 32, 18]; }
    return [
      Math.min(255, Math.floor(155 + n*95)),
      Math.min(255, Math.floor(52  + n*58)),
      Math.min(255, Math.floor(28  + n*28))
    ];
  }

  function saturnColor(n, u, v) {
    var band = Math.sin(v * Math.PI * 30) * 0.5 + 0.5;
    return [
      Math.min(255, Math.floor(205 + band*42 + n*18)),
      Math.min(255, Math.floor(168 + band*34 + n*18)),
      Math.min(255, Math.floor(105 + band*18 + n*10))
    ];
  }

  function neptuneColor(n, u, v) {
    var band = Math.sin(v * Math.PI * 20) * 0.5 + 0.5;
    return [
      Math.min(255, Math.floor(18  + n*28  + band*8)),
      Math.min(255, Math.floor(65  + n*55  + band*35)),
      Math.min(255, Math.floor(192 + n*58  + band*5))
    ];
  }

  /* ── Planet Builder ──────────────────────────────────────── */
  function buildPlanet(cfg) {
    var grp  = new THREE.Group();
    var geo  = new THREE.SphereGeometry(1, 96, 96);
    var mat  = new THREE.MeshPhongMaterial({
      map:       makeTex(cfg.colorFn, 512),
      shininess: cfg.shininess !== undefined ? cfg.shininess : 5,
      specular:  new THREE.Color(cfg.specular || 0x111111)
    });
    if (cfg.normalMap) {
      mat.normalMap   = makeNormalTex(256);
      mat.normalScale = new THREE.Vector2(0.5, 0.5);
    }
    var mesh = new THREE.Mesh(geo, mat);
    grp.add(mesh);
    grp.userData.mesh = mesh;

    /* Cloud layer */
    if (cfg.clouds) {
      var cGeo = new THREE.SphereGeometry(1.025, 64, 64);
      var cMat = new THREE.MeshPhongMaterial({
        map:         makeCloudTex(512),
        transparent: true,
        depthWrite:  false,
        shininess:   0
      });
      var cMesh = new THREE.Mesh(cGeo, cMat);
      grp.add(cMesh);
      grp.userData.cloudMesh = cMesh;
    }

    /* Atmosphere rim — BackSide additive glow */
    var atmoGeo = new THREE.SphereGeometry(1.10, 64, 64);
    var atmoMat = new THREE.MeshPhongMaterial({
      color:            cfg.atmoColor || 0x4488ff,
      emissive:         cfg.atmoColor || 0x4488ff,
      emissiveIntensity: 0.30,
      transparent:      true,
      opacity:          0.18,
      side:             THREE.BackSide,
      depthWrite:       false,
      blending:         THREE.AdditiveBlending
    });
    grp.add(new THREE.Mesh(atmoGeo, atmoMat));

    /* Outer glow halo */
    var haloGeo = new THREE.SphereGeometry(1.25, 32, 32);
    var haloMat = new THREE.MeshPhongMaterial({
      color:            cfg.atmoColor || 0x4488ff,
      emissive:         cfg.atmoColor || 0x4488ff,
      emissiveIntensity: 0.12,
      transparent:      true,
      opacity:          0.05,
      side:             THREE.BackSide,
      depthWrite:       false,
      blending:         THREE.AdditiveBlending
    });
    grp.add(new THREE.Mesh(haloGeo, haloMat));

    /* Saturn rings */
    if (cfg.rings) {
      var rGeo = new THREE.RingGeometry(1.38, 2.5, 128);
      /* Remap UV so the ring texture maps radially */
      var pos = rGeo.attributes.position;
      var uv  = rGeo.attributes.uv;
      var v3  = new THREE.Vector3();
      for (var i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        uv.setXY(i, (v3.length() - 1.38) / (2.5 - 1.38), 0);
      }
      var rMat = new THREE.MeshBasicMaterial({
        map:         makeRingTex(),
        side:        THREE.DoubleSide,
        transparent: true,
        depthWrite:  false
      });
      var rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.rotation.x = -Math.PI / 2.6;
      grp.add(rMesh);
    }

    grp.userData.rotSpeed = cfg.rotSpeed || 0.001;
    return grp;
  }

  /* ── Starfield ───────────────────────────────────────────── */
  function buildStarfield() {
    var N   = 9000;
    var pos = new Float32Array(N * 3);
    var col = new Float32Array(N * 3);
    var sz  = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      var theta = Math.random() * Math.PI * 2;
      var phi   = Math.acos(2 * Math.random() - 1);
      var r     = 300 + Math.random() * 700;
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);
      sz[i] = Math.random() * 2.2 + 0.3;
      var t = Math.random();
      if (t > 0.92)      { col[i*3]=1;    col[i*3+1]=0.88; col[i*3+2]=0.62; }
      else if (t > 0.82) { col[i*3]=0.78; col[i*3+1]=0.86; col[i*3+2]=1.0;  }
      else               { col[i*3]=1;    col[i*3+1]=1;    col[i*3+2]=1;    }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    var mat = new THREE.PointsMaterial({
      size:             1.2,
      sizeAttenuation:  true,
      vertexColors:     true,
      transparent:      true,
      opacity:          0.88
    });
    return new THREE.Points(geo, mat);
  }

  /* ── Nebula Sprite ───────────────────────────────────────── */
  function buildNebula() {
    var cvs = document.createElement('canvas');
    cvs.width = cvs.height = 512;
    var ctx = cvs.getContext('2d');
    var gradients = [
      { x:180, y:150, r:260, c0:'rgba(79,124,255,0.18)', c1:'rgba(53,210,255,0.04)' },
      { x:370, y:320, r:200, c0:'rgba(139,92,246,0.14)', c1:'rgba(79,40,160,0.03)'  },
      { x:80,  y:400, r:160, c0:'rgba(53,210,255,0.10)', c1:'rgba(0,0,0,0)'         }
    ];
    gradients.forEach(function(g) {
      var gr = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
      gr.addColorStop(0,   g.c0);
      gr.addColorStop(0.5, g.c1);
      gr.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, 512, 512);
    });
    var tex = new THREE.CanvasTexture(cvs);
    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    var s   = new THREE.Sprite(mat);
    s.scale.set(900, 900, 1);
    s.position.set(0, 0, -500);
    return s;
  }

  /* ── Orbital Ring Lines (decorative) ────────────────────── */
  function buildOrbitRing(radius, color) {
    var N   = 200;
    var pts = [];
    for (var i = 0; i <= N; i++) {
      var a = (i / N) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.18 });
    return new THREE.Line(geo, mat);
  }

  /* ── Glowing Particle Ring (organic/vine feel) ───────────── */
  function buildParticleRing(radius, count, color) {
    var pos = new Float32Array(count * 3);
    var col = new Float32Array(count * 3);
    var r   = new THREE.Color(color);
    for (var i = 0; i < count; i++) {
      var a  = (i / count) * Math.PI * 2;
      var jt = (Math.random() - 0.5) * 0.25;
      pos[i*3]   = Math.cos(a) * (radius + jt);
      pos[i*3+1] = (Math.random() - 0.5) * 0.3;
      pos[i*3+2] = Math.sin(a) * (radius + jt);
      col[i*3]   = r.r; col[i*3+1] = r.g; col[i*3+2] = r.b;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    var mat = new THREE.PointsMaterial({
      size:            0.04,
      vertexColors:    true,
      transparent:     true,
      opacity:         0.55,
      blending:        THREE.AdditiveBlending,
      depthWrite:      false
    });
    return new THREE.Points(geo, mat);
  }

  /* ── Assemble Planets ────────────────────────────────────── */
  var earthPlanet = buildPlanet({
    colorFn:   earthColor,
    atmoColor: 0x3399ff,
    shininess: 22,
    specular:  0x224466,
    normalMap: true,
    clouds:    true,
    rotSpeed:  0.0008
  });

  var marsPlanet = buildPlanet({
    colorFn:   marsColor,
    atmoColor: 0xcc5522,
    shininess: 3,
    normalMap: true,
    rotSpeed:  0.0009
  });

  var saturnPlanet = buildPlanet({
    colorFn:   saturnColor,
    atmoColor: 0xddaa44,
    shininess: 6,
    rings:     true,
    rotSpeed:  0.0007
  });

  var neptunePlanet = buildPlanet({
    colorFn:   neptuneColor,
    atmoColor: 0x1144dd,
    shininess: 10,
    rotSpeed:  0.0006
  });

  /* Add decorative rings around Earth */
  var ring1 = buildOrbitRing(1.7, 0x35d2ff);
  var ring2 = buildOrbitRing(2.0, 0x4f7cff);
  var pRing = buildParticleRing(1.85, 600, 0x35d2ff);
  earthPlanet.add(ring1);
  earthPlanet.add(ring2);
  earthPlanet.add(pRing);
  ring1.rotation.x = 0.35;
  ring2.rotation.x = -0.28;
  pRing.rotation.x = 0.35;

  /* Per-section config */
  var SECTIONS = [
    {
      id:      'hero',
      planet:  earthPlanet,
      camPos:  new THREE.Vector3(0, 0, 5.5),
      pPos:    new THREE.Vector3(1.1, 0, 0),
      scale:   1.5
    },
    {
      id:      'about',
      planet:  marsPlanet,
      camPos:  new THREE.Vector3(-0.3, 0.2, 5.2),
      pPos:    new THREE.Vector3(-1.1, 0, 0),
      scale:   1.2
    },
    {
      id:      'skills',
      planet:  saturnPlanet,
      camPos:  new THREE.Vector3(0.3, -0.1, 5.4),
      pPos:    new THREE.Vector3(1.2, 0, 0),
      scale:   1.0
    },
    {
      id:      'education',
      planet:  neptunePlanet,
      camPos:  new THREE.Vector3(-0.2, 0.15, 5.3),
      pPos:    new THREE.Vector3(-1.0, 0, 0),
      scale:   1.3
    },
    {
      id:      'projects',
      planet:  neptunePlanet,
      camPos:  new THREE.Vector3(0, 0, 5.5),
      pPos:    new THREE.Vector3(0.9, -0.3, 0),
      scale:   1.1
    },
    {
      id:      'contact',
      planet:  earthPlanet,
      camPos:  new THREE.Vector3(0, 0, 5.8),
      pPos:    new THREE.Vector3(1.0, 0.2, 0),
      scale:   1.2
    }
  ];

  var allPlanets = [earthPlanet, marsPlanet, saturnPlanet, neptunePlanet];
  allPlanets.forEach(function(p) {
    p.visible = false;
    scene.add(p);
  });

  /* Position planets at initial config */
  SECTIONS.forEach(function(s) {
    s.planet.position.copy(s.pPos);
    s.planet.scale.setScalar(s.scale);
  });
  earthPlanet.visible = true;

  /* Starfield + nebula */
  scene.add(buildStarfield());
  scene.add(buildNebula());

  /* ── Scroll State ────────────────────────────────────────── */
  var curSection = 0;
  var camTarget  = SECTIONS[0].camPos.clone();

  function detectSection() {
    var mid = window.innerHeight / 2;
    for (var i = 0; i < SECTIONS.length; i++) {
      var el = document.getElementById(SECTIONS[i].id);
      if (!el) continue;
      var r = el.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) {
        if (i !== curSection) {
          /* Hide old planet, show new */
          SECTIONS[curSection].planet.visible = false;
          curSection = i;
          var cfg = SECTIONS[curSection];
          cfg.planet.visible = true;
          cfg.planet.position.copy(cfg.pPos);
          cfg.planet.scale.setScalar(cfg.scale);
          camTarget.copy(cfg.camPos);
        }
        return;
      }
    }
  }

  window.addEventListener('scroll', detectSection, { passive: true });
  detectSection();

  /* ── Render Loop ─────────────────────────────────────────── */
  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    var dt = clock.getDelta();

    /* Rotate planets */
    allPlanets.forEach(function(p) {
      if (p.userData.mesh)      p.userData.mesh.rotation.y       += p.userData.rotSpeed;
      if (p.userData.cloudMesh) p.userData.cloudMesh.rotation.y  += p.userData.rotSpeed * 1.35;
    });

    /* Gentle float on active planet */
    var activePlanet = SECTIONS[curSection].planet;
    activePlanet.position.y = SECTIONS[curSection].pPos.y + Math.sin(clock.elapsedTime * 0.55) * 0.08;

    /* Smooth camera */
    camera.position.lerp(camTarget, 0.025);

    renderer.render(scene, camera);
  }

  /* ── Resize ──────────────────────────────────────────────── */
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();

})();
