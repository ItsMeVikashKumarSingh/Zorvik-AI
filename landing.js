/**
 * Zorvik AI — Flagship Landing Page Interactive Engine
 * Features:
 * 1. 3D Neural Particle Constellation Engine (HTML5 Canvas)
 * 2. Background Ambient Drifting Star Dust Field (Dala Aesthetic)
 * 3. Dual-Intent Intelligence Switcher (GenZ vs. Complex Code)
 * 4. Zorvik Enterprise API Code Snippet Switcher & Copy
 * 5. Smooth Scroll & Navbar Transitions
 */

(function () {
  "use strict";

  // Initialize on DOM Ready
  document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
    initConstellationCanvas();
    initAmbientDustCanvas();
    initIntentShowcase();
    initCodeTerminal();
    initNavbarScroll();
    initAccentSwitcher();
    initScrollReveal();
  });

  /* ==========================================================================
     1. 3D NEURAL PARTICLE CONSTELLATION ENGINE
     Matches Dala signature neural brain / constellation orb (media_1787828378219.png)
     ========================================================================== */
  function initConstellationCanvas() {
    const canvas = document.getElementById("neuralConstellationCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    let width = 580;
    let height = 580;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width || 580;
      height = rect.height || 580;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }
    resizeCanvas();
    window.addEventListener("resize", () => {
      dpr = window.devicePixelRatio || 1;
      resizeCanvas();
    });

    // Multi-chromatic palette matching media_1787828378219.png
    const chromaticColors = [
      "rgba(139, 92, 246, ",  // Electric Iris / Violet
      "rgba(34, 211, 238, ",  // Neon Cyan / Turquoise
      "rgba(245, 158, 11, ",  // Saffron / Golden Amber
      "rgba(244, 63, 94, ",   // Hot Magenta / Coral Rose
      "rgba(56, 189, 248, ",  // Sky Blue
      "rgba(168, 85, 247, ",  // Bright Purple
    ];

    const PARTICLE_COUNT = 620;
    const SPHERE_RADIUS = 205;
    const particles = [];

    // Fibonacci sphere distribution with organic lobe perturbation
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      // Organic dual-lobe brain contour modulation
      const lobeWarp = 1 + 0.12 * Math.sin(phi * 3) * Math.cos(theta * 2);
      // Subtle depth dispersion (mantle layer)
      const depthJitter = 0.88 + Math.random() * 0.22;
      const r = SPHERE_RADIUS * lobeWarp * depthJitter;

      const bx = r * Math.sin(phi) * Math.cos(theta);
      const by = r * Math.cos(phi);
      const bz = r * Math.sin(phi) * Math.sin(theta);

      particles.push({
        baseX: bx,
        baseY: by,
        baseZ: bz,
        colorPrefix: chromaticColors[i % chromaticColors.length],
        size: 1.8 + Math.random() * 2.4,
        rotationOffset: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.025,
        pulsePhase: Math.random() * Math.PI * 2,
        neighbors: [],
      });
    }

    // Precalculate 3D spatial neighbors for 60fps synaptic wireframe
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      const candidates = [];
      for (let j = 0; j < particles.length; j++) {
        if (i === j) continue;
        const p2 = particles[j];
        const dx = p1.baseX - p2.baseX;
        const dy = p1.baseY - p2.baseY;
        const dz = p1.baseZ - p2.baseZ;
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < 2800) {
          candidates.push({ index: j, distSq });
        }
      }
      candidates.sort((a, b) => a.distSq - b.distSq);
      p1.neighbors = candidates.slice(0, 4).map((c) => c.index);
    }

    // Ambient space dust & outer bokeh motes (matching media_1787828378219.png)
    const AMBIENT_COUNT = 38;
    const ambientParticles = [];
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dist = SPHERE_RADIUS * (1.35 + Math.random() * 1.2);
      const isBokeh = i < 5;
      ambientParticles.push({
        x: dist * Math.sin(phi) * Math.cos(theta),
        y: dist * Math.cos(phi),
        z: dist * Math.sin(phi) * Math.sin(theta),
        colorPrefix: chromaticColors[i % chromaticColors.length],
        size: isBokeh ? 4.5 + Math.random() * 5.5 : 1.0 + Math.random() * 1.8,
        isBokeh,
        driftSpeedX: (Math.random() - 0.5) * 0.15,
        driftSpeedY: (Math.random() - 0.5) * 0.15,
        alphaBase: isBokeh ? 0.22 : 0.45,
      });
    }

    // Interactive mouse rotation and gravity inertia
    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0.0028;
    let targetRotX = 0.0008;
    let currentRotY = 0.0028;
    let currentRotX = 0.0008;

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      mouseX = x / (rect.width / 2);
      mouseY = y / (rect.height / 2);
      targetRotY = mouseX * 0.02;
      targetRotX = -mouseY * 0.02;
    });

    canvas.addEventListener("mouseleave", () => {
      targetRotY = 0.0028;
      targetRotX = 0.0008;
    });

    let angleY = 0;
    let angleX = 0;
    let isVisible = true;

    document.addEventListener("visibilitychange", () => {
      isVisible = !document.hidden;
    });

    function drawEquilateralTriangle(context, cx, cy, size, angle, strokeColor, fillColor) {
      context.save();
      context.translate(cx, cy);
      context.rotate(angle);
      context.beginPath();
      context.moveTo(0, -size);
      context.lineTo(size * 0.866, size * 0.5);
      context.lineTo(-size * 0.866, size * 0.5);
      context.closePath();
      if (fillColor) {
        context.fillStyle = fillColor;
        context.fill();
      }
      context.strokeStyle = strokeColor;
      context.lineWidth = 0.9;
      context.stroke();
      context.restore();
    }

    function renderLoop() {
      if (!isVisible) {
        requestAnimationFrame(renderLoop);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      currentRotY += (targetRotY - currentRotY) * 0.05;
      currentRotX += (targetRotX - currentRotX) * 0.05;
      angleY += currentRotY;
      angleX += currentRotX;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const fov = 480;
      const centerX = width / 2;
      const centerY = height / 2;

      // Project ambient particles
      for (let i = 0; i < ambientParticles.length; i++) {
        const ap = ambientParticles[i];
        ap.x += ap.driftSpeedX;
        ap.y += ap.driftSpeedY;

        const x1 = ap.x * cosY - ap.z * sinY;
        const z1 = ap.z * cosY + ap.x * sinY;
        const y1 = ap.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + ap.y * sinX;

        const scale = fov / (fov + z2 + 300);
        const px = centerX + x1 * scale;
        const py = centerY + y1 * scale;

        if (px < -20 || px > width + 20 || py < -20 || py > height + 20) continue;

        if (ap.isBokeh) {
          const grad = ctx.createRadialGradient(px, py, 0, px, py, ap.size * scale);
          grad.addColorStop(0, ap.colorPrefix + (ap.alphaBase * 0.8) + ")");
          grad.addColorStop(0.6, ap.colorPrefix + (ap.alphaBase * 0.3) + ")");
          grad.addColorStop(1, ap.colorPrefix + "0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, ap.size * scale, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = ap.colorPrefix + (ap.alphaBase * Math.min(1, scale)) + ")";
          ctx.beginPath();
          ctx.arc(px, py, ap.size * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Project sphere particles
      const projected = [];
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const x1 = p.baseX * cosY - p.baseZ * sinY;
        const z1 = p.baseZ * cosY + p.baseX * sinY;
        const y1 = p.baseY * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.baseY * sinX;

        const scale = fov / (fov + z2 + 280);
        const px = centerX + x1 * scale;
        const py = centerY + y1 * scale;
        const alpha = Math.min(1, Math.max(0.14, (z2 + SPHERE_RADIUS) / (SPHERE_RADIUS * 2)));

        p.pulsePhase += p.pulseSpeed;
        const dynamicSize = p.size * scale * (0.88 + 0.24 * Math.sin(p.pulsePhase));

        projected.push({
          index: i,
          px,
          py,
          pz: z2,
          scale,
          alpha,
          dynamicSize,
          colorPrefix: p.colorPrefix,
          rotation: p.rotationOffset + angleY,
          neighbors: p.neighbors,
        });
      }

      // Draw faint synaptic filaments
      ctx.lineWidth = 0.65;
      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i];
        if (p1.alpha < 0.22) continue;

        for (let k = 0; k < p1.neighbors.length; k++) {
          const neighborIdx = p1.neighbors[k];
          if (neighborIdx <= i) continue;
          const p2 = projected[neighborIdx];
          if (!p2 || p2.alpha < 0.22) continue;

          const dx = p1.px - p2.px;
          const dy = p1.py - p2.py;
          const distSq = dx * dx + dy * dy;

          if (distSq < 2600) {
            const lineAlpha = (1 - distSq / 2600) * 0.22 * Math.min(p1.alpha, p2.alpha);
            ctx.strokeStyle = p1.colorPrefix + lineAlpha + ")";
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.stroke();
          }
        }
      }

      // Draw particles sorted by depth
      projected.sort((a, b) => a.pz - b.pz);
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const stroke = p.colorPrefix + (p.alpha * 0.95) + ")";
        const fill = p.colorPrefix + (p.alpha * 0.42) + ")";
        drawEquilateralTriangle(ctx, p.px, p.py, p.dynamicSize, p.rotation, stroke, fill);
      }

      requestAnimationFrame(renderLoop);
    }

    requestAnimationFrame(renderLoop);
  }

  /* ==========================================================================
     2. BACKGROUND AMBIENT DRIFTING STAR DUST (Dala Ambient Field)
     ========================================================================== */
  function initAmbientDustCanvas() {
    const canvas = document.getElementById("ambientDustCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });

    const dustCount = 45;
    const dustParticles = [];
    const dustColors = [
      "rgba(128, 82, 255, ",
      "rgba(34, 211, 238, ",
      "rgba(255, 184, 41, ",
    ];

    for (let i = 0; i < dustCount; i++) {
      dustParticles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        color: dustColors[i % dustColors.length],
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    function renderDust() {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < dustParticles.length; i++) {
        const p = dustParticles[i];
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.fillStyle = p.color + p.alpha + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(renderDust);
    }

    requestAnimationFrame(renderDust);
  }

  /* ==========================================================================
     3. DUAL-INTENT INTELLIGENCE SHOWCASE (GenZ vs. Complex Code)
     ========================================================================== */
  function initIntentShowcase() {
    const tabGenz = document.getElementById("tabGenz");
    const tabCode = document.getElementById("tabCode");
    const display = document.getElementById("intentDisplay");

    if (!tabGenz || !tabCode || !display) return;

    const demos = {
      genz: {
        user: "bro really pushed to master on friday 5pm with no tests and went offline 💀💅",
        meta: "Zorvik AI • Casual Mode • 36ms",
        response: "nah that's actually generational criminal behavior lowkey 😭🙏 blud left a live hand grenade in production and went into witness protection. one unhandled promise rejection and the whole company's weekend is permanently cooked on god 🍳💀",
      },
      code: {
        user: "Implement a high-performance token bucket rate limiter in TypeScript with sliding expiration.",
        meta: "Zorvik AI • Engineering Mode • 44ms",
        codeSnippet: `export class TokenBucketLimiter {
  private tokens: number;
  private lastRefillTimestamp: number;

  constructor(
    private readonly capacity: number,
    private readonly refillRatePerSecond: number
  ) {
    this.tokens = capacity;
    this.lastRefillTimestamp = Date.now();
  }

  tryConsume(tokensToConsume = 1): boolean {
    this.refill();
    if (this.tokens >= tokensToConsume) {
      this.tokens -= tokensToConsume;
      return true; // Request admitted
    }
    return false; // Rate limit exceeded
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;
    const tokensToAdd = elapsedSeconds * this.refillRatePerSecond;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTimestamp = now;
  }
}`,
      },
    };

    function renderDemo(mode) {
      const data = demos[mode];
      if (mode === "genz") {
        display.innerHTML = `
          <div class="chat-bubble-preview user">
            <div class="bubble-meta">USER PROMPT</div>
            <div class="bubble-text">"${data.user}"</div>
          </div>
          <div class="chat-bubble-preview ai">
            <div class="bubble-meta"><span class="meta-tag">ZORVIK AI</span> · ${data.meta}</div>
            <div class="bubble-text">${data.response}</div>
          </div>
        `;
      } else {
        display.innerHTML = `
          <div class="chat-bubble-preview user">
            <div class="bubble-meta">USER PROMPT</div>
            <div class="bubble-text">"${data.user}"</div>
          </div>
          <div class="chat-bubble-preview ai">
            <div class="bubble-meta"><span class="meta-tag cyan">ZORVIK ENGINE</span> · ${data.meta}</div>
            <pre style="margin-top:8px;font-family:var(--font-mono);font-size:13px;color:#a5f3fc;overflow-x:auto;"><code>${escapeHtml(data.codeSnippet)}</code></pre>
          </div>
        `;
      }
    }

    function escapeHtml(str) {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    renderDemo("genz");

    tabGenz.addEventListener("click", () => {
      tabGenz.classList.add("active");
      tabCode.classList.remove("active");
      renderDemo("genz");
    });

    tabCode.addEventListener("click", () => {
      tabCode.classList.add("active");
      tabGenz.classList.remove("active");
      renderDemo("code");
    });
  }

  /* ==========================================================================
     4. ZORVIK ENTERPRISE API CODE TABS & CLIPBOARD
     ========================================================================== */
  function initCodeTerminal() {
    const tabs = document.querySelectorAll(".terminal-tab");
    const codeElem = document.getElementById("codeSnippetContent");
    const copyBtn = document.getElementById("copyCodeBtn");
    const copyText = document.getElementById("copyText");

    if (!codeElem || !copyBtn) return;

    const snippets = {
      curl: `curl -X POST https://ai.zorviktech.com/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ZORVIK_ENTERPRISE_KEY" \\
  -d '{
    "prompt": "Analyze dataset variance and draft production recommendations",
    "mode": "analytical"
  }'`,
      javascript: `// Node.js 18+ / Browser Fetch
const response = await fetch("https://ai.zorviktech.com/api/v1/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ZORVIK_ENTERPRISE_KEY"
  },
  body: JSON.stringify({
    prompt: "Analyze dataset variance and draft production recommendations",
    mode: "analytical"
  })
});

const data = await response.json();
console.log(data.response);`,
      python: `# Python 3.9+ with requests
import requests

url = "https://ai.zorviktech.com/api/v1/chat"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ZORVIK_ENTERPRISE_KEY"
}
payload = {
    "prompt": "Analyze dataset variance and draft production recommendations",
    "mode": "analytical"
}

res = requests.post(url, json=payload, headers=headers)
print(res.json()["response"])`,
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const lang = tab.getAttribute("data-lang");
        if (snippets[lang]) {
          codeElem.textContent = snippets[lang];
          codeElem.className = lang === "curl" ? "language-bash" : `language-${lang}`;
          if (window.Prism) {
            window.Prism.highlightElement(codeElem);
          }
        }
      });
    });

    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(codeElem.textContent);
        copyText.textContent = "Copied!";
        setTimeout(() => {
          copyText.textContent = "Copy";
        }, 2000);
      } catch {
        copyText.textContent = "Failed";
      }
    });
  }

  /* ==========================================================================
     5. NAVBAR SCROLL BLUR EFFECT
     ========================================================================== */
  function initNavbarScroll() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    window.addEventListener("scroll", () => {
      if (window.scrollY > 20) {
        navbar.style.background = "rgba(0, 0, 0, 0.88)";
        navbar.style.borderBottomColor = "rgba(255, 255, 255, 0.12)";
      } else {
        navbar.style.background = "rgba(0, 0, 0, 0.75)";
        navbar.style.borderBottomColor = "rgba(255, 255, 255, 0.08)";
      }
    });
  }

  /* ==========================================================================
     6. THOUGHTLAB / DALA ACCENT SWITCHER
     ========================================================================== */
  function initAccentSwitcher() {
    const switcher = document.getElementById("accentSwitcher");
    if (!switcher) return;

    const btns = switcher.querySelectorAll(".accent-btn");
    const saved = localStorage.getItem("zorvik_accent") || "iris";

    function setAccent(accent) {
      btns.forEach((b) => {
        b.classList.toggle("active", b.dataset.accent === accent);
      });
      if (accent === "crimson") {
        document.body.classList.add("theme-crimson");
      } else {
        document.body.classList.remove("theme-crimson");
      }
      localStorage.setItem("zorvik_accent", accent);
      window.dispatchEvent(new CustomEvent("accentchange", { detail: { accent } }));
    }

    setAccent(saved);

    btns.forEach((b) => {
      b.addEventListener("click", () => {
        setAccent(b.dataset.accent);
      });
    });
  }

  /* ==========================================================================
     7. SCROLL-REVEAL OBSERVER ENGINE
     ========================================================================== */
  function initScrollReveal() {
    const targets = document.querySelectorAll('[data-anim="fade-up"]');
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("anim-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("anim-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
  }
})();
