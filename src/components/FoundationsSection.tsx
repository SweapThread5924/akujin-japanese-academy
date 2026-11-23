import React, { useEffect, useRef, useState } from 'react';
import {
  Volume2,
  CheckCircle2,
  Eraser,
  Sparkles,
  Clock,
  MessageCircle,
  BookOpen,
} from 'lucide-react';
import {
  BASIC_GREETINGS,
  HIRAGANA_46,
  KANA_DAKUTEN_YOON,
  KATAKANA_46,
  NUMBERS_TIME_BASICS,
  type KanaGridCell,
} from '../data/foundationsData';
import { speakJapanese } from '../utils/speechAndPwa';
import { playQuizFeedbackSound } from '../utils/soundEffects';
import { buildKanaQuizOptions } from '../utils/kanaQuiz';

interface FoundationsSectionProps {
  showRomaji: boolean;
  soundEnabled: boolean;
  masteredItemIds: string[];
  onMasterItem: (itemId: string, xp: number) => void;
  onRecordQuizAnswer: (isCorrect: boolean, xpEarned: number) => void;
  onStartN5Track: () => void;
}

type FoundationSubTab = 'hiragana' | 'katakana' | 'greetings' | 'numbers' | 'quiz';

export const FoundationsSection: React.FC<FoundationsSectionProps> = ({
  showRomaji,
  soundEnabled,
  masteredItemIds,
  onMasterItem,
  onRecordQuizAnswer,
  onStartN5Track,
}) => {
  const [subTab, setSubTab] = useState<FoundationSubTab>('hiragana');
  const [selectedKana, setSelectedKana] = useState<KanaGridCell>(HIRAGANA_46[0]);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [quizTargetIdx, setQuizTargetIdx] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  // Canvas drawing pad for practicing selected Kana
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const activeChart = subTab === 'katakana' ? KATAKANA_46 : HIRAGANA_46;
  const hiraganaMasteredCount = HIRAGANA_46.filter((k) =>
    masteredItemIds.includes(`kana-h-${k.kana}`)
  ).length;
  const katakanaMasteredCount = KATAKANA_46.filter((k) =>
    masteredItemIds.includes(`kana-k-${k.kana}`)
  ).length;

  useEffect(() => {
    if (subTab === 'hiragana') setSelectedKana(HIRAGANA_46[0]);
    if (subTab === 'katakana') setSelectedKana(KATAKANA_46[0]);
  }, [subTab]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    clearCanvas();
  }, [selectedKana.kana]);

  const handleSelectKana = (entry: KanaGridCell) => {
    setSelectedKana(entry);
    setSpeakingKey(entry.kana);
    speakJapanese(entry.kana, 0.85, () => setSpeakingKey(null));
  };

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    isDrawingRef.current = true;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getPointerPos(e);
    ctx.strokeStyle = '#D92525';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  // Group 46 Kana dynamically by their Gojuon row labels
  const rowLabels = Array.from(new Set(activeChart.map((c) => c.row)));

  // Sound Recognition Quiz Data
  const quizPool = [...HIRAGANA_46.slice(0, 20), ...KATAKANA_46.slice(0, 15)];
  const safeQuizIdx = quizTargetIdx % quizPool.length;
  const currentQuizKana = quizPool[safeQuizIdx];
  const quizOptions = buildKanaQuizOptions(currentQuizKana, quizPool, safeQuizIdx);

  const handleAnswerQuiz = (romajiChoice: string) => {
    if (quizFeedback !== null) return;
    setSelectedChoice(romajiChoice);
    const isCorrect = romajiChoice === currentQuizKana.romaji;
    setQuizFeedback(isCorrect ? 'correct' : 'wrong');
    playQuizFeedbackSound(soundEnabled, isCorrect);
    onRecordQuizAnswer(isCorrect, isCorrect ? 15 : 0);
  };

  const activeMasterKey =
    subTab === 'katakana' ? `kana-k-${selectedKana.kana}` : `kana-h-${selectedKana.kana}`;
  const isSelectedKanaMastered = masteredItemIds.includes(activeMasterKey);

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
            入門 · Step 1 Before JLPT N5 · Zero to Reading Japanese
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#141413] dark:text-white mt-1">
            Foundations: All 46 Hiragana, 46 Katakana &amp;{' '}
            <span className="font-display-italic text-[#D92525] dark:text-rose-400 font-semibold">
              Daily Basics.
            </span>
          </h1>
          <p className="text-sm text-stone-600 dark:text-zinc-300 mt-1.5 max-w-2xl">
            Start from zero. Tap any character to hear Tokyo pronunciation, trace strokes directly on the canvas, learn essential greetings &amp; numbers, and earn XP before advancing to JLPT N5.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartN5Track}
          className="self-start inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] dark:bg-white text-white dark:text-[#141413] text-xs font-semibold hover:opacity-90 cursor-pointer shrink-0"
        >
          Ready for JLPT N5 →
        </button>
      </div>

      {/* Progress Strip & Sub-navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800">
        <div
          role="tablist"
          aria-label="Foundations study modules"
          className="flex flex-wrap items-center gap-1.5"
        >
          {(
            [
              { id: 'hiragana', label: 'Hiragana (46)' },
              { id: 'katakana', label: 'Katakana (46)' },
              { id: 'greetings', label: 'Basic Greetings (18)' },
              { id: 'numbers', label: 'Numbers & Time' },
              { id: 'quiz', label: 'Kana Sound Quiz' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={subTab === t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                subTab === t.id
                  ? 'bg-[#D92525] text-white'
                  : 'bg-stone-100 dark:bg-[#1E2029] text-stone-700 dark:text-zinc-300 hover:text-[#141413] dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono-nums text-stone-600 dark:text-zinc-300">
          <span>Hiragana: {hiraganaMasteredCount}/46</span>
          <span>Katakana: {katakanaMasteredCount}/46</span>
        </div>
      </div>

      {/* Hiragana / Katakana Interactive Gojuon + Trace Studio */}
      {(subTab === 'hiragana' || subTab === 'katakana') && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left: Complete 46 Character Matrix */}
          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#141413] dark:text-white">
                  Complete 46 {subTab === 'hiragana' ? 'Hiragana (平仮名)' : 'Katakana (片仮名)'} Gojūon Chart
                </h2>
                <span className="text-xs font-mono-nums text-stone-500 dark:text-zinc-400">
                  {activeChart.length} characters
                </span>
              </div>

              <div className="space-y-2">
                {rowLabels.map((rowKey) => {
                  const rowItems = activeChart.filter((c) => c.row === rowKey);
                  return (
                    <div key={rowKey} className="grid grid-cols-5 gap-2">
                      {rowItems.map((entry) => {
                        const isSelected = selectedKana.kana === entry.kana;
                        const masterKey =
                          subTab === 'katakana' ? `kana-k-${entry.kana}` : `kana-h-${entry.kana}`;
                        const mastered = masteredItemIds.includes(masterKey);
                        const isPlaying = speakingKey === entry.kana;
                        return (
                          <button
                            key={entry.kana}
                            type="button"
                            onClick={() => handleSelectKana(entry)}
                            className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#D92525] bg-[#D92525]/10 ring-1 ring-[#D92525]/40'
                                : isPlaying
                                ? 'border-[#D92525]/60 bg-rose-50/60 dark:bg-rose-950/30'
                                : 'border-stone-200 dark:border-zinc-800 bg-stone-50/60 dark:bg-[#101218] hover:border-[#D92525]/50'
                            }`}
                          >
                            {mastered && (
                              <CheckCircle2
                                className="w-3 h-3 text-emerald-600 absolute top-1.5 right-1.5"
                                aria-label="Mastered"
                              />
                            )}
                            <span className="font-jp text-xl sm:text-2xl font-bold text-[#141413] dark:text-white">
                              {entry.kana}
                            </span>
                            <span className="text-[11px] font-mono-nums text-stone-500 dark:text-zinc-400">
                              {showRomaji ? entry.romaji : '···'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dakuten, Handakuten & Yoon Guide */}
            <div className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 space-y-4">
              <h3 className="text-sm font-bold text-[#141413] dark:text-white">
                Voiced Sounds (Dakuten ゛・Handakuten ゜) &amp; Combo Sounds (Yōon)
              </h3>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {(['Dakuten', 'Handakuten', 'Yoon'] as const).map((grpName) => {
                  const items = (
                    subTab === 'katakana'
                      ? KANA_DAKUTEN_YOON.katakana
                      : KANA_DAKUTEN_YOON.hiragana
                  ).filter((item) => item.group === grpName);
                  if (items.length === 0) return null;
                  return (
                    <div
                      key={grpName}
                      className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800 space-y-2"
                    >
                      <p className="text-xs font-semibold text-[#D92525] dark:text-rose-400">
                        {grpName}
                      </p>
                      <div className="space-y-1.5">
                        {items.map((p) => (
                          <button
                            key={p.kana}
                            type="button"
                            onClick={() => speakJapanese(p.sampleWord.split(' ')[0] || p.kana, 0.85)}
                            className="w-full text-left px-2.5 py-2 rounded-lg bg-white dark:bg-[#101218] border border-stone-200 dark:border-zinc-700 text-xs hover:border-[#D92525] cursor-pointer space-y-0.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-jp font-semibold text-[#141413] dark:text-white">
                                {p.kana}
                              </span>
                              <span className="text-[11px] text-stone-500 dark:text-zinc-400 shrink-0">
                                {p.sampleMeaning}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-400 font-mono-nums truncate">
                              {p.romaji}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Selected Kana Audio, Mnemonic & Practice Pad */}
          <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-6 space-y-5 lg:sticky lg:top-24">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-mono-nums text-[#D92525] dark:text-rose-400">
                  {selectedKana.strokes} {selectedKana.strokes === 1 ? 'stroke' : 'strokes'} ·{' '}
                  {selectedKana.romaji.toUpperCase()}
                </p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="font-jp text-6xl font-bold text-[#141413] dark:text-white">
                    {selectedKana.kana}
                  </span>
                  <span className="text-sm text-stone-500 dark:text-zinc-400">
                    “{selectedKana.romaji}”
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => speakJapanese(selectedKana.kana, 0.8)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                Hear Sound
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800 space-y-1.5">
              <p className="text-xs font-semibold text-[#141413] dark:text-white">
                Memory Hook
              </p>
              <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                {selectedKana.mnemonic}
              </p>
              <div className="pt-1.5 flex items-center justify-between text-xs border-t border-stone-200/70 dark:border-zinc-700/60">
                <span className="font-jp font-bold text-[#141413] dark:text-white">
                  Example: {selectedKana.sampleWord} — {selectedKana.sampleMeaning}
                </span>
                <button
                  type="button"
                  onClick={() => speakJapanese(selectedKana.sampleWord)}
                  className="text-[#D92525] hover:underline font-medium cursor-pointer"
                >
                  Play word
                </button>
              </div>
            </div>

            {/* Interactive Kana Writing Pad */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#141413] dark:text-white">
                  Trace “{selectedKana.kana}” on Pad
                </span>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="inline-flex items-center gap-1 text-stone-500 hover:text-[#D92525] cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" aria-hidden="true" />
                  Clear Pad
                </button>
              </div>

              <div className="relative rounded-xl border border-stone-200 dark:border-zinc-700 bg-[#FCFBF8] dark:bg-[#101218] overflow-hidden flex items-center justify-center">
                <span
                  aria-hidden="true"
                  className="pointer-events-none select-none font-jp text-[130px] leading-none text-stone-200/70 dark:text-zinc-800/80"
                >
                  {selectedKana.kana}
                </span>
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={200}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  className="absolute inset-0 h-full w-full touch-none cursor-crosshair"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isSelectedKanaMastered}
              onClick={() => onMasterItem(activeMasterKey, 5)}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isSelectedKanaMastered
                  ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                  : 'bg-[#141413] dark:bg-white text-white dark:text-[#141413] hover:opacity-90'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              {isSelectedKanaMastered ? 'Character Mastered (+5 XP Earned)' : 'Mark Character Mastered (+5 XP)'}
            </button>
          </div>
        </div>
      )}

      {/* Basic Greetings (18 items) */}
      {subTab === 'greetings' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#141413] dark:text-white">
            <MessageCircle className="w-4 h-4 text-[#D92525]" aria-hidden="true" />
            18 Essential Everyday Japanese Greetings &amp; Polite Expressions
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BASIC_GREETINGS.map((g) => {
              const masterKey = `greet-${g.id}`;
              const mastered = masteredItemIds.includes(masterKey);
              return (
                <div
                  key={g.id}
                  className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300">
                        {g.register}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakJapanese(g.japanese)}
                        aria-label={`Listen to ${g.japanese}`}
                        className="p-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 hover:border-[#D92525] text-[#D92525] cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <p className="font-jp text-lg font-bold text-[#141413] dark:text-white">
                      {g.japanese}
                    </p>
                    {showRomaji && (
                      <p className="text-xs font-mono-nums text-stone-500 dark:text-zinc-400">
                        {g.romaji}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-[#D92525] dark:text-rose-400">
                      {g.english}
                    </p>
                    <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                      {g.usageNote}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={mastered}
                    onClick={() => onMasterItem(masterKey, 5)}
                    className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                      mastered
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                        : 'border border-stone-200 dark:border-zinc-700 hover:border-[#D92525] text-[#141413] dark:text-zinc-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {mastered ? 'Learned' : 'Mark Learned (+5 XP)'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Numbers, Time & Counters */}
      {subTab === 'numbers' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#141413] dark:text-white">
            <Clock className="w-4 h-4 text-[#D92525]" aria-hidden="true" />
            Numbers (0–10,000), Clock Time, Days of the Week &amp; Counters
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {NUMBERS_TIME_BASICS.map((item) => {
              const masterKey = `num-${item.id}`;
              const mastered = masteredItemIds.includes(masterKey);
              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono-nums text-[#D92525] dark:text-rose-400 font-semibold">
                        {item.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakJapanese(item.japanese)}
                        aria-label={`Play ${item.japanese}`}
                        className="p-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 hover:border-[#D92525] text-[#D92525] cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <p className="text-lg font-bold text-[#141413] dark:text-white font-jp">
                      {item.japanese}
                    </p>
                    <p className="text-xs font-jp text-stone-600 dark:text-zinc-300">
                      {item.reading} {showRomaji ? `· ${item.romaji}` : ''}
                    </p>
                    <p className="text-sm font-semibold text-[#141413] dark:text-zinc-100">
                      {item.english}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-zinc-400">{item.note}</p>
                  </div>
                  <button
                    type="button"
                    disabled={mastered}
                    onClick={() => onMasterItem(masterKey, 5)}
                    className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                      mastered
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                        : 'border border-stone-200 dark:border-zinc-700 hover:border-[#D92525] text-[#141413] dark:text-zinc-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {mastered ? 'Mastered' : 'Mark Mastered (+5 XP)'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kana Sound Quiz */}
      {subTab === 'quiz' && (
        <div className="max-w-xl mx-auto rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6 text-center">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1 font-semibold text-[#D92525] dark:text-rose-400">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Kana Recognition Drill
            </span>
            <button
              type="button"
              onClick={() => speakJapanese(currentQuizKana.kana)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-stone-200 dark:border-zinc-700 text-[#141413] dark:text-white cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
              Play Audio
            </button>
          </div>

          <div className="py-4">
            <p className="font-jp text-7xl font-bold text-[#141413] dark:text-white">
              {currentQuizKana.kana}
            </p>
            <p className="mt-2 text-xs text-stone-500 dark:text-zinc-400">
              Select the matching Romaji sound for this character
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {quizOptions.map((opt) => {
              const isSelected = selectedChoice === opt;
              const isRight = opt === currentQuizKana.romaji;
              let btnStyle =
                'border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-[#141413] dark:text-white hover:border-[#D92525]';
              if (quizFeedback !== null) {
                if (isRight) btnStyle = 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300';
                else if (isSelected) btnStyle = 'border-[#D92525] bg-rose-50 dark:bg-rose-950/40 text-[#D92525]';
              }
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={quizFeedback !== null}
                  onClick={() => handleAnswerQuiz(opt)}
                  className={`py-3 rounded-xl border text-base font-mono-nums font-bold transition-colors cursor-pointer ${btnStyle}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {quizFeedback !== null && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-medium text-stone-600 dark:text-zinc-300">
                {quizFeedback === 'correct'
                  ? `Correct! (+15 XP) — Hint: ${currentQuizKana.mnemonic}`
                  : `Answer: "${currentQuizKana.romaji}" — Hint: ${currentQuizKana.mnemonic}`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuizFeedback(null);
                  setSelectedChoice(null);
                  setQuizTargetIdx((i) => i + 1);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                Next Kana Card →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
