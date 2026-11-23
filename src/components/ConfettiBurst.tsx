import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  createConfettiParticles,
  stepConfettiParticles,
  type ConfettiParticle,
} from '../utils/roadmapCelebration';

interface ConfettiBurstProps {
  burstKey: number;
  durationMs?: number;
  onComplete?: () => void;
}

export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({
  burstKey,
  durationMs = 3000,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (burstKey <= 0 || typeof window === 'undefined') return;

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      const doneTimer = window.setTimeout(() => {
        onCompleteRef.current?.();
      }, 1500);
      return () => window.clearTimeout(doneTimer);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let particles: ConfettiParticle[] = createConfettiParticles(
      window.innerWidth,
      window.innerHeight,
      115
    );

    let rafId = 0;
    const startTime = performance.now();
    let lastTime = startTime;

    const renderFrame = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const elapsed = now - startTime;
      const fadeProgress =
        elapsed > durationMs * 0.58
          ? (elapsed - durationMs * 0.58) / (durationMs * 0.42)
          : 0;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      particles = stepConfettiParticles(
        particles,
        dt,
        window.innerHeight,
        fadeProgress
      );

      for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.width * 0.42, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        }
        ctx.restore();
      }

      if (elapsed < durationMs && particles.length > 0) {
        rafId = window.requestAnimationFrame(renderFrame);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        onCompleteRef.current?.();
      }
    };

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [burstKey, durationMs]);

  if (burstKey <= 0 || typeof document === 'undefined') return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      data-testid="roadmap-confetti-burst"
      data-burst-key={burstKey}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
    />,
    document.body
  );
};
