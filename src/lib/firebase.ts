import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Provider with Workspace scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/documents.readonly');
provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
provider.addScope('https://www.googleapis.com/auth/presentations.readonly');
provider.addScope('https://www.googleapis.com/auth/tasks.readonly');
provider.addScope('https://www.googleapis.com/auth/contacts.readonly');

// In-memory access token cache as strictly required by Workspace Skill
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Connection test as required by Firebase skill
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection is offline or unverified.');
      return false;
    }
    // Expected if document doesn't exist yet, but connection was made
    return true;
  }
}

export const initAuth = (
  onSuccess?: (user: User, token: string | null) => void,
  onFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        onSuccess?.(user, null);
      }
    } else {
      cachedAccessToken = null;
      onFailure?.();
    }
  });
};

export const signInWithGoogle = async (): Promise<{
  user: User;
  accessToken: string | null;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;

    // Save or update user profile document in Firestore
    if (result.user) {
      await setDoc(
        doc(db, 'users', result.user.uid),
        {
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Firestore Persistence Helpers
export interface WorkspaceItemData {
  id: string;
  userId: string;
  type: 'note' | 'task' | 'doc' | 'sheet' | 'form' | 'event' | 'contact' | 'chat';
  title: string;
  content: string;
  status?: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationItemData {
  id: string;
  userId: string;
  kind: 'image' | 'music' | 'video' | 'text' | 'speech' | 'transcription' | 'thinking' | 'grounded';
  model: string;
  prompt: string;
  resultUrl?: string;
  resultText?: string;
  createdAt: string;
}

export async function saveWorkspaceItem(item: WorkspaceItemData) {
  if (!item.userId) return;
  const ref = doc(db, 'users', item.userId, 'items', item.id);
  await setDoc(ref, item, { merge: true });
}

export async function deleteWorkspaceItem(userId: string, itemId: string) {
  if (!userId || !itemId) return;
  const ref = doc(db, 'users', userId, 'items', itemId);
  await deleteDoc(ref);
}

export async function loadWorkspaceItems(userId: string): Promise<WorkspaceItemData[]> {
  if (!userId) return [];
  try {
    const colRef = collection(db, 'users', userId, 'items');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((d) => d.data() as WorkspaceItemData);
  } catch (err) {
    console.warn('Error loading items from Firestore:', err);
    return [];
  }
}

export async function saveGenerationItem(gen: GenerationItemData) {
  if (!gen.userId) return;
  const ref = doc(db, 'users', gen.userId, 'generations', gen.id);
  await setDoc(ref, gen);
}

export async function loadGenerationItems(userId: string): Promise<GenerationItemData[]> {
  if (!userId) return [];
  try {
    const colRef = collection(db, 'users', userId, 'generations');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as GenerationItemData);
  } catch (err) {
    console.warn('Error loading generations from Firestore:', err);
    return [];
  }
}
