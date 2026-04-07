/* ============================================================
   solar.js — 3D Interactive Solar System (Three.js)
   Shaan Basu Portfolio · Projects page
   ============================================================ */
(function () {
  'use strict';

  if (typeof THREE === 'undefined') return;

  var canvas = document.getElementById('solar-canvas');
  if (!canvas) return;

  var panel  = document.getElementById('project-panel');
  var pTitle = document.getElementById('panel-title');
  var pDesc  = document.getElementById('panel-desc');
  var pTags  = document.getElementById('panel-tags');
  var pLink  = document.getElementById('panel-link');
  var pGH    = document.getElementById('panel-github');
  var pClose = document.getElementById('panel-close');

  /* ── Project Data ──────────────────────────────────────────── */
  var PROJECTS = [
    {
      name:   'Instant Checkout Link',
      desc:   "A full-stack project combining Algorand's Algokit with blockchain and smart contracts to make transactions seamless and easier.",
      tags:   ['Algorand', 'HTML5', 'CSS', 'Algokit', 'Python'],
      link:   'https://github.com/ShaanBasu/Instant-Checkout-Link',
      github: 'https://github.com/ShaanBasu',
      color:  0x35d2ff,
      orbit:  2.6,
      speed:  0.0045,
      scale:  0.55,
      rings:  false
    },
    {
      name:   'PDF Data Extractor',
      desc:   'A full-stack data-extractor which extracts structured information from resumes, contracts, invoices and research papers locally with no API cost.',
      tags:   ['Python', 'Llama 3.2', 'LangChain'],
      link:   'https://github.com/ShaanBasu/PDF-Data-Extractor',
      github: 'https://github.com/ShaanBasu',
      color:  0x8b5cf6,
      orbit:  4.0,
      speed:  0.0030,
      scale:  0.48,
      rings:  false
    },
    {
      name:   'Task Management App',
      desc:   'A collaborative task management app with real-time updates, user roles, project organisation, and deadline tracking for team productivity. (In Progress)',
      tags:   ['JavaScript', 'Firebase', 'Material-UI', 'REST API'],
      link:   '#',
      github: 'https://github.com/ShaanBasu',
      color:  0xf59e0b,
      orbit:  5.6,
      speed:  0.0020,
      scale:  0.44,
      rings:  true
    }
  ];

  /* ── Renderer ────────────────────────────────────────────── */
  var wrap   = canvas.parentElement;
  var wRect  = wrap.getBoundingClientRect();
  var W      = wRect.width  || 900;
  var H      = Math.max(500, Math.min(680, window.innerHeight * 0.72));

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  canvas.style.height = H + 'px';

  /* ── Scene & Camera ──────────────────────────────────────── */
  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 500);
  camera.position.set(0, 5.5, 12);
  camera.lookAt(0, 0, 0);

  /* ── Lighting ────────────────────────────────────────────── */
  var sunPoint = new THREE.PointLight(0xfff8e0, 6, 60);
  sunPoint.position.set(0, 0, 0);
  scene.add(sunPoint);

  var ambLight = new THREE.AmbientLight(0x0a0c1a, 1.5);
  scene.add(ambLight);

  var fillLight = new THREE.DirectionalLight(0x334466, 0.5);
  fillLight.position.set(-10, -5, -10);
  scene.add(fillLight);

  /* ── Noise Helpers ───────────────────────────────────────── */
  /*
   * hash2 — same fast pseudo-random hash used in threescene.js.
   * Constants 127.1, 311.7, 43758.5453 are standard noise-generation
   * values: large primes for input scattering and a high-frequency
   * multiplier to extract well-distributed fractional values.
   */
  function hash2(x, y) { return (((Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1) + 1) % 1; }
  function smooth(t)    { return t * t * (3 - 2 * t); }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function vNoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    return lerp(lerp(hash2(xi,yi), hash2(xi+1,yi), smooth(xf)), lerp(hash2(xi,yi+1), hash2(xi+1,yi+1), smooth(xf)), smooth(yf));
  }
  function fbm(x, y, oct) {
    var v=0, a=0.5, f=1, m=0;
    for(var i=0;i<oct;i++){v+=vNoise(x*f,y*f)*a;m+=a;a*=0.5;f*=2.1;}
    return v/m;
  }

  /* ── Texture Factory ─────────────────────────────────────── */
  function makeTex(colorFn, size) {
    var cvs=document.createElement('canvas'); cvs.width=cvs.height=size;
    var ctx=cvs.getContext('2d'); var img=ctx.createImageData(size,size); var d=img.data;
    for(var py=0;py<size;py++){for(var px=0;px<size;px++){
      var n=fbm(px/size*5.6,py/size*2.8,6); var c=colorFn(n,px/size,py/size);
      var i4=(py*size+px)*4; d[i4]=c[0];d[i4+1]=c[1];d[i4+2]=c[2];d[i4+3]=255;
    }}
    ctx.putImageData(img,0,0);
    var tex=new THREE.CanvasTexture(cvs);
    tex.colorSpace=THREE.SRGBColorSpace;
    return tex;
  }

  function makeCloudTex(size) {
    var cvs=document.createElement('canvas'); cvs.width=cvs.height=size;
    var ctx=cvs.getContext('2d'); var img=ctx.createImageData(size,size); var d=img.data;
    for(var py=0;py<size;py++){for(var px=0;px<size;px++){
      var n=fbm(px/size*7+200,py/size*3.5+100,6);
      var alpha=n>0.52?Math.floor((n-0.52)/0.48*210):0;
      var i4=(py*size+px)*4; d[i4]=255;d[i4+1]=255;d[i4+2]=255;d[i4+3]=alpha;
    }}
    ctx.putImageData(img,0,0);
    var tex=new THREE.CanvasTexture(cvs); tex.colorSpace=THREE.SRGBColorSpace; return tex;
  }

  function makeRingTex() {
    var cvs=document.createElement('canvas'); cvs.width=512;cvs.height=1;
    var ctx=cvs.getContext('2d'); var g=ctx.createLinearGradient(0,0,512,0);
    g.addColorStop(0,'rgba(215,190,125,0)');   g.addColorStop(0.04,'rgba(215,190,125,0.45)');
    g.addColorStop(0.12,'rgba(195,170,110,0.85)'); g.addColorStop(0.22,'rgba(210,185,120,0.92)');
    g.addColorStop(0.32,'rgba(160,140,88,0.38)');  g.addColorStop(0.42,'rgba(205,180,115,0.72)');
    g.addColorStop(0.55,'rgba(215,192,125,0.88)'); g.addColorStop(0.68,'rgba(188,166,108,0.42)');
    g.addColorStop(0.80,'rgba(210,188,120,0.58)'); g.addColorStop(0.94,'rgba(195,175,112,0.18)');
    g.addColorStop(1,'rgba(195,175,112,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,512,1);
    return new THREE.CanvasTexture(cvs);
  }

  /* ── Color Fns ───────────────────────────────────────────── */
  function colorForProject(projectColor) {
    var c = new THREE.Color(projectColor);
    return function(n, u, v) {
      var band = Math.sin(v * Math.PI * 22) * 0.5 + 0.5;
      var r = Math.min(255, Math.floor(c.r * 255 * (0.6 + n*0.6) + band*20));
      var g = Math.min(255, Math.floor(c.g * 255 * (0.6 + n*0.6) + band*15));
      var b = Math.min(255, Math.floor(c.b * 255 * (0.6 + n*0.6) + band*10));
      if (n < 0.25) { r=Math.floor(r*0.5); g=Math.floor(g*0.5); b=Math.floor(b*0.5); }
      return [r, g, b];
    };
  }

  /* ── Build Planet ────────────────────────────────────────── */
  function buildPlanet(proj) {
    var grp = new THREE.Group();
    var geo = new THREE.SphereGeometry(1, 96, 96);
    var mat = new THREE.MeshPhongMaterial({
      map:       makeTex(colorForProject(proj.color), 512),
      shininess: 8,
      specular:  new THREE.Color(0x222222)
    });
    var mesh = new THREE.Mesh(geo, mat);
    grp.add(mesh);
    grp.userData.mesh = mesh;

    /* Clouds on first planet */
    if (proj === PROJECTS[0]) {
      var cGeo = new THREE.SphereGeometry(1.022, 64, 64);
      var cMat = new THREE.MeshPhongMaterial({ map: makeCloudTex(512), transparent: true, depthWrite: false, shininess: 0 });
      var cMesh = new THREE.Mesh(cGeo, cMat);
      grp.add(cMesh);
      grp.userData.cloudMesh = cMesh;
    }

    /* Atmosphere */
    var c3 = new THREE.Color(proj.color);
    var atmoGeo = new THREE.SphereGeometry(1.10, 48, 48);
    var atmoMat = new THREE.MeshPhongMaterial({
      color: proj.color, emissive: proj.color, emissiveIntensity: 0.25,
      transparent: true, opacity: 0.16,
      side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending
    });
    grp.add(new THREE.Mesh(atmoGeo, atmoMat));

    /* Halo */
    var haloGeo = new THREE.SphereGeometry(1.22, 32, 32);
    var haloMat = new THREE.MeshPhongMaterial({
      color: proj.color, emissive: proj.color, emissiveIntensity: 0.10,
      transparent: true, opacity: 0.06,
      side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending
    });
    grp.add(new THREE.Mesh(haloGeo, haloMat));

    /* Rings (Task Management planet) */
    if (proj.rings) {
      var rGeo = new THREE.RingGeometry(1.38, 2.35, 128);
      var pos = rGeo.attributes.position;
      var uv  = rGeo.attributes.uv;
      var v3  = new THREE.Vector3();
      for (var k = 0; k < pos.count; k++) {
        v3.fromBufferAttribute(pos, k);
        uv.setXY(k, (v3.length() - 1.38) / (2.35 - 1.38), 0);
      }
      var rMat = new THREE.MeshBasicMaterial({ map: makeRingTex(), side: THREE.DoubleSide, transparent: true, depthWrite: false });
      var rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.rotation.x = -Math.PI / 2.8;
      grp.add(rMesh);
    }

    grp.scale.setScalar(proj.scale);
    return grp;
  }

  /* ── Build Sun ───────────────────────────────────────────── */
  function buildSun() {
    var grp = new THREE.Group();

    var sunGeo = new THREE.SphereGeometry(1, 64, 64);
    var sunMat = new THREE.MeshPhongMaterial({
      emissive:          0xffcc00,
      emissiveIntensity: 1.0,
      color:             0xffaa00,
      shininess:         0
    });
    grp.add(new THREE.Mesh(sunGeo, sunMat));

    /* Corona glow layers */
    var coroColors = [
      { r: 1.5,  c: 0xffdd44, op: 0.18 },
      { r: 2.0,  c: 0xff9900, op: 0.10 },
      { r: 2.8,  c: 0xff6600, op: 0.05 }
    ];
    coroColors.forEach(function(co) {
      var cGeo = new THREE.SphereGeometry(co.r, 32, 32);
      var cMat = new THREE.MeshBasicMaterial({
        color: co.c, transparent: true, opacity: co.op,
        side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending
      });
      grp.add(new THREE.Mesh(cGeo, cMat));
    });

    return grp;
  }

  /* ── Build Orbit Ring ────────────────────────────────────── */
  function buildOrbitRing(radius, color) {
    var pts = [];
    for (var i = 0; i <= 200; i++) {
      var a = (i / 200) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.18 });
    return new THREE.Line(geo, mat);
  }

  /* ── Build Starfield ─────────────────────────────────────── */
  function buildStarfield() {
    var N = 5000;
    var pos = new Float32Array(N*3), col = new Float32Array(N*3);
    for (var i = 0; i < N; i++) {
      var theta=Math.random()*Math.PI*2, phi=Math.acos(2*Math.random()-1), r=50+Math.random()*200;
      pos[i*3]=r*Math.sin(phi)*Math.cos(theta); pos[i*3+1]=r*Math.sin(phi)*Math.sin(theta); pos[i*3+2]=r*Math.cos(phi);
      var t=Math.random();
      if(t>0.92){col[i*3]=1;col[i*3+1]=0.88;col[i*3+2]=0.62;}
      else if(t>0.82){col[i*3]=0.78;col[i*3+1]=0.86;col[i*3+2]=1;}
      else{col[i*3]=1;col[i*3+1]=1;col[i*3+2]=1;}
    }
    var geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    var mat=new THREE.PointsMaterial({size:0.4,sizeAttenuation:true,vertexColors:true,transparent:true,opacity:0.85});
    return new THREE.Points(geo,mat);
  }

  /* ── Build Label Sprite ──────────────────────────────────── */
  function buildLabel(text, color) {
    var cvs = document.createElement('canvas');
    cvs.width = 256; cvs.height = 48;
    var ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, 256, 48);
    ctx.font = '700 18px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#' + new THREE.Color(color).getHexString();
    ctx.textAlign = 'center';
    ctx.fillText(text.length > 18 ? text.slice(0, 16) + '…' : text, 128, 28);
    var tex = new THREE.CanvasTexture(cvs);
    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.4, 0.28, 1);
    return sprite;
  }

  /* ── Assemble Scene ──────────────────────────────────────── */
  var sun = buildSun();
  scene.add(sun);

  var planetGroups = PROJECTS.map(function(proj, idx) {
    var grp    = buildPlanet(proj);
    var pivot  = new THREE.Group();
    pivot.add(grp);
    scene.add(pivot);

    /* Label */
    var label = buildLabel(proj.name, proj.color);
    label.position.set(proj.orbit, proj.scale * 1.6 + 0.1, 0);
    pivot.add(label);

    /* Orbit line */
    scene.add(buildOrbitRing(proj.orbit, proj.color));

    return { pivot: pivot, planet: grp, label: label, proj: proj, angle: idx * (Math.PI * 2 / PROJECTS.length) };
  });

  scene.add(buildStarfield());

  /* Raycaster for click detection */
  var raycaster = new THREE.Raycaster();
  var mouse     = new THREE.Vector2();
  var paused    = false;

  /* Map planet mesh → project index */
  var meshToProject = new Map();
  planetGroups.forEach(function(pg, idx) {
    pg.planet.traverse(function(child) {
      if (child.isMesh && child.geometry.type === 'SphereGeometry') {
        var s = child.geometry.parameters;
        if (s && s.radius === 1) meshToProject.set(child, idx);
      }
    });
  });

  /* ── Render Loop ─────────────────────────────────────────── */
  var clock    = new THREE.Clock();
  var hovIdx   = -1;
  var selIdx   = -1;

  function animate() {
    requestAnimationFrame(animate);
    var dt = clock.getDelta();

    if (!paused) {
      planetGroups.forEach(function(pg) {
        pg.angle += pg.proj.speed;
        pg.pivot.rotation.y = pg.angle;

        /* Rotate planet on its own axis */
        if (pg.planet.userData.mesh) pg.planet.userData.mesh.rotation.y += 0.003;
        if (pg.planet.userData.cloudMesh) pg.planet.userData.cloudMesh.rotation.y += 0.004;
      });
    }

    /* Sun pulse */
    var pulse = 1 + Math.sin(clock.elapsedTime * 1.4) * 0.025;
    sun.scale.setScalar(pulse);

    /* Hover scale */
    planetGroups.forEach(function(pg, i) {
      var targetScale = pg.proj.scale * (i === hovIdx || i === selIdx ? 1.25 : 1.0);
      pg.planet.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    });

    renderer.render(scene, camera);
  }

  /* ── Hit Detection ───────────────────────────────────────── */
  function getHit(clientX, clientY) {
    var rect   = canvas.getBoundingClientRect();
    mouse.x    = ((clientX - rect.left) / rect.width)  *  2 - 1;
    mouse.y   = -((clientY - rect.top)  / rect.height) *  2 + 1;
    raycaster.setFromCamera(mouse, camera);
    var hits = raycaster.intersectObjects(scene.children, true);
    for (var h = 0; h < hits.length; h++) {
      var idx = meshToProject.get(hits[h].object);
      if (idx !== undefined) return idx;
    }
    return -1;
  }

  /* ── Events ──────────────────────────────────────────────── */
  canvas.addEventListener('mousemove', function(e) {
    hovIdx = getHit(e.clientX, e.clientY);
    canvas.style.cursor = hovIdx >= 0 ? 'pointer' : 'default';
  });

  canvas.addEventListener('mouseleave', function() { hovIdx = -1; canvas.style.cursor = 'default'; });

  canvas.addEventListener('click', function(e) {
    var hit = getHit(e.clientX, e.clientY);
    if (hit >= 0) {
      selIdx = hit; paused = true;
      showPanel(hit, e.clientX, e.clientY);
    } else {
      selIdx = -1; paused = false;
      hidePanel();
    }
  });

  canvas.addEventListener('touchend', function(e) {
    var touch = e.changedTouches[0];
    var hit   = getHit(touch.clientX, touch.clientY);
    if (hit >= 0) { selIdx = hit; paused = true; showPanel(hit, touch.clientX, touch.clientY); }
    else           { selIdx = -1; paused = false; hidePanel(); }
    e.preventDefault();
  }, { passive: false });

  /* ── Panel ───────────────────────────────────────────────── */
  function showPanel(idx, clientX, clientY) {
    var p = PROJECTS[idx];
    pTitle.textContent = p.name;
    pDesc.textContent  = p.desc;
    pTags.innerHTML    = p.tags.map(function(t) { return '<span class="tag">' + t + '</span>'; }).join('');
    pLink.href   = p.link;
    pGH.href     = p.github;
    pLink.style.display = p.link === '#' ? 'none' : 'inline-flex';

    var wr   = canvas.getBoundingClientRect();
    var left = clientX - wr.left + 20;
    var top  = clientY - wr.top  - 20;
    if (left + 370 > wr.width)  left = left - 390;
    if (top  + 300 > wr.height) top  = wr.height - 310;
    if (top < 0)  top  = 10;
    if (left < 0) left = 10;
    panel.style.left = left + 'px';
    panel.style.top  = top  + 'px';
    panel.classList.add('visible');
  }

  function hidePanel() { panel.classList.remove('visible'); }

  if (pClose) pClose.addEventListener('click', function() { selIdx = -1; paused = false; hidePanel(); });

  /* ── Resize ──────────────────────────────────────────────── */
  window.addEventListener('resize', function() {
    var wr2 = wrap.getBoundingClientRect();
    W = wr2.width || 900;
    H = Math.max(500, Math.min(680, window.innerHeight * 0.72));
    renderer.setSize(W, H);
    canvas.style.height = H + 'px';
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  });

  animate();

})();
