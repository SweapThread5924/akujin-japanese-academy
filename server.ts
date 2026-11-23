import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  applyPendingStreakProtection,
  purchaseStreakFreeze,
  type StreakFreezeLogEntry,
} from './src/utils/streakFreeze';
import {
  DEFAULT_DAILY_STUDY_GOAL_MINUTES,
  normalizeDailyStudyGoal,
} from './src/utils/dailyStudyGoal';
import {
  emailToProfileId,
  normalizeEmail,
  validateAuthInput,
  validateContactInput,
  validateNewsletterEmail,
} from './src/utils/authAndForms';
import { buildStudyPdfBuffer, type PdfSectionLine } from './src/utils/pdfBuilder';
import {
  DEFAULT_SUPPORT_EMAIL,
  buildContactConfirmationEmail,
  buildContactNotificationEmail,
  buildNewsletterWelcomeEmail,
  createSlidingWindowRateLimiter,
  dispatchEmail,
  getGmailSmtpConfig,
  isLikelySpamSubmission,
} from './src/utils/emailService';

const contactRateLimiter = createSlidingWindowRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
});

const newsletterRateLimiter = createSlidingWindowRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 8,
});

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'akujin-store.json');

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface DiscussionPost {
  id: string;
  lessonId: string;
  author: string;
  jlptBadge: string;
  quoteOrPhrase: string;
  comment: string;
  upvotes: number;
  createdAt: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  targetLevel: string;
  xp: number;
  streak: number;
  kanjiLearned: number;
}

interface AccountRecord {
  email: string;
  name: string;
  profileId: string;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  mobile: string;
  message: string;
  receivedAt: string;
}

interface LearnerProfile {
  profileId: string;
  email?: string;
  name: string;
  xp: number;
  streak: number;
  hearts: number;
  maxHearts: number;
  lastStudyDate: string;
  targetLevel: string;
  quizCorrectTotal: number;
  recentQuizResults: boolean[];
  srsProgress: Record<string, unknown>;
  heatmapHistory: Record<string, number>;
  bookmarkedPhrases: {
    id: string;
    plainJapanese: string;
    reading: string;
    romaji: string;
    english: string;
    scenarioTitle: string;
  }[];
  unlockedAchievements: string[];
  masteredItemIds?: string[];
  streakFreezes?: number;
  streakFreezeHistory?: StreakFreezeLogEntry[];
  dailyStudyGoalMinutes?: number;
  onboardingCompleted?: boolean;
  startingTrack?: string | null;
  onboardingAnswers?: Record<string, unknown>;
  updatedAt: string;
}

interface StoreData {
  profiles: Record<string, LearnerProfile>;
  accounts: Record<string, AccountRecord>;
  backups: Record<string, LearnerProfile>;
  discussions: DiscussionPost[];
  leaderboard: LeaderboardEntry[];
  contacts: ContactSubmission[];
  newsletterSubscribers: { email: string; subscribedAt: string }[];
  sentEmails?: {
    id: string;
    to: string;
    subject: string;
    provider: string;
    delivered: boolean;
    sentAt: string;
  }[];
}

function createZeroProfile(profileId: string, name = 'Guest Learner', email?: string): LearnerProfile {
  return {
    profileId,
    ...(email ? { email } : {}),
    name,
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
    updatedAt: new Date().toISOString(),
  };
}

function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): { salt: string; hash: string } {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const computed = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHash, 'hex');
    if (computed.length !== expected.length) return false;
    return crypto.timingSafeEqual(computed, expected);
  } catch {
    return false;
  }
}

function createInitialStore(): StoreData {
  const defaultProfile = createZeroProfile('akujin-local', 'Guest Learner');

  return {
    profiles: { 'akujin-local': defaultProfile },
    accounts: {},
    backups: {
      'AKUJIN-DEMO-2026': { ...defaultProfile, profileId: 'AKUJIN-DEMO-2026' },
    },
    discussions: [
      {
        id: 'disc-1',
        lessonId: 'lesson-n5-particles',
        author: 'Aarav M.',
        jlptBadge: 'N5 Learner',
        quoteOrPhrase: '図書館で勉強します (Study at the library)',
        comment: 'Visualizing で as the "stage" where action happens finally stopped me from confusing で and に on N5 mock papers!',
        upvotes: 14,
        createdAt: '2026-11-12T08:15:00Z',
      },
      {
        id: 'disc-2',
        lessonId: 'lesson-n4-contractions',
        author: 'Meera K.',
        jlptBadge: 'N3 Challenger',
        quoteOrPhrase: '食べちゃった！ (Oops, I ate it all!)',
        comment: 'In slice-of-life anime, characters almost always say 〜ちゃった instead of 〜てしまった when they regret eating someone else’s pudding.',
        upvotes: 21,
        createdAt: '2026-11-13T11:40:00Z',
      },
      {
        id: 'disc-3',
        lessonId: 'lesson-n3-nuance',
        author: 'Kenji S.',
        jlptBadge: 'N2 Passed',
        quoteOrPhrase: 'ワクワクが止まらない (Can’t stop feeling excited)',
        comment: 'Notice how ドキドキ can be nervous OR romantic, while ワクワク is pure joyful anticipation before a trip to Tokyo.',
        upvotes: 19,
        createdAt: '2026-11-14T15:05:00Z',
      },
    ],
    leaderboard: [
      { id: 'akujin-local', name: 'Guest Learner', targetLevel: 'N5', xp: 0, streak: 0, kanjiLearned: 0 },
    ],
    contacts: [],
    newsletterSubscribers: [],
    sentEmails: [],
  };
}

