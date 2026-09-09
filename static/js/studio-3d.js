/* =========================================================================
   VISUALNEXA - "THE EDITING MACHINE" 3D CINEMATIC WORKSTATION ENGINE
   Theme: VisualNexa Electric Blue & Metallic Cyan PBR Scene
   ========================================================================= */

(function() {
  'use strict';

  let scene, camera, renderer, studioGroup;
  let mainScreenMesh, subScreenMesh, monitorCanvas, monitorCtx, monitorTexture;
  let timelineGroup, timelinePlayhead, floatingFrames = [];
  let keyLight, fillLight, rimLight, monitorLight;
  let isMobile = false;

  // Camera animation target values for GSAP & mouse parallax
  window.studioCameraState = window.studioCameraState || {
    posX: 0,
    posY: 3.5,
    posZ: 14,
    lookX: 0,
    lookY: 1.8,
    lookZ: 0,
    playheadProgress: 0, // 0 to 1
    colorGradingIntensity: 0, // 0 (neutral) to 1 (graded warm/vibrant)
    motionActive: 0 // 0 to 1
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
  // Extra safety trigger on full window load
  window.addEventListener('load', checkAndInit);

  function initStudio3D() {
    const container = document.getElementById('studio-canvas-container');
    if (!container) return;
    if (container.querySelector('canvas')) return; // Avoid duplicate canvases

    isMobile = window.innerWidth <= 768;

    // 1. SCENE SETUP
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05060a);
    scene.fog = new THREE.FogExp2(0x05060a, 0.035);

    // 2. CAMERA SETUP
    camera = new THREE.PerspectiveCamera(
      45,
      (window.innerWidth || 1200) / (window.innerHeight || 800),
      0.1,
      100
    );
    camera.position.set(0, isMobile ? 4.0 : 3.5, isMobile ? 17.5 : 14);

    // 3. RENDERER SETUP (Multi-tier safe initialization)
    const renderOpts = [
      { antialias: !isMobile, powerPreference: 'default', alpha: false },
      { antialias: false, powerPreference: 'low-power', alpha: false },
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
      renderer.toneMappingExposure = 1.15;
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
     LIGHTING RIG (Cinematic Key, Fill, Rim & Monitor Bounce)
  ------------------------------------------------------------------------- */
  function setupLighting() {
    // Ambient baseline
    const ambient = new THREE.AmbientLight(0x090b14, 0.85);
    scene.add(ambient);

    // Key Light (Soft Warm Overhead Studio Light)
    keyLight = new THREE.SpotLight(0xffeedd, 2.5);
    keyLight.position.set(5, 10, 8);
    keyLight.angle = Math.PI / 4;
    keyLight.penumbra = 0.8;
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Fill Light (Cool Teal/Cyan Shadow Tone)
    fillLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    fillLight.position.set(-8, 6, 4);
    scene.add(fillLight);

    // Rim / Accent Light (VisualNexa Electric Sapphire Blue Backlight)
    rimLight = new THREE.SpotLight(0x0284c7, 3.8);
    rimLight.position.set(-6, 8, -6);
    rimLight.target.position.set(0, 2, 0);
    scene.add(rimLight);
    scene.add(rimLight.target);

    // Monitor Radiance Glow (Dynamic Screen Light bouncing on desk)
    monitorLight = new THREE.PointLight(0x38bdf8, 2.2, 8);
    monitorLight.position.set(0, 2.4, 0.8);
    scene.add(monitorLight);
  }

  /* -------------------------------------------------------------------------
     STUDIO DESK & ACOUSTIC WALLS
  ------------------------------------------------------------------------- */
  function buildStudioDesk() {
    // Desk Surface (Charcoal Brushed Matte Wood/Metal)
    const deskGeo = new THREE.BoxGeometry(10.5, 0.18, 4.5);
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x11131a,
      roughness: 0.35,
      metalness: 0.3
    });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, 0, 0);
    desk.receiveShadow = true;
    studioGroup.add(desk);

    // Desk Legs (Anodized Dark Aluminum)
    const legGeo = new THREE.BoxGeometry(0.2, 3.2, 4.2);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x08090f,
      roughness: 0.4,
      metalness: 0.85
    });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-4.8, -1.6, 0);
    studioGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(4.8, -1.6, 0);
    studioGroup.add(rightLeg);

    // Floor (Dark Studio Concrete / Parquet)
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x040508,
      roughness: 0.6,
      metalness: 0.15
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.2;
    floor.receiveShadow = true;
    scene.add(floor);
  }

  /* -------------------------------------------------------------------------
     PRIMARY EDITING MONITOR (Dynamic NLE Interface)
  ------------------------------------------------------------------------- */
  function buildMainMonitor() {
    const monitorGroup = new THREE.Group();
    monitorGroup.position.set(0, 0.09, -0.6);

    // Monitor Stand Base
    const baseGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.08, 32);
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x161822,
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
    const frameWidth = 5.6;
    const frameHeight = 2.5;
    const frameGeo = new THREE.BoxGeometry(frameWidth, frameHeight, 0.15);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0a0b10,
      metalness: 0.9,
      roughness: 0.3
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 2.2, 0);
    frame.castShadow = true;
    monitorGroup.add(frame);

    // Dynamic Canvas for Video Editing Interface (NLE)
    monitorCanvas = document.createElement('canvas');
    monitorCanvas.width = 1024;
    monitorCanvas.height = 512;
    monitorCtx = monitorCanvas.getContext('2d');

    // Load high-resolution BMW M4 poster image
    const bmwPoster = new Image();
    bmwPoster.crossOrigin = 'anonymous';
    bmwPoster.src = 'assets/images/proj_bmw.jpg';
    bmwPoster.onload = () => {
      window.monitorProjectImage = bmwPoster;
    };
    window.monitorProjectImage = bmwPoster;

    // Load actual BMW M4 video for live 3D monitor playback
    const monitorVideo = document.createElement('video');
    monitorVideo.src = 'assets/videos/BMW M4 underground landscape.mp4';
    monitorVideo.crossOrigin = 'anonymous';
    monitorVideo.loop = true;
    monitorVideo.muted = true;
    monitorVideo.playsInline = true;
    monitorVideo.autoplay = true;
    monitorVideo.setAttribute('muted', '');
    monitorVideo.setAttribute('playsinline', '');
    monitorVideo.setAttribute('autoplay', '');
    monitorVideo.style.position = 'fixed';
    monitorVideo.style.top = '-9999px';
    monitorVideo.style.left = '-9999px';
    monitorVideo.style.width = '1px';
    monitorVideo.style.height = '1px';
    monitorVideo.style.opacity = '0';
    document.body.appendChild(monitorVideo);

    const tryPlayVideo = () => {
      monitorVideo.play().then(() => {
        window.monitorVideoElement = monitorVideo;
      }).catch(() => {});
    };
    tryPlayVideo();
    window.addEventListener('click', tryPlayVideo);
    window.addEventListener('touchstart', tryPlayVideo);
    window.addEventListener('mousemove', tryPlayVideo, { once: true });
    window.monitorVideoElement = monitorVideo;

    monitorTexture = new THREE.CanvasTexture(monitorCanvas);
    monitorTexture.generateMipmaps = true;
    monitorTexture.minFilter = THREE.LinearFilter;

    const screenGeo = new THREE.PlaneGeometry(frameWidth - 0.1, frameHeight - 0.1);
    const screenMat = new THREE.MeshBasicMaterial({
      map: monitorTexture,
      transparent: false
    });
    mainScreenMesh = new THREE.Mesh(screenGeo, screenMat);
    mainScreenMesh.position.set(0, 2.2, 0.08);
    monitorGroup.add(mainScreenMesh);

    // Monitor Ambient Backlight Bar (VisualNexa Cyan Glow)
    const backlightGeo = new THREE.BoxGeometry(frameWidth - 0.6, 0.06, 0.05);
    const backlightMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8
    });
    const backlight = new THREE.Mesh(backlightGeo, backlightMat);
    backlight.position.set(0, 2.2, -0.09);
    monitorGroup.add(backlight);

    studioGroup.add(monitorGroup);
  }

  /* -------------------------------------------------------------------------
     SECONDARY REFERENCE MONITOR (Color Grading Scopes)
  ------------------------------------------------------------------------- */
  function buildSecondaryMonitor() {
    const subGroup = new THREE.Group();
    subGroup.position.set(3.4, 0.09, -0.4);
    subGroup.rotation.y = -Math.PI / 7;

    const baseGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.06, 24);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x141620, metalness: 0.8, roughness: 0.3 });
    const base = new THREE.Mesh(baseGeo, metalMat);
    base.position.set(0, 0.03, 0);
    subGroup.add(base);

    const stemGeo = new THREE.BoxGeometry(0.18, 1.8, 0.14);
    const stem = new THREE.Mesh(stemGeo, metalMat);
    stem.position.set(0, 0.9, -0.15);
    subGroup.add(stem);

    const frameGeo = new THREE.BoxGeometry(2.4, 1.8, 0.12);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x090a0f, metalness: 0.85, roughness: 0.3 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 1.8, 0);
    subGroup.add(frame);

    const scopeCanvas = document.createElement('canvas');
    scopeCanvas.width = 512;
    scopeCanvas.height = 384;
    const sCtx = scopeCanvas.getContext('2d');

    function drawScopes() {
      sCtx.fillStyle = '#080910';
      sCtx.fillRect(0, 0, 512, 384);

      sCtx.fillStyle = '#64748b';
      sCtx.font = 'bold 16px monospace';
      sCtx.fillText('VECTORSCOPE / RGB PARADE', 20, 30);
      sCtx.fillStyle = '#38bdf8';
      sCtx.fillText('VISUALNEXA • 10-BIT', 340, 30);

      sCtx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      sCtx.lineWidth = 1.5;
      sCtx.beginPath();
      sCtx.arc(130, 150, 75, 0, Math.PI * 2);
      sCtx.stroke();

      sCtx.beginPath();
      sCtx.moveTo(130, 75); sCtx.lineTo(130, 225);
      sCtx.moveTo(55, 150); sCtx.lineTo(205, 150);
      sCtx.stroke();

      sCtx.fillStyle = 'rgba(56, 189, 248, 0.7)';
      for (let i = 0; i < 40; i++) {
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

        sCtx.fillStyle = colors[c];
        sCtx.globalAlpha = 0.75;
        for (let x = 0; x < 60; x += 3) {
          const h = 40 + Math.sin(Date.now() * 0.005 + x * 0.1 + c) * 35 + Math.random() * 20;
          sCtx.fillRect(startX + x, 190 - h, 2, h);
        }
        sCtx.globalAlpha = 1.0;
      }

      sCtx.fillStyle = '#0f172a';
      sCtx.fillRect(20, 255, 472, 110);
      sCtx.fillStyle = '#94a3b8';
      sCtx.font = '12px monospace';
      sCtx.fillText('LIFT', 70, 275);
      sCtx.fillText('GAMMA', 230, 275);
      sCtx.fillText('GAIN', 395, 275);

      const wheelColors = ['#38bdf8', '#60a5fa', '#0284c7'];
      for (let w = 0; w < 3; w++) {
        sCtx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        sCtx.beginPath();
        sCtx.arc(85 + w * 160, 320, 30, 0, Math.PI * 2);
        sCtx.stroke();
        sCtx.fillStyle = wheelColors[w];
        sCtx.beginPath();
        sCtx.arc(85 + w * 160 + (w - 1) * 6, 320 + (1 - w) * 5, 4, 0, Math.PI * 2);
        sCtx.fill();
      }
    }

    const scopeTexture = new THREE.CanvasTexture(scopeCanvas);
    const scopeGeo = new THREE.PlaneGeometry(2.3, 1.7);
    const scopeMat = new THREE.MeshBasicMaterial({ map: scopeTexture });
    subScreenMesh = new THREE.Mesh(scopeGeo, scopeMat);
    subScreenMesh.position.set(0, 1.8, 0.07);
    subGroup.add(subScreenMesh);

    studioGroup.add(subGroup);

    setInterval(() => {
      drawScopes();
      scopeTexture.needsUpdate = true;
    }, 100);
  }

  /* -------------------------------------------------------------------------
     EDITING CONSOLE & KEYBOARD
  ------------------------------------------------------------------------- */
  function buildEditingConsole() {
    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(0, 0.1, 0.7);

    const bodyGeo = new THREE.BoxGeometry(3.6, 0.12, 1.4);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x12141c,
      roughness: 0.35,
      metalness: 0.7
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = 0.08;
    consoleGroup.add(body);

    const keyGeo = new THREE.BoxGeometry(0.12, 0.04, 0.12);
    const keyMatDark = new THREE.MeshStandardMaterial({ color: 0x1e212b, roughness: 0.5 });
    const keyMatCyan = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const keyMatBlue = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
    const keyMatLightCyan = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 });

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 14; col++) {
        let mat = keyMatDark;
        if (row === 2 && (col === 6 || col === 7 || col === 8)) mat = keyMatLightCyan;
        if (row === 1 && (col === 3 || col === 8)) mat = keyMatCyan;
        if (col === 13) mat = keyMatBlue;

        const key = new THREE.Mesh(keyGeo, mat);
        key.position.set(-1.4 + col * 0.16, 0.07, -0.3 + row * 0.16);
        key.rotation.x = 0.08;
        consoleGroup.add(key);
      }
    }

    const dialGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.14, 32);
    const dialMat = new THREE.MeshStandardMaterial({
      color: 0x272c3d,
      metalness: 0.9,
      roughness: 0.2
    });
    const dial = new THREE.Mesh(dialGeo, dialMat);
    dial.position.set(1.2, 0.08, 0.05);
    dial.rotation.x = 0.08;
    consoleGroup.add(dial);

    const indentGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16);
    const indentMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const indent = new THREE.Mesh(indentGeo, indentMat);
    indent.position.set(1.2, 0.16, -0.15);
    consoleGroup.add(indent);

    const ledGeo = new THREE.BoxGeometry(0.8, 0.02, 0.04);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(-1.0, 0.08, -0.48);
    consoleGroup.add(led);

    studioGroup.add(consoleGroup);
  }

  /* -------------------------------------------------------------------------
     STUDIO MONITORS / SPEAKERS (Left & Right)
  ------------------------------------------------------------------------- */
  function buildStudioSpeakers() {
    const speakerGeo = new THREE.BoxGeometry(0.9, 1.6, 0.9);
    const speakerMat = new THREE.MeshStandardMaterial({
      color: 0x0d0e14,
      roughness: 0.4,
      metalness: 0.3
    });

    const coneGeo1 = new THREE.CylinderGeometry(0.28, 0.22, 0.06, 24);
    const coneMat1 = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 }); // Electric Blue Woofer

    const coneGeo2 = new THREE.SphereGeometry(0.1, 16, 16);
    const coneMat2 = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.8 });

    const leftSpeaker = new THREE.Group();
    leftSpeaker.position.set(-3.6, 0.9, -0.5);
    leftSpeaker.rotation.y = Math.PI / 8;

    const leftBox = new THREE.Mesh(speakerGeo, speakerMat);
    leftSpeaker.add(leftBox);

    const leftWoofer = new THREE.Mesh(coneGeo1, coneMat1);
    leftWoofer.rotation.x = Math.PI / 2;
    leftWoofer.position.set(0, -0.2, 0.45);
    leftSpeaker.add(leftWoofer);

    const leftTweeter = new THREE.Mesh(coneGeo2, coneMat2);
    leftTweeter.position.set(0, 0.4, 0.45);
    leftSpeaker.add(leftTweeter);

    studioGroup.add(leftSpeaker);

    const rightSpeaker = leftSpeaker.clone();
    rightSpeaker.position.set(4.8, 0.9, -0.3);
    rightSpeaker.rotation.y = -Math.PI / 6;
    studioGroup.add(rightSpeaker);
  }

  /* -------------------------------------------------------------------------
     3D FLOATING EDITING TIMELINE (RAW → CUT → COLOR → VFX → MOTION → FINAL)
  ------------------------------------------------------------------------- */
  function build3DFloatingTimeline() {
    timelineGroup = new THREE.Group();
    timelineGroup.position.set(0, -0.8, 2.2);

    const clipLabels = ['RAW', 'CUT', 'COLOR', 'VFX', 'MOTION', 'FINAL'];
    const clipColors = [0x334155, 0x0284c7, 0x0ea5e9, 0x2563eb, 0x38bdf8, 0x60a5fa];
    const clipWidth = 1.4;
    const clipGap = 0.22;
    const startX = -((clipLabels.length * (clipWidth + clipGap)) / 2) + clipWidth / 2;

    for (let i = 0; i < clipLabels.length; i++) {
      const clipBox = new THREE.Group();
      clipBox.position.set(startX + i * (clipWidth + clipGap), 0, 0);

      const geo = new THREE.BoxGeometry(clipWidth, 0.4, 0.6);
      const mat = new THREE.MeshStandardMaterial({
        color: clipColors[i],
        roughness: 0.2,
        metalness: 0.7,
        transparent: true,
        opacity: 0.9
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      clipBox.add(mesh);

      const glowBarGeo = new THREE.BoxGeometry(clipWidth - 0.1, 0.04, 0.06);
      const glowBarMat = new THREE.MeshBasicMaterial({ color: clipColors[i] });
      const glowBar = new THREE.Mesh(glowBarGeo, glowBarMat);
      glowBar.position.set(0, 0.22, 0.22);
      clipBox.add(glowBar);

      const lCanvas = document.createElement('canvas');
      lCanvas.width = 256;
      lCanvas.height = 64;
      const lCtx = lCanvas.getContext('2d');
      lCtx.fillStyle = 'rgba(0,0,0,0)';
      lCtx.fillRect(0, 0, 256, 64);
      lCtx.fillStyle = '#ffffff';
      lCtx.font = 'bold 28px "Plus Jakarta Sans", monospace';
      lCtx.textAlign = 'center';
      lCtx.textBaseline = 'middle';
      lCtx.fillText(clipLabels[i], 128, 32);

      const lTex = new THREE.CanvasTexture(lCanvas);
      const lGeo = new THREE.PlaneGeometry(clipWidth - 0.2, 0.25);
      const lMat = new THREE.MeshBasicMaterial({ map: lTex, transparent: true });
      const lMesh = new THREE.Mesh(lGeo, lMat);
      lMesh.position.set(0, 0, 0.31);
      clipBox.add(lMesh);

      timelineGroup.add(clipBox);
    }

    const playheadGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 16);
    const playheadMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    timelinePlayhead = new THREE.Mesh(playheadGeo, playheadMat);
    timelinePlayhead.position.set(startX, 0.2, 0.4);
    timelineGroup.add(timelinePlayhead);

    const haloGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
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
      { img: 'assets/images/proj_bmw.jpg', title: 'BMW M4 AI Cinematic Video', pos: [4.2, 3.4, 1.4], rotY: -0.25 },
      { img: 'assets/images/thumb_ugc_canada.jpg', title: 'Canada UGC Ad', pos: [3.8, 1.5, 2.8], rotY: -0.35 }
    ];

    const texLoader = new THREE.TextureLoader();

    projects.forEach((proj, idx) => {
      const frameGroup = new THREE.Group();
      frameGroup.position.set(...proj.pos);
      frameGroup.rotation.y = proj.rotY;

      const frameGeo = new THREE.BoxGeometry(2.1, 1.25, 0.08);
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x0f1118,
        roughness: 0.3,
        metalness: 0.85
      });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameGroup.add(frameMesh);

      const imgGeo = new THREE.PlaneGeometry(1.95, 1.1);
      const texture = texLoader.load(proj.img);
      const imgMat = new THREE.MeshBasicMaterial({ map: texture });
      const imgMesh = new THREE.Mesh(imgGeo, imgMat);
      imgMesh.position.z = 0.045;
      frameGroup.add(imgMesh);

      const glassGeo = new THREE.PlaneGeometry(1.95, 1.1);
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.15
      });
      const glassMesh = new THREE.Mesh(glassGeo, glassMat);
      glassMesh.position.z = 0.05;
      frameGroup.add(glassMesh);

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
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = Math.random() * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.035,
      transparent: true,
      opacity: 0.45
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);
  }

  /* -------------------------------------------------------------------------
     PROCEDURAL VIDEO EDITING NLE CANVAS RENDERER
  ------------------------------------------------------------------------- */
  let playheadX = 380;
  function updateMonitorNLECanvas(time) {
    if (!monitorCtx) return;
    const w = 1024;
    const h = 512;

    monitorCtx.fillStyle = '#080a10';
    monitorCtx.fillRect(0, 0, w, h);

    monitorCtx.fillStyle = '#111420';
    monitorCtx.fillRect(0, 0, w, 32);

    monitorCtx.fillStyle = '#94a3b8';
    monitorCtx.font = '12px monospace';
    monitorCtx.fillText('BMW_M4_UNDERGROUND_CINEMATIC_V04.prproj', 16, 21);
    monitorCtx.fillText('24.00 fps • 3840x2160 • Apple ProRes 422 HQ', 360, 21);

    const hours = '00';
    const mins = '01';
    const secs = String(Math.floor((time * 24) % 60)).padStart(2, '0');
    const frames = String(Math.floor((time * 48) % 24)).padStart(2, '0');
    monitorCtx.fillStyle = '#38bdf8';
    monitorCtx.font = 'bold 14px monospace';
    monitorCtx.fillText(`TC: ${hours}:${mins}:${secs}:${frames}`, 840, 21);

    monitorCtx.fillStyle = '#0d101a';
    monitorCtx.fillRect(8, 40, 260, 250);

    monitorCtx.fillStyle = '#64748b';
    monitorCtx.font = 'bold 11px monospace';
    monitorCtx.fillText('PROJECT BIN [BMW M4 4K RAW]', 16, 58);

    const binClips = [
      { name: 'BMW_M4_UNDERGROUND_01.MP4', col: '#38bdf8' },
      { name: 'VOLUMETRIC_FOG_PASS_3D.EXR', col: '#60a5fa' },
      { name: 'TWIN_TURBO_EXHAUST_SFX.WAV', col: '#0284c7' },
      { name: 'ANAMORPHIC_FLARE_VFX.MOV', col: '#0ea5e9' },
      { name: 'BMWM4_TEAL_MAGENTA_LUT.CUBE', col: '#38bdf8' }
    ];

    binClips.forEach((c, idx) => {
      monitorCtx.fillStyle = '#151928';
      monitorCtx.fillRect(16, 70 + idx * 36, 244, 28);
      monitorCtx.fillStyle = c.col;
      monitorCtx.fillRect(16, 70 + idx * 36, 4, 28);
      monitorCtx.fillStyle = '#e2e8f0';
      monitorCtx.font = '10px monospace';
      monitorCtx.fillText(c.name, 28, 88 + idx * 36);
    });

    monitorCtx.fillStyle = '#040508';
    monitorCtx.fillRect(276, 40, 480, 250);

    // Draw live BMW M4 video frame directly into the 3D Premiere Pro Program Monitor
    if (window.monitorVideoElement && window.monitorVideoElement.readyState >= 2) {
      monitorCtx.drawImage(window.monitorVideoElement, 276, 40, 480, 250);
    } else if (window.monitorProjectImage && window.monitorProjectImage.complete) {
      monitorCtx.drawImage(window.monitorProjectImage, 276, 40, 480, 250);
    } else {
      monitorCtx.fillStyle = '#0f172a';
      monitorCtx.fillRect(276, 40, 480, 250);
      monitorCtx.fillStyle = '#38bdf8';
      monitorCtx.font = 'bold 14px monospace';
      monitorCtx.fillText('LOADING BMW M4 4K SEQUENCE...', 380, 165);
    }

    monitorCtx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    monitorCtx.lineWidth = 1;
    monitorCtx.strokeRect(300, 55, 432, 220);

    monitorCtx.fillStyle = '#0d101a';
    monitorCtx.fillRect(764, 40, 252, 250);
    monitorCtx.fillStyle = '#64748b';
    monitorCtx.font = 'bold 11px monospace';
    monitorCtx.fillText('AUDIO MASTER [LUFS -14.0]', 774, 58);

    for (let bar = 0; bar < 8; bar++) {
      const barHeight = 60 + Math.sin(time * 8 + bar * 0.8) * 45 + Math.random() * 25;
      const bX = 774 + bar * 30;

      const grad = monitorCtx.createLinearGradient(0, 280, 0, 80);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.7, '#38bdf8');
      grad.addColorStop(1, '#ffffff');

      monitorCtx.fillStyle = grad;
      monitorCtx.fillRect(bX, 280 - barHeight, 20, barHeight);
    }

    monitorCtx.fillStyle = '#0f121d';
    monitorCtx.fillRect(8, 298, 1008, 206);

    monitorCtx.fillStyle = '#161b2b';
    monitorCtx.fillRect(8, 298, 1008, 22);

    monitorCtx.fillStyle = '#64748b';
    monitorCtx.font = '10px monospace';
    for (let r = 0; r < 10; r++) {
      monitorCtx.fillText(`00:0${r}:00:00`, 30 + r * 100, 314);
      monitorCtx.fillRect(30 + r * 100, 316, 1, 4);
    }

    // Video Track V3 (Titles & Motion)
    monitorCtx.fillStyle = '#0284c7';
    monitorCtx.fillRect(120, 326, 260, 26);
    monitorCtx.fillStyle = '#0ea5e9';
    monitorCtx.fillRect(410, 326, 320, 26);
    monitorCtx.fillStyle = '#ffffff';
    monitorCtx.font = 'bold 9px monospace';
    monitorCtx.fillText('V3: 3D MOTION LOWER THIRDS', 130, 343);
    monitorCtx.fillText('V3: VFX GLOW PARTICLES', 420, 343);

    // Video Track V2 (B-Roll)
    monitorCtx.fillStyle = '#38bdf8';
    monitorCtx.fillRect(30, 356, 350, 28);
    monitorCtx.fillStyle = '#60a5fa';
    monitorCtx.fillRect(400, 356, 440, 28);
    monitorCtx.fillStyle = '#040508';
    monitorCtx.font = 'bold 9px monospace';
    monitorCtx.fillText('V2: B-ROLL 4K 120FPS SLOWMO', 40, 374);
    monitorCtx.fillText('V2: CINEMATIC TRAILER HOOK CUT', 410, 374);

    // Video Track V1 (Main A-Roll)
    monitorCtx.fillStyle = '#1e293b';
    monitorCtx.fillRect(30, 388, 920, 28);
    monitorCtx.fillStyle = '#ffffff';
    monitorCtx.fillText('V1: A-ROLL INTERVIEW STORYLINE [MASTER CUT]', 40, 406);

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

    playheadX = 140 + (time * 65) % 800;
    monitorCtx.fillStyle = '#38bdf8';
    monitorCtx.fillRect(playheadX, 298, 2, 206);
    monitorCtx.beginPath();
    monitorCtx.moveTo(playheadX - 6, 298);
    monitorCtx.lineTo(playheadX + 8, 298);
    monitorCtx.lineTo(playheadX + 1, 310);
    monitorCtx.fill();

    monitorTexture.needsUpdate = true;
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
  }

  /* -------------------------------------------------------------------------
     WINDOW RESIZE
  ------------------------------------------------------------------------- */
  function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    isMobile = window.innerWidth <= 768;
  }

  /* -------------------------------------------------------------------------
     ANIMATION & RENDER LOOP
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
      posY: isMobile ? 4.0 : 3.5,
      posZ: isMobile ? 17.5 : 14,
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
    const posY = (typeof st.posY === 'number' && !isNaN(st.posY)) ? st.posY : (isMobile ? 4.0 : 3.5);
    const posZ = (typeof st.posZ === 'number' && !isNaN(st.posZ)) ? st.posZ : (isMobile ? 17.5 : 14);

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
      frame.group.position.y = frame.baseY + Math.sin(elapsedTime * frame.speed + frame.phase) * 0.12;
      frame.group.rotation.x = Math.sin(elapsedTime * 0.8 + frame.phase) * 0.05;
    });

    if (monitorLight) {
      monitorLight.color.setHex(0x38bdf8);
      monitorLight.intensity = 2.4 + Math.sin(elapsedTime * 3) * 0.3;
    }

    renderer.render(scene, camera);
  }

})();
