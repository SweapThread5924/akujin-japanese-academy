import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { TopNav, type AppTab } from './components/TopNav';
import { JlptLevelBadge } from './components/JlptLevelBadge';
import { OverviewSection } from './components/OverviewSection';
import { FoundationsSection } from './components/FoundationsSection';
import { LessonsSection, type DiscussionItem } from './components/LessonsSection';
import { KanjiSrsSection, type FocusedKanjiRequest } from './components/KanjiSrsSection';
import { KanjiDictionarySection } from './components/KanjiDictionarySection';
import type { KanjiPracticeMode } from './components/KanjiDrawingBoard';
import type { JoyoKanjiEntry } from './utils/datasetLoader';
import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SakuraWelcomeCelebration } from './components/SakuraWelcomeCelebration';
import { ResourcesSection } from './components/ResourcesSection';
import { StudyInJapanSection } from './components/StudyInJapanSection';
import { RoadmapSection } from './components/RoadmapSection';
import {
  BackToTopButton,
  ScrollProgressBar,
  useAutoScrollReveal,
} from './components/RevealOnScroll';
import {
  getStartingTrackMeta,
  type OnboardingAnswers,
  type StartingTrackId,
} from './utils/onboardingProfile';
import {
  ScenariosSection,
  type BookmarkedPhrase,
} from './components/ScenariosSection';
import {
  LeaderboardSyncSection,
  type LeaderboardRow,
} from './components/LeaderboardSyncSection';
import { ACHIEVEMENTS } from './data/curriculumData';
import {
  calculateSm2Review,
  createInitialSrsProgress,
  type JlptLevel,
  type SrsCardProgress,
  type SrsRating,
} from './utils/srsEngine';
import {
  createAchievementToastItem,
  createStandardToastItem,
  detectNewMilestoneAchievements,
  dismissToastItem,
  enqueueToastItems,
  sanitizeUnlockedAchievements,
  type ToastNotificationItem,
} from './utils/achievementToast';
import { ToastNotificationHost } from './components/ToastNotificationHost';
import {
  purchaseStreakFreeze,
  resolveStreakOnStudy,
  STREAK_FREEZE_COST_XP,
  type StreakFreezeLogEntry,
} from './utils/streakFreeze';
import { loadOfflineState, saveOfflineState } from './utils/speechAndPwa';
import {
  DEFAULT_DAILY_STUDY_GOAL_MINUTES,
  estimateTodayStudyMinutes,
  normalizeDailyStudyGoal,
  type DailyStudyGoalMinutes,
} from './utils/dailyStudyGoal';
import {
  SOUND_PREF_STORAGE_KEY,
  parseStoredSoundPreference,
  playAchievementSound,
  playCardFlipSound,
  playQuizFeedbackSound,
  primeAudioContext,
} from './utils/soundEffects';
import {
  AUDIO_SPEED_STORAGE_KEY,
  clampAudioSpeed,
  parseStoredAudioSpeed,
} from './utils/audioSpeed';
import { validateNewsletterEmail } from './utils/authAndForms';
import {
  auth,
  clearAccessToken,
  loadLearnerProfileFromFirestore,
  signInWithGoogleFirebase,
  signOutFirebase,
  syncLearnerProfileToFirestore,
} from './firebase';
import {
  ALL_JLPT_LEVELS,
  readStoredVisibleJlptLevels,
  resolveActiveVisibleLevel,
  toggleVisibleJlptLevel,
  writeStoredVisibleJlptLevels,
} from './utils/jlptVisibility';
import {
  prependReadingSpeedRecord,
  sanitizeReadingSpeedRecords,
  summarizeReadingSpeed,
  type ReadingSpeedRecord,
} from './utils/readingSpeed';
import { FloatingGmailLauncher } from './components/FloatingGmailLauncher';
import { QuickActionMenu } from './components/QuickActionMenu';

interface LearnerState {
  profileId: string;
  email?: string;
  name: string;
  xp: number;
  streak: number;
  hearts: number;
  maxHearts: number;
  lastStudyDate: string;
  targetLevel: JlptLevel;
  quizCorrectTotal: number;
  recentQuizResults: boolean[];
  srsProgress: Record<string, SrsCardProgress>;
  heatmapHistory: Record<string, number>;
  bookmarkedPhrases: BookmarkedPhrase[];
  unlockedAchievements: string[];
  masteredItemIds: string[];
  streakFreezes: number;
  streakFreezeHistory: StreakFreezeLogEntry[];
  dailyStudyGoalMinutes: DailyStudyGoalMinutes;
  onboardingCompleted: boolean;
  startingTrack: StartingTrackId | null;
  onboardingAnswers?: Partial<OnboardingAnswers>;
  readingSpeedRecords: ReadingSpeedRecord[];
}

interface StoredSession {
  profileId: string;
  email: string;
  name: string;
  authType: 'email' | 'google';
}

const SESSION_STORAGE_KEY = 'akujin_session_v1';

const DEFAULT_STATE: LearnerState = {
  profileId: 'akujin-local',
  name: 'Guest Learner',
  xp: 0,
  streak: 0,
  hearts: 0,
  maxHearts: 5,
  lastStudyDate: '',
  targetLevel: 'N5',
  quizCorrectTotal: 0,
  recentQuizResults: [],
  srsProgress: {},
  heatmapHistory: {},
  bookmarkedPhrases: [],
  unlockedAchievements: [],
  masteredItemIds: [],
  streakFreezes: 0,
  streakFreezeHistory: [],
  dailyStudyGoalMinutes: DEFAULT_DAILY_STUDY_GOAL_MINUTES,
  onboardingCompleted: false,
  startingTrack: null,
  readingSpeedRecords: [],
};

function normalizeLearnerState(raw: Partial<LearnerState> & { profileId?: string }): LearnerState {
  return {
    ...DEFAULT_STATE,
    ...raw,
    xp: typeof raw.xp === 'number' ? Math.max(0, raw.xp) : 0,
    streak: typeof raw.streak === 'number' ? Math.max(0, raw.streak) : 0,
    hearts: typeof raw.hearts === 'number' ? Math.max(0, raw.hearts) : 0,
    maxHearts: typeof raw.maxHearts === 'number' ? Math.max(1, raw.maxHearts) : 5,
    masteredItemIds: Array.isArray(raw.masteredItemIds) ? raw.masteredItemIds : [],
    unlockedAchievements: sanitizeUnlockedAchievements(raw.unlockedAchievements),
    streakFreezes: typeof raw.streakFreezes === 'number' ? Math.max(0, raw.streakFreezes) : 0,
    streakFreezeHistory: Array.isArray(raw.streakFreezeHistory) ? raw.streakFreezeHistory : [],
    dailyStudyGoalMinutes: normalizeDailyStudyGoal(raw.dailyStudyGoalMinutes),
    onboardingCompleted: Boolean(raw.onboardingCompleted),
    startingTrack: (raw.startingTrack as StartingTrackId | null) ?? null,
    readingSpeedRecords: sanitizeReadingSpeedRecords(raw.readingSpeedRecords),
  };
}

