import React, { useRef, useEffect, useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';

interface Particle {
  originX: number;
  originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  isDispersed: boolean;
  alpha: number;
}

export const HumanPointerCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [erasedCount, setErasedCount] = useState(0);
  const particlesRef = useRef<Particle[]>([]);
  const isInteractingRef = useRef(false);

  // Colors matching Dala + ThoughtLab + Auros palette
  const colors = ['#8052ff', '#22d3ee', '#ffb829', '#ffffff', '#a855f7'];

  const initHumanParticles = (width: number, height: number) => {
    const pts: Particle[] = [];
    const centerX = width * 0.58;
    const centerY = height * 0.52;
    const scale = Math.min(width, height) * 0.0034;

    // Helper to add density clustered particles
    const addCluster = (baseX: number, baseY: number, radiusX: number, radiusY: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random());
        const px = baseX + Math.cos(angle) * radiusX * r;
        const py = baseY + Math.sin(angle) * radiusY * r;
        pts.push({
          originX: px,
          originY: py,
          x: px,
          y: py,
          vx: 0,
          vy: 0,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 2.2 + 1.2,
          isDispersed: false,
          alpha: Math.random() * 0.4 + 0.6,
        });
      }
    };

    // 1. Head & Face profile
    addCluster(centerX, centerY - 85 * scale, 22 * scale, 26 * scale, 120);

    // 2. Neck
    addCluster(centerX - 2 * scale, centerY - 55 * scale, 10 * scale, 10 * scale, 35);

    // 3. Torso & Shoulders
    addCluster(centerX + 6 * scale, centerY - 15 * scale, 32 * scale, 40 * scale, 240);
    addCluster(centerX + 10 * scale, centerY + 30 * scale, 26 * scale, 32 * scale, 180);

    // 4. Left Arm extended to the LEFT pointing forward with index finger
    // Upper Arm
    for (let t = 0; t <= 1; t += 0.05) {
      const armX = (centerX - 20 * scale) - t * 45 * scale;
      const armY = (centerY - 35 * scale) + t * 4 * scale;
      addCluster(armX, armY, 8 * scale, 8 * scale, 15);
    }

    // Forearm extending sharply LEFT toward the hero text
    for (let t = 0; t <= 1; t += 0.04) {
      const forearmX = (centerX - 65 * scale) - t * 75 * scale;
      const forearmY = (centerY - 31 * scale) - t * 14 * scale;
      addCluster(forearmX, forearmY, 6 * scale, 6 * scale, 18);
    }

    // Hand & Pointing Index Finger directed sharply at the text
    const handX = centerX - 140 * scale;
    const handY = centerY - 45 * scale;
    addCluster(handX, handY, 7 * scale, 7 * scale, 30);

    // Extended Index Finger Line + Pointer Glow
    for (let t = 0; t <= 1; t += 0.08) {
      const fingerX = handX - t * 36 * scale;
      const fingerY = handY - t * 6 * scale;
      addCluster(fingerX, fingerY, 3 * scale, 3 * scale, 12);
    }
    // Fingertip energy pulse
    addCluster(handX - 38 * scale, handY - 6 * scale, 10 * scale, 10 * scale, 45);

    // 5. Right Arm (relaxed at side)
    for (let t = 0; t <= 1; t += 0.06) {
      const rArmX = (centerX + 32 * scale) + t * 12 * scale;
      const rArmY = (centerY - 30 * scale) + t * 55 * scale;
      addCluster(rArmX, rArmY, 7 * scale, 7 * scale, 14);
    }

    // 6. Lower Body / Pelvis
    addCluster(centerX + 12 * scale, centerY + 75 * scale, 24 * scale, 22 * scale, 120);

    // 7. Ambient halo particles around the pointing finger creating laser-like focus
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 45 * scale;
      pts.push({
        originX: handX - 38 * scale + Math.cos(angle) * dist,
        originY: handY - 6 * scale + Math.sin(angle) * dist,
        x: handX - 38 * scale + Math.cos(angle) * dist,
        y: handY - 6 * scale + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        color: '#22d3ee',
        size: Math.random() * 1.8 + 1,
        isDispersed: false,
        alpha: Math.random() * 0.5 + 0.3,
      });
    }

    particlesRef.current = pts;
    setErasedCount(0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 580;
    let height = 580;

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      initHumanParticles(width, height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Erase / disperse particles near the cursor
    const disperseAt = (clientX: number, clientY: number) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;
      const eraseRadius = 55;

      let newlyErased = 0;

      for (const p of particlesRef.current) {
        if (!p.isDispersed) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const dist = Math.hypot(dx, dy);

          if (dist < eraseRadius) {
            p.isDispersed = true;
            newlyErased++;
            const force = (1 - dist / eraseRadius) * 12 + 3;
            const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.8;
            p.vx = Math.cos(angle) * force + (Math.random() - 0.5) * 4;
            p.vy = Math.sin(angle) * force - Math.random() * 6; // Float upwards
          }
        }
      }

      if (newlyErased > 0) {
        const totalDispersed = particlesRef.current.filter(p => p.isDispersed).length;
        setErasedCount(Math.round((totalDispersed / particlesRef.current.length) * 100));
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      disperseAt(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        disperseAt(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onMouseDown = () => {
      isInteractingRef.current = true;
    };
    const onMouseUp = () => {
      isInteractingRef.current = false;
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Connect filaments between close active particles for cyber-mesh aesthetic
      const active = particlesRef.current.filter(p => !p.isDispersed);
      ctx.lineWidth = 0.5;
      for (let i = 0; i < active.length; i += 3) {
        const p1 = active[i];
        for (let j = i + 1; j < Math.min(i + 5, active.length); j++) {
          const p2 = active[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 22) {
            const alpha = (1 - dist / 22) * 0.25;
            ctx.strokeStyle = `rgba(128, 82, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Render pointing laser ray from index fingertip
      const fingerTip = particlesRef.current.find(p => !p.isDispersed && p.originX < width * 0.2);
      if (fingerTip) {
        const grad = ctx.createLinearGradient(fingerTip.x, fingerTip.y, 0, fingerTip.y);
        grad.addColorStop(0, 'rgba(34, 211, 238, 0.7)');
        grad.addColorStop(1, 'rgba(128, 82, 255, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(fingerTip.x, fingerTip.y);
        ctx.lineTo(0, fingerTip.y);
        ctx.stroke();
      }

      // Draw each particle
      for (const p of particlesRef.current) {
        if (p.isDispersed) {
          // Physics: velocity + gravity + friction + fade
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.08; // subtle gravity
          p.vx *= 0.96; // air friction
          p.vy *= 0.96;
          p.alpha *= 0.97; // fade out
        } else {
          // Micro breathing jitter
          p.x += (p.originX - p.x) * 0.1 + (Math.random() - 0.5) * 0.3;
          p.y += (p.originY - p.y) * 0.1 + (Math.random() - 0.5) * 0.3;
        }

        if (p.alpha > 0.02) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const handleRemanifest = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      initHumanParticles(rect.width, rect.height);
    }
  };

  return (
    <div className="relative w-full max-w-[560px] aspect-square flex flex-col items-center justify-center group select-none">
      {/* Background glow */}
      <div className="absolute inset-0 bg-radial-gradient from-iris/15 via-transparent to-transparent pointer-events-none rounded-full blur-3xl" />

      {/* Interactive Human Pointer Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair active:cursor-grabbing"
      />

      {/* Floating Interaction Pill / Reset trigger */}
      <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-3 pointer-events-auto">
        <div className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md text-[11px] font-mono text-silver flex items-center gap-2">
          <Sparkles size={13} className="text-cyan animate-spin" style={{ animationDuration: '4s' }} />
          <span>
            {erasedCount > 80
              ? 'Human entity erased into light void'
              : 'Swipe / drag across figure to erase'}
          </span>
          {erasedCount > 0 && (
            <span className="text-iris font-semibold">({erasedCount}%)</span>
          )}
        </div>

        {erasedCount > 0 && (
          <button
            onClick={handleRemanifest}
            className="px-3 py-1.5 rounded-full bg-iris hover:bg-iris-hover text-white text-[11px] font-mono flex items-center gap-1.5 shadow-lg shadow-iris/25 transition-all"
            title="Re-manifest human particle mesh"
          >
            <RefreshCw size={12} />
            <span>Re-manifest</span>
          </button>
        )}
      </div>
    </div>
  );
};
