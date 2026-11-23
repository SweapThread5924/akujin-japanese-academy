import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Eraser,
  Eye,
  EyeOff,
  PenTool,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { KanjiCard } from '../data/curriculumData';
import {
  parseSvgStrokePath,
  verifyStrokeAttempt,
  type Point2D,
  type StrokeVerificationResult,
} from '../utils/kanjiStrokeVerifier';
import {
  buildIdealReferenceShape,
  evaluateFullTraceComparison,
  evaluateLiveTracePoint,
  type TraceHapticZone,
} from '../utils/kanjiTraceEvaluator';
import {
  playCardFlipSound,
  playQuizFeedbackSound,
  playSrsRatingSound,
} from '../utils/soundEffects';

export type KanjiPracticeMode = 'stroke-order' | 'precision-trace';

interface KanjiDrawingBoardProps {
  kanji: KanjiCard;
  darkMode: boolean;
  soundEnabled: boolean;
  initialMode?: KanjiPracticeMode;
  deckIndex?: number;
  deckTotal?: number;
  onPrevKanji: () => void;
  onNextKanji: () => void;
  onGainXp: (amount: number) => void;
}

interface VerifiedStrokeRecord {
  strokeIndex: number;
  points: Point2D[];
  accuracyPct: number;
}

interface TraceSegmentPoint extends Point2D {
  zone: TraceHapticZone;
}

interface HapticRipple {
  x: number;
  y: number;
  startMs: number;
  durationMs: number;
  color: string;
  maxRadius: number;
}

const CANVAS_CSS_SIZE = 280;

