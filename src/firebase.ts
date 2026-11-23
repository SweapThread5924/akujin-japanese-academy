import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { normalizeDailyStudyGoal } from './utils/dailyStudyGoal';
import {
  sanitizeReadingSpeedRecords,
  type ReadingSpeedRecord,
} from './utils/readingSpeed';

const app = initializeApp(firebaseConfig);

function createFirestoreClient(): Firestore {
  try {
    return initializeFirestore(
      app,
      { experimentalForceLongPolling: true },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = createFirestoreClient();
export const auth = getAuth(app);

export const SCOPES: readonly string[] = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
];

export const googleProvider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  googleProvider.addScope(scope);
}
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Memory-only OAuth access token cache (never stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const clearAccessToken = (): void => {
  cachedAccessToken = null;
};

export async function signInWithGoogleWorkspace(): Promise<{
  user: User;
  accessToken: string;
}> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Workspace OAuth access token.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
}

export async function signInWithGoogleFirebase(): Promise<User> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return result.user;
  } finally {
    isSigningIn = false;
  }
}

export async function signOutFirebase(): Promise<void> {
  cachedAccessToken = null;
  await firebaseSignOut(auth);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export async function syncLearnerProfileToFirestore(
  user: User,
  state: {
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
    bookmarkedPhrases: unknown[];
    unlockedAchievements: string[];
    masteredItemIds: string[];
    streakFreezes: number;
    streakFreezeHistory: unknown[];
    dailyStudyGoalMinutes: number;
    readingSpeedRecords?: ReadingSpeedRecord[];
  }
): Promise<void> {
  if (!user.emailVerified || !user.email) return;
  const profilePath = `learnerProfiles/${user.uid}`;
  const profileRef = doc(db, 'learnerProfiles', user.uid);
  try {
    const existingSnap = await getDoc(profileRef);
    const cleanName =
      ((state.name || '').trim() || (user.displayName || '').trim() || 'Learner').slice(0, 80);
    const validLevel = ['N5', 'N4', 'N3', 'N2', 'N1'].includes(state.targetLevel)
      ? state.targetLevel
      : 'N5';
    const payload = {
      userId: user.uid,
      email: user.email.toLowerCase().slice(0, 160),
      name: cleanName,
      xp: Math.min(1000000, Math.max(0, Math.round(state.xp))),
      streak: Math.min(36500, Math.max(0, Math.round(state.streak))),
      hearts: Math.max(0, Math.min(10, Math.round(state.hearts))),
      maxHearts: Math.max(1, Math.min(10, Math.round(state.maxHearts))),
      lastStudyDate: (state.lastStudyDate || '').slice(0, 32),
      targetLevel: validLevel,
      quizCorrectTotal: Math.max(0, Math.round(state.quizCorrectTotal)),
      recentQuizResults: (state.recentQuizResults || []).slice(-30),
      srsProgress: state.srsProgress || {},
      heatmapHistory: state.heatmapHistory || {},
      bookmarkedPhrases: (state.bookmarkedPhrases || []).slice(0, 200),
      unlockedAchievements: (state.unlockedAchievements || []).slice(0, 50),
      masteredItemIds: (state.masteredItemIds || []).slice(0, 5000),
      streakFreezes: Math.max(0, Math.min(10, Math.round(state.streakFreezes))),
      streakFreezeHistory: (state.streakFreezeHistory || []).slice(0, 100),
      dailyStudyGoalMinutes: normalizeDailyStudyGoal(state.dailyStudyGoalMinutes),
      readingSpeedRecords: sanitizeReadingSpeedRecords(state.readingSpeedRecords),
      createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(profileRef, payload);

    const kanjiLearned = Math.min(
      5000,
      Object.values(state.srsProgress || {}).filter(
        (c) => (c as { repetitions?: number })?.repetitions && (c as { repetitions: number }).repetitions >= 1
      ).length
    );

    await setDoc(doc(db, 'leaderboardPublic', user.uid), {
      userId: user.uid,
      displayName: payload.name,
      targetLevel: payload.targetLevel,
      xp: payload.xp,
      streak: payload.streak,
      kanjiLearned,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      profilePath
    );
  }
}

export async function loadLearnerProfileFromFirestore(
  user: User
): Promise<Record<string, unknown> | null> {
  if (!user.emailVerified) return null;
  const profilePath = `learnerProfiles/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'learnerProfiles', user.uid));
    return snap.exists() ? (snap.data() as Record<string, unknown>) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, profilePath);
  }
}
