/* =========================================================================
   CINEMATIC SCROLL & 5-PHASE TIMELINE ORCHESTRATOR
   Tech: GSAP 3 + ScrollTrigger
   Phases: RAW → CUT → COLOR → MOTION → FINAL
   ========================================================================= */

function checkAndInitScroll() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    setTimeout(checkAndInitScroll, 100);
    return;
  }
  const stage = document.getElementById('studio-stage');
  if (!stage) {
    setTimeout(checkAndInitScroll, 100);
    return;
  }
  initCinematicScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAndInitScroll);
} else {
  checkAndInitScroll();
}
window.addEventListener('load', () => {
  checkAndInitScroll();
  if (typeof ScrollTrigger !== 'undefined') {
    setTimeout(() => { ScrollTrigger.refresh(); }, 300);
  }
});

function initCinematicScroll() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const stage = document.getElementById('studio-stage');
  if (!stage) return;

  if (!window.studioCameraState) {
    window.studioCameraState = {
      posX: 0,
      posY: 3.5,
      posZ: 14,
      lookX: 0,
      lookY: 1.8,
      lookZ: 0,
      playheadProgress: 0,
      colorGradingIntensity: 0,
      motionActive: 0
    };
  }

  const phases = document.querySelectorAll('.story-phase');
  const hudProgress = document.getElementById('hud-progress-fill');
  const hudTc = document.getElementById('hud-timecode');

  // Master GSAP Timeline pinned to #studio-stage
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: '+=4500', // 4500px scroll journey
      scrub: 1.2,
      pin: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        // Update HUD Progress & Timecode
        const prog = self.progress;
        if (hudProgress) hudProgress.style.width = `${prog * 100}%`;
        if (hudTc) {
          const totalFrames = Math.floor(prog * 1440); // 1 minute timeline in 24fps
          const m = String(Math.floor(totalFrames / 1440)).padStart(2, '0');
          const s = String(Math.floor((totalFrames % 1440) / 24)).padStart(2, '0');
          const f = String(totalFrames % 24).padStart(2, '0');
          hudTc.textContent = `00:${m}:${s}:${f}`;
        }
      }
    }
  });

  const isMobile = window.innerWidth <= 768;
  const zScale = isMobile ? 1.25 : 1.0;
  const yOffset = isMobile ? 0.5 : 0.0;

  /* -------------------------------------------------------------------------
     PHASE CHOREOGRAPHY
  ------------------------------------------------------------------------- */
  // PHASE 01 (RAW) -> Initial wide studio
  tl.set(window.studioCameraState, {
    posX: 0,
    posY: 3.5 + yOffset,
    posZ: 14 * zScale,
    lookX: 0,
    lookY: 1.8,
    lookZ: 0,
    playheadProgress: 0.05,
    colorGradingIntensity: 0,
    motionActive: 0
  });

  // PHASE 01 -> PHASE 02 (CUT) - Dolly toward timeline & assemble clips
  tl.to(window.studioCameraState, {
    posX: isMobile ? 0 : -0.8,
    posY: 1.6 + yOffset * 0.5,
    posZ: 8.2 * zScale,
    lookX: 0,
    lookY: 1.0,
    lookZ: 0,
    playheadProgress: 0.28,
    colorGradingIntensity: 0.1,
    duration: 2,
    ease: 'power2.inOut'
  }, 'phase2');

  // PHASE 02 -> PHASE 03 (COLOR) - Angle toward color scopes & warm studio lighting
  tl.to(window.studioCameraState, {
    posX: isMobile ? 1.2 : 2.2,
    posY: 2.2 + yOffset * 0.5,
    posZ: 5.6 * zScale,
    lookX: isMobile ? 0.6 : 1.2,
    lookY: 1.8,
    lookZ: 0,
    playheadProgress: 0.52,
    colorGradingIntensity: 0.9,
    duration: 2,
    ease: 'power2.inOut'
  }, 'phase3');

  // PHASE 03 -> PHASE 04 (MOTION) - Wide dynamic angle, floating VFX project frames glide
  tl.to(window.studioCameraState, {
    posX: isMobile ? -1.2 : -2.4,
    posY: 2.8 + yOffset * 0.5,
    posZ: 4.8 * zScale,
    lookX: isMobile ? 0 : -0.6,
    lookY: 2.2,
    lookZ: 0,
    playheadProgress: 0.76,
    motionActive: 1,
    duration: 2,
    ease: 'power2.inOut'
  }, 'phase4');

  // PHASE 04 -> PHASE 05 (FINAL) - Direct frontal zoom into Main Monitor
  tl.to(window.studioCameraState, {
    posX: 0,
    posY: 2.22,
    posZ: isMobile ? 3.0 : 2.5,
    lookX: 0,
    lookY: 2.2,
    lookZ: 0,
    playheadProgress: 1.0,
    colorGradingIntensity: 1.0,
    duration: 2,
    ease: 'power3.inOut'
  }, 'phase5');

  /* -------------------------------------------------------------------------
     HTML HUD PHASE TEXT ANIMATIONS (Explicit & Safe Transitions)
  ------------------------------------------------------------------------- */
  if (phases[0]) {
    gsap.set(phases[0], { opacity: 1, y: 0, filter: 'blur(0px)', autoAlpha: 1 });
  }
  for (let p = 1; p < phases.length; p++) {
    if (phases[p]) {
      gsap.set(phases[p], { opacity: 0, y: 30, filter: 'blur(8px)', autoAlpha: 0 });
    }
  }

  if (phases[0] && phases[1]) {
    tl.to(phases[0], { opacity: 0, y: -30, filter: 'blur(8px)', autoAlpha: 0, duration: 1.0 }, 'phase2')
      .to(phases[1], { opacity: 1, y: 0, filter: 'blur(0px)', autoAlpha: 1, duration: 1.0 }, 'phase2');
  }

  if (phases[1] && phases[2]) {
    tl.to(phases[1], { opacity: 0, y: -30, filter: 'blur(8px)', autoAlpha: 0, duration: 1.0 }, 'phase3')
      .to(phases[2], { opacity: 1, y: 0, filter: 'blur(0px)', autoAlpha: 1, duration: 1.0 }, 'phase3');
  }

  if (phases[2] && phases[3]) {
    tl.to(phases[2], { opacity: 0, y: -30, filter: 'blur(8px)', autoAlpha: 0, duration: 1.0 }, 'phase4')
      .to(phases[3], { opacity: 1, y: 0, filter: 'blur(0px)', autoAlpha: 1, duration: 1.0 }, 'phase4');
  }

  if (phases[3] && phases[4]) {
    tl.to(phases[3], { opacity: 0, y: -30, filter: 'blur(8px)', autoAlpha: 0, duration: 1.0 }, 'phase5')
      .to(phases[4], { opacity: 1, y: 0, filter: 'blur(0px)', autoAlpha: 1, duration: 1.0 }, 'phase5');
  }

  /* -------------------------------------------------------------------------
     SCROLLTRIGGER FOR REGULAR CONTENT SECTIONS
  ------------------------------------------------------------------------- */
  // Cinematic Project Cards Entrance
  gsap.utils.toArray('.cinematic-project-row').forEach((row, i) => {
    gsap.from(row, {
      scrollTrigger: {
        trigger: row,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      },
      opacity: 0,
      y: 60,
      duration: 1.0,
      ease: 'power3.out',
      delay: i * 0.15
    });
  });

  // Kinetic Typography in Services
  gsap.utils.toArray('.kinetic-service-item').forEach((item) => {
    gsap.from(item, {
      scrollTrigger: {
        trigger: item,
        start: 'top 90%',
        toggleActions: 'play none none reverse'
      },
      opacity: 0,
      x: -40,
      duration: 0.8,
      ease: 'power2.out'
    });
  });
}