export const KanjiDrawingBoard: React.FC<KanjiDrawingBoardProps> = ({
  kanji,
  darkMode,
  soundEnabled,
  initialMode = 'stroke-order',
  deckIndex,
  deckTotal,
  onPrevKanji,
  onNextKanji,
  onGainXp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const activePointsRef = useRef<Point2D[]>([]);

  // Practice mode switcher
  const [practiceMode, setPracticeMode] = useState<KanjiPracticeMode>(initialMode);

  // Stroke Order Drill state
  const [verifiedStrokes, setVerifiedStrokes] = useState<VerifiedStrokeRecord[]>([]);
  const [rejectedStroke, setRejectedStroke] = useState<Point2D[] | null>(null);
  const [lastResult, setLastResult] = useState<StrokeVerificationResult | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [showNextHint, setShowNextHint] = useState(true);
  const [xpAwardedForKanjiId, setXpAwardedForKanjiId] = useState<string | null>(null);

  // Precision Trace Mode state & haptic feedback
  const [traceStrokes, setTraceStrokes] = useState<TraceSegmentPoint[][]>([]);
  const activeTraceRef = useRef<TraceSegmentPoint[]>([]);
  const ripplesRef = useRef<HapticRipple[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const lastRippleMsRef = useRef<number>(0);
  const prevZoneRef = useRef<TraceHapticZone | null>(null);

  const [showIdealRef, setShowIdealRef] = useState(true);
  const [liveZone, setLiveZone] = useState<TraceHapticZone | null>(null);
  const [livePrecisionPct, setLivePrecisionPct] = useState<number | null>(null);
  const [hapticMotion, setHapticMotion] = useState<'pulse' | 'nudge' | null>(null);
  const [hapticPulseCount, setHapticPulseCount] = useState(0);
  const [traceXpAwardedId, setTraceXpAwardedId] = useState<string | null>(null);

  const totalStrokes = kanji.strokePaths.length;
  const expectedIndex = verifiedStrokes.length;
  const isStrokeOrderComplete = expectedIndex >= totalStrokes;

  const parsedGuides = useMemo(
    () => kanji.strokePaths.map((d) => parseSvgStrokePath(d)),
    [kanji.strokePaths]
  );

  const idealReference = useMemo(
    () => buildIdealReferenceShape(kanji.strokePaths, 32),
    [kanji.strokePaths]
  );

  // Compute full trace comparison against ideal reference shape
  const traceComparison = useMemo(() => {
    const combined =
      activeTraceRef.current.length > 0
        ? [...traceStrokes, activeTraceRef.current]
        : traceStrokes;
    return evaluateFullTraceComparison(combined, idealReference);
  }, [traceStrokes, idealReference]);

  // Reset board cleanly whenever active Kanji changes
  useEffect(() => {
    isDrawingRef.current = false;
    activePointsRef.current = [];
    activeTraceRef.current = [];
    ripplesRef.current = [];
    prevZoneRef.current = null;
    setVerifiedStrokes([]);
    setRejectedStroke(null);
    setLastResult(null);
    setXpAwardedForKanjiId(null);
    setTraceStrokes([]);
    setLiveZone(null);
    setLivePrecisionPct(null);
    setHapticMotion(null);
    setHapticPulseCount(0);
    setTraceXpAwardedId(null);
  }, [kanji.id]);

  const triggerWrapperHaptic = useCallback((kind: 'pulse' | 'nudge') => {
    setHapticMotion(null);
    requestAnimationFrame(() => {
      setHapticMotion(kind);
    });
    if (kind === 'pulse') {
      setHapticPulseCount((c) => c + 1);
    }
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(kind === 'pulse' ? 8 : [10, 20, 10]);
      }
    } catch {
      // Vibration API optional
    }
  }, []);

  const avgAccuracy = useMemo(() => {
    if (verifiedStrokes.length === 0) return 0;
    const sum = verifiedStrokes.reduce((acc, item) => acc + item.accuracyPct, 0);
    return Math.round(sum / verifiedStrokes.length);
  }, [verifiedStrokes]);

  const drawSmoothPolyline = (
    ctx: CanvasRenderingContext2D,
    points: Point2D[],
    scale: number,
    strokeStyle: string,
    lineWidth: number,
    dashed = false
  ) => {
    if (points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (dashed) {
      ctx.setLineDash([4 * scale, 4 * scale]);
    }
    ctx.beginPath();
    ctx.moveTo(points[0].x * scale, points[0].y * scale);
    for (let i = 1; i < points.length - 1; i++) {
      const midX = ((points[i].x + points[i + 1].x) / 2) * scale;
      const midY = ((points[i].y + points[i + 1].y) / 2) * scale;
      ctx.quadraticCurveTo(
        points[i].x * scale,
        points[i].y * scale,
        midX,
        midY
      );
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x * scale, last.y * scale);
    ctx.stroke();
    ctx.restore();
  };

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const pixelSize = CANVAS_CSS_SIZE * dpr;
    if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
      canvas.width = pixelSize;
      canvas.height = pixelSize;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    const scale = CANVAS_CSS_SIZE / 100;

    // 1. Background surface
    ctx.fillStyle = darkMode ? '#101218' : '#FCFBF8';
    ctx.fillRect(0, 0, CANVAS_CSS_SIZE, CANVAS_CSS_SIZE);

    // 2. Genkouyoushi crosshair & inner guide box
    ctx.save();
    ctx.strokeStyle = darkMode ? 'rgba(161, 161, 170, 0.18)' : 'rgba(120, 113, 108, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_CSS_SIZE / 2, 0);
    ctx.lineTo(CANVAS_CSS_SIZE / 2, CANVAS_CSS_SIZE);
    ctx.moveTo(0, CANVAS_CSS_SIZE / 2);
    ctx.lineTo(CANVAS_CSS_SIZE, CANVAS_CSS_SIZE / 2);
    ctx.stroke();

    ctx.strokeStyle = darkMode ? 'rgba(161, 161, 170, 0.1)' : 'rgba(120, 113, 108, 0.12)';
    ctx.strokeRect(12 * scale, 12 * scale, 76 * scale, 76 * scale);
    ctx.restore();

    if (practiceMode === 'stroke-order') {
      // Stroke Order Mode rendering
      if (showGuide) {
        // Crisp centered ghost character watermark so all 2,136 Jōyō Kanji are authentically traceable
        ctx.save();
        ctx.fillStyle = darkMode
          ? 'rgba(228, 228, 231, 0.14)'
          : 'rgba(20, 20, 19, 0.11)';
        ctx.font = `500 ${Math.round(CANVAS_CSS_SIZE * 0.72)}px "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(kanji.kanji, CANVAS_CSS_SIZE / 2, CANVAS_CSS_SIZE / 2 + 6);
        ctx.restore();

        const ghostColor = darkMode
          ? 'rgba(228, 228, 231, 0.12)'
          : 'rgba(20, 20, 19, 0.10)';
        for (let i = 0; i < parsedGuides.length; i++) {
          drawSmoothPolyline(ctx, parsedGuides[i], scale, ghostColor, 4.4 * scale, false);
        }
      }

      if (showNextHint && !isStrokeOrderComplete && parsedGuides[expectedIndex]) {
        const targetPts = parsedGuides[expectedIndex];
        const hintColor = darkMode
          ? 'rgba(244, 63, 94, 0.45)'
          : 'rgba(217, 37, 37, 0.38)';
        drawSmoothPolyline(ctx, targetPts, scale, hintColor, 2.2 * scale, true);

        const start = targetPts[0];
        const end = targetPts[targetPts.length - 1];
        ctx.save();
        ctx.fillStyle = '#D92525';
        ctx.beginPath();
        ctx.arc(start.x * scale, start.y * scale, 4.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(expectedIndex + 1), start.x * scale, start.y * scale + 0.5);

        if (targetPts.length >= 2) {
          const prev = targetPts[Math.max(0, targetPts.length - 3)];
          const angle = Math.atan2(end.y - prev.y, end.x - prev.x);
          const arrowLen = 7;
          ctx.strokeStyle = '#D92525';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(end.x * scale, end.y * scale);
          ctx.lineTo(
            end.x * scale - arrowLen * Math.cos(angle - Math.PI / 6),
            end.y * scale - arrowLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(end.x * scale, end.y * scale);
          ctx.lineTo(
            end.x * scale - arrowLen * Math.cos(angle + Math.PI / 6),
            end.y * scale - arrowLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
        ctx.restore();
      }

      const inkColor = darkMode ? '#F4F3EF' : '#141413';
      for (const stroke of verifiedStrokes) {
        drawSmoothPolyline(ctx, stroke.points, scale, inkColor, 5.4 * scale, false);
      }

      if (rejectedStroke && rejectedStroke.length >= 2) {
        drawSmoothPolyline(
          ctx,
          rejectedStroke,
          scale,
          'rgba(217, 37, 37, 0.45)',
          4.6 * scale,
          true
        );
      }

      if (activePointsRef.current.length >= 2) {
        drawSmoothPolyline(
          ctx,
          activePointsRef.current,
          scale,
          '#D92525',
          5.6 * scale,
          false
        );
      }
    } else {
      // Precision Trace Mode: Ideal Reference Shape + Coverage Illumination + Haptic Ripples
      const liveCombined =
        activeTraceRef.current.length > 0
          ? [...traceStrokes, activeTraceRef.current]
          : traceStrokes;
      const comparison = evaluateFullTraceComparison(liveCombined, idealReference);

      // A. Ideal Reference Shape blueprint
      if (showIdealRef) {
        const baseRefColor = darkMode
          ? 'rgba(228, 228, 231, 0.16)'
          : 'rgba(20, 20, 19, 0.14)';
        for (let sIdx = 0; sIdx < idealReference.length; sIdx++) {
          const refPts = idealReference[sIdx].points;
          drawSmoothPolyline(ctx, refPts, scale, baseRefColor, 5.2 * scale, false);

          // Highlight matched/covered points along the ideal reference shape
          const flags = comparison.coveredStrokePointFlags[sIdx] ?? [];
          ctx.save();
          ctx.fillStyle = darkMode
            ? 'rgba(16, 185, 129, 0.32)'
            : 'rgba(5, 150, 105, 0.25)';
          for (let pIdx = 0; pIdx < refPts.length; pIdx++) {
            if (flags[pIdx]) {
              ctx.beginPath();
              ctx.arc(refPts[pIdx].x * scale, refPts[pIdx].y * scale, 2.7 * scale, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
        }
      }

      // B. Render user trace strokes colored segment-by-segment by haptic accuracy zone
      const zoneColor = (z: TraceHapticZone): string => {
        if (z === 'locked') return darkMode ? '#34D399' : '#059669';
        if (z === 'close') return '#F59E0B';
        return '#D92525';
      };

      const renderColoredTrace = (pts: TraceSegmentPoint[]) => {
        if (pts.length < 2) return;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 4.6 * scale;
        for (let i = 1; i < pts.length; i++) {
          ctx.strokeStyle = zoneColor(pts[i].zone);
          ctx.beginPath();
          ctx.moveTo(pts[i - 1].x * scale, pts[i - 1].y * scale);
          ctx.lineTo(pts[i].x * scale, pts[i].y * scale);
          ctx.stroke();
        }
        ctx.restore();
      };

      for (const stroke of traceStrokes) {
        renderColoredTrace(stroke);
      }
      if (activeTraceRef.current.length >= 2) {
        renderColoredTrace(activeTraceRef.current);
      }

      // C. Live brush halo when actively tracing
      if (isDrawingRef.current && activeTraceRef.current.length > 0) {
        const tip = activeTraceRef.current[activeTraceRef.current.length - 1];
        const haloColor =
          tip.zone === 'locked'
            ? 'rgba(16, 185, 129, 0.32)'
            : tip.zone === 'close'
              ? 'rgba(245, 158, 11, 0.28)'
              : 'rgba(217, 37, 37, 0.28)';
        ctx.save();
        ctx.fillStyle = haloColor;
        ctx.beginPath();
        ctx.arc(tip.x * scale, tip.y * scale, 7.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // D. Expanding haptic-like visual feedback pulse rings
      const now = performance.now();
      const remainingRipples: HapticRipple[] = [];
      for (const rip of ripplesRef.current) {
        const elapsed = now - rip.startMs;
        if (elapsed < rip.durationMs) {
          const progress = elapsed / rip.durationMs;
          const radius = (4 + progress * rip.maxRadius) * scale;
          const alpha = Math.max(0, 1 - progress);
          ctx.save();
          ctx.strokeStyle = rip.color;
          ctx.globalAlpha = alpha * 0.85;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(rip.x * scale, rip.y * scale, radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          remainingRipples.push(rip);
        }
      }
      ripplesRef.current = remainingRipples;
    }

    ctx.restore();
  }, [
    darkMode,
    expectedIndex,
    idealReference,
    isStrokeOrderComplete,
    parsedGuides,
    practiceMode,
    rejectedStroke,
    showGuide,
    showIdealRef,
    showNextHint,
    traceStrokes,
    verifiedStrokes,
  ]);

  const renderCanvasRef = useRef(renderCanvas);
  renderCanvasRef.current = renderCanvas;

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Manage smooth ripple animation loop only while ripples exist
  const ensureRippleLoop = useCallback(() => {
    if (rafIdRef.current !== null) return;
    const step = () => {
      renderCanvasRef.current();
      if (ripplesRef.current.length > 0) {
        rafIdRef.current = requestAnimationFrame(step);
      } else {
        rafIdRef.current = null;
      }
    };
    rafIdRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const spawnRipple = useCallback(
    (pt: Point2D, color: string, maxRadius = 11) => {
      ripplesRef.current.push({
        x: pt.x,
        y: pt.y,
        startMs: performance.now(),
        durationMs: 380,
        color,
        maxRadius,
      });
      ensureRippleLoop();
    },
    [ensureRippleLoop]
  );

  const toNormalizedPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point2D => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
    const y = ((e.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (practiceMode === 'stroke-order' && isStrokeOrderComplete) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic pointer events may not support capture
    }

    const pt = toNormalizedPoint(e);
    isDrawingRef.current = true;

    if (practiceMode === 'stroke-order') {
      setRejectedStroke(null);
      activePointsRef.current = [pt];
      renderCanvas();
    } else {
      const liveEval = evaluateLiveTracePoint(pt, idealReference);
      setLiveZone(liveEval.zone);
      setLivePrecisionPct(liveEval.precisionPct);
      prevZoneRef.current = liveEval.zone;
      activeTraceRef.current = [{ ...pt, zone: liveEval.zone }];

      if (liveEval.zone === 'locked') {
        lastRippleMsRef.current = performance.now();
        spawnRipple(pt, '#10B981', 10);
        triggerWrapperHaptic('pulse');
      } else if (liveEval.zone === 'off-track') {
        spawnRipple(pt, '#D92525', 8);
        triggerWrapperHaptic('nudge');
      }
      renderCanvas();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const pt = toNormalizedPoint(e);

    if (practiceMode === 'stroke-order') {
      const pts = activePointsRef.current;
      const last = pts[pts.length - 1];
      if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) >= 0.8) {
        pts.push(pt);
        renderCanvas();
      }
    } else {
      const pts = activeTraceRef.current;
      const last = pts[pts.length - 1];
      if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) >= 0.8) {
        const liveEval = evaluateLiveTracePoint(pt, idealReference);
        pts.push({ ...pt, zone: liveEval.zone });
        setLiveZone(liveEval.zone);
        setLivePrecisionPct(liveEval.precisionPct);

        const now = performance.now();
        if (liveEval.zone === 'locked') {
          if (prevZoneRef.current !== 'locked') {
            triggerWrapperHaptic('pulse');
          }
          if (now - lastRippleMsRef.current >= 75) {
            lastRippleMsRef.current = now;
            spawnRipple(pt, '#10B981', 10);
          }
        } else if (
          liveEval.zone === 'off-track' &&
          prevZoneRef.current &&
          prevZoneRef.current !== 'off-track'
        ) {
          triggerWrapperHaptic('nudge');
          spawnRipple(pt, '#D92525', 8);
        }
        prevZoneRef.current = liveEval.zone;
        renderCanvas();
      }
    }
  };

  const finishStroke = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (practiceMode === 'stroke-order') {
      const drawn = [...activePointsRef.current];
      activePointsRef.current = [];
      if (isStrokeOrderComplete) {
        renderCanvas();
        return;
      }

      const result = verifyStrokeAttempt({
        strokePaths: kanji.strokePaths,
        expectedStrokeIndex: expectedIndex,
        userPoints: drawn,
      });
      setLastResult(result);

      if (result.passed) {
        const nextVerified: VerifiedStrokeRecord[] = [
          ...verifiedStrokes,
          {
            strokeIndex: expectedIndex,
            points: drawn,
            accuracyPct: result.accuracyPct,
          },
        ];
        setVerifiedStrokes(nextVerified);
        setRejectedStroke(null);

        if (nextVerified.length >= totalStrokes) {
          playSrsRatingSound(soundEnabled, true);
          if (xpAwardedForKanjiId !== kanji.id) {
            setXpAwardedForKanjiId(kanji.id);
            onGainXp(15);
          }
        } else {
          playCardFlipSound(soundEnabled);
        }
      } else {
        setRejectedStroke(drawn);
        if (result.reason !== 'too-short') {
          playQuizFeedbackSound(soundEnabled, false);
        }
      }
    } else {
      const finishedTrace = [...activeTraceRef.current];
      activeTraceRef.current = [];
      if (finishedTrace.length >= 2) {
        const nextTraces = [...traceStrokes, finishedTrace];
        setTraceStrokes(nextTraces);
        const evalFull = evaluateFullTraceComparison(nextTraces, idealReference);
        if (evalFull.passed) {
          spawnRipple({ x: 50, y: 50 }, '#10B981', 34);
          triggerWrapperHaptic('pulse');
          playSrsRatingSound(soundEnabled, true);
          if (traceXpAwardedId !== kanji.id) {
            setTraceXpAwardedId(kanji.id);
            onGainXp(20);
          }
        } else if (evalFull.shapeAccuracyPct >= 75) {
          playCardFlipSound(soundEnabled);
        }
      }
      renderCanvas();
    }
  };

  const handleClear = () => {
    isDrawingRef.current = false;
    activePointsRef.current = [];
    activeTraceRef.current = [];
    ripplesRef.current = [];
    prevZoneRef.current = null;
    if (practiceMode === 'stroke-order') {
      setVerifiedStrokes([]);
      setRejectedStroke(null);
      setLastResult(null);
    } else {
      setTraceStrokes([]);
      setLiveZone(null);
      setLivePrecisionPct(null);
      setHapticMotion(null);
    }
  };

  const handleUndo = () => {
    if (practiceMode === 'stroke-order') {
      if (rejectedStroke) {
        setRejectedStroke(null);
        setLastResult(null);
        return;
      }
      setVerifiedStrokes((prev) => prev.slice(0, -1));
      setLastResult(null);
    } else {
      setTraceStrokes((prev) => prev.slice(0, -1));
      setLiveZone(null);
      setLivePrecisionPct(null);
    }
  };

  const handleSwitchMode = (mode: KanjiPracticeMode) => {
    isDrawingRef.current = false;
    activePointsRef.current = [];
    activeTraceRef.current = [];
    ripplesRef.current = [];
    setPracticeMode(mode);
  };

  const wrapperMotionClass =
    hapticMotion === 'pulse'
      ? 'animate-haptic-pulse'
      : hapticMotion === 'nudge'
        ? 'animate-haptic-nudge'
        : '';

  const zoneBorderClass =
    practiceMode === 'precision-trace' && liveZone === 'locked'
      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
      : practiceMode === 'precision-trace' && liveZone === 'close'
        ? 'border-amber-500 ring-2 ring-amber-500/20'
        : practiceMode === 'precision-trace' && liveZone === 'off-track'
          ? 'border-[#D92525] ring-2 ring-[#D92525]/20'
          : 'border-stone-300 dark:border-zinc-700';

  return (
    <section
      aria-label="Kanji Stroke Order Drawing Board"
      className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-[#D92525] dark:text-rose-400">
            <PenTool className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {practiceMode === 'stroke-order'
                ? '筆順練習 · HTML5 Canvas Stroke Practice'
                : '精密トレース · Haptic Ideal-Shape Tracing Mode'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#141413] dark:text-white">
            {practiceMode === 'stroke-order' ? 'Draw' : 'Trace & Compare'}{' '}
            <span className="font-jp text-2xl mx-1">{kanji.kanji}</span> ({kanji.meaning})
          </h2>
          <p className="text-xs text-stone-500 dark:text-zinc-400">
            {practiceMode === 'stroke-order'
              ? 'Trace each stroke in exact Japanese order—start at the numbered red dot and follow the direction arrow.'
              : 'Trace smoothly along the ideal reference shape to trigger emerald haptic-like pulse rings and verify full character balance.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
          {/* Practice Mode Switcher */}
          <div
            role="tablist"
            aria-label="Kanji Canvas practice mode"
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-[#101218] border border-stone-200 dark:border-zinc-800"
          >
            <button
              type="button"
              role="tab"
              data-testid="mode-stroke-order"
              aria-selected={practiceMode === 'stroke-order'}
              onClick={() => handleSwitchMode('stroke-order')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                practiceMode === 'stroke-order'
                  ? 'bg-[#D92525] text-white'
                  : 'text-stone-600 dark:text-zinc-300 hover:text-[#141413] dark:hover:text-white'
              }`}
            >
              Stroke Order
            </button>
            <button
              type="button"
              role="tab"
              data-testid="mode-precision-trace"
              aria-selected={practiceMode === 'precision-trace'}
              onClick={() => handleSwitchMode('precision-trace')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                practiceMode === 'precision-trace'
                  ? 'bg-[#D92525] text-white'
                  : 'text-stone-600 dark:text-zinc-300 hover:text-[#141413] dark:hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" aria-hidden="true" />
              Precision Trace
            </button>
          </div>

          <div className="flex items-center gap-2">
            {typeof deckIndex === 'number' && typeof deckTotal === 'number' && (
              <span
                data-testid="canvas-deck-counter"
                className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-[#101218] border border-stone-200 dark:border-zinc-800 text-[11px] font-mono-nums font-semibold text-stone-600 dark:text-zinc-300 whitespace-nowrap"
              >
                {(deckIndex + 1).toLocaleString()} / {deckTotal.toLocaleString()}
              </span>
            )}
            <button
              type="button"
              onClick={onPrevKanji}
              aria-label="Previous Kanji"
              className="akujin-btn-press inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-zinc-200 hover:border-[#D92525]/50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Prev Kanji
            </button>
            <button
              type="button"
              onClick={onNextKanji}
              aria-label="Next Kanji"
              className="akujin-btn-press inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-zinc-200 hover:border-[#D92525]/50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Next Kanji
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive HTML5 Canvas with Haptic Frame */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-3">
          <div
            data-testid="kanji-canvas-frame"
            onAnimationEnd={() => setHapticMotion(null)}
            className={`relative rounded-xl border overflow-hidden bg-[#FCFBF8] dark:bg-[#101218] transition-colors ${zoneBorderClass} ${wrapperMotionClass}`}
          >
            <canvas
              ref={canvasRef}
              data-testid="kanji-drawing-canvas"
              aria-label={`Kanji drawing canvas for ${kanji.kanji}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishStroke}
              onPointerCancel={finishStroke}
              style={{ width: CANVAS_CSS_SIZE, height: CANVAS_CSS_SIZE }}
              className="block touch-none cursor-crosshair select-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {practiceMode === 'stroke-order' ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowGuide((g) => !g)}
                  aria-pressed={showGuide}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    showGuide
                      ? 'border-[#D92525]/50 text-[#D92525] dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/20'
                      : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300'
                  }`}
                >
                  {showGuide ? (
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  Guide: {showGuide ? 'On' : 'Off'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowNextHint((h) => !h)}
                  aria-pressed={showNextHint}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    showNextHint
                      ? 'border-[#D92525]/50 text-[#D92525] dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/20'
                      : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300'
                  }`}
                >
                  Hint: {showNextHint ? 'On' : 'Off'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowIdealRef((v) => !v)}
                aria-pressed={showIdealRef}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  showIdealRef
                    ? 'border-[#D92525]/50 text-[#D92525] dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/20'
                    : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300'
                }`}
              >
                {showIdealRef ? (
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                Ideal Ref: {showIdealRef ? 'On' : 'Off'}
              </button>
            )}

            <button
              type="button"
              onClick={handleUndo}
              disabled={
                practiceMode === 'stroke-order'
                  ? verifiedStrokes.length === 0 && !rejectedStroke
                  : traceStrokes.length === 0
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 disabled:opacity-45 whitespace-nowrap cursor-pointer disabled:cursor-default"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Undo
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={
                practiceMode === 'stroke-order'
                  ? verifiedStrokes.length === 0 && !rejectedStroke && !lastResult
                  : traceStrokes.length === 0 && liveZone === null
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 disabled:opacity-45 whitespace-nowrap cursor-pointer disabled:cursor-default"
            >
              <Eraser className="w-3.5 h-3.5" aria-hidden="true" />
              Clear
            </button>
          </div>
        </div>

        {/* Right: Mode-Specific Verification HUD */}
        {practiceMode === 'stroke-order' ? (
          <div
            data-testid="kanji-drawing-status"
            data-verified-strokes={verifiedStrokes.length}
            data-total-strokes={totalStrokes}
            data-last-status={lastResult ? (lastResult.passed ? 'passed' : lastResult.reason) : 'idle'}
            className="lg:col-span-7 space-y-5"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#141413] dark:text-white">
                  Real-Time Stroke Verification
                </span>
                <span className="font-mono-nums text-stone-600 dark:text-zinc-300">
                  {verifiedStrokes.length} / {totalStrokes} strokes verified
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-[#D92525] transition-all duration-200"
                  style={{
                    width: `${
                      totalStrokes > 0
                        ? Math.round((verifiedStrokes.length / totalStrokes) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Stroke Order Sequence
              </p>
              <div className="flex flex-wrap gap-2">
                {kanji.strokePaths.map((_, idx) => {
                  const done = idx < verifiedStrokes.length;
                  const current = idx === expectedIndex && !isStrokeOrderComplete;
                  return (
                    <div
                      key={idx}
                      className={`h-8 w-8 rounded-lg border font-mono-nums text-xs font-semibold flex items-center justify-center transition-colors ${
                        done
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : current
                            ? 'border-[#D92525] text-[#D92525] dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                            : 'border-stone-200 dark:border-zinc-700 text-stone-400 dark:text-zinc-500 bg-stone-50 dark:bg-[#1B1E28]'
                      }`}
                      title={
                        done
                          ? `Stroke ${idx + 1}: Verified (${verifiedStrokes[idx].accuracyPct}%)`
                          : current
                            ? `Stroke ${idx + 1}: Draw next`
                            : `Stroke ${idx + 1}: Pending`
                      }
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>
            </div>

            {isStrokeOrderComplete ? (
              <div className="rounded-xl border border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>
                      Kanji Complete! Avg Accuracy {avgAccuracy}% · +15 XP
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    All {totalStrokes} strokes for {kanji.kanji} verified in accurate sequence.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3.5 py-2 rounded-lg bg-[#141413] dark:bg-white text-white dark:text-[#141413] text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  Practice Again
                </button>
              </div>
            ) : lastResult ? (
              <div
                className={`rounded-xl border p-4 flex items-start gap-3 ${
                  lastResult.passed
                    ? 'border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/25 text-emerald-900 dark:text-emerald-200'
                    : 'border-[#D92525]/40 bg-rose-50/70 dark:bg-rose-950/25 text-rose-900 dark:text-rose-200'
                }`}
              >
                {lastResult.passed ? (
                  <CheckCircle2
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                ) : (
                  <AlertCircle
                    className="w-4 h-4 text-[#D92525] dark:text-rose-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                )}
                <div className="text-xs space-y-1">
                  <p className="font-semibold">{lastResult.feedback}</p>
                  <p className="opacity-85">
                    Next target: Stroke {expectedIndex + 1} of {totalStrokes}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-[#1B1E28] p-4 text-xs text-stone-600 dark:text-zinc-300">
                Draw <strong className="text-[#141413] dark:text-white">Stroke 1</strong> starting on the red numbered dot. Each stroke is checked in real time for stroke order, direction, and shape.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800">
                <span className="text-stone-500 dark:text-zinc-400">On’yomi</span>
                <p className="font-jp font-semibold text-[#141413] dark:text-white mt-0.5">
                  {kanji.onyomi.length > 0 ? kanji.onyomi.map((r) => r.kana).join(' · ') : '—'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800">
                <span className="text-stone-500 dark:text-zinc-400">Kun’yomi</span>
                <p className="font-jp font-semibold text-[#141413] dark:text-white mt-0.5">
                  {kanji.kunyomi.length > 0 ? kanji.kunyomi.map((r) => r.kana).join(' · ') : '—'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            data-testid="precision-trace-status"
            data-trace-zone={liveZone ?? 'idle'}
            data-trace-coverage={traceComparison.coveragePct}
            data-trace-accuracy={traceComparison.shapeAccuracyPct}
            data-trace-complete={traceComparison.passed ? 'true' : 'false'}
            data-haptic-pulses={hapticPulseCount}
            className="lg:col-span-7 space-y-5"
          >
            {/* Ideal Reference Comparison Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800">
                <p className="text-xs text-stone-500 dark:text-zinc-400">Shape Match</p>
                <p className="text-xl font-bold font-mono-nums text-[#141413] dark:text-white mt-1">
                  {traceComparison.shapeAccuracyPct}%
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800">
                <p className="text-xs text-stone-500 dark:text-zinc-400">Ideal Coverage</p>
                <p className="text-xl font-bold font-mono-nums text-[#D92525] dark:text-rose-400 mt-1">
                  {traceComparison.coveragePct}%
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800">
                <p className="text-xs text-stone-500 dark:text-zinc-400">Haptic Zone</p>
                <p
                  className={`text-sm font-bold mt-1.5 ${
                    liveZone === 'locked'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : liveZone === 'close'
                        ? 'text-amber-700 dark:text-amber-400'
                        : liveZone === 'off-track'
                          ? 'text-[#D92525] dark:text-rose-400'
                          : 'text-stone-600 dark:text-zinc-300'
                  }`}
                >
                  {liveZone === 'locked'
                    ? 'On Track'
                    : liveZone === 'close'
                      ? 'Near Edge'
                      : liveZone === 'off-track'
                        ? 'Off Path'
                        : 'Ready'}
                </p>
              </div>
            </div>

            {/* Coverage Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-zinc-400">
                <span>Ideal Shape Coverage Target (78%+)</span>
                <span className="font-mono-nums">
                  {livePrecisionPct !== null
                    ? `Live precision: ${livePrecisionPct}% · Pulses: ${hapticPulseCount}`
                    : `Pulses: ${hapticPulseCount}`}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-150 ${
                    traceComparison.passed ? 'bg-emerald-600' : 'bg-[#D92525]'
                  }`}
                  style={{ width: `${traceComparison.coveragePct}%` }}
                />
              </div>
            </div>

            {/* Haptic Visual Feedback & Ideal Shape Comparison Banner */}
            {traceComparison.passed ? (
              <div className="rounded-xl border border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>
                      Ideal Shape Matched! {traceComparison.compositeScorePct}% Score · +20 XP
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    {traceComparison.feedback}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3.5 py-2 rounded-lg bg-[#141413] dark:bg-white text-white dark:text-[#141413] text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  Trace Again
                </button>
              </div>
            ) : (
              <div
                className={`rounded-xl border p-4 flex items-start gap-3 ${
                  liveZone === 'locked'
                    ? 'border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                    : liveZone === 'off-track'
                      ? 'border-[#D92525]/40 bg-rose-50/70 dark:bg-rose-950/25 text-rose-900 dark:text-rose-200'
                      : 'border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-[#1B1E28] text-stone-700 dark:text-zinc-300'
                }`}
              >
                <Activity
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    liveZone === 'locked'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : liveZone === 'off-track'
                        ? 'text-[#D92525] dark:text-rose-400'
                        : 'text-stone-500 dark:text-zinc-400'
                  }`}
                  aria-hidden="true"
                />
                <div className="text-xs space-y-1">
                  <p className="font-semibold">
                    {liveZone === 'locked'
                      ? 'Locked onto ideal shape — emerald haptic rings active.'
                      : liveZone === 'off-track'
                        ? 'Off ideal shape — steer back onto the blueprint stroke.'
                        : traceComparison.feedback}
                  </p>
                  <p className="opacity-85">
                    Emerald ink = exact match · Amber ink = near edge · Crimson ink = off ideal path.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
