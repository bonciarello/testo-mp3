import { useEffect, useRef } from 'react';

/**
 * WaveformVisualizer — the signature visual element.
 * Renders an animated canvas waveform that pulses during playback.
 * Uses requestAnimationFrame with transform/opacity for smooth 60fps.
 */
export default function WaveformVisualizer({ active = false, bars = 48 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const barWidth = 3;
    const gap = 2;
    const totalWidth = bars * (barWidth + gap) - gap;

    const draw = (timestamp) => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const startX = (w - totalWidth) / 2;
      const midY = h / 2;
      const speed = 0.0015;

      for (let i = 0; i < bars; i++) {
        // Create a wave pattern through the bars
        const phi = (i / bars) * Math.PI * 2 + phaseRef.current;
        let amplitude = Math.sin(phi * 3) * 0.5 + 0.5;

        if (!active) {
          amplitude *= 0.15; // Muted when inactive
        }

        // Add some randomness to make it look organic
        const noise = Math.sin(i * 0.7 + timestamp * 0.003) * 0.1;
        amplitude = Math.max(0.08, amplitude + noise);

        const barHeight = Math.max(4, h * 0.8 * amplitude);
        const x = startX + i * (barWidth + gap);
        const y = midY - barHeight / 2;

        // Gradient fill for each bar
        const gradient = ctx.createLinearGradient(x, midY - barHeight / 2, x, midY + barHeight / 2);
        const alpha = 0.4 + amplitude * 0.55;
        gradient.addColorStop(0, `rgba(37, 99, 235, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(124, 58, 237, ${alpha * 0.9})`);
        gradient.addColorStop(1, `rgba(37, 99, 235, ${alpha})`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        const r = barWidth / 2;
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, r);
        } else {
          // Fallback for older browsers
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + barWidth - r, y);
          ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
          ctx.lineTo(x + barWidth, y + barHeight - r);
          ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - r, y + barHeight);
          ctx.lineTo(x + r, y + barHeight);
          ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
        }
        ctx.fill();
      }

      phaseRef.current += speed * (active ? 2.5 : 0.6);
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, bars]);

  return (
    <div className="waveform-container" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="waveform-canvas"
        role="presentation"
      />
      {active && <span className="waveform-label">In riproduzione</span>}
    </div>
  );
}