function loadStoredSession(): StoredSession | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [visibleJlptLevels, setVisibleJlptLevels] = useState<JlptLevel[]>(() =>
    readStoredVisibleJlptLevels()
  );
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>(() =>
    resolveActiveVisibleLevel('N5', readStoredVisibleJlptLevels())
  );
  const mainRef = useRef<HTMLElement | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('akujin_theme') === 'dark';
  });
  const [showFurigana, setShowFurigana] = useState(true);
  const [showRomaji, setShowRomaji] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return parseStoredSoundPreference(localStorage.getItem(SOUND_PREF_STORAGE_KEY));
  });
  const [audioSpeed, setAudioSpeed] = useState<number>(() => {
    if (typeof window === 'undefined') return 1.0;
    return parseStoredAudioSpeed(localStorage.getItem(AUDIO_SPEED_STORAGE_KEY));
  });
  const [initialKanjiMode] = useState<KanjiPracticeMode>(() => {
    if (typeof window === 'undefined') return 'stroke-order';
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'trace' ? 'precision-trace' : 'stroke-order';
  });

  const [session, setSession] = useState<StoredSession | null>(() => loadStoredSession());
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [gmailModalOpen, setGmailModalOpen] = useState(false);
  const [kanjiJumpRequest, setKanjiJumpRequest] = useState<FocusedKanjiRequest | null>(null);
  const skipNextScrollTopRef = useRef(false);

  const [learner, setLearner] = useState<LearnerState>(DEFAULT_STATE);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [sakuraWelcome, setSakuraWelcome] = useState<{
    active: boolean;
    trackLabel?: string;
    dailyGoalMinutes?: number;
  }>({ active: false });
  const [bootstrapReady, setBootstrapReady] = useState(false);
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [lastOfflineSyncAt, setLastOfflineSyncAt] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotificationItem[]>([]);
  const toastTimersRef = useRef<Map<string, number>>(new Map());
  const toastDurationMapRef = useRef<Map<string, number>>(new Map());
  const knownUnlockedRef = useRef<Set<string>>(new Set());

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterWebsite, setNewsletterWebsite] = useState(''); // Hidden anti-spam honeypot
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  const dismissToast = useCallback((id: string) => {
    const existingTimer = toastTimersRef.current.get(id);
    if (existingTimer !== undefined) {
      window.clearTimeout(existingTimer);
      toastTimersRef.current.delete(id);
    }
    toastDurationMapRef.current.delete(id);
    setToasts((prev) => dismissToastItem(prev, id));
  }, []);

  const scheduleToastDismiss = useCallback(
    (id: string, durationMs: number) => {
      const prevTimer = toastTimersRef.current.get(id);
      if (prevTimer !== undefined) {
        window.clearTimeout(prevTimer);
      }
      toastDurationMapRef.current.set(id, durationMs);
      const timerId = window.setTimeout(() => {
        toastTimersRef.current.delete(id);
        toastDurationMapRef.current.delete(id);
        setToasts((prev) => dismissToastItem(prev, id));
      }, durationMs);
      toastTimersRef.current.set(id, timerId);
    },
    []
  );

  const pauseToastTimer = useCallback((id: string) => {
    const timer = toastTimersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
  }, []);

  const resumeToastTimer = useCallback(
    (id: string) => {
      const durationMs = toastDurationMapRef.current.get(id);
      if (durationMs !== undefined && !toastTimersRef.current.has(id)) {
        scheduleToastDismiss(id, Math.min(durationMs, 2500));
      }
    },
    [scheduleToastDismiss]
  );

  const enqueueToasts = useCallback(
    (items: ToastNotificationItem[]) => {
      if (items.length === 0) return;
      setToasts((prev) => enqueueToastItems(prev, items));
      for (const item of items) {
        scheduleToastDismiss(item.id, item.durationMs);
      }
    },
    [scheduleToastDismiss]
  );

  const showToast = useCallback(
    (msg: string) => {
      enqueueToasts([createStandardToastItem(msg)]);
    },
    [enqueueToasts]
  );

  useEffect(() => {
    const timers = toastTimersRef.current;
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('akujin_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('akujin_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SOUND_PREF_STORAGE_KEY, String(soundEnabled));
    }
  }, [soundEnabled]);

  useEffect(() => {
    writeStoredVisibleJlptLevels(visibleJlptLevels);
  }, [visibleJlptLevels]);

  useEffect(() => {
    setSelectedLevel((curr) => resolveActiveVisibleLevel(curr, visibleJlptLevels));
  }, [visibleJlptLevels, selectedLevel]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUDIO_SPEED_STORAGE_KEY, String(audioSpeed));
    }
  }, [audioSpeed]);

  const handleChangeAudioSpeed = useCallback((nextSpeed: number) => {
    setAudioSpeed(clampAudioSpeed(nextSpeed));
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (next) {
        primeAudioContext();
        playCardFlipSound(true);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setActiveTab('foundations');
    }
    const tabParam = params.get('tab');
    if (tabParam === 'gmail') {
      setGmailModalOpen(true);
    } else if (
      tabParam &&
      [
        'overview',
        'roadmap',
        'foundations',
        'lessons',
        'kanji',
        'dictionary',
        'scenarios',
        'study-japan',
        'resources',
        'leaderboard',
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam as AppTab);
    }
  }, []);

  useEffect(() => {
    if (skipNextScrollTopRef.current) {
      skipNextScrollTopRef.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  // Listen to Firebase Auth state for Google-signed-in cloud sync
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user?.emailVerified && user.email) {
        try {
          const remote = await loadLearnerProfileFromFirestore(user);
          if (remote) {
            const loaded = normalizeLearnerState({
              ...(remote as Partial<LearnerState>),
              profileId: `fb-${user.uid}`,
              email: user.email,
            });
            knownUnlockedRef.current = new Set(loaded.unlockedAchievements);
            setLearner(loaded);
            setSelectedLevel(loaded.targetLevel || 'N5');
            const sess: StoredSession = {
              profileId: loaded.profileId,
              email: user.email,
              name: loaded.name,
              authType: 'google',
            };
            setSession(sess);
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sess));
            void fetch('/api/progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profileId: loaded.profileId, patch: loaded }),
            })
              .then((r) => (r.ok ? r.json() : null))
              .then((res) => {
                if (Array.isArray(res?.leaderboard)) setLeaderboard(res.leaderboard);
              })
              .catch(() => {});
          }
        } catch {
          // Offline / emulator fallback silently ignored
        }
      }
    });
    return () => unsub();
  }, []);

  // Bootstrap active session profile (email profileId if logged in, else akujin-local)
  useEffect(() => {
    const activeProfileId = session?.profileId || 'akujin-local';
    const isGoogleSession = session?.authType === 'google';
    const cached = loadOfflineState<{
      learner: LearnerState;
      discussions: DiscussionItem[];
      leaderboard: LeaderboardRow[];
    }>();
    if (cached) {
      setLastOfflineSyncAt(cached.savedAt);
    }

    fetch(`/api/bootstrap?profileId=${encodeURIComponent(activeProfileId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Bootstrap failed'))))
      .then((data) => {
        if (data.profile && !isGoogleSession) {
          const loaded = normalizeLearnerState(data.profile);
          knownUnlockedRef.current = new Set(loaded.unlockedAchievements);
          setLearner(loaded);
          setSelectedLevel((loaded.targetLevel as JlptLevel) || 'N5');
          if (!loaded.onboardingCompleted) {
            setOnboardingModalOpen(true);
          }
        }
        if (Array.isArray(data.discussions)) setDiscussions(data.discussions);
        if (Array.isArray(data.leaderboard)) setLeaderboard(data.leaderboard);
      })
      .catch(() => {
        if (cached?.payload && cached.payload.learner?.profileId === activeProfileId) {
          const loaded = normalizeLearnerState(cached.payload.learner);
          knownUnlockedRef.current = new Set(loaded.unlockedAchievements);
          setLearner(loaded);
          setDiscussions(cached.payload.discussions);
          setLeaderboard(cached.payload.leaderboard);
          if (!loaded.onboardingCompleted && !isGoogleSession) {
            setOnboardingModalOpen(true);
          }
        } else if (!isGoogleSession) {
          setOnboardingModalOpen(true);
        }
      })
      .finally(() => {
        setBootstrapReady(true);
      });
  }, [session?.profileId, session?.authType]);

  // Trigger animated 'New Achievement Unlocked' cards when learner.unlockedAchievements grows
  useEffect(() => {
    if (!bootstrapReady) {
      knownUnlockedRef.current = new Set(learner.unlockedAchievements);
      return;
    }
    const newlyUnlockedIds = learner.unlockedAchievements.filter(
      (id) => !knownUnlockedRef.current.has(id)
    );
    if (newlyUnlockedIds.length === 0) return;

    for (const id of newlyUnlockedIds) {
      knownUnlockedRef.current.add(id);
    }

    const defsById = new Map(ACHIEVEMENTS.map((d) => [d.id, d]));
    const cards = newlyUnlockedIds
      .map((id) => defsById.get(id))
      .filter((d): d is NonNullable<typeof d> => Boolean(d))
      .map((def, idx) => createAchievementToastItem(def, Date.now() + idx));

    if (cards.length > 0) {
      playAchievementSound(soundEnabled);
      enqueueToasts(cards);
    }
  }, [learner.unlockedAchievements, bootstrapReady, soundEnabled, enqueueToasts]);

  const persistProgress = useCallback(
    (updater: (prev: LearnerState) => LearnerState) => {
      setLearner((prev) => {
        const nextDraft = updater(prev);
        const learnedCount = Object.values(nextDraft.srsProgress).filter(
          (c) => c.repetitions >= 1
        ).length;
        const achievementEval = detectNewMilestoneAchievements({
          xp: nextDraft.xp,
          streak: nextDraft.streak,
          learnedKanjiCount: learnedCount,
          bookmarkedCount: nextDraft.bookmarkedPhrases.length,
          quizCorrectTotal: nextDraft.quizCorrectTotal,
          existingUnlockedIds: nextDraft.unlockedAchievements,
        });
        const nextState: LearnerState = {
          ...nextDraft,
          xp: achievementEval.finalXp,
          unlockedAchievements: achievementEval.nextUnlockedIds,
        };

        const ts = saveOfflineState({
          learner: nextState,
          discussions,
          leaderboard,
        });
        setLastOfflineSyncAt(ts);

        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId: nextState.profileId,
            patch: nextState,
          }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((res) => {
            if (res?.leaderboard) setLeaderboard(res.leaderboard);
          })
          .catch(() => {});

        if (firebaseUser?.emailVerified) {
          void syncLearnerProfileToFirestore(firebaseUser, nextState).catch(() => {});
        }

        return nextState;
      });
    },
    [discussions, leaderboard, firebaseUser]
  );

  const handleSelectLevel = (lvl: JlptLevel) => {
    setVisibleJlptLevels((prev) =>
      prev.includes(lvl) ? prev : ALL_JLPT_LEVELS.filter((item) => prev.includes(item) || item === lvl)
    );
    setSelectedLevel(lvl);
    persistProgress((prev) => ({ ...prev, targetLevel: lvl }));
  };

  const handleToggleVisibleJlptLevel = (lvl: JlptLevel) => {
    const result = toggleVisibleJlptLevel(visibleJlptLevels, lvl);
    if (result.blockedLastLevel) {
      showToast('At least one JLPT level (N5–N1) must remain visible.');
      return;
    }
    setVisibleJlptLevels(result.next);
    setSelectedLevel((curr) => resolveActiveVisibleLevel(curr, result.next));
  };

  const handleShowAllJlptLevels = () => {
    setVisibleJlptLevels([...ALL_JLPT_LEVELS]);
  };

  const handleFocusOnlyVisibleLevel = (lvl: JlptLevel) => {
    setVisibleJlptLevels([lvl]);
    setSelectedLevel(lvl);
  };

  const handleJumpFromDictionary = useCallback(
    (entry: JoyoKanjiEntry, targetView: 'srs' | 'stroke-practice') => {
      setVisibleJlptLevels((prev) =>
        prev.includes(entry.level)
          ? prev
          : ALL_JLPT_LEVELS.filter((item) => prev.includes(item) || item === entry.level)
      );
      skipNextScrollTopRef.current = true;
      setKanjiJumpRequest({
        kanji: entry.kanji,
        level: entry.level,
        targetView,
        nonce: Date.now(),
      });
      setActiveTab('kanji');
    },
    []
  );

  const handleChangeDailyStudyGoal = (minutes: DailyStudyGoalMinutes) => {
    const normalized = normalizeDailyStudyGoal(minutes);
    persistProgress((prev) => ({ ...prev, dailyStudyGoalMinutes: normalized }));
    showToast(`Daily study goal set to ${normalized} min/day.`);
  };

  const handleCompleteOnboarding = (answers: OnboardingAnswers) => {
    const meta = getStartingTrackMeta(answers.startingTrack);
    setVisibleJlptLevels((prev) =>
      prev.includes(meta.mappedJlptLevel)
        ? prev
        : ALL_JLPT_LEVELS.filter((item) => prev.includes(item) || item === meta.mappedJlptLevel)
    );
    setSelectedLevel(meta.mappedJlptLevel);
    persistProgress((prev) => ({
      ...prev,
      onboardingCompleted: true,
      startingTrack: answers.startingTrack,
      targetLevel: meta.mappedJlptLevel,
      dailyStudyGoalMinutes: normalizeDailyStudyGoal(answers.dailyGoalMinutes),
      onboardingAnswers: answers,
    }));
    setOnboardingModalOpen(false);
    setSakuraWelcome({
      active: true,
      trackLabel: meta.shortBadgeLabel,
      dailyGoalMinutes: normalizeDailyStudyGoal(answers.dailyGoalMinutes),
    });
  };

  const handleSkipOnboarding = () => {
    setOnboardingModalOpen(false);
  };

  const handleGainXp = (amount: number) => {
    const today = new Date().toISOString().slice(0, 10);
    persistProgress((prev) => {
      const resolved = resolveStreakOnStudy({
        streak: prev.streak,
        lastStudyDate: prev.lastStudyDate,
        todayDate: today,
        streakFreezes: prev.streakFreezes,
        streakFreezeHistory: prev.streakFreezeHistory,
      });
      return {
        ...prev,
        xp: prev.xp + amount,
        streak: resolved.streak,
        lastStudyDate: resolved.lastStudyDate,
        streakFreezes: resolved.streakFreezes,
        streakFreezeHistory: resolved.streakFreezeHistory,
        heatmapHistory: {
          ...prev.heatmapHistory,
          [today]: (prev.heatmapHistory[today] ?? 0) + 1,
        },
      };
    });
  };

  const handleMasterItem = (itemId: string, xpReward: number) => {
    if (learner.masteredItemIds.includes(itemId)) return;
    const today = new Date().toISOString().slice(0, 10);
    persistProgress((prev) => {
      if (prev.masteredItemIds.includes(itemId)) return prev;
      const resolved = resolveStreakOnStudy({
        streak: prev.streak,
        lastStudyDate: prev.lastStudyDate,
        todayDate: today,
        streakFreezes: prev.streakFreezes,
        streakFreezeHistory: prev.streakFreezeHistory,
      });
      return {
        ...prev,
        xp: prev.xp + xpReward,
        hearts: Math.min(prev.maxHearts, prev.hearts + (prev.hearts < prev.maxHearts ? 1 : 0)),
        streak: resolved.streak,
        lastStudyDate: resolved.lastStudyDate,
        streakFreezes: resolved.streakFreezes,
        streakFreezeHistory: resolved.streakFreezeHistory,
        masteredItemIds: [...prev.masteredItemIds, itemId],
        heatmapHistory: {
          ...prev.heatmapHistory,
          [today]: (prev.heatmapHistory[today] ?? 0) + 1,
        },
      };
    });
    playQuizFeedbackSound(soundEnabled, true);
    showToast(`Mastered! +${xpReward} XP saved to your account.`);
  };

  const handleRecordQuizAnswer = (isCorrect: boolean, xpEarned: number) => {
    const today = new Date().toISOString().slice(0, 10);
    persistProgress((prev) => {
      const resolved = resolveStreakOnStudy({
        streak: prev.streak,
        lastStudyDate: prev.lastStudyDate,
        todayDate: today,
        streakFreezes: prev.streakFreezes,
        streakFreezeHistory: prev.streakFreezeHistory,
      });
      return {
        ...prev,
        xp: prev.xp + xpEarned,
        hearts: isCorrect
          ? Math.min(prev.maxHearts, prev.hearts + (prev.hearts === 0 ? 1 : 0))
          : Math.max(0, prev.hearts - 1),
        streak: resolved.streak,
        lastStudyDate: resolved.lastStudyDate,
        streakFreezes: resolved.streakFreezes,
        streakFreezeHistory: resolved.streakFreezeHistory,
        quizCorrectTotal: prev.quizCorrectTotal + (isCorrect ? 1 : 0),
        recentQuizResults: [...prev.recentQuizResults.slice(-14), isCorrect],
        heatmapHistory: {
          ...prev.heatmapHistory,
          [today]: (prev.heatmapHistory[today] ?? 0) + 1,
        },
      };
    });
  };

  const handleRestoreHearts = () => {
    persistProgress((prev) => ({ ...prev, hearts: prev.maxHearts }));
    showToast('Hearts refilled to 5/5! Keep practicing.');
  };

  const handleRecordReadingSpeed = (record: ReadingSpeedRecord) => {
    const today = new Date().toISOString().slice(0, 10);
    persistProgress((prev) => {
      const resolved = resolveStreakOnStudy({
        streak: prev.streak,
        lastStudyDate: prev.lastStudyDate,
        todayDate: today,
        streakFreezes: prev.streakFreezes,
        streakFreezeHistory: prev.streakFreezeHistory,
      });
      return {
        ...prev,
        xp: prev.xp + 10,
        streak: resolved.streak,
        lastStudyDate: resolved.lastStudyDate,
        streakFreezes: resolved.streakFreezes,
        streakFreezeHistory: resolved.streakFreezeHistory,
        readingSpeedRecords: prependReadingSpeedRecord(prev.readingSpeedRecords, record),
        heatmapHistory: {
          ...prev.heatmapHistory,
          [today]: (prev.heatmapHistory[today] ?? 0) + 1,
        },
      };
    });
    showToast(`${record.cpm} CPM (${record.level}) saved to your Progress Report! (+10 XP)`);
  };

  const handleReviewKanji = (kanjiId: string, rating: SrsRating) => {
    const today = new Date().toISOString().slice(0, 10);
    const xpGain = rating >= 4 ? (rating === 5 ? 30 : 20) : 5;
    persistProgress((prev) => {
      const existing = prev.srsProgress[kanjiId] ?? createInitialSrsProgress(kanjiId);
      const updatedCard = calculateSm2Review(existing, rating);
      const resolved = resolveStreakOnStudy({
        streak: prev.streak,
        lastStudyDate: prev.lastStudyDate,
        todayDate: today,
        streakFreezes: prev.streakFreezes,
        streakFreezeHistory: prev.streakFreezeHistory,
      });
      return {
        ...prev,
        xp: prev.xp + xpGain,
        streak: resolved.streak,
        lastStudyDate: resolved.lastStudyDate,
        streakFreezes: resolved.streakFreezes,
        streakFreezeHistory: resolved.streakFreezeHistory,
        srsProgress: {
          ...prev.srsProgress,
          [kanjiId]: updatedCard,
        },
        heatmapHistory: {
          ...prev.heatmapHistory,
          [today]: (prev.heatmapHistory[today] ?? 0) + 1,
        },
      };
    });
  };

  const handleToggleBookmark = (phrase: BookmarkedPhrase) => {
    persistProgress((prev) => {
      const exists = prev.bookmarkedPhrases.some((b) => b.id === phrase.id);
      return {
        ...prev,
        bookmarkedPhrases: exists
          ? prev.bookmarkedPhrases.filter((b) => b.id !== phrase.id)
          : [phrase, ...prev.bookmarkedPhrases],
      };
    });
  };

  const handlePostDiscussion = async (post: {
    lessonId: string;
    author: string;
    jlptBadge: string;
    quoteOrPhrase: string;
    comment: string;
  }) => {
    const res = await fetch('/api/discussions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Could not post nuance note right now.');
    }
    if (Array.isArray(data.discussions)) {
      setDiscussions(data.discussions);
    }
  };

  const handleUpvoteDiscussion = async (id: string) => {
    setDiscussions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, upvotes: d.upvotes + 1 } : d))
    );
    await fetch(`/api/discussions/${id}/upvote`, { method: 'POST' }).catch(() => {});
  };

  const handleSaveCloudBackup = async (customCode?: string) => {
    const res = await fetch('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ syncCode: customCode, profile: learner }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Backup failed');
    return data as { syncCode: string; savedAt: string };
  };

  const handleRestoreCloudBackup = async (syncCode: string) => {
    const res = await fetch(`/api/backup/${encodeURIComponent(syncCode.trim())}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Restore failed');
    if (data.profile) {
      const restoredLevel = (data.profile.targetLevel as JlptLevel) || 'N5';
      const restoredAchievements = sanitizeUnlockedAchievements(
        (data.profile as Partial<LearnerState>).unlockedAchievements
      );
      knownUnlockedRef.current = new Set(restoredAchievements);
      persistProgress((prev) =>
        normalizeLearnerState({
          ...data.profile,
          profileId: prev.profileId,
          email: prev.email,
        })
      );
      setSelectedLevel(restoredLevel);
      showToast('Cloud backup restored and saved to your profile.');
    }
  };

  const handleTriggerOfflineSync = () => {
    const ts = saveOfflineState({
      learner,
      discussions,
      leaderboard,
    });
    setLastOfflineSyncAt(ts);
    showToast('Offline study pack cached for subway & flight access.');
  };

  const handleBuyStreakFreeze = async (): Promise<{ ok: boolean; error?: string }> => {
    const localAttempt = purchaseStreakFreeze({
      xp: learner.xp,
      streakFreezes: learner.streakFreezes,
      streakFreezeHistory: learner.streakFreezeHistory,
    });
    if (!localAttempt.ok) {
      return { ok: false, error: localAttempt.error };
    }

    try {
      const res = await fetch('/api/streak-freeze/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: learner.profileId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Purchase could not be completed.' };
      }
      const nextLearner = normalizeLearnerState(data.profile);
      setLearner(nextLearner);
      if (Array.isArray(data.leaderboard)) {
        setLeaderboard(data.leaderboard);
      }
      const ts = saveOfflineState({
        learner: nextLearner,
        discussions,
        leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : leaderboard,
      });
      setLastOfflineSyncAt(ts);
      playQuizFeedbackSound(soundEnabled, true);
      showToast(`1-Day Streak Freeze equipped! (-${STREAK_FREEZE_COST_XP} XP)`);
      return { ok: true };
    } catch {
      const nextLearner: LearnerState = {
        ...learner,
        xp: localAttempt.nextState.xp,
        streakFreezes: localAttempt.nextState.streakFreezes,
        streakFreezeHistory: localAttempt.nextState.streakFreezeHistory,
      };
      setLearner(nextLearner);
      const nextLb = leaderboard
        .map((row) =>
          row.id === learner.profileId ? { ...row, xp: nextLearner.xp } : row
        )
        .sort((a, b) => b.xp - a.xp);
      setLeaderboard(nextLb);
      const ts = saveOfflineState({
        learner: nextLearner,
        discussions,
        leaderboard: nextLb,
      });
      setLastOfflineSyncAt(ts);
      playQuizFeedbackSound(soundEnabled, true);
      showToast(`1-Day Streak Freeze equipped offline! (-${STREAK_FREEZE_COST_XP} XP)`);
      return { ok: true };
    }
  };

  const handleEmailAuthSuccess = (payload: {
    account: { email: string; name: string; profileId: string };
    profile: Record<string, unknown>;
    leaderboard?: unknown[];
  }) => {
    const nextSession: StoredSession = {
      profileId: payload.account.profileId,
      email: payload.account.email,
      name: payload.account.name,
      authType: 'email',
    };
    setSession(nextSession);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));

    const nextLearner = normalizeLearnerState(payload.profile as Partial<LearnerState>);
    knownUnlockedRef.current = new Set(nextLearner.unlockedAchievements);
    setLearner(nextLearner);
    setSelectedLevel(nextLearner.targetLevel || 'N5');
    if (Array.isArray(payload.leaderboard)) {
      setLeaderboard(payload.leaderboard as LeaderboardRow[]);
    }
    const ts = saveOfflineState({
      learner: nextLearner,
      discussions,
      leaderboard: Array.isArray(payload.leaderboard)
        ? (payload.leaderboard as LeaderboardRow[])
        : leaderboard,
    });
    setLastOfflineSyncAt(ts);
    showToast(`Signed in as ${payload.account.email} (${nextLearner.xp} XP restored).`);
  };

  const handleGoogleSignIn = async () => {
    const user = await signInWithGoogleFirebase();
    const nextSession: StoredSession = {
      profileId: `fb-${user.uid}`,
      email: user.email || '',
      name: user.displayName || 'AkuJin Learner',
      authType: 'google',
    };
    const existingRemote = await loadLearnerProfileFromFirestore(user);
    let syncedState: LearnerState;
    if (existingRemote) {
      syncedState = normalizeLearnerState({
        ...(existingRemote as Partial<LearnerState>),
        profileId: nextSession.profileId,
        email: nextSession.email,
      });
      knownUnlockedRef.current = new Set(syncedState.unlockedAchievements);
      setLearner(syncedState);
      setSelectedLevel(syncedState.targetLevel || 'N5');
      showToast(`Welcome back, ${syncedState.name}! Cloud progress synced.`);
    } else {
      syncedState = normalizeLearnerState({
        ...learner,
        profileId: nextSession.profileId,
        email: nextSession.email,
        name: user.displayName || learner.name,
      });
      knownUnlockedRef.current = new Set(syncedState.unlockedAchievements);
      setLearner(syncedState);
      await syncLearnerProfileToFirestore(user, syncedState);
      showToast(`Google Cloud Sync enabled for ${nextSession.email}!`);
    }
    setSession(nextSession);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    void fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: syncedState.profileId, patch: syncedState }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (Array.isArray(res?.leaderboard)) setLeaderboard(res.leaderboard);
      })
      .catch(() => {});
  };

  const handleLogout = async () => {
    clearAccessToken();
    if (session?.authType === 'google') {
      await signOutFirebase().catch(() => {});
    }
    let nextLeaderboard = leaderboard;
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: 'akujin-local',
          patch: DEFAULT_STATE,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.leaderboard)) {
          nextLeaderboard = data.leaderboard;
          setLeaderboard(nextLeaderboard);
        }
      }
    } catch {
      // Offline fallback handled via saveOfflineState below
    }
    localStorage.removeItem(SESSION_STORAGE_KEY);
    knownUnlockedRef.current = new Set(DEFAULT_STATE.unlockedAchievements);
    setSession(null);
    setLearner(DEFAULT_STATE);
    setSelectedLevel('N5');
    saveOfflineState({
      learner: DEFAULT_STATE,
      discussions,
      leaderboard: nextLeaderboard,
    });
    showToast('Signed out. Local guest session reset cleanly.');
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterError(null);
    setNewsletterStatus(null);
    const check = validateNewsletterEmail(newsletterEmail);
    if (!check.ok) {
      setNewsletterError(check.error);
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: check.email, website: newsletterWebsite }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setNewsletterError(
          data.error || 'We could not complete your subscription right now. Please try again shortly.'
        );
        return;
      }
      if (data.alreadySubscribed) {
        setNewsletterStatus(`${check.email} is already subscribed to AkuJin Weekly!`);
      } else {
        setNewsletterStatus(
          `Confirmation email sent to ${check.email}! ${
            data.confirmationMessage ||
            'Thank you for subscribing to AkuJin! We are excited to support your Japanese learning journey. Please reach out to us via the Contact section if you have any questions.'
          }`
        );
      }
      setNewsletterEmail('');
    } catch {
      setNewsletterError(
        'We could not reach the server to complete your subscription. Please check your connection and try again.'
      );
    } finally {
      setSubscribing(false);
    }
  };

  const navigateToLeaderboardSection = useCallback((elementId: string) => {
    setActiveTab((prev) => {
      if (prev !== 'leaderboard') {
        skipNextScrollTopRef.current = true;
      }
      return 'leaderboard';
    });
    window.setTimeout(() => {
      const target = document.getElementById(elementId);
      if (target) {
        const prefersReduced =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({
          behavior: prefersReduced ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    }, 80);
  }, []);

  const todayMinutesStudied = estimateTodayStudyMinutes(learner.heatmapHistory);

  useAutoScrollReveal(mainRef, `${activeTab}-${selectedLevel}`);

  return (
    <div className="relative min-h-screen flex flex-col bg-[#FCFBF8] text-[#141413] dark:bg-[#0D0E12] dark:text-[#F4F3EF] transition-colors">
      {/* Subtle Ambient Washi & Vermilion Drifting Orbs */}
      <div
        aria-hidden="true"
        data-testid="ambient-bg-orbs"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        <div className="animate-ambient-drift absolute -top-28 -right-24 h-80 w-80 rounded-full bg-[#D92525]/[0.05] dark:bg-rose-500/[0.06] blur-3xl" />
        <div className="animate-ambient-drift-slow absolute top-[45%] -left-28 h-96 w-96 rounded-full bg-amber-400/[0.055] dark:bg-amber-500/[0.04] blur-3xl" />
        <div className="animate-ambient-drift absolute -bottom-24 right-[20%] h-72 w-72 rounded-full bg-rose-300/[0.06] dark:bg-sky-500/[0.045] blur-3xl" />
      </div>

      <ScrollProgressBar />
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        xp={learner.xp}
        streak={learner.streak}
        hearts={learner.hearts}
        maxHearts={learner.maxHearts}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        showFurigana={showFurigana}
        onToggleFurigana={() => setShowFurigana((f) => !f)}
        showRomaji={showRomaji}
        onToggleRomaji={() => setShowRomaji((r) => !r)}
        onRestoreHearts={handleRestoreHearts}
        streakFreezes={learner.streakFreezes}
        targetLevel={learner.targetLevel}
        startingTrack={learner.startingTrack}
        onboardingCompleted={learner.onboardingCompleted}
        onOpenOnboarding={() => setOnboardingModalOpen(true)}
        learnerName={learner.name}
        dailyStudyGoalMinutes={learner.dailyStudyGoalMinutes}
        todayMinutesStudied={todayMinutesStudied}
        authEmail={session?.email ?? null}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      <main ref={mainRef} className="relative z-10 flex-1">
        <div className="lg:hidden border-b border-stone-200/70 dark:border-zinc-800 bg-stone-50/80 dark:bg-[#121319] px-2.5 sm:px-5 py-1.5 flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <JlptLevelBadge
              level={learner.targetLevel}
              startingTrack={learner.startingTrack}
              onboardingCompleted={learner.onboardingCompleted}
              variant="compact"
              testId="mobile-jlpt-badge"
              onClick={() => setOnboardingModalOpen(true)}
            />
            <span className="text-[11px] font-mono-nums font-semibold text-[#141413] dark:text-zinc-200 whitespace-nowrap shrink-0">
              {learner.xp} XP
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowFurigana((f) => !f)}
              className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-medium border whitespace-nowrap shrink-0 cursor-pointer ${
                showFurigana
                  ? 'border-[#D92525]/50 text-[#D92525] bg-white dark:bg-[#1E2029] dark:text-rose-400'
                  : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-400'
              }`}
            >
              Furigana: {showFurigana ? 'On' : 'Off'}
            </button>
            <button
              type="button"
              onClick={() => setShowRomaji((r) => !r)}
              className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-medium border whitespace-nowrap shrink-0 cursor-pointer ${
                showRomaji
                  ? 'border-[#D92525]/50 text-[#D92525] bg-white dark:bg-[#1E2029] dark:text-rose-400'
                  : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-400'
              }`}
            >
              Romaji: {showRomaji ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <div key={activeTab} className="animate-tab-enter">
        {activeTab === 'overview' && (
          <OverviewSection
              selectedLevel={selectedLevel}
              targetLevel={learner.targetLevel}
              visibleLevels={visibleJlptLevels}
              onToggleVisibleLevel={handleToggleVisibleJlptLevel}
              onShowAllVisibleLevels={handleShowAllJlptLevels}
              onFocusOnlyLevel={handleFocusOnlyVisibleLevel}
              onSelectLevel={handleSelectLevel}
              onNavigateTab={setActiveTab}
              showRomaji={showRomaji}
              darkMode={darkMode}
              srsProgress={learner.srsProgress}
              masteredItemIds={learner.masteredItemIds}
              onMasterItem={handleMasterItem}
              userEmail={session?.email}
              learnerName={learner.name}
              onOpenGmailWorkspace={() => setGmailModalOpen(true)}
            />
        )}

        {activeTab === 'roadmap' && (
          <RoadmapSection
              xp={learner.xp}
              targetLevel={learner.targetLevel}
              visibleLevels={visibleJlptLevels}
              onResetVisibleLevels={handleShowAllJlptLevels}
              srsProgress={learner.srsProgress}
              masteredItemIds={learner.masteredItemIds}
              quizCorrectTotal={learner.quizCorrectTotal}
              onSelectTargetLevel={handleSelectLevel}
              onOpenLessonsForLevel={(lvl) => {
                handleSelectLevel(lvl);
                setActiveTab('lessons');
              }}
              onOpenKanjiSrs={() => setActiveTab('kanji')}
            />
        )}

        {activeTab === 'foundations' && (
          <FoundationsSection
              showRomaji={showRomaji}
              soundEnabled={soundEnabled}
              masteredItemIds={learner.masteredItemIds}
              onMasterItem={handleMasterItem}
              onRecordQuizAnswer={handleRecordQuizAnswer}
              onStartN5Track={() => {
                handleSelectLevel('N5');
                setActiveTab('lessons');
              }}
            />
        )}

        {activeTab === 'lessons' && (
          <LessonsSection
              selectedLevel={selectedLevel}
              visibleLevels={visibleJlptLevels}
              onResetVisibleLevels={handleShowAllJlptLevels}
              onSelectLevel={handleSelectLevel}
              showFurigana={showFurigana}
              showRomaji={showRomaji}
              soundEnabled={soundEnabled}
              recentQuizResults={learner.recentQuizResults}
              onRecordQuizAnswer={handleRecordQuizAnswer}
              onGainXp={handleGainXp}
              discussions={discussions}
              onPostDiscussion={handlePostDiscussion}
              onUpvoteDiscussion={handleUpvoteDiscussion}
              learnerName={learner.name}
              masteredItemIds={learner.masteredItemIds}
              onMasterItem={handleMasterItem}
              onRecordReadingSpeed={handleRecordReadingSpeed}
            />
        )}

        {activeTab === 'kanji' && (
          <KanjiSrsSection
              targetLevel={learner.targetLevel}
              visibleLevels={visibleJlptLevels}
              onResetVisibleLevels={handleShowAllJlptLevels}
              srsProgress={learner.srsProgress}
              heatmapHistory={learner.heatmapHistory}
              onReviewKanji={handleReviewKanji}
              onGainXp={handleGainXp}
              showFurigana={showFurigana}
              showRomaji={showRomaji}
              soundEnabled={soundEnabled}
              darkMode={darkMode}
              initialPracticeMode={initialKanjiMode}
              focusedKanjiRequest={kanjiJumpRequest}
              masteredItemIds={learner.masteredItemIds}
              onMasterItem={handleMasterItem}
              audioSpeed={audioSpeed}
              onChangeAudioSpeed={handleChangeAudioSpeed}
            />
        )}

        {activeTab === 'dictionary' && (
          <KanjiDictionarySection
              srsProgress={learner.srsProgress}
              masteredItemIds={learner.masteredItemIds}
              showRomaji={showRomaji}
              audioSpeed={audioSpeed}
              onChangeAudioSpeed={handleChangeAudioSpeed}
              onOpenSrsCard={(entry) => handleJumpFromDictionary(entry, 'srs')}
              onOpenStrokePractice={(entry) => handleJumpFromDictionary(entry, 'stroke-practice')}
            />
        )}

        {activeTab === 'scenarios' && (
          <ScenariosSection
              xp={learner.xp}
              showRomaji={showRomaji}
              bookmarkedPhrases={learner.bookmarkedPhrases}
              onToggleBookmark={handleToggleBookmark}
              onCompleteScenarioLine={() => handleGainXp(5)}
              audioSpeed={audioSpeed}
              onChangeAudioSpeed={handleChangeAudioSpeed}
            />
        )}

        {activeTab === 'study-japan' && (
          <StudyInJapanSection />
        )}

        {activeTab === 'resources' && (
          <ResourcesSection
              visibleLevels={visibleJlptLevels}
              onResetVisibleLevels={handleShowAllJlptLevels}
            />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardSyncSection
              profileId={learner.profileId}
              learnerName={learner.name}
              learnerEmail={session?.email}
              authType={session?.authType}
              onUpdateLearnerName={(name) =>
                persistProgress((prev) => ({ ...prev, name }))
              }
              onOpenAuth={() => {
                setAuthModalMode('signup');
                setAuthModalOpen(true);
              }}
              onSignOut={handleLogout}
              xp={learner.xp}
              streak={learner.streak}
              hearts={learner.hearts}
              maxHearts={learner.maxHearts}
              onRestoreHearts={handleRestoreHearts}
              kanjiLearnedCount={
                Object.values(learner.srsProgress).filter((c) => c.repetitions >= 1).length
              }
              masteredItemsCount={learner.masteredItemIds.length}
              bookmarkedCount={learner.bookmarkedPhrases.length}
              quizCorrectTotal={learner.quizCorrectTotal}
              targetLevel={learner.targetLevel}
              onChangeTargetLevel={handleSelectLevel}
              startingTrack={learner.startingTrack}
              onboardingAnswers={learner.onboardingAnswers}
              onEditStudyPlan={() => setOnboardingModalOpen(true)}
              streakFreezes={learner.streakFreezes}
              streakFreezeHistory={learner.streakFreezeHistory}
              onBuyStreakFreeze={handleBuyStreakFreeze}
              unlockedAchievements={learner.unlockedAchievements}
              leaderboard={leaderboard}
              lastOfflineSyncAt={lastOfflineSyncAt}
              onTriggerOfflineSync={handleTriggerOfflineSync}
              onSaveCloudBackup={handleSaveCloudBackup}
              onRestoreCloudBackup={handleRestoreCloudBackup}
              showFurigana={showFurigana}
              onToggleFurigana={() => setShowFurigana((f) => !f)}
              showRomaji={showRomaji}
              onToggleRomaji={() => setShowRomaji((r) => !r)}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode((d) => !d)}
              audioSpeed={audioSpeed}
              readingSpeedRecords={learner.readingSpeedRecords}
              onOpenReadingLab={() => setActiveTab('lessons')}
              onOpenGmailHub={() => setGmailModalOpen(true)}
            />
        )}
        </div>
      </main>

      <OnboardingModal
        isOpen={bootstrapReady && onboardingModalOpen}
        initialAnswers={learner.onboardingAnswers}
        onComplete={handleCompleteOnboarding}
        onDismiss={handleSkipOnboarding}
      />

      <SakuraWelcomeCelebration
        isActive={sakuraWelcome.active}
        trackLabel={sakuraWelcome.trackLabel}
        dailyGoalMinutes={sakuraWelcome.dailyGoalMinutes}
        onFinish={() => setSakuraWelcome({ active: false })}
      />

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onEmailAuthSuccess={handleEmailAuthSuccess}
        onGoogleSignIn={handleGoogleSignIn}
        guestStateSnapshot={learner as unknown as Record<string, unknown>}
      />

      <BackToTopButton />

      <QuickActionMenu
        isGmailOpen={gmailModalOpen}
        isGmailConnected={Boolean(firebaseUser?.email || session?.authType === 'google')}
        gmailEmail={session?.email}
        streak={learner.streak}
        streakFreezes={learner.streakFreezes}
        lastStudyDate={learner.lastStudyDate}
        unlockedAchievements={learner.unlockedAchievements}
        xp={learner.xp}
        dailyStudyGoalMinutes={learner.dailyStudyGoalMinutes}
        todayMinutesStudied={todayMinutesStudied}
        onOpenGmail={() => setGmailModalOpen(true)}
        onOpenAchievements={() => navigateToLeaderboardSection('achievements-showcase')}
        onOpenStreakStatus={() => navigateToLeaderboardSection('streak-status-vault')}
      />

      <FloatingGmailLauncher
        showFloatingButton={false}
        isOpen={gmailModalOpen}
        onOpen={() => setGmailModalOpen(true)}
        onClose={() => setGmailModalOpen(false)}
        isConnected={Boolean(firebaseUser?.email || session?.authType === 'google')}
        learnerName={learner.name}
        learnerEmail={session?.email}
        targetLevel={learner.targetLevel}
        xp={learner.xp}
        streak={learner.streak}
        kanjiLearnedCount={
          Object.values(learner.srsProgress).filter((c) => c.repetitions >= 1).length
        }
        masteredItemsCount={learner.masteredItemIds.length}
        readingSummary={summarizeReadingSpeed(learner.readingSpeedRecords)}
        onGoogleConnected={async () => {
          const user = auth.currentUser;
          if (user?.email) {
            const nextSess: StoredSession = {
              profileId: `fb-${user.uid}`,
              email: user.email,
              name: user.displayName || learner.name,
              authType: 'google',
            };
            setSession(nextSess);
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSess));
          }
          showToast('Gmail Workspace connected securely.');
        }}
      />

      <ToastNotificationHost
        toasts={toasts}
        onDismiss={dismissToast}
        onPauseTimer={pauseToastTimer}
        onResumeTimer={resumeToastTimer}
        onViewAchievements={() => navigateToLeaderboardSection('achievements-showcase')}
      />

      {/* Editorial Footer + Subscribe to Newsletter + 2026 Copyright */}
      <footer className="relative z-10 border-t border-stone-200 dark:border-zinc-800 bg-white/95 dark:bg-[#101218]/95 backdrop-blur-xs">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-10 space-y-8">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#D92525] text-white font-jp font-bold text-xs">
                  学
                </span>
                <span className="font-bold text-base text-[#141413] dark:text-white">
                  AkuJin
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
                Complete Zero-to-JLPT N1 Japanese academy covering Hiragana, Katakana, Kanji Radical Trees, Vocabulary, Grammar, Reading, Writing, Listening &amp; Speaking.
              </p>
            </div>

            <div className="md:col-span-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-stone-600 dark:text-zinc-400">
              <button
                type="button"
                onClick={() => setActiveTab('foundations')}
                className="akujin-link-underline hover:text-[#D92525] transition-colors cursor-pointer"
              >
                Foundations (46 Kana)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('lessons')}
                className="akujin-link-underline hover:text-[#D92525] transition-colors cursor-pointer"
              >
                JLPT N5–N1 Labs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('kanji')}
                className="akujin-link-underline hover:text-[#D92525] transition-colors cursor-pointer"
              >
                Kanji SRS
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dictionary')}
                className="akujin-link-underline hover:text-[#D92525] transition-colors cursor-pointer"
              >
                2,136 Kanji Dictionary
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('scenarios')}
                className="akujin-link-underline hover:text-[#D92525] transition-colors cursor-pointer"
              >
                All-Japan Scenarios
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('study-japan')}
                className="akujin-link-underline hover:text-[#D92525] transition-colors cursor-pointer"
              >
                Study in Japan Guide
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('resources')}
                className="akujin-link-underline hover:text-[#D92525] transition-colors cursor-pointer"
              >
                Books, PDFs &amp; Videos
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('overview');
                  setTimeout(
                    () => document.getElementById('contact-us')?.scrollIntoView({ behavior: 'smooth' }),
                    60
                  );
                }}
                className="akujin-link-underline hover:text-[#D92525] transition-colors cursor-pointer"
              >
                Contact Us
              </button>
              <button
                type="button"
                onClick={() => setGmailModalOpen(true)}
                className="akujin-link-underline hover:text-[#D92525] transition-colors cursor-pointer"
              >
                Gmail Study Inbox
              </button>
              <button
                type="button"
                onClick={() => {
                  if (session?.email) {
                    setActiveTab('leaderboard');
                  } else {
                    setAuthModalMode('signup');
                    setAuthModalOpen(true);
                  }
                }}
                className="akujin-link-underline hover:text-[#D92525] transition-colors cursor-pointer"
              >
                {session?.email ? 'Account Synced' : 'Sign Up / Log In'}
              </button>
            </div>

            {/* Newsletter Subscription */}
            <div className="md:col-span-4 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#141413] dark:text-white">
                Subscribe to Our Newsletter
              </h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Get weekly JLPT study notes, kanji cheat sheets &amp; Japan scholarship updates.
              </p>
              <form noValidate onSubmit={handleNewsletterSubmit} className="flex items-center gap-2">
                <label htmlFor="newsletter-email-input" className="sr-only">
                  Email address for newsletter
                </label>
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="newsletter-website">Website</label>
                  <input
                    id="newsletter-website"
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={newsletterWebsite}
                    onChange={(e) => setNewsletterWebsite(e.target.value)}
                  />
                </div>
                <input
                  id="newsletter-email-input"
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#16181F] text-xs text-[#141413] dark:text-white"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  data-testid="newsletter-submit-btn"
                  className="px-4 py-2 rounded-lg bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 akujin-btn-press"
                >
                  {subscribing ? 'Joining…' : 'Subscribe'}
                </button>
              </form>
              {newsletterStatus && (
                <p role="status" data-testid="newsletter-success" className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {newsletterStatus}
                </p>
              )}
              {newsletterError && (
                <p role="alert" data-testid="newsletter-error" className="text-xs font-medium text-[#D92525] dark:text-rose-400">
                  {newsletterError}
                </p>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-stone-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500 dark:text-zinc-400">
            <p>© 2026 AkuJin. All Rights Reserved.</p>
            <p>Foundations · JLPT N5 · N4 · N3 · N2 · N1</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
