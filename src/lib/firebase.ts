import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  signOut,
  Auth,
} from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const LOCAL_STORAGE_SESSION_KEY = 'autobiblio_local_session';

// Silence internal @firebase/firestore connection/token retry noise in console.error
try {
  setLogLevel('silent');
} catch {
  // Ignore if setLogLevel fails
}

/**
 * Migrate any cached Firebase Auth user from localStorage or IndexedDB
 * into our resilient local session storage, then purge stale Firebase Auth
 * tokens so Firebase never calls securetoken.googleapis.com with an expired token
 * when the Token Service API is disabled in the project.
 */
function migrateAndPurgeStaleFirebaseAuthStorage(): void {
  if (typeof window === 'undefined') return;

  const saveMigratedUser = (rawUser: any) => {
    if (!rawUser || !rawUser.uid) return;
    try {
      const existing = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (existing) return; // Already have an active session

      const email = rawUser.email || null;
      const displayName =
        rawUser.displayName ||
        (email ? email.split('@')[0] : 'นักวิจัย');
      const isSuperAdmin = email === 'nonenapatnunwipat@gmail.com';
      const now = new Date().toISOString();

      const sessionPayload = {
        user: {
          uid: rawUser.uid,
          email,
          displayName,
          photoURL: rawUser.photoURL || null,
        },
        profile: {
          uid: rawUser.uid,
          email,
          displayName,
          role: isSuperAdmin ? 'admin' : 'member',
          status: 'active',
          createdAt: now,
          lastLoginAt: now,
        },
      };
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(sessionPayload));
    } catch {
      // Ignore storage errors
    }
  };

  // 1. Check & clean localStorage keys starting with firebase:authUser:
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('firebase:authUser:')) {
        try {
          const val = localStorage.getItem(key);
          if (val) {
            saveMigratedUser(JSON.parse(val));
          }
        } catch {
          // Ignore parse error
        }
        keysToRemove.push(key);
      } else if (
        key.startsWith('firebase:previous_websocket_failure') ||
        key.startsWith('firebase:host:')
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore localStorage access errors
  }

  // 2. Check & delete firebaseLocalStorageDb in IndexedDB
  try {
    if (window.indexedDB) {
      const openReq = window.indexedDB.open('firebaseLocalStorageDb');
      openReq.onsuccess = () => {
        const idb = openReq.result;
        try {
          if (idb.objectStoreNames.contains('firebaseLocalStorage')) {
            const tx = idb.transaction('firebaseLocalStorage', 'readonly');
            const store = tx.objectStore('firebaseLocalStorage');
            const getAllReq = store.getAll();
            getAllReq.onsuccess = () => {
              const items = getAllReq.result || [];
              for (const item of items) {
                if (item && item.value && typeof item.value === 'object') {
                  saveMigratedUser(item.value);
                }
              }
              idb.close();
              try {
                window.indexedDB.deleteDatabase('firebaseLocalStorageDb');
              } catch {
                // Ignore delete error
              }
            };
            getAllReq.onerror = () => {
              idb.close();
              try {
                window.indexedDB.deleteDatabase('firebaseLocalStorageDb');
              } catch {
                // Ignore
              }
            };
          } else {
            idb.close();
            window.indexedDB.deleteDatabase('firebaseLocalStorageDb');
          }
        } catch {
          idb.close();
          try {
            window.indexedDB.deleteDatabase('firebaseLocalStorageDb');
          } catch {
            // Ignore
          }
        }
      };
      openReq.onerror = () => {
        try {
          window.indexedDB.deleteDatabase('firebaseLocalStorageDb');
        } catch {
          // Ignore
        }
      };
    }
  } catch {
    // Ignore IndexedDB errors
  }
}

migrateAndPurgeStaleFirebaseAuthStorage();

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

function initSafeAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: inMemoryPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = initSafeAuth();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

let tokenServiceDisabled = false;

/**
 * Verifies whether Firebase Auth currently has a live, valid ID token that can
 * authenticate against Cloud Firestore without triggering token-service errors.
 */
export async function ensureValidFirestoreAuth(): Promise<boolean> {
  if (tokenServiceDisabled) return false;
  const currentUser = auth.currentUser;
  if (!currentUser) return false;

  try {
    await currentUser.getIdToken(false);
    return true;
  } catch (err: any) {
    const msg = String(err?.message || err?.code || '');
    if (
      msg.includes('token-service-api-has-not-been-used') ||
      msg.includes('securetoken') ||
      msg.includes('auth/')
    ) {
      tokenServiceDisabled = true;
      try {
        await signOut(auth);
      } catch {
        // Ignore signOut error
      }
    }
    return false;
  }
}

export function markTokenServiceDisabled(): void {
  tokenServiceDisabled = true;
}

export default app;