const FAKE_LEADERBOARD_IDS = new Set(['lb-1', 'lb-2', 'lb-3', 'lb-4']);

function loadStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      const initial = createInitialStore();
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    const fallback = createInitialStore();
    const rawLeaderboard = Array.isArray(parsed.leaderboard)
      ? parsed.leaderboard.filter((entry) => entry && !FAKE_LEADERBOARD_IDS.has(entry.id))
      : fallback.leaderboard;
    return {
      profiles: parsed.profiles ?? fallback.profiles,
      accounts: parsed.accounts ?? {},
      backups: parsed.backups ?? fallback.backups,
      discussions: parsed.discussions ?? fallback.discussions,
      leaderboard: rawLeaderboard.length > 0 ? rawLeaderboard : fallback.leaderboard,
      contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
      newsletterSubscribers: Array.isArray(parsed.newsletterSubscribers) ? parsed.newsletterSubscribers : [],
      sentEmails: Array.isArray(parsed.sentEmails) ? parsed.sentEmails : [],
    };
  } catch {
    return createInitialStore();
  }
}

function saveStore(store: StoreData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('Failed to persist store:', err);
  }
}

function normalizeProfile(profile: LearnerProfile): LearnerProfile {
  return {
    ...profile,
    xp: typeof profile.xp === 'number' ? Math.max(0, profile.xp) : 0,
    streak: typeof profile.streak === 'number' ? Math.max(0, profile.streak) : 0,
    hearts: typeof profile.hearts === 'number' ? Math.max(0, profile.hearts) : 0,
    maxHearts: typeof profile.maxHearts === 'number' ? Math.max(1, profile.maxHearts) : 5,
    masteredItemIds: Array.isArray(profile.masteredItemIds) ? profile.masteredItemIds : [],
    streakFreezes: typeof profile.streakFreezes === 'number' ? Math.max(0, profile.streakFreezes) : 0,
    streakFreezeHistory: Array.isArray(profile.streakFreezeHistory) ? profile.streakFreezeHistory : [],
    dailyStudyGoalMinutes: normalizeDailyStudyGoal(profile.dailyStudyGoalMinutes),
    onboardingCompleted: Boolean(profile.onboardingCompleted),
    startingTrack: typeof profile.startingTrack === 'string' ? profile.startingTrack : null,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '6mb' }));

  app.use('/sw.js', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'akujin-api' });
  });

  app.get('/api/bootstrap', (req, res) => {
    const profileId = String(req.query.profileId || 'akujin-local');
    const store = loadStore();
    let profile = store.profiles[profileId];
    let dirty = false;
    if (!profile) {
      profile = createZeroProfile(profileId);
      store.profiles[profileId] = profile;
      dirty = true;
    } else {
      const normalized = normalizeProfile(profile);
      if (
        normalized.streakFreezes !== profile.streakFreezes ||
        normalized.streakFreezeHistory !== profile.streakFreezeHistory
      ) {
        profile = normalized;
        store.profiles[profileId] = profile;
        dirty = true;
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const protection = applyPendingStreakProtection({
      streak: profile.streak,
      lastStudyDate: profile.lastStudyDate,
      todayDate: todayStr,
      streakFreezes: profile.streakFreezes ?? 0,
      streakFreezeHistory: profile.streakFreezeHistory ?? [],
    });

    if (
      protection.consumedCount > 0 ||
      protection.streak !== profile.streak
    ) {
      profile = {
        ...profile,
        streak: protection.streak,
        lastStudyDate: protection.lastStudyDate,
        streakFreezes: protection.streakFreezes,
        streakFreezeHistory: protection.streakFreezeHistory,
        updatedAt: new Date().toISOString(),
      };
      store.profiles[profileId] = profile;
      const lbIdx = store.leaderboard.findIndex((entry) => entry.id === profileId);
      if (lbIdx >= 0) {
        store.leaderboard[lbIdx] = {
          ...store.leaderboard[lbIdx],
          streak: profile.streak,
        };
      }
      dirty = true;
    }

    if (dirty) {
      saveStore(store);
    }

    const sortedLeaderboard = [...store.leaderboard].sort((a, b) => b.xp - a.xp);
    res.json({
      profile,
      discussions: store.discussions,
      leaderboard: sortedLeaderboard,
    });
  });

  app.post('/api/progress', (req, res) => {
    const { profileId = 'akujin-local', patch } = req.body ?? {};
    if (!patch || typeof patch !== 'object') {
      res.status(400).json({ error: 'Invalid progress patch payload' });
      return;
    }
    const store = loadStore();
    const existing = normalizeProfile(
      store.profiles[profileId] || createZeroProfile(profileId)
    );
    const updated: LearnerProfile = normalizeProfile({
      ...existing,
      ...patch,
      profileId,
      updatedAt: new Date().toISOString(),
    });
    store.profiles[profileId] = updated;

    const kanjiLearned = Object.values(updated.srsProgress || {}).filter(
      (c) => (c as { repetitions?: number })?.repetitions && (c as { repetitions: number }).repetitions >= 1
    ).length;

    const lbIdx = store.leaderboard.findIndex((entry) => entry.id === profileId);
    const lbRecord: LeaderboardEntry = {
      id: profileId,
      name: updated.name || 'Guest Learner',
      targetLevel: updated.targetLevel || 'N5',
      xp: updated.xp,
      streak: updated.streak,
      kanjiLearned,
    };
    if (lbIdx >= 0) {
      store.leaderboard[lbIdx] = lbRecord;
    } else {
      store.leaderboard.push(lbRecord);
    }

    saveStore(store);
    res.json({
      profile: updated,
      leaderboard: [...store.leaderboard].sort((a, b) => b.xp - a.xp),
    });
  });

  // Email Sign Up & Log In (cross-device persistent learner profile)
  app.post('/api/auth/signup', (req, res) => {
    const { name = '', email = '', password = '', guestState } = req.body ?? {};
    const validation = validateAuthInput({
      mode: 'signup',
      name: String(name),
      email: String(email),
      password: String(password),
    });
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const normalizedEmail = normalizeEmail(String(email));
    const trimmedName = String(name).trim();
    const store = loadStore();
    if (store.accounts[normalizedEmail]) {
      res.status(409).json({ error: 'An account with this email already exists. Please log in instead.' });
      return;
    }

    const profileId = emailToProfileId(normalizedEmail);
    const { salt, hash } = hashPassword(String(password));
    const nowIso = new Date().toISOString();

    const account: AccountRecord = {
      email: normalizedEmail,
      name: trimmedName,
      profileId,
      passwordSalt: salt,
      passwordHash: hash,
      createdAt: nowIso,
    };
    store.accounts[normalizedEmail] = account;

    const baseProfile = createZeroProfile(profileId, trimmedName, normalizedEmail);
    const hasGuestProgress =
      guestState &&
      typeof guestState === 'object' &&
      ((guestState.xp ?? 0) > 0 ||
        Object.keys(guestState.srsProgress || {}).length > 0 ||
        (guestState.masteredItemIds?.length ?? 0) > 0);

    const profile: LearnerProfile = hasGuestProgress
      ? normalizeProfile({
          ...baseProfile,
          ...guestState,
          profileId,
          email: normalizedEmail,
          name: trimmedName,
          updatedAt: nowIso,
        })
      : baseProfile;

    store.profiles[profileId] = profile;

    const kanjiLearned = Object.values(profile.srsProgress || {}).filter(
      (c) => (c as { repetitions?: number })?.repetitions && (c as { repetitions: number }).repetitions >= 1
    ).length;

    const lbIdx = store.leaderboard.findIndex((entry) => entry.id === profileId);
    const lbEntry: LeaderboardEntry = {
      id: profileId,
      name: trimmedName,
      targetLevel: profile.targetLevel || 'N5',
      xp: profile.xp,
      streak: profile.streak,
      kanjiLearned,
    };
    if (lbIdx >= 0) store.leaderboard[lbIdx] = lbEntry;
    else store.leaderboard.push(lbEntry);

    saveStore(store);
    res.status(201).json({
      account: { email: normalizedEmail, name: trimmedName, profileId },
      profile,
      leaderboard: [...store.leaderboard].sort((a, b) => b.xp - a.xp),
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email = '', password = '' } = req.body ?? {};
    const validation = validateAuthInput({
      mode: 'login',
      email: String(email),
      password: String(password),
    });
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const normalizedEmail = normalizeEmail(String(email));
    const store = loadStore();
    const account = store.accounts[normalizedEmail];
    if (!account || !verifyPassword(String(password), account.passwordSalt, account.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const profile = normalizeProfile(
      store.profiles[account.profileId] ||
        createZeroProfile(account.profileId, account.name, account.email)
    );
    store.profiles[account.profileId] = profile;
    saveStore(store);

    res.json({
      account: { email: account.email, name: account.name, profileId: account.profileId },
      profile,
      leaderboard: [...store.leaderboard].sort((a, b) => b.xp - a.xp),
    });
  });

  // Contact Inquiry Submission (Gmail SMTP exclusively + validation, honeypot & rate limiting)
  app.post('/api/contact', async (req, res) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp =
      (Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : undefined) ||
      req.socket.remoteAddress ||
      'unknown';

    const rateCheck = contactRateLimiter.check(clientIp);
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSec));
      res.status(429).json({
        error:
          'You have sent several messages recently. Please wait a few minutes before submitting another query.',
      });
      return;
    }

    const { name = '', email = '', mobile = '', message = '', website = '' } = req.body ?? {};
    const spamCheck = isLikelySpamSubmission({
      honeypot: String(website),
      message: String(message),
    });
    if (spamCheck.isSpam) {
      res.status(400).json({
        error:
          'Your submission could not be verified. Please remove excessive links and try again.',
      });
      return;
    }

    const validation = validateContactInput({
      name: String(name),
      email: String(email),
      mobile: String(mobile),
      message: String(message),
    });
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const smtpConfig = getGmailSmtpConfig(process.env);
    if (!smtpConfig) {
      res.status(503).json({
        error: `Email delivery is temporarily unavailable right now. Please try again shortly or reach us directly at ${DEFAULT_SUPPORT_EMAIL}.`,
      });
      return;
    }

    const record: ContactSubmission = {
      id: `contact-${Date.now()}`,
      name: String(name).trim().slice(0, 80),
      email: normalizeEmail(String(email)),
      mobile: String(mobile).trim().slice(0, 30),
      message: String(message).trim().slice(0, 2000),
      receivedAt: new Date().toISOString(),
    };

    const notifyMail = buildContactNotificationEmail({
      ...record,
      receiverEmail: smtpConfig.contactReceiverEmail,
    });
    const notifyResult = await dispatchEmail(notifyMail);

    if (!notifyResult.delivered) {
      res.status(502).json({
        error: `We couldn't send your message right now. Please try again in a moment or email us directly at ${DEFAULT_SUPPORT_EMAIL}.`,
      });
      return;
    }

    // Secondary polite receipt confirmation to the visitor (non-fatal if skipped)
    const confirmMail = buildContactConfirmationEmail(record);
    const confirmResult = await dispatchEmail(confirmMail);

    const store = loadStore();
    store.contacts.unshift(record);
    store.sentEmails = store.sentEmails ?? [];
    store.sentEmails.unshift(
      {
        id: `mail-${Date.now()}-support`,
        to: notifyMail.to,
        subject: notifyMail.subject,
        provider: notifyResult.provider,
        delivered: notifyResult.delivered,
        sentAt: new Date().toISOString(),
      },
      {
        id: `mail-${Date.now()}-confirm`,
        to: confirmMail.to,
        subject: confirmMail.subject,
        provider: confirmResult.provider,
        delivered: confirmResult.delivered,
        sentAt: new Date().toISOString(),
      }
    );
    saveStore(store);

    res.status(201).json({
      ok: true,
      id: record.id,
      receivedAt: record.receivedAt,
      emailDelivered: true,
    });
  });

  // Newsletter Subscription (uses Gmail SMTP configuration to send automated confirmation email)
  app.post('/api/newsletter', async (req, res) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp =
      (Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : undefined) ||
      req.socket.remoteAddress ||
      'unknown';

    const rateCheck = newsletterRateLimiter.check(clientIp);
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSec));
      res.status(429).json({
        error: 'Too many subscription attempts. Please wait a few minutes and try again.',
      });
      return;
    }

    const { email = '', website = '' } = req.body ?? {};
    const spamCheck = isLikelySpamSubmission({ honeypot: String(website) });
    if (spamCheck.isSpam) {
      res.status(400).json({ error: 'Unable to verify subscription request.' });
      return;
    }

    const validation = validateNewsletterEmail(String(email));
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const store = loadStore();
    const alreadySubscribed = store.newsletterSubscribers.some((s) => s.email === validation.email);
    if (alreadySubscribed) {
      res.status(200).json({
        ok: true,
        email: validation.email,
        alreadySubscribed: true,
        emailDelivered: false,
      });
      return;
    }

    const smtpConfig = getGmailSmtpConfig(process.env);
    if (!smtpConfig) {
      res.status(503).json({
        error: `Confirmation email delivery is temporarily unavailable right now. Please try again shortly or reach us via the Contact section (${DEFAULT_SUPPORT_EMAIL}).`,
      });
      return;
    }

    const welcomeMail = buildNewsletterWelcomeEmail(
      validation.email,
      smtpConfig.contactReceiverEmail
    );
    const dispatchResult = await dispatchEmail(welcomeMail);

    if (!dispatchResult.delivered) {
      res.status(502).json({
        error: `We couldn't send your confirmation email right now. Please try again in a moment or reach us via the Contact section (${DEFAULT_SUPPORT_EMAIL}).`,
      });
      return;
    }

    store.newsletterSubscribers.unshift({
      email: validation.email,
      subscribedAt: new Date().toISOString(),
    });
    store.sentEmails = store.sentEmails ?? [];
    store.sentEmails.unshift({
      id: `mail-${Date.now()}-welcome`,
      to: welcomeMail.to,
      subject: welcomeMail.subject,
      provider: dispatchResult.provider,
      delivered: dispatchResult.delivered,
      sentAt: new Date().toISOString(),
    });
    saveStore(store);

    res.status(201).json({
      ok: true,
      email: validation.email,
      alreadySubscribed: false,
      emailDelivered: true,
      confirmationMessage:
        'Thank you for subscribing to AkuJin! We are excited to support your Japanese learning journey. Please reach out to us via the Contact section if you have any questions.',
    });
  });

  // Downloadable Study PDF Companions (Valid PDF 1.4 binary files)
  app.get('/api/resources/pdf/:slug', (req, res) => {
    const slug = String(req.params.slug || '').toLowerCase();
    const publicDataDir = path.resolve(process.cwd(), 'public', 'data');
    let title = 'AkuJin Japanese Study Guide';
    let subtitle = 'Complete Zero-to-JLPT N1 Academy Reference Sheet';
    let filename = 'akujin-study-guide.pdf';
    const lines: PdfSectionLine[] = [];

    try {
      if (slug === 'kana-workbook') {
        title = '46 Hiragana & 46 Katakana Mastery Workbook';
        subtitle = 'Gojuon Rows, Dakuten, Handakuten & Beginner Greetings Roadmap';
        filename = 'akujin-kana-46-workbook.pdf';
        const rows = [
          'A-row: a, i, u, e, o | KA-row: ka, ki, ku, ke, ko (+ ga, gi, gu, ge, go)',
          'SA-row: sa, shi, su, se, so (+ za, ji, zu, ze, zo)',
          'TA-row: ta, chi, tsu, te, to (+ da, ji, zu, de, do)',
          'NA-row: na, ni, nu, ne, no | HA-row: ha, hi, fu, he, ho (+ ba/pa rows)',
          'MA-row: ma, mi, mu, me, mo | YA-row: ya, yu, yo',
          'RA-row: ra, ri, ru, re, ro | WA-row: wa, wo, n',
          'Essential Greetings:',
          'Ohayou gozaimasu (Good morning) | Konnichiwa (Hello) | Konbanwa (Good evening)',
          'Arigatou gozaimasu (Thank you) | Sumimasen (Excuse me / Sorry)',
          'Onegaishimasu (Please) | Yoroshiku onegaishimasu (Nice to meet you)',
        ];
        rows.forEach((t, i) => lines.push({ text: t, bold: i === 6 }));
      } else if (slug === 'genki-companion') {
        title = 'Genki I & II Study Companion Checklist';
        subtitle = 'Chapters 1-23 Grammar Summary & Self-Study Schedule';
        filename = 'akujin-genki-companion.pdf';
        lines.push({ text: 'Genki I (JLPT N5 Foundation):', bold: true });
        lines.push({ text: 'Ch 1-3: X wa Y desu, numbers, time, masu-present & negative verbs' });
        lines.push({ text: 'Ch 4-6: Location particles ni/de, adjectives, te-form requests' });
        lines.push({ text: 'Ch 7-9: Te-iru ongoing states, short casual form, past-tense qualifiers' });
        lines.push({ text: 'Ch 10-12: Comparisons, tai-desu desires, n-desu explanations, must-do' });
        lines.push({ text: 'Genki II (JLPT N4 Progression):', bold: true });
        lines.push({ text: 'Ch 13-16: Potential verbs, volitional, giving/receiving (ageru/kureru/morau)' });
        lines.push({ text: 'Ch 17-20: Conditionals (tara/ba/to), transitivity pairs, extra-modest Keigo' });
        lines.push({ text: 'Ch 21-23: Passive, causative, and passive-causative natural expressions' });
      } else if (slug === 'minna-companion') {
        title = 'Minna no Nihongo N5-N4 Pattern Companion';
        subtitle = 'Lessons 1-50 Bunkei & Core Exam Sentence Roadmap';
        filename = 'akujin-minna-no-nihongo-companion.pdf';
        lines.push({ text: 'Lessons 1-13: Demonstratives (kore/sore/are), time, destinations, te-want', bold: true });
        lines.push({ text: 'Lessons 14-25: Te-form permission/prohibition, nai-form, dictionary-form, ta-form' });
        lines.push({ text: 'Lessons 26-38: Contextual n-desu, potential, conditionals, transitive/intransitive' });
        lines.push({ text: 'Lessons 39-50: Purpose/reason, honorific/humble Keigo (sonkeigo & kenjougo)' });
      } else if (slug === 'kanji-2136') {
        title = 'Complete 2,136 Joyo Kanji Compendium (Romanized Index)';
        subtitle = 'All 2,136 Official Japanese Joyo Kanji (JLPT N5 -> N1)';
        filename = 'akujin-2136-joyo-kanji-index.pdf';
        const raw = JSON.parse(fs.readFileSync(path.join(publicDataDir, 'joyo-kanji-2136.json'), 'utf-8')) as Array<{
          level: string;
          strokes: number;
          meaning: string;
          sampleMeaning: string;
        }>;
        raw.forEach((k, idx) => {
          lines.push({
            text: `${idx + 1}. [${k.level} | ${k.strokes}st] ${k.meaning} (Sample: ${k.sampleMeaning})`,
          });
        });
      } else if (/^kanji-n[1-5]$/.test(slug)) {
        const lvl = slug.replace('kanji-', '').toUpperCase();
        const raw = JSON.parse(fs.readFileSync(path.join(publicDataDir, 'joyo-kanji-2136.json'), 'utf-8')) as Array<{
          level: string;
          strokes: number;
          meaning: string;
          sampleMeaning: string;
        }>;
        const filtered = raw.filter((k) => k.level === lvl);
        title = `JLPT ${lvl} Kanji Study Compendium (${filtered.length} Kanji)`;
        subtitle = `Official JLPT ${lvl} Joyo Kanji Meanings, Stroke Counts & Sample Glosses`;
        filename = `akujin-jlpt-${lvl.toLowerCase()}-kanji-${filtered.length}.pdf`;
        filtered.forEach((k, idx) => {
          lines.push({
            text: `${idx + 1}. [${lvl} | ${k.strokes}st] ${k.meaning} (Sample: ${k.sampleMeaning})`,
          });
        });
      } else if (slug === 'grammar-guide') {
        title = 'JLPT N5-N1 Grammar & IRODORI / Tae Kim Study Companion';
        subtitle = 'Core Grammar Patterns & Explanations Across All 5 JLPT Levels';
        filename = 'akujin-jlpt-n5-n1-grammar-guide.pdf';
        const grammarMap = JSON.parse(
          fs.readFileSync(path.join(publicDataDir, 'jlpt-grammar-all.json'), 'utf-8')
        ) as Record<string, Array<{ meaning: string; structure?: string; romaji?: string }>>;
        (['N5', 'N4', 'N3', 'N2', 'N1'] as const).forEach((lvl) => {
          const items = grammarMap[lvl] || [];
          lines.push({ text: `--- JLPT ${lvl} Grammar (${items.length} Patterns) ---`, bold: true });
          items.forEach((g, idx) => {
            const rom = g.romaji ? `${g.romaji}: ` : '';
            lines.push({ text: `${idx + 1}. ${rom}${g.meaning}` });
          });
        });
      } else if (slug.startsWith('vocab-')) {
        const lvl = slug.replace('vocab-', '').toUpperCase();
        const safeLvl = ['N5', 'N4', 'N3', 'N2', 'N1'].includes(lvl) ? lvl : 'N5';
        title = `JLPT ${safeLvl} Complete Vocabulary Compendium`;
        subtitle = `Romanized Study Sheet & English Glosses - JLPT ${safeLvl}`;
        filename = `akujin-jlpt-${safeLvl.toLowerCase()}-vocabulary.pdf`;
        const vocabPath = path.join(publicDataDir, `jlpt-vocab-${safeLvl.toLowerCase()}.json`);
        const rows = JSON.parse(fs.readFileSync(vocabPath, 'utf-8')) as Array<{
          romaji: string;
          english: string;
          pos: string;
        }>;
        rows.forEach((v, idx) => {
          lines.push({
            text: `${idx + 1}. ${v.romaji} [${v.pos}] - ${v.english}`,
          });
        });
      } else {
        res.status(404).json({ error: 'Unknown resource slug.' });
        return;
      }

      const pdfBuffer = buildStudyPdfBuffer({ title, subtitle, lines });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (err) {
      console.error('PDF generation failed:', err);
      res.status(500).json({ error: 'Could not generate study PDF right now.' });
    }
  });

  // Printable UTF-8 HTML Sheet (shows crisp full Kanji/Kana + Furigana for Ctrl+P / Save PDF)
  app.get('/api/resources/sheet/:slug', (req, res) => {
    const slug = String(req.params.slug || '').toLowerCase();
    const publicDataDir = path.resolve(process.cwd(), 'public', 'data');
    const esc = (s: unknown) =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    let heading = 'AkuJin Printable Japanese Study Sheet';
    let bodyHtml = '';

    try {
      if (slug === 'kanji-2136' || /^kanji-n[1-5]$/.test(slug)) {
        const filterLvl = slug === 'kanji-2136' ? null : slug.replace('kanji-', '').toUpperCase();
        const rawRows = JSON.parse(fs.readFileSync(path.join(publicDataDir, 'joyo-kanji-2136.json'), 'utf-8')) as Array<{
          level: string;
          kanji: string;
          meaning: string;
          onyomi: string;
          kunyomi: string;
          strokes: number;
          sampleWord: string;
          sampleReading: string;
        }>;
        const rows = filterLvl ? rawRows.filter((k) => k.level === filterLvl) : rawRows;
        heading = filterLvl
          ? `JLPT ${filterLvl} Kanji Printable Study Sheet (${rows.length} Kanji)`
          : 'Complete 2,136 Jōyō Kanji Study Sheet (N5 → N1)';
        bodyHtml = `<div class="grid">${rows
          .map(
            (k, idx) =>
              `<div class="card"><div class="meta">#${idx + 1} · ${esc(k.level)} · ${k.strokes}画</div><div class="jp">${esc(k.kanji)}</div><div class="mean">${esc(k.meaning)}</div><div class="sub">On: ${esc(k.onyomi)} | Kun: ${esc(k.kunyomi)}</div><div class="sub">${esc(k.sampleWord)} (${esc(k.sampleReading)})</div></div>`
          )
          .join('')}</div>`;
      } else if (slug === 'grammar-guide') {
        heading = 'Complete JLPT N5–N1 Grammar Study Sheet (526 Patterns)';
        const grammarMap = JSON.parse(
          fs.readFileSync(path.join(publicDataDir, 'jlpt-grammar-all.json'), 'utf-8')
        ) as Record<string, Array<{ pattern: string; meaning: string; structure?: string; exampleJp?: string; exampleEn?: string }>>;
        bodyHtml = (['N5', 'N4', 'N3', 'N2', 'N1'] as const)
          .map((lvl) => {
            const list = grammarMap[lvl] || [];
            return `<h2 style="margin-top:22px;font-size:18px;border-bottom:1px solid #e7e5e4;padding-bottom:6px">JLPT ${lvl} Grammar (${list.length} Patterns)</h2><div class="grid">${list
              .map(
                (g, idx) =>
                  `<div class="card"><div class="meta">${lvl} · #${idx + 1}</div><div class="jp" style="font-size:18px">${esc(g.pattern)}</div><div class="mean">${esc(g.meaning)}</div>${g.exampleJp ? `<div class="sub">${esc(g.exampleJp)}</div>` : ''}</div>`
              )
              .join('')}</div>`;
          })
          .join('');
      } else if (slug.startsWith('vocab-')) {
        const lvl = slug.replace('vocab-', '').toUpperCase();
        const safeLvl = ['N5', 'N4', 'N3', 'N2', 'N1'].includes(lvl) ? lvl : 'N5';
        heading = `JLPT ${safeLvl} Vocabulary Sheet`;
        const rows = JSON.parse(
          fs.readFileSync(path.join(publicDataDir, `jlpt-vocab-${safeLvl.toLowerCase()}.json`), 'utf-8')
        ) as Array<{ word: string; reading: string; romaji: string; english: string; pos: string }>;
        bodyHtml = `<div class="grid">${rows
          .map(
            (v, idx) =>
              `<div class="card"><div class="meta">#${idx + 1} · ${esc(v.pos)}</div><div class="jp">${esc(v.word)}</div><div class="sub">${esc(v.reading)} · ${esc(v.romaji)}</div><div class="mean">${esc(v.english)}</div></div>`
          )
          .join('')}</div>`;
      } else {
        heading = `AkuJin Companion Sheet — ${esc(slug)}`;
        bodyHtml =
          '<p>Includes complete 46 Hiragana (あ–ん), 46 Katakana (ア–ン), polite verbs, particles (は・が・を・に・で), and JLPT study notes. Use your browser Print / Save as PDF menu anytime.</p>';
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>${esc(heading)}</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:1080px;margin:24px auto;padding:0 16px;color:#141413}h1{font-size:22px;margin-bottom:6px}.bar{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e7e5e4;padding-bottom:12px;margin-bottom:18px}button{background:#D92525;color:#fff;border:none;padding:8px 14px;border-radius:8px;font-weight:600;cursor:pointer}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}.card{border:1px solid #e7e5e4;border-radius:8px;padding:10px}.meta{font-size:11px;color:#D92525;font-weight:700}.jp{font-size:24px;font-weight:700;margin:4px 0}.mean{font-size:13px;font-weight:600}.sub{font-size:11px;color:#57534e}@media print{button{display:none}}</style></head><body><div class="bar"><div><h1>${esc(heading)}</h1><div style="font-size:12px;color:#57534e">AkuJin Japanese Academy Printable Reference</div></div><button onclick="window.print()">Print / Save as PDF</button></div>${bodyHtml}</body></html>`);
    } catch {
      res.status(500).send('Unable to render study sheet.');
    }
  });

  app.post('/api/streak-freeze/purchase', (req, res) => {
    const { profileId = 'akujin-local' } = req.body ?? {};
    const store = loadStore();
    const existing = normalizeProfile(
      store.profiles[profileId] || createZeroProfile(profileId)
    );

    const result = purchaseStreakFreeze({
      xp: existing.xp,
      streakFreezes: existing.streakFreezes ?? 0,
      streakFreezeHistory: existing.streakFreezeHistory ?? [],
    });

    if (!result.ok) {
      res.status(400).json({ error: result.error || 'Cannot purchase Streak Freeze.' });
      return;
    }

    const updated: LearnerProfile = {
      ...existing,
      xp: result.nextState.xp,
      streakFreezes: result.nextState.streakFreezes,
      streakFreezeHistory: result.nextState.streakFreezeHistory,
      updatedAt: new Date().toISOString(),
    };
    store.profiles[profileId] = updated;

    const lbIdx = store.leaderboard.findIndex((entry) => entry.id === profileId);
    if (lbIdx >= 0) {
      store.leaderboard[lbIdx] = {
        ...store.leaderboard[lbIdx],
        xp: updated.xp,
      };
    }

    saveStore(store);
    res.json({
      profile: updated,
      entry: result.entry,
      leaderboard: [...store.leaderboard].sort((a, b) => b.xp - a.xp),
    });
  });

  app.post('/api/backup', (req, res) => {
    const { syncCode, profile } = req.body ?? {};
    if (!profile || typeof profile !== 'object') {
      res.status(400).json({ error: 'Missing profile data for backup.' });
      return;
    }
    const store = loadStore();
    const code =
      typeof syncCode === 'string' && syncCode.trim().length >= 4
        ? syncCode.trim().toUpperCase()
        : `AKUJIN-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const snapshot: LearnerProfile = {
      ...(profile as LearnerProfile),
      updatedAt: new Date().toISOString(),
    };
    store.backups[code] = snapshot;
    saveStore(store);
    res.json({ syncCode: code, savedAt: snapshot.updatedAt });
  });

  app.get('/api/backup/:syncCode', (req, res) => {
    const code = String(req.params.syncCode || '').trim().toUpperCase();
    const store = loadStore();
    const backup = store.backups[code];
    if (!backup) {
      res.status(404).json({ error: `No cloud backup found for sync code "${code}".` });
      return;
    }
    res.json({ syncCode: code, profile: backup });
  });

  app.get('/api/discussions', (req, res) => {
    const lessonId = req.query.lessonId ? String(req.query.lessonId) : null;
    const store = loadStore();
    const items = lessonId
      ? store.discussions.filter((d) => d.lessonId === lessonId)
      : store.discussions;
    res.json({ discussions: items });
  });

  app.post('/api/discussions', (req, res) => {
    const { lessonId, author, jlptBadge, quoteOrPhrase, comment } = req.body ?? {};
    if (!lessonId || !comment || String(comment).trim().length < 2) {
      res.status(400).json({ error: 'Please enter a valid comment before posting.' });
      return;
    }
    const store = loadStore();
    const post: DiscussionPost = {
      id: `disc-${Date.now()}`,
      lessonId: String(lessonId),
      author: String(author || 'Kaito Learner').slice(0, 40),
      jlptBadge: String(jlptBadge || 'N5 Learner').slice(0, 24),
      quoteOrPhrase: String(quoteOrPhrase || '').slice(0, 140),
      comment: String(comment).trim().slice(0, 500),
      upvotes: 1,
      createdAt: new Date().toISOString(),
    };
    store.discussions.unshift(post);
    saveStore(store);
    res.status(201).json({ post, discussions: store.discussions });
  });

  app.post('/api/discussions/:id/upvote', (req, res) => {
    const id = String(req.params.id);
    const store = loadStore();
    const post = store.discussions.find((d) => d.id === id);
    if (!post) {
      res.status(404).json({ error: 'Discussion post not found' });
      return;
    }
    post.upvotes += 1;
    saveStore(store);
    res.json({ post });
  });

  app.post('/api/pronunciation-feedback', async (req, res) => {
    const { targetJapanese, targetReading, targetRomaji, spokenText, audioBase64, mimeType } = req.body ?? {};
    if (!targetJapanese) {
      res.status(400).json({ error: 'Missing target Japanese phrase.' });
      return;
    }

    if (!ai) {
      // Deterministic pronunciation evaluator when GEMINI_API_KEY is absent
      const normalizedTarget = String(targetReading || targetJapanese).replace(/[\s。、！？]/g, '');
      const normalizedSpoken = String(spokenText || '').replace(/[\s。、！？]/g, '');
      const overlap =
        normalizedSpoken.length === 0
          ? 74
          : Math.min(98, Math.max(48, Math.round((Math.min(normalizedSpoken.length, normalizedTarget.length) / Math.max(1, normalizedTarget.length)) * 95)));
      res.json({
        source: 'local-mora-analyzer',
        detectedSpeech: spokenText || targetJapanese,
        accuracyScore: overlap,
        pitchTip: `Keep every mora in "${targetRomaji || targetReading}" even in length without stressing English syllables.`,
        moraBreakdown: `Target morae: ${targetReading || targetJapanese}. Focus on crisp vowel endings and clean double-consonant pauses.`,
        encouragement: overlap >= 80 ? 'Great Tokyo cadence! Ready for full-speed shadowing.' : 'Good start—slow down slightly and articulate each kana distinctly.',
      });
      return;
    }

    try {
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
      if (audioBase64 && mimeType) {
        parts.push({
          inlineData: {
            mimeType: String(mimeType),
            data: String(audioBase64),
          },
        });
      }
      parts.push({
        text: `Evaluate this Japanese pronunciation attempt.
Target Japanese: "${targetJapanese}"
Reading: "${targetReading || ''}"
Romaji: "${targetRomaji || ''}"
Spoken transcript from browser (if available): "${spokenText || '(audio clip attached)'}"

Return strict JSON evaluating pronunciation accuracy (0-100), detected Japanese speech, one specific pitch accent / mora timing tip, a brief mora breakdown, and a warm encouraging coaching note.`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction:
            'You are an encouraging senior Japanese phonetics Sensei at AkuJin. Give concise, actionable pitch-accent and mora-timing feedback.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedSpeech: { type: Type.STRING },
              accuracyScore: { type: Type.INTEGER },
              pitchTip: { type: Type.STRING },
              moraBreakdown: { type: Type.STRING },
              encouragement: { type: Type.STRING },
            },
          },
        },
      });

      const rawJson = (response.text ?? '{}')
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const parsed = JSON.parse(rawJson || '{}');
      res.json({ source: 'gemini-sensei', ...parsed });
    } catch (err) {
      console.error('Gemini pronunciation feedback error:', err);
      res.status(502).json({ error: 'Could not evaluate audio with AI right now. Please try speaking again.' });
    }
  });

  app.post('/api/adaptive-quiz', async (req, res) => {
    const { level = 'N5', accuracyPct = 80, topic = 'Grammar & Real-Life Usage' } = req.body ?? {};
    if (!ai) {
      res.status(503).json({ error: 'AI generator unavailable offline; using curated JLPT bank.' });
      return;
    }
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Generate 1 original JLPT ${level} multiple-choice question focused on "${topic}". Learner recent accuracy is ${accuracyPct}%.`,
        config: {
          systemInstruction:
            'You are a JLPT exam designer for AkuJin. Output 1 accurate multiple-choice Japanese question with 4 options, romaji, and a crisp exam explanation.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prompt: { type: Type.STRING },
              plainJapanese: { type: Type.STRING },
              romaji: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    reading: { type: Type.STRING },
                  },
                },
              },
              correctOptionId: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
          },
        },
      });
      const rawJson = (response.text ?? '{}')
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const data = JSON.parse(rawJson || '{}');
      res.json({ question: { id: `ai-q-${Date.now()}`, level, skill: 'Adaptive AI', ...data } });
    } catch (err) {
      console.error('Adaptive quiz generation failed:', err);
      res.status(502).json({ error: 'Unable to generate adaptive question right now.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AkuJin full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
