/* =========================================================================
   VISUALNEXA - "THE EDITING MACHINE" 3D CINEMATIC WORKSTATION ENGINE
   Theme: VisualNexa Electric Blue & Metallic Cyan PBR Scene
   ========================================================================= */

(function() {
  'use strict';

  let scene, camera, renderer, studioGroup;
  let mainScreenMesh, subScreenMesh, monitorCanvas, monitorCtx, monitorTexture;
  let timelineGroup, timelinePlayhead, floatingFrames = [];
  let keyLight, fillLight, rimLight, monitorLight, deskGlowLight;
  let isMobile = false;

  // Camera animation target values for GSAP & mouse parallax
  window.studioCameraState = window.studioCameraState || {
    posX: 0,
    posY: 3.2,
    posZ: 13.5,
    lookX: 0,
    lookY: 1.8,
    lookZ: 0,
    playheadProgress: 0.05,
    colorGradingIntensity: 0,
    motionActive: 0
  };

  function checkAndInit() {
    if (typeof THREE === 'undefined') {
      setTimeout(checkAndInit, 100);
      return;
    }
    const container = document.getElementById('studio-canvas-container');
    if (!container) {
      setTimeout(checkAndInit, 100);
      return;
    }
    initStudio3D();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndInit);
  } else {
    checkAndInit();
  }
  window.addEventListener('load', checkAndInit);

  function initStudio3D() {
    const container = document.getElementById('studio-canvas-container');
    if (!container) return;
    if (container.querySelector('canvas')) return; // Prevent duplicates

    isMobile = window.innerWidth <= 768;

    // 1. SCENE SETUP
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05060a);
    scene.fog = new THREE.FogExp2(0x05060a, 0.018);

    // 2. CAMERA SETUP
    camera = new THREE.PerspectiveCamera(
      45,
      (window.innerWidth || 1200) / (window.innerHeight || 800),
      0.1,
      100
    );
    camera.position.set(0, isMobile ? 3.8 : 3.2, isMobile ? 16.5 : 13.5);

    // 3. RENDERER SETUP (Multi-tier safe initialization)
    const renderOpts = [
      { antialias: true, powerPreference: 'default', alpha: true },
      { antialias: false, powerPreference: 'low-power', alpha: true },
      { antialias: false, precision: 'mediump' }
    ];

    for (let i = 0; i < renderOpts.length; i++) {
      try {
        renderer = new THREE.WebGLRenderer(renderOpts[i]);
        if (renderer && renderer.domElement) break;
      } catch (err) {
        console.warn('WebGL init attempt ' + (i + 1) + ' failed:', err);
      }
    }

    if (!renderer || !renderer.domElement) {
      console.warn('WebGL not supported on this device/browser');
      return;
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    try {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
    } catch (e) {}
    container.appendChild(renderer.domElement);

    studioGroup = new THREE.Group();
    scene.add(studioGroup);

    // 4. BUILD SCENE ELEMENTS
    setupLighting();
    buildStudioDesk();
    buildMainMonitor();
    buildSecondaryMonitor();
    buildEditingConsole();
    buildStudioSpeakers();
    build3DFloatingTimeline();
    buildFloatingProjectFrames();
    buildStudioDustParticles();

    // 5. EVENT LISTENERS
    window.addEventListener('resize', onWindowResize);
    setupMouseParallax();

    // 6. START ANIMATION LOOP
    animate();
  }

  /* -------------------------------------------------------------------------
     LIGHTING RIG (Vibrant Cinematic Studio Lighting)
  ------------------------------------------------------------------------- */
  function setupLighting() {
    // Ambient baseline (Vibrant Slate Navy Tone)
    const ambient = new THREE.AmbientLight(0x1e293b, 1.8);
    scene.add(ambient);

    // Key Light (Soft Warm White Studio Light)
    keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(5, 10, 8);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Fill Light (Electric Cyan Tone)
    fillLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    fillLight.position.set(-8, 6, 4);
    scene.add(fillLight);

    // Rim / Backlight (VisualNexa Electric Sapphire Blue)
    rimLight = new THREE.PointLight(0x0284c7, 4.0, 25);
    rimLight.position.set(-5, 7, -4);
    scene.add(rimLight);

    // Monitor Radiance Glow (Dynamic Cyan Glow onto Desk)
    monitorLight = new THREE.PointLight(0x38bdf8, 3.2, 12);
    monitorLight.position.set(0, 2.4, 0.8);
    scene.add(monitorLight);

    // Desk Edge Underglow Light
    deskGlowLight = new THREE.PointLight(0x0284c7, 2.5, 8);
    deskGlowLight.position.set(0, 0.2, 1.8);
    scene.add(deskGlowLight);
  }

  /* -------------------------------------------------------------------------
     STUDIO DESK & ACOUSTIC WALLS
  ------------------------------------------------------------------------- */
  function buildStudioDesk() {
    // Desk Surface (Charcoal Brushed Matte Wood/Metal)
    const deskGeo = new THREE.BoxGeometry(10.5, 0.18, 4.5);
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x141824,
      roughness: 0.35,
      metalness: 0.4
    });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, 0, 0);
    desk.receiveShadow = true;
    studioGroup.add(desk);

    // Glowing Cyan Desk Front LED Light Strip
    const stripGeo = new THREE.BoxGeometry(10.4, 0.04, 0.04);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(0, -0.06, 2.25);
    studioGroup.add(strip);

    // Desk Legs (Anodized Dark Aluminum)
    const legGeo = new THREE.BoxGeometry(0.2, 3.2, 4.2);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x0a0d14,
      roughness: 0.4,
      metalness: 0.85
    });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-4.8, -1.6, 0);
    studioGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(4.8, -1.6, 0);
    studioGroup.add(rightLeg);

    // Acoustic Backdrop Studio Wall
    const wallGeo = new THREE.PlaneGeometry(36, 18);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x07090e,
      roughness: 0.85,
      metalness: 0.15
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 5, -4.5);
    studioGroup.add(wall);

    // Acoustic Sound Diffuser Slats on Back Wall
    const slatGroup = new THREE.Group();
    const slatGeo = new THREE.BoxGeometry(0.08, 6.0, 0.12);
    const slatMat = new THREE.MeshStandardMaterial({
      color: 0x111624,
      roughness: 0.7,
      metalness: 0.2
    });

    for (let x = -8; x <= 8; x += 0.35) {
      const slat = new THREE.Mesh(slatGeo, slatMat);
      slat.position.set(x, 4.2, -4.38);
      slatGroup.add(slat);
    }
    studioGroup.add(slatGroup);
  }

  /* -------------------------------------------------------------------------
     PRIMARY EDITING MONITOR (Ultra-wide 21:9 NLE Workspace)
  ------------------------------------------------------------------------- */
  function buildMainMonitor() {
    const monitorGroup = new THREE.Group();
    monitorGroup.position.set(0, 0.09, -0.8);

    // Stand Base
    const baseGeo = new THREE.CylinderGeometry(0.6, 0.7, 0.08, 32);
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1a2030,
      metalness: 0.85,
      roughness: 0.25
    });
    const base = new THREE.Mesh(baseGeo, metalMat);
    base.position.set(0, 0.04, 0);
    monitorGroup.add(base);

    // Monitor Arm / Stem
    const stemGeo = new THREE.BoxGeometry(0.25, 2.2, 0.18);
    const stem = new THREE.Mesh(stemGeo, metalMat);
    stem.position.set(0, 1.1, -0.2);
    monitorGroup.add(stem);

    // Monitor Frame / Bezel (Ultra-wide 21:9 ratio)
    const frameWidth = 5.8;
    const frameHeight = 2.6;
    const frameGeo = new THREE.BoxGeometry(frameWidth, frameHeight, 0.15);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0e111a,
      metalness: 0.9,
      roughness: 0.3
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 2.2, 0);
    monitorGroup.add(frame);

    // Dynamic Canvas for Video Editing Interface (NLE)
    monitorCanvas = document.createElement('canvas');
    monitorCanvas.width = 1024;
    monitorCanvas.height = 512;
    monitorCtx = monitorCanvas.getContext('2d');

    // Create default procedural background for immediate rendering
    drawInitialNLECanvas();

    monitorTexture = new THREE.CanvasTexture(monitorCanvas);
    monitorTexture.generateMipmaps = true;
    monitorTexture.minFilter = THREE.LinearFilter;

    const screenGeo = new THREE.PlaneGeometry(frameWidth - 0.12, frameHeight - 0.12);
    const screenMat = new THREE.MeshBasicMaterial({
      map: monitorTexture,
      transparent: false
    });
    mainScreenMesh = new THREE.Mesh(screenGeo, screenMat);
    mainScreenMesh.position.set(0, 2.2, 0.08);
    monitorGroup.add(mainScreenMesh);

    // Monitor Ambient Backlight Bar (VisualNexa Cyan Glow)
    const backlightGeo = new THREE.BoxGeometry(frameWidth - 0.4, 0.06, 0.05);
    const backlightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const backlight = new THREE.Mesh(backlightGeo, backlightMat);
    backlight.position.set(0, 2.2, -0.09);
    monitorGroup.add(backlight);

    studioGroup.add(monitorGroup);
  }

  function drawInitialNLECanvas() {
    if (!monitorCtx) return;
    monitorCtx.fillStyle = '#0a0d16';
    monitorCtx.fillRect(0, 0, 1024, 512);

    // Top Header
    monitorCtx.fillStyle = '#101524';
    monitorCtx.fillRect(0, 0, 1024, 34);
    monitorCtx.fillStyle = '#38bdf8';
    monitorCtx.font = 'bold 12px monospace';
    monitorCtx.fillText('VISUALNEXA EDITING SUITE 2026 • 4K UHD MASTER TIMELINE', 18, 22);

    // Program Monitor Preview
    monitorCtx.fillStyle = '#06080e';
    monitorCtx.fillRect(276, 40, 480, 250);
    monitorCtx.fillStyle = '#38bdf8';
    monitorCtx.font = 'bold 16px sans-serif';
    monitorCtx.fillText('TATA SIERRA EV / BMW M4 4K RAW', 360, 160);

    // Audio Equalizer
    monitorCtx.fillStyle = '#101524';
    monitorCtx.fillRect(764, 40, 252, 250);

    // Timeline Tracks
    monitorCtx.fillStyle = '#0e121e';
    monitorCtx.fillRect(8, 298, 1008, 206);
  }

  /* -------------------------------------------------------------------------
     SECONDARY REFERENCE MONITOR (Color Grading Scopes)
  ------------------------------------------------------------------------- */
  function buildSecondaryMonitor() {
    const subGroup = new THREE.Group();
    subGroup.position.set(3.5, 0.09, -0.4);
    subGroup.rotation.y = -Math.PI / 6.5;

    const baseGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.06, 24);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x141824, metalness: 0.8, roughness: 0.3 });
    const base = new THREE.Mesh(baseGeo, metalMat);
    base.position.set(0, 0.03, 0);
    subGroup.add(base);

    const stemGeo = new THREE.BoxGeometry(0.18, 1.8, 0.14);
    const stem = new THREE.Mesh(stemGeo, metalMat);
    stem.position.set(0, 0.9, -0.15);
    subGroup.add(stem);

    const frameGeo = new THREE.BoxGeometry(2.5, 1.9, 0.12);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0e111a, metalness: 0.85, roughness: 0.3 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 1.8, 0);
    subGroup.add(frame);

    const scopeCanvas = document.createElement('canvas');
    scopeCanvas.width = 512;
    scopeCanvas.height = 384;
    const sCtx = scopeCanvas.getContext('2d');

    function drawScopes() {
      sCtx.fillStyle = '#090c16';
      sCtx.fillRect(0, 0, 512, 384);

      sCtx.fillStyle = '#94a3b8';
      sCtx.font = 'bold 15px monospace';
      sCtx.fillText('VECTORSCOPE / RGB PARADE', 20, 30);
      sCtx.fillStyle = '#38bdf8';
      sCtx.fillText('VISUALNEXA • 10-BIT', 340, 30);

      sCtx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      sCtx.lineWidth = 1.5;
      sCtx.beginPath();
      sCtx.arc(130, 150, 75, 0, Math.PI * 2);
      sCtx.stroke();

      sCtx.beginPath();
      sCtx.moveTo(130, 75); sCtx.lineTo(130, 225);
      sCtx.moveTo(55, 150); sCtx.lineTo(205, 150);
      sCtx.stroke();

      sCtx.fillStyle = 'rgba(56, 189, 248, 0.85)';
      for (let i = 0; i < 45; i++) {
        const rad = Math.random() * 55;
        const ang = Math.random() * Math.PI * 2;
        sCtx.fillRect(130 + Math.cos(ang) * rad, 150 + Math.sin(ang) * rad, 2, 2);
      }

      const colors = ['#38bdf8', '#60a5fa', '#0284c7'];
      for (let c = 0; c < 3; c++) {
        const startX = 260 + c * 80;
        sCtx.fillStyle = colors[c];
        sCtx.fillRect(startX, 60, 60, 2);
        sCtx.fillRect(startX, 230, 60, 2);

        for (let y = 65; y < 225; y += 3) {
          const w = 25 + Math.sin(y * 0.1 + c) * 18 + Math.random() * 12;
          sCtx.fillRect(startX + (60 - w) / 2, y, w, 1.5);
        }
      }

      // Color Wheels (Lift / Gamma / Gain)
      const wheelLabels = ['LIFT', 'GAMMA', 'GAIN'];
      const wheelColors = ['#0284c7', '#38bdf8', '#60a5fa'];
      for (let w = 0; w < 3; w++) {
        const cx = 90 + w * 165;
        const cy = 305;
        sCtx.strokeStyle = 'rgba(255,255,255,0.2)';
        sCtx.beginPath();
        sCtx.arc(cx, cy, 36, 0, Math.PI * 2);
        sCtx.stroke();

        sCtx.fillStyle = wheelColors[w];
        sCtx.beginPath();
        sCtx.arc(cx + (w === 1 ? 4 : -3), cy + (w === 2 ? -5 : 2), 5, 0, Math.PI * 2);
        sCtx.fill();

        sCtx.fillStyle = '#cbd5e1';
        sCtx.font = 'bold 12px monospace';
        sCtx.fillText(wheelLabels[w], cx - 14, cy + 54);
      }
    }
    drawScopes();

    const scopeTex = new THREE.CanvasTexture(scopeCanvas);
    const sMat = new THREE.MeshBasicMaterial({ map: scopeTex });
    const sMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.38, 1.78), sMat);
    sMesh.position.set(0, 1.8, 0.07);
    subGroup.add(sMesh);

    studioGroup.add(subGroup);
  }

  /* -------------------------------------------------------------------------
     EDITING CONSOLE & COLOR GRADING DIALS
  ------------------------------------------------------------------------- */
  function buildEditingConsole() {
    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(0, 0.12, 0.9);

    // Main Control Surface Panel
    const bodyGeo = new THREE.BoxGeometry(3.6, 0.1, 1.6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x161b28,
      metalness: 0.85,
      roughness: 0.25
    });
    const panel = new THREE.Mesh(bodyGeo, bodyMat);
    panel.rotation.x = Math.PI / 18;
    consoleGroup.add(panel);

    // 3 Metallic Trackballs (Lift, Gamma, Gain)
    const ballGeo = new THREE.SphereGeometry(0.24, 24, 24);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0x222a3d,
      roughness: 0.15,
      metalness: 0.95
    });

    [-1.0, 0, 1.0].forEach((posX, idx) => {
      const ringGeo = new THREE.RingGeometry(0.26, 0.32, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 1 ? 0x38bdf8 : 0x0284c7,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(posX, 0.12, 0.1);
      ring.rotation.x = -Math.PI / 2 + Math.PI / 18;
      consoleGroup.add(ring);

      const ball = new THREE.Mesh(ballGeo, ballMat);
      ball.position.set(posX, 0.18, 0.1);
      consoleGroup.add(ball);
    });

    studioGroup.add(consoleGroup);
  }

  /* -------------------------------------------------------------------------
     STUDIO MONITOR SPEAKERS (Left & Right Nearfield Audio Monitors)
  ------------------------------------------------------------------------- */
  function buildStudioSpeakers() {
    const speakerMat = new THREE.MeshStandardMaterial({
      color: 0x101420,
      metalness: 0.7,
      roughness: 0.3
    });

    [-3.8, 3.8].forEach((posX) => {
      const spkGroup = new THREE.Group();
      spkGroup.position.set(posX, 0.09, -0.6);
      spkGroup.rotation.y = posX < 0 ? Math.PI / 7 : -Math.PI / 7;

      // Speaker Box
      const boxGeo = new THREE.BoxGeometry(0.9, 1.6, 0.9);
      const box = new THREE.Mesh(boxGeo, speakerMat);
      box.position.set(0, 0.8, 0);
      spkGroup.add(box);

      // Tweeter Cone (Cyan Glowing Ring)
      const tweetRingGeo = new THREE.RingGeometry(0.12, 0.16, 24);
      const tweetRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
      const tweetRing = new THREE.Mesh(tweetRingGeo, tweetRingMat);
      tweetRing.position.set(0, 1.25, 0.46);
      spkGroup.add(tweetRing);

      // Woofer Cone
      const wooferGeo = new THREE.CylinderGeometry(0.3, 0.15, 0.12, 24);
      const wooferMat = new THREE.MeshStandardMaterial({ color: 0x1f2638, roughness: 0.4 });
      const woofer = new THREE.Mesh(wooferGeo, wooferMat);
      woofer.rotation.x = Math.PI / 2;
      woofer.position.set(0, 0.65, 0.46);
      spkGroup.add(woofer);

      studioGroup.add(spkGroup);
    });
  }

  /* -------------------------------------------------------------------------
     3D FLOATING NLE TIMELINE (Interactive Glowing Video/Audio Clips)
  ------------------------------------------------------------------------- */
  function build3DFloatingTimeline() {
    timelineGroup = new THREE.Group();
    timelineGroup.position.set(0, 1.1, 0.4);

    const clipColors = [
      0x38bdf8, // Electric Cyan (B-Roll)
      0x0284c7, // Sapphire Blue (A-Roll)
      0x60a5fa, // Light Sky (VFX)
      0x3b82f6, // Royal Blue (Audio)
      0x38bdf8, // Cyan (SFX)
      0x0ea5e9  // Deep Sky (Master)
    ];

    const clipWidth = 1.4;
    const clipHeight = 0.28;
    const clipDepth = 0.06;
    const gap = 0.22;

    clipColors.forEach((col, idx) => {
      const geo = new THREE.BoxGeometry(clipWidth, clipHeight, clipDepth);
      const mat = new THREE.MeshStandardMaterial({
        color: col,
        metalness: 0.8,
        roughness: 0.2,
        emissive: col,
        emissiveIntensity: 0.2
      });
      const clip = new THREE.Mesh(geo, mat);
      const startX = -(clipColors.length * (clipWidth + gap)) / 2 + clipWidth / 2;
      clip.position.set(startX + idx * (clipWidth + gap), (idx % 2 === 0 ? 0.12 : -0.12), 0);
      timelineGroup.add(clip);
    });

    // 3D Glowing Timeline Playhead Needle
    const playheadGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.2, 16);
    const playheadMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    timelinePlayhead = new THREE.Mesh(playheadGeo, playheadMat);
    timelinePlayhead.position.set(0, 0, 0.08);

    const haloGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.set(0, 0.6, 0);
    timelinePlayhead.add(halo);

    studioGroup.add(timelineGroup);
  }

  /* -------------------------------------------------------------------------
     FLOATING 3D PROJECT FRAMES (Actual Portfolio Projects)
  ------------------------------------------------------------------------- */
  function buildFloatingProjectFrames() {
    const projects = [
      { img: 'assets/images/yt_brahmeshwar.jpg', title: 'The Prime Documentary', pos: [-4.2, 3.2, 1.2], rotY: 0.25 },
      { img: 'assets/images/proj_saas.jpg', title: 'B2B SaaS Video Demo', pos: [-3.8, 1.4, 2.5], rotY: 0.35 },
      { img: 'assets/images/proj_sierra_ev.jpg', title: 'Tata Sierra EV Commercial', pos: [4.2, 3.4, 1.4], rotY: -0.25 },
      { img: 'assets/images/thumb_ugc_canada.jpg', title: 'Canada UGC Ad', pos: [3.8, 1.5, 2.8], rotY: -0.35 }
    ];

    const texLoader = new THREE.TextureLoader();

    projects.forEach((proj, idx) => {
      const frameGroup = new THREE.Group();
      frameGroup.position.set(...proj.pos);
      frameGroup.rotation.y = proj.rotY;

      const frameGeo = new THREE.BoxGeometry(2.1, 1.25, 0.08);
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x141824,
        roughness: 0.3,
        metalness: 0.85
      });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameGroup.add(frameMesh);

      const imgGeo = new THREE.PlaneGeometry(1.95, 1.1);
      
      // Load texture safely with fallback
      texLoader.load(
        proj.img,
        (loadedTex) => {
          const imgMat = new THREE.MeshBasicMaterial({ map: loadedTex });
          const imgMesh = new THREE.Mesh(imgGeo, imgMat);
          imgMesh.position.z = 0.045;
          frameGroup.add(imgMesh);
        },
        undefined,
        () => {
          // Fallback procedural canvas card
          const c = document.createElement('canvas');
          c.width = 256; c.height = 144;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,256,144);
          ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 16px sans-serif';
          ctx.fillText(proj.title, 20, 75);
          const fbTex = new THREE.CanvasTexture(c);
          const imgMesh = new THREE.Mesh(imgGeo, new THREE.MeshBasicMaterial({ map: fbTex }));
          imgMesh.position.z = 0.045;
          frameGroup.add(imgMesh);
        }
      );

      // Glowing Neon Border
      const borderGeo = new THREE.BoxGeometry(2.14, 1.29, 0.02);
      const borderMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
      const borderMesh = new THREE.Mesh(borderGeo, borderMat);
      borderMesh.position.z = 0.048;
      frameGroup.add(borderMesh);

      studioGroup.add(frameGroup);
      floatingFrames.push({
        group: frameGroup,
        baseY: proj.pos[1],
        baseX: proj.pos[0],
        speed: 1.2 + idx * 0.3,
        phase: idx * Math.PI * 0.5
      });
    });
  }

  /* -------------------------------------------------------------------------
     ATMOSPHERIC STUDIO DUST PARTICLES
  ------------------------------------------------------------------------- */
  function buildStudioDustParticles() {
    const count = 250;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = Math.random() * 9;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.05,
      transparent: true,
      opacity: 0.65
    });

    const particles = new THREE.Points(geo, mat);
    studioGroup.add(particles);
  }

  /* -------------------------------------------------------------------------
     DYNAMIC MONITOR NLE INTERFACE CANVAS UPDATER
  ------------------------------------------------------------------------- */
  let playheadX = 140;

  function updateMonitorNLECanvas(time) {
    if (!monitorCtx) return;

    monitorCtx.fillStyle = '#080a12';
    monitorCtx.fillRect(0, 0, 1024, 512);

    // Top Header Bar
    monitorCtx.fillStyle = '#101524';
    monitorCtx.fillRect(0, 0, 1024, 34);

    monitorCtx.fillStyle = '#38bdf8';
    monitorCtx.font = 'bold 12px monospace';
    monitorCtx.fillText('VISUALNEXA EDITING SUITE 2026 • 4K UHD MASTER TIMELINE', 18, 22);

    const hours = '00';
    const mins = '01';
    const secs = String(Math.floor((time * 24) % 60)).padStart(2, '0');
    const frames = String(Math.floor((time * 48) % 24)).padStart(2, '0');
    monitorCtx.fillText(`TC: ${hours}:${mins}:${secs}:${frames}`, 840, 22);

    // Project Bin (Left Panel)
    monitorCtx.fillStyle = '#0d111d';
    monitorCtx.fillRect(8, 40, 260, 250);
    monitorCtx.fillStyle = '#94a3b8';
    monitorCtx.font = 'bold 11px monospace';
    monitorCtx.fillText('PROJECT BIN [4K CINEMATIC RAW]', 16, 58);

    const binClips = [
      { name: 'TATA_SIERRA_EV_COMMERCIAL_4K.MP4', col: '#38bdf8' },
      { name: 'BMW_M4_AI_CINEMATIC_VFX.EXR', col: '#60a5fa' },
      { name: 'THE_PRIME_DOC_EP01_INVESTIGATION.MOV', col: '#0284c7' },
      { name: 'SPEED_RAMP_OPTICAL_FLARE.MOV', col: '#0ea5e9' },
      { name: 'COLOR_GRADE_TEAL_MAGENTA.CUBE', col: '#38bdf8' }
    ];

    binClips.forEach((c, idx) => {
      monitorCtx.fillStyle = '#161c2e';
      monitorCtx.fillRect(16, 70 + idx * 36, 244, 28);
      monitorCtx.fillStyle = c.col;
      monitorCtx.fillRect(16, 70 + idx * 36, 4, 28);
      monitorCtx.fillStyle = '#f1f5f9';
      monitorCtx.font = '10px monospace';
      monitorCtx.fillText(c.name, 26, 88 + idx * 36);
    });

    // Program Monitor (Center Screen)
    monitorCtx.fillStyle = '#030509';
    monitorCtx.fillRect(276, 40, 480, 250);

    // Animated Preview Waveform in Program Monitor
    monitorCtx.fillStyle = '#0f172a';
    monitorCtx.fillRect(286, 50, 460, 230);
    
    // Draw animated gradient bars inside program monitor
    const gradBars = 20;
    for (let g = 0; g < gradBars; g++) {
      const bh = 40 + Math.sin(time * 5 + g * 0.4) * 35;
      const bx = 300 + g * 22;
      const barGrad = monitorCtx.createLinearGradient(0, 240, 0, 100);
      barGrad.addColorStop(0, '#0284c7');
      barGrad.addColorStop(0.7, '#38bdf8');
      barGrad.addColorStop(1, '#ffffff');
      monitorCtx.fillStyle = barGrad;
      monitorCtx.fillRect(bx, 240 - bh, 14, bh);
    }

    monitorCtx.fillStyle = '#ffffff';
    monitorCtx.font = 'bold 13px sans-serif';
    monitorCtx.fillText('4K HDR PLAYBACK • 60 FPS', 320, 80);

    // Audio Master Meters (Right Panel)
    monitorCtx.fillStyle = '#0d111d';
    monitorCtx.fillRect(764, 40, 252, 250);
    monitorCtx.fillStyle = '#94a3b8';
    monitorCtx.font = 'bold 11px monospace';
    monitorCtx.fillText('AUDIO MASTER [LUFS -14.0]', 774, 58);

    for (let bar = 0; bar < 8; bar++) {
      const barHeight = 60 + Math.sin(time * 8 + bar * 0.8) * 45 + Math.random() * 20;
      const bX = 774 + bar * 30;
      const grad = monitorCtx.createLinearGradient(0, 280, 0, 80);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.7, '#38bdf8');
      grad.addColorStop(1, '#ffffff');
      monitorCtx.fillStyle = grad;
      monitorCtx.fillRect(bX, 280 - barHeight, 20, barHeight);
    }

    // Timeline Tracks Panel (Bottom)
    monitorCtx.fillStyle = '#0f1422';
    monitorCtx.fillRect(8, 298, 1008, 206);
    monitorCtx.fillStyle = '#171e33';
    monitorCtx.fillRect(8, 298, 1008, 22);

    monitorCtx.fillStyle = '#64748b';
    monitorCtx.font = '10px monospace';
    for (let r = 0; r < 10; r++) {
      monitorCtx.fillText(`00:0${r}:00:00`, 30 + r * 100, 314);
      monitorCtx.fillRect(30 + r * 100, 316, 1, 4);
    }

    // Video Track V3
    monitorCtx.fillStyle = '#0284c7';
    monitorCtx.fillRect(120, 326, 260, 26);
    monitorCtx.fillStyle = '#0ea5e9';
    monitorCtx.fillRect(410, 326, 320, 26);
    monitorCtx.fillStyle = '#ffffff';
    monitorCtx.font = 'bold 9px monospace';
    monitorCtx.fillText('V3: 3D MOTION LOWER THIRDS', 130, 343);
    monitorCtx.fillText('V3: VFX GLOW PARTICLES', 420, 343);

    // Video Track V2
    monitorCtx.fillStyle = '#38bdf8';
    monitorCtx.fillRect(30, 356, 350, 28);
    monitorCtx.fillStyle = '#60a5fa';
    monitorCtx.fillRect(400, 356, 440, 28);
    monitorCtx.fillStyle = '#040508';
    monitorCtx.fillText('V2: B-ROLL 4K 120FPS SLOWMO', 40, 374);
    monitorCtx.fillText('V2: CINEMATIC TRAILER HOOK CUT', 410, 374);

    // Video Track V1
    monitorCtx.fillStyle = '#1e293b';
    monitorCtx.fillRect(30, 388, 920, 28);
    monitorCtx.fillStyle = '#ffffff';
    monitorCtx.fillText('V1: A-ROLL STORYLINE [MASTER 4K EDIT]', 40, 406);

    // Audio Track A1 & A2
    monitorCtx.fillStyle = '#0369a1';
    monitorCtx.fillRect(30, 420, 920, 34);
    monitorCtx.fillStyle = '#075985';
    monitorCtx.fillRect(30, 458, 920, 34);

    monitorCtx.fillStyle = '#38bdf8';
    for (let wx = 35; wx < 940; wx += 4) {
      const wave = Math.abs(Math.sin(wx * 0.08 + time * 6)) * 22;
      monitorCtx.fillRect(wx, 437 - wave / 2, 2, wave);
      const wave2 = Math.abs(Math.cos(wx * 0.05 + time * 4)) * 20;
      monitorCtx.fillRect(wx, 475 - wave2 / 2, 2, wave2);
    }

    // Playhead line
    playheadX = 140 + (time * 65) % 800;
    monitorCtx.fillStyle = '#ffffff';
    monitorCtx.fillRect(playheadX, 298, 2, 206);
    monitorCtx.beginPath();
    monitorCtx.moveTo(playheadX - 6, 298);
    monitorCtx.lineTo(playheadX + 8, 298);
    monitorCtx.lineTo(playheadX + 1, 310);
    monitorCtx.fill();

    if (monitorTexture) {
      monitorTexture.needsUpdate = true;
    }
  }

  /* -------------------------------------------------------------------------
     MOUSE PARALLAX INTERACTION
  ------------------------------------------------------------------------- */
  let mouseX = 0, mouseY = 0;
  let targetParallaxX = 0, targetParallaxY = 0;

  function setupMouseParallax() {
    window.addEventListener('mousemove', (e) => {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      targetParallaxX = normX * 0.6;
      targetParallaxY = -normY * 0.4;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        const normX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
        const normY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
        targetParallaxX = normX * 0.6;
        targetParallaxY = -normY * 0.4;
      }
    }, { passive: true });
  }

  /* -------------------------------------------------------------------------
     WINDOW RESIZE
  ------------------------------------------------------------------------- */
  function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = (window.innerWidth || 1200) / (window.innerHeight || 800);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    isMobile = window.innerWidth <= 768;
  }

  /* -------------------------------------------------------------------------
     ANIMATION & RENDER LOOP (Real-Time Organic Floating Motion)
  ------------------------------------------------------------------------- */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    if (!renderer || !scene || !camera) return;

    const elapsedTime = clock.getElapsedTime();

    try {
      updateMonitorNLECanvas(elapsedTime);
    } catch (e) {}

    mouseX += (targetParallaxX - mouseX) * 0.05;
    mouseY += (targetParallaxY - mouseY) * 0.05;

    const st = window.studioCameraState || {
      posX: 0,
      posY: isMobile ? 3.8 : 3.2,
      posZ: isMobile ? 16.5 : 13.5,
      lookX: 0,
      lookY: 1.8,
      lookZ: 0,
      playheadProgress: 0.05
    };

    // Continuous organic studio floating & breathing motion
    const idleFloatX = Math.sin(elapsedTime * 0.5) * 0.28;
    const idleFloatY = Math.cos(elapsedTime * 0.38) * 0.16;
    const idleFloatZ = Math.sin(elapsedTime * 0.28) * 0.18;

    const posX = (typeof st.posX === 'number' && !isNaN(st.posX)) ? st.posX : 0;
    const posY = (typeof st.posY === 'number' && !isNaN(st.posY)) ? st.posY : (isMobile ? 3.8 : 3.2);
    const posZ = (typeof st.posZ === 'number' && !isNaN(st.posZ)) ? st.posZ : (isMobile ? 16.5 : 13.5);

    const lookX = (typeof st.lookX === 'number' && !isNaN(st.lookX)) ? st.lookX : 0;
    const lookY = (typeof st.lookY === 'number' && !isNaN(st.lookY)) ? st.lookY : 1.8;
    const lookZ = (typeof st.lookZ === 'number' && !isNaN(st.lookZ)) ? st.lookZ : 0;

    camera.position.x = posX + mouseX + idleFloatX;
    camera.position.y = posY + mouseY + idleFloatY;
    camera.position.z = posZ + idleFloatZ;

    camera.lookAt(lookX + mouseX * 0.3 + idleFloatX * 0.15, lookY + mouseY * 0.3, lookZ);

    if (timelinePlayhead) {
      const prog = (typeof st.playheadProgress === 'number' && !isNaN(st.playheadProgress)) ? st.playheadProgress : 0.05;
      const totalWidth = 6 * (1.4 + 0.22);
      const startX = -(totalWidth / 2) + 0.7;
      timelinePlayhead.position.x = startX + prog * (totalWidth - 1.4);
    }

    floatingFrames.forEach((frame) => {
      frame.group.position.y = frame.baseY + Math.sin(elapsedTime * frame.speed + frame.phase) * 0.14;
      frame.group.rotation.x = Math.sin(elapsedTime * 0.8 + frame.phase) * 0.05;
    });

    if (monitorLight) {
      monitorLight.color.setHex(0x38bdf8);
      monitorLight.intensity = 2.8 + Math.sin(elapsedTime * 3) * 0.4;
    }

    if (deskGlowLight) {
      deskGlowLight.intensity = 2.0 + Math.cos(elapsedTime * 2.5) * 0.3;
    }

    renderer.render(scene, camera);
  }

})();
