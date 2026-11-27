import React, { useEffect, useMemo, useState } from 'react';
import {
  Volume2,
  RotateCw,
  Mic,
  MicOff,
  Sparkles,
  ThumbsUp,
  Send,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import {
  FLASHCARDS,
  LESSONS,
  QUIZ_BANK,
  SPEECH_BUBBLES,
  TEXTBOOK_VS_ANIME,
  type QuizQuestion,
} from '../data/curriculumData';
import {
  interpolateRegisterTier,
  selectAdaptiveDifficulty,
  type JlptLevel,
} from '../utils/srsEngine';
import {
  isAllJlptLevelsVisible,
  normalizeVisibleJlptLevels,
  resolveActiveVisibleLevel,
} from '../utils/jlptVisibility';
import { speakJapanese } from '../utils/speechAndPwa';
import { playCardFlipSound, playQuizFeedbackSound } from '../utils/soundEffects';
import { JapaneseText } from './JapaneseText';
import { JlptSkillLabsPanel } from './JlptSkillLabsPanel';
import type { ReadingSpeedRecord } from '../utils/readingSpeed';

export interface DiscussionItem {
  id: string;
  lessonId: string;
  author: string;
  jlptBadge: string;
  quoteOrPhrase: string;
  comment: string;
  upvotes: number;
  createdAt: string;
}

interface LessonsSectionProps {
  selectedLevel: JlptLevel;
  visibleLevels?: JlptLevel[];
  onResetVisibleLevels?: () => void;
  onSelectLevel: (level: JlptLevel) => void;
  showFurigana: boolean;
  showRomaji: boolean;
  soundEnabled: boolean;
  recentQuizResults: boolean[];
  onRecordQuizAnswer: (isCorrect: boolean, xpEarned: number) => void;
  onGainXp: (xp: number) => void;
  discussions: DiscussionItem[];
  onPostDiscussion: (post: {
    lessonId: string;
    author: string;
    jlptBadge: string;
    quoteOrPhrase: string;
    comment: string;
  }) => Promise<void>;
  onUpvoteDiscussion: (id: string) => Promise<void>;
  learnerName: string;
  masteredItemIds: string[];
  onMasterItem: (itemId: string, xp: number) => void;
  onRecordReadingSpeed?: (record: ReadingSpeedRecord) => void;
}

const LESSONS_GRID_COLS: Record<number, string> = {
  1: 'sm:grid-cols-1 max-w-md',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 md:grid-cols-3',
  4: 'sm:grid-cols-2 xl:grid-cols-4',
  5: 'sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
};

interface PronunciationFeedback {
  source: string;
  detectedSpeech: string;
  accuracyScore: number;
  pitchTip: string;
  moraBreakdown: string;
  encouragement: string;
}

export const LessonsSection: React.FC<LessonsSectionProps> = ({
  selectedLevel,
  visibleLevels,
  onResetVisibleLevels,
  onSelectLevel,
  showFurigana,
  showRomaji,
  soundEnabled,
  recentQuizResults,
  onRecordQuizAnswer,
  onGainXp,
  discussions,
  onPostDiscussion,
  onUpvoteDiscussion,
  learnerName,
  masteredItemIds,
  onMasterItem,
  onRecordReadingSpeed,
}) => {
  const activeVisibleLevels = useMemo(
    () => normalizeVisibleJlptLevels(visibleLevels),
    [visibleLevels]
  );
  const allVisible = isAllJlptLevelsVisible(activeVisibleLevels);
  const effectiveSelectedLevel = resolveActiveVisibleLevel(selectedLevel, activeVisibleLevels);
  const visibleLessons = useMemo(
    () => LESSONS.filter((l) => activeVisibleLevels.includes(l.level)),
    [activeVisibleLevels]
  );

  const [activeLessonId, setActiveLessonId] = useState(
    visibleLessons[0]?.id ?? LESSONS[0].id
  );
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [aiQuestion, setAiQuestion] = useState<QuizQuestion | null>(null);
  const [loadingAiQuiz, setLoadingAiQuiz] = useState(false);
  const [aiQuizError, setAiQuizError] = useState<string | null>(null);

  // Pronunciation speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [spokenInput, setSpokenInput] = useState('');
  const [pronFeedback, setPronFeedback] = useState<PronunciationFeedback | null>(null);
  const [checkingPron, setCheckingPron] = useState(false);
  const [pronError, setPronError] = useState<string | null>(null);

  // Hover-to-translate active token
  const [hoveredTokenId, setHoveredTokenId] = useState<string>(SPEECH_BUBBLES[0].tokens[0].id);

  // Textbook vs. Anime slider
  const [tvaIndex, setTvaIndex] = useState(0);
  const [sliderValue, setSliderValue] = useState(50);

  // Discussion form
  const [quoteInput, setQuoteInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [postingDiscussion, setPostingDiscussion] = useState(false);
  const [discussionError, setDiscussionError] = useState<string | null>(null);

  useEffect(() => {
    setCardIndex(0);
    setIsFlipped(false);
    setSelectedOption(null);
    setQuizFeedback(null);
    setAiQuestion(null);
    setAiQuizError(null);
    const matchingLesson = visibleLessons.find((l) => l.level === effectiveSelectedLevel);
    if (matchingLesson) setActiveLessonId(matchingLesson.id);
    else if (visibleLessons[0]) setActiveLessonId(visibleLessons[0].id);
  }, [effectiveSelectedLevel, visibleLessons]);

  const levelCards = useMemo(() => {
    const filtered = FLASHCARDS.filter((c) => c.level === effectiveSelectedLevel);
    return filtered.length > 0 ? filtered : FLASHCARDS;
  }, [effectiveSelectedLevel]);

  const currentCard = levelCards[cardIndex % levelCards.length];

  const adaptive = useMemo(
    () => selectAdaptiveDifficulty(recentQuizResults, effectiveSelectedLevel),
    [recentQuizResults, effectiveSelectedLevel]
  );

  const levelQuestions = useMemo(() => {
    const matches = QUIZ_BANK.filter((q) => q.level === adaptive.recommendedLevel);
    return matches.length > 0 ? matches : QUIZ_BANK;
  }, [adaptive.recommendedLevel]);

  const activeQuestion = aiQuestion ?? levelQuestions[quizIndex % levelQuestions.length];

  const activeLesson =
    visibleLessons.find((l) => l.id === activeLessonId) ?? visibleLessons[0] ?? LESSONS[0];
  const lessonDiscussions = discussions.filter((d) => d.lessonId === activeLesson.id);

  const tvaExample = TEXTBOOK_VS_ANIME[tvaIndex % TEXTBOOK_VS_ANIME.length];
  const registerTierIndex = interpolateRegisterTier(sliderValue);
  const activeRegister = tvaExample.tiers[registerTierIndex];

  const handleSpeak = (id: string, text: string) => {
    setSpeakingId(id);
    speakJapanese(text, 0.92, () => setSpeakingId(null));
  };

  const handleSelectOption = (optionId: string) => {
    if (quizFeedback !== null) return;
    setSelectedOption(optionId);
    const isCorrect = optionId === activeQuestion.correctOptionId;
    setQuizFeedback(isCorrect ? 'correct' : 'wrong');
    playQuizFeedbackSound(soundEnabled, isCorrect);
    onRecordQuizAnswer(isCorrect, isCorrect ? 25 : 0);
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setQuizFeedback(null);
    setAiQuestion(null);
    setQuizIndex((prev) => prev + 1);
  };

  const handleGenerateAdaptiveQuiz = async () => {
    setLoadingAiQuiz(true);
    setAiQuizError(null);
    try {
      const res = await fetch('/api/adaptive-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: adaptive.recommendedLevel,
          accuracyPct: adaptive.accuracyPct,
          topic: activeLesson.title,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not generate adaptive question.');
      }
      setAiQuestion(data.question);
      setSelectedOption(null);
      setQuizFeedback(null);
    } catch (err) {
      setAiQuizError(err instanceof Error ? err.message : 'Adaptive generator unavailable.');
    } finally {
      setLoadingAiQuiz(false);
    }
  };

  const startSpeechCapture = () => {
    setPronError(null);
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setSpokenInput(currentCard.plainJapanese);
      setPronError(
        'Browser microphone speech-to-text is unavailable here — we pre-filled the target phrase so you can edit and test AI mora feedback directly.'
      );
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new SpeechRec() as any;
      recognition.lang = 'ja-JP';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      setIsListening(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        setSpokenInput(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => {
        setIsListening(false);
        setPronError('Microphone capture stopped. You can type or adjust what you spoke below.');
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
      setPronError('Unable to start microphone. Try typing your spoken Japanese below.');
    }
  };

  const submitPronunciationCheck = async () => {
    const attempt = spokenInput.trim() || currentCard.plainJapanese;
    setCheckingPron(true);
    setPronError(null);
    try {
      const res = await fetch('/api/pronunciation-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetJapanese: currentCard.plainJapanese,
          targetReading: currentCard.reading,
          targetRomaji: currentCard.romaji,
          spokenText: attempt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Evaluation failed');
      setPronFeedback(data);
      if (data.accuracyScore >= 75) {
        onGainXp(15);
      }
    } catch (err) {
      setPronError(err instanceof Error ? err.message : 'Unable to check pronunciation.');
    } finally {
      setCheckingPron(false);
    }
  };

  const handleDiscussionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setPostingDiscussion(true);
    setDiscussionError(null);
    try {
      await onPostDiscussion({
        lessonId: activeLesson.id,
        author: learnerName,
        jlptBadge: `${effectiveSelectedLevel} Learner`,
        quoteOrPhrase: quoteInput.trim(),
        comment: commentInput.trim(),
      });
      setQuoteInput('');
      setCommentInput('');
      onGainXp(10);
    } catch (err) {
      setDiscussionError(err instanceof Error ? err.message : 'Unable to post your note right now.');
    } finally {
      setPostingDiscussion(false);
    }
  };

  const activeHoveredToken = useMemo(() => {
    for (const bubble of SPEECH_BUBBLES) {
      const found = bubble.tokens.find((t) => t.id === hoveredTokenId);
      if (found) return found;
    }
    return SPEECH_BUBBLES[0].tokens[0];
  }, [hoveredTokenId]);

  return (
    <div className="mx-auto max-w-[1380px] px-4 sm:px-6 py-6 sm:py-8 space-y-10 sm:space-y-12">
      {/* Lesson Curriculum Selector */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
              教室 · Interactive Practice Studio
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#141413] dark:text-white mt-1 text-balance">
              Lessons, Flashcards &amp;{' '}
              <span className="font-display-italic text-[#D92525] dark:text-rose-400 font-semibold">
                Real Speech Nuance.
              </span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 max-w-full">
            {!allVisible && onResetVisibleLevels && (
              <button
                type="button"
                data-testid="lessons-filter-notice"
                onClick={onResetVisibleLevels}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#D92525]/35 bg-rose-50/70 dark:bg-rose-950/30 text-xs font-semibold text-[#D92525] dark:text-rose-300 hover:bg-rose-100/80 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
              >
                Filtered: {activeVisibleLevels.join(', ')} · Show All
              </button>
            )}
            <div
              role="tablist"
              aria-label="Filter lessons by JLPT level"
              data-testid="lessons-jlpt-tablist"
              className="inline-flex max-w-full overflow-x-auto akujin-no-scrollbar items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800"
            >
              {activeVisibleLevels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  role="tab"
                  aria-selected={effectiveSelectedLevel === lvl}
                  onClick={() => {
                    onSelectLevel(lvl);
                    setCardIndex(0);
                    setIsFlipped(false);
                    const matchingLesson = visibleLessons.find((l) => l.level === lvl);
                    if (matchingLesson) setActiveLessonId(matchingLesson.id);
                  }}
                  className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    effectiveSelectedLevel === lvl
                      ? 'bg-[#D92525] text-white'
                      : 'text-stone-600 dark:text-zinc-300 hover:text-[#141413] dark:hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lesson Unit Strip */}
        <div
          data-testid="lessons-unit-strip"
          className={`grid grid-cols-1 ${
            LESSONS_GRID_COLS[visibleLessons.length] ?? 'sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5'
          } gap-3`}
        >
          {visibleLessons.map((lesson) => {
            const active = lesson.id === activeLesson.id;
            return (
              <button
                key={lesson.id}
                type="button"
                data-testid={`lesson-unit-card-${lesson.level}`}
                onClick={() => {
                  setActiveLessonId(lesson.id);
                  onSelectLevel(lesson.level);
                  setCardIndex(0);
                  setIsFlipped(false);
                }}
                className={`min-w-0 min-h-[76px] p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-[#1B1D26] border-[#D92525]'
                    : 'bg-white/70 dark:bg-[#16181F] border-stone-200 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700'
                }`}
              >
                <p className="text-xs font-mono-nums text-[#D92525] dark:text-rose-400 font-semibold">
                  {lesson.code}
                </p>
                <p className="text-sm font-semibold text-[#141413] dark:text-white mt-1 line-clamp-1">
                  {lesson.title}
                </p>
                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 truncate">
                  {lesson.focusSkills.join(' · ')}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Complete 6-Skill JLPT Exam Labs (Vocab, Grammar, Reading, Writing, Listening, Speaking) */}
      <JlptSkillLabsPanel
        selectedLevel={effectiveSelectedLevel}
        showRomaji={showRomaji}
        soundEnabled={soundEnabled}
        masteredItemIds={masteredItemIds}
        onMasterItem={onMasterItem}
        onRecordQuizAnswer={onRecordQuizAnswer}
        onRecordReadingSpeed={onRecordReadingSpeed}
        onPracticeSpeakingPhrase={(phrase) => {
          setSpokenInput(phrase);
          setPronFeedback(null);
          setPronError(null);
          document
            .getElementById('ai-pronunciation-studio')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />

      {/* Main Grid: Interactive Flashcard + Pronunciation Coach | Adaptive Quiz */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left: Interactive 3D Flashcard + Pronunciation Practice */}
        <div className="lg:col-span-6 min-w-0 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#141413] dark:text-white">
              Interactive Flashcard ({effectiveSelectedLevel})
            </h2>
            <span className="text-xs font-mono-nums text-stone-500 dark:text-zinc-400 shrink-0">
              Card {(cardIndex % levelCards.length) + 1} of {levelCards.length}
            </span>
          </div>

          <div className="perspective-1000">
            <div
              className={`grid grid-cols-1 w-full preserve-3d transition-transform duration-500 ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front Face */}
              <div
                aria-hidden={isFlipped}
                className={`[grid-area:1/1] backface-hidden rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-7 flex flex-col justify-between min-h-[260px] ${
                  isFlipped ? 'pointer-events-none' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs text-stone-500 dark:text-zinc-400">
                  <span>
                    {currentCard.level} · {currentCard.category}
                  </span>
                  <button
                    type="button"
                    tabIndex={isFlipped ? -1 : undefined}
                    onClick={() => handleSpeak(currentCard.id, currentCard.plainJapanese)}
                    aria-label="Play flashcard pronunciation"
                    className={`inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                      speakingId === currentCard.id
                        ? 'border-[#D92525] text-[#D92525] bg-[#D92525]/5'
                        : 'border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-200 hover:border-[#D92525]/50'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {speakingId === currentCard.id ? 'Speaking…' : 'Listen'}
                  </button>
                </div>

                <div className="py-5">
                  <JapaneseText
                    segments={currentCard.segments}
                    plainText={currentCard.plainJapanese}
                    reading={currentCard.reading}
                    romaji={currentCard.romaji}
                    showFurigana={showFurigana}
                    showRomaji={showRomaji}
                    className="text-2xl sm:text-3xl font-bold text-[#141413] dark:text-white"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-100 dark:border-zinc-800">
                  <button
                    type="button"
                    tabIndex={isFlipped ? -1 : undefined}
                    onClick={() => {
                      setIsFlipped(true);
                      playCardFlipSound(soundEnabled);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2.5 rounded-lg bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                    Flip for Meaning &amp; Exam Note
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      tabIndex={isFlipped ? -1 : undefined}
                      onClick={() => {
                        setIsFlipped(false);
                        setCardIndex((prev) => (prev + 1) % levelCards.length);
                        setPronFeedback(null);
                      }}
                      className="min-h-[42px] px-3.5 py-2.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      Next Card
                    </button>
                  </div>
                </div>
              </div>

              {/* Back Face */}
              <div
                aria-hidden={!isFlipped}
                className={`[grid-area:1/1] backface-hidden rotate-y-180 rounded-2xl bg-white dark:bg-[#16181F] border border-[#D92525]/40 p-5 sm:p-7 flex flex-col justify-between min-h-[260px] ${
                  !isFlipped ? 'pointer-events-none' : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-zinc-400">
                    <span className="font-semibold text-[#D92525] dark:text-rose-400">
                      Meaning &amp; JLPT Note
                    </span>
                    <span>{currentCard.level}</span>
                  </div>
                  <p className="text-xl font-bold text-[#141413] dark:text-white">
                    {currentCard.english}
                  </p>
                  <p className="text-sm text-stone-600 dark:text-zinc-300 leading-relaxed">
                    <span className="font-semibold text-[#141413] dark:text-white">Grammar: </span>
                    {currentCard.grammarTip}
                  </p>
                  <p className="text-xs text-stone-600 dark:text-zinc-400 bg-stone-50 dark:bg-[#1D202A] p-3 rounded-lg border border-stone-200/70 dark:border-zinc-800">
                    <span className="font-semibold text-[#D92525] dark:text-rose-400">
                      JLPT Exam Tip:{' '}
                    </span>
                    {currentCard.examNote}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-100 dark:border-zinc-800">
                  <button
                    type="button"
                    tabIndex={!isFlipped ? -1 : undefined}
                    onClick={() => {
                      setIsFlipped(false);
                      playCardFlipSound(soundEnabled);
                    }}
                    className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2.5 rounded-lg border border-stone-300 dark:border-zinc-700 text-xs font-semibold text-[#141413] dark:text-white cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                    Show Front
                  </button>
                  <button
                    type="button"
                    tabIndex={!isFlipped ? -1 : undefined}
                    onClick={() => {
                      setIsFlipped(false);
                      setCardIndex((prev) => (prev + 1) % levelCards.length);
                      onGainXp(10);
                    }}
                    className="min-h-[42px] px-4 py-2.5 rounded-lg bg-[#141413] dark:bg-white text-white dark:text-[#141413] text-xs font-semibold cursor-pointer"
                  >
                    Got It (+10 XP)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Speech Recognition & AI Pronunciation Practice */}
          <div
            id="ai-pronunciation-studio"
            className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#141413] dark:text-white">
                  AI Pronunciation Studio
                </h3>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  Speak the flashcard phrase aloud for mora &amp; pitch-accent feedback.
                </p>
              </div>

              <button
                type="button"
                onClick={startSpeechCapture}
                className={`inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  isListening
                    ? 'bg-[#D92525] text-white'
                    : 'bg-stone-100 dark:bg-[#232632] text-[#141413] dark:text-white hover:bg-stone-200 dark:hover:bg-zinc-700'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" aria-hidden="true" />
                    Listening…
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
                    Record Speech
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <label htmlFor="spoken-jp-input" className="sr-only">
                Spoken Japanese transcript
              </label>
              <input
                id="spoken-jp-input"
                type="text"
                value={spokenInput}
                onChange={(e) => setSpokenInput(e.target.value)}
                placeholder={`Speak or type: ${currentCard.plainJapanese}`}
                className="flex-1 min-h-[42px] px-3.5 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-sm font-jp text-[#141413] dark:text-white focus:outline-none focus:border-[#D92525]"
              />
              <button
                type="button"
                onClick={submitPronunciationCheck}
                disabled={checkingPron}
                className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 rounded-lg bg-[#D92525] hover:bg-[#B91C1C] disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                {checkingPron ? 'Analyzing…' : 'Analyze Accent'}
              </button>
            </div>

            {pronError && (
              <p className="text-xs text-amber-700 dark:text-amber-300">{pronError}</p>
            )}

            {pronFeedback && (
              <div className="rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200 dark:border-zinc-800 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#141413] dark:text-white">
                    Mora Accuracy Score
                  </span>
                  <span className="font-mono-nums font-bold text-sm text-[#D92525] dark:text-rose-400">
                    {pronFeedback.accuracyScore}%
                  </span>
                </div>
                <p className="text-stone-600 dark:text-zinc-300">
                  <strong className="text-[#141413] dark:text-white">Pitch Tip:</strong>{' '}
                  {pronFeedback.pitchTip}
                </p>
                <p className="text-stone-600 dark:text-zinc-300">{pronFeedback.moraBreakdown}</p>
                <p className="font-medium text-emerald-700 dark:text-emerald-400">
                  {pronFeedback.encouragement}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Adaptive Quiz Module with Celebratory Hanko Animation */}
        <div className="lg:col-span-6 min-w-0 rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-7 space-y-5 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-stone-500 dark:text-zinc-400">
                Adaptive JLPT Quiz · {adaptive.difficultyLabel} ({adaptive.recommendedLevel})
              </p>
              <h2 className="text-lg font-bold text-[#141413] dark:text-white mt-0.5">
                {activeQuestion.skill} Check
              </h2>
            </div>

            <button
              type="button"
              onClick={handleGenerateAdaptiveQuiz}
              disabled={loadingAiQuiz}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 text-xs font-semibold text-[#141413] dark:text-zinc-100 hover:border-[#D92525]/60 cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
              {loadingAiQuiz ? 'Generating…' : 'AI Adaptive Question'}
            </button>
          </div>

          <p className="text-xs text-stone-500 dark:text-zinc-400">{adaptive.rationale}</p>
          {aiQuizError && <p className="text-xs text-amber-600 dark:text-amber-400">{aiQuizError}</p>}

          <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200/70 dark:border-zinc-800 space-y-3">
            <p className="text-sm font-medium text-[#141413] dark:text-zinc-100">
              {activeQuestion.prompt}
            </p>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <JapaneseText
                  segments={activeQuestion.segments}
                  plainText={activeQuestion.plainJapanese}
                  romaji={activeQuestion.romaji}
                  showFurigana={showFurigana}
                  showRomaji={showRomaji}
                  className="text-xl sm:text-2xl font-bold text-[#141413] dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => handleSpeak(activeQuestion.id, activeQuestion.plainJapanese)}
                aria-label="Listen to quiz sentence"
                className="min-h-[42px] min-w-[42px] p-2.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-stone-700 dark:text-zinc-200 hover:border-[#D92525] flex items-center justify-center cursor-pointer shrink-0"
              >
                <Volume2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeQuestion.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              const isCorrectOption = opt.id === activeQuestion.correctOptionId;
              let stateClass =
                'border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#1A1C25] hover:border-[#D92525]/60';
              if (quizFeedback !== null) {
                if (isCorrectOption) {
                  stateClass =
                    'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
                } else if (isSelected) {
                  stateClass =
                    'border-[#D92525] bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt.id)}
                  disabled={quizFeedback !== null}
                  className={`min-h-[52px] p-3.5 rounded-xl border text-left transition-all cursor-pointer disabled:cursor-default ${stateClass}`}
                >
                  <div className="font-jp text-base font-bold">{opt.label}</div>
                  {showRomaji && opt.reading && (
                    <div className="text-xs font-mono-nums text-stone-500 dark:text-zinc-400 mt-0.5">
                      {opt.reading}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {quizFeedback && (
            <div className="rounded-xl p-4 border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-[#1B1E28] flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold">
                  {quizFeedback === 'correct' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                      <span className="text-emerald-700 dark:text-emerald-400">
                        正解！ +25 XP earned
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-[#D92525]" aria-hidden="true" />
                      <span className="text-[#D92525] dark:text-rose-400">
                        Not quite · -1 Heart
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                  {activeQuestion.explanation}
                </p>
              </div>

              {quizFeedback === 'correct' && (
                <div
                  aria-hidden="true"
                  className="animate-hanko-stamp shrink-0 h-12 w-12 rounded-lg border-2 border-[#D92525] text-[#D92525] font-jp font-bold text-sm flex items-center justify-center"
                >
                  合格
                </div>
              )}

              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-4 py-2 rounded-lg bg-[#141413] dark:bg-white text-white dark:text-[#141413] text-xs font-semibold whitespace-nowrap cursor-pointer shrink-0"
              >
                Next Question
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Hover-to-Translate Speech Bubbles & Textbook vs. Anime Comparison Slider */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Hover-to-Translate Speech Bubbles */}
        <div className="lg:col-span-6 min-w-0 rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-6 space-y-5">
          <div>
            <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
              漫画・会話 · Hover or Tap Highlighted Terms
            </p>
            <h2 className="text-xl font-bold text-[#141413] dark:text-white mt-0.5">
              Hover-to-Translate Speech Bubbles
            </h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
              Inspect casual slang, contractions, and expressive Japanese onomatopoeia in context.
            </p>
          </div>

          <div className="space-y-4">
            {SPEECH_BUBBLES.map((bubble) => (
              <div
                key={bubble.id}
                className="rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200 dark:border-zinc-800 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-stone-500 dark:text-zinc-400">
                  <span className="font-semibold text-[#141413] dark:text-zinc-200 min-w-0 truncate">
                    {bubble.speaker} · {bubble.scene}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSpeak(bubble.id, bubble.plainJapanese)}
                    aria-label={`Play ${bubble.speaker} speech bubble`}
                    className="inline-flex items-center gap-1 min-h-[38px] px-2.5 py-1.5 rounded-lg text-[#D92525] dark:text-rose-400 font-medium cursor-pointer shrink-0"
                  >
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Play
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 font-jp text-lg font-medium text-[#141413] dark:text-white">
                  {bubble.tokens.map((tok) => {
                    const isFocused = hoveredTokenId === tok.id;
                    return (
                      <button
                        key={tok.id}
                        type="button"
                        onMouseEnter={() => setHoveredTokenId(tok.id)}
                        onFocus={() => setHoveredTokenId(tok.id)}
                        onClick={() => setHoveredTokenId(tok.id)}
                        className={`min-h-[40px] px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isFocused
                            ? 'border-[#D92525] bg-[#D92525]/10 text-[#D92525] dark:text-rose-300'
                            : 'border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] hover:border-[#D92525]/50'
                        }`}
                      >
                        {tok.surface}
                      </button>
                    );
                  })}
                </div>

                {showRomaji && (
                  <p className="text-xs font-mono-nums text-stone-500 dark:text-zinc-400">
                    {bubble.romaji}
                  </p>
                )}
                <p className="text-xs text-stone-600 dark:text-zinc-300">“{bubble.english}”</p>
              </div>
            ))}
          </div>

          {/* Live Breakdown Inspector */}
          <div className="rounded-xl border border-[#D92525]/30 bg-rose-50/40 dark:bg-rose-950/20 p-4 space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#D92525] dark:text-rose-400">
                {activeHoveredToken.tag} Breakdown
              </span>
              <span className="font-mono-nums text-stone-500 dark:text-zinc-400">
                {activeHoveredToken.reading} · {activeHoveredToken.romaji}
              </span>
            </div>
            <p className="text-base font-bold text-[#141413] dark:text-white">
              <span className="font-jp">{activeHoveredToken.surface}</span> —{' '}
              {activeHoveredToken.meaning}
            </p>
            <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
              {activeHoveredToken.nuanceNote}
            </p>
          </div>
        </div>

        {/* Textbook vs. Anime Japanese Comparison Slider */}
        <div className="lg:col-span-6 min-w-0 rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
                  教科書 vs. アニメ · Register Spectrum
                </p>
                <h2 className="text-xl font-bold text-[#141413] dark:text-white mt-0.5">
                  Textbook vs. Anime Japanese Slider
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {TEXTBOOK_VS_ANIME.map((ex, idx) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => setTvaIndex(idx)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      tvaIndex === idx
                        ? 'bg-[#141413] dark:bg-white text-white dark:text-[#141413]'
                        : 'bg-stone-100 dark:bg-[#232632] text-stone-600 dark:text-zinc-300'
                    }`}
                  >
                    Case {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Situation: <strong className="text-[#141413] dark:text-zinc-200">{tvaExample.situation}</strong> ({tvaExample.level})
            </p>

            {/* Range Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-stone-600 dark:text-zinc-400">
                <span>0% Textbook Polite</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#D92525] dark:text-rose-400">
                  <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                  {activeRegister.registerLabel} ({sliderValue}%)
                </span>
                <span>100% Anime Slang</span>
              </div>
              <label htmlFor="register-slider" className="sr-only">
                Textbook to Anime speech register slider
              </label>
              <input
                id="register-slider"
                type="range"
                min={0}
                max={100}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full h-6 accent-[#D92525] cursor-pointer"
              />
            </div>

            {/* Active Register Display */}
            <div className="rounded-xl bg-stone-50 dark:bg-[#1B1E28] border border-stone-200 dark:border-zinc-800 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-jp font-semibold text-[#D92525] dark:text-rose-400">
                  {activeRegister.japaneseTag}
                </span>
                <button
                  type="button"
                  onClick={() => handleSpeak('tva-speech', activeRegister.japanese)}
                  aria-label="Play register phrase audio"
                  className="inline-flex items-center gap-1 min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#141413] dark:text-zinc-200 hover:text-[#D92525] cursor-pointer shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Hear Expression
                </button>
              </div>

              <JapaneseText
                plainText={activeRegister.japanese}
                reading={activeRegister.reading}
                romaji={activeRegister.romaji}
                showFurigana={showFurigana}
                showRomaji={showRomaji}
                className="text-2xl font-bold text-[#141413] dark:text-white"
              />

              <p className="text-sm font-medium text-stone-700 dark:text-zinc-200">
                “{activeRegister.english}”
              </p>
              <p className="text-xs text-stone-600 dark:text-zinc-400 leading-relaxed pt-2 border-t border-stone-200/70 dark:border-zinc-700">
                {activeRegister.grammarNote}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-center text-xs">
            {[
              { label: 'Textbook', val: 10 },
              { label: 'Tokyo Casual', val: 50 },
              { label: 'Anime Slang', val: 95 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setSliderValue(preset.val)}
                className={`min-h-[42px] py-2.5 px-3 rounded-lg border font-medium cursor-pointer transition-colors ${
                  interpolateRegisterTier(sliderValue) === interpolateRegisterTier(preset.val)
                    ? 'border-[#D92525] text-[#D92525] dark:text-rose-400 bg-[#D92525]/5'
                    : 'border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Community Discussion Board Under Each Lesson */}
      <section className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <MessageSquare className="w-5 h-5 text-[#D92525] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#141413] dark:text-white">
                Community Nuance &amp; Quote Board — {activeLesson.title}
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Discuss subtle grammar differences and share your favorite anime or novel lines.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono-nums text-stone-500 dark:text-zinc-400">
            {lessonDiscussions.length} notes in this lesson
          </span>
        </div>

        <form onSubmit={handleDiscussionSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label htmlFor="quote-input" className="sr-only">
              Japanese quote or phrase (optional)
            </label>
            <input
              id="quote-input"
              type="text"
              value={quoteInput}
              onChange={(e) => setQuoteInput(e.target.value)}
              placeholder="Quote / phrase (optional, e.g. やばい！)"
              className="w-full min-h-[42px] px-3.5 py-2.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-sm font-jp text-[#141413] dark:text-white focus:outline-none focus:border-[#D92525]"
            />
          </div>
          <div className="md:col-span-6">
            <label htmlFor="comment-input" className="sr-only">
              Nuance comment
            </label>
            <input
              id="comment-input"
              type="text"
              required
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Share a nuance insight, JLPT memory hook, or favorite line…"
              className="w-full min-h-[42px] px-3.5 py-2.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-sm text-[#141413] dark:text-white focus:outline-none focus:border-[#D92525]"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={postingDiscussion}
              className="w-full min-h-[42px] h-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              Post Note
            </button>
          </div>
        </form>

        {discussionError && (
          <p role="alert" className="text-xs font-medium text-[#D92525] dark:text-rose-400">
            {discussionError}
          </p>
        )}

        <div className="divide-y divide-stone-200 dark:divide-zinc-800">
          {lessonDiscussions.length === 0 ? (
            <p className="py-6 text-sm text-stone-500 dark:text-zinc-400">
              No notes posted for this unit yet—share the first nuance tip above!
            </p>
          ) : (
            lessonDiscussions.map((post) => (
              <article key={post.id} className="py-4 flex items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-zinc-400">
                    <span className="font-semibold text-[#141413] dark:text-white">
                      {post.author}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{post.jlptBadge}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-nums">{post.createdAt.slice(0, 10)}</span>
                  </div>
                  {post.quoteOrPhrase && (
                    <p className="font-jp text-sm font-semibold text-[#D92525] dark:text-rose-400">
                      「{post.quoteOrPhrase}」
                    </p>
                  )}
                  <p className="text-sm text-stone-700 dark:text-zinc-300 leading-relaxed">
                    {post.comment}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onUpvoteDiscussion(post.id)}
                  aria-label={`Upvote note by ${post.author}`}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-xs font-mono-nums text-stone-600 dark:text-zinc-300 hover:border-[#D92525] cursor-pointer shrink-0"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
                  {post.upvotes}
                </button>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
