import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, ensureValidFirestoreAuth, markTokenServiceDisabled } from '../lib/firebase';
import { BibliographyProject } from '../types/history';

const COLLECTION_NAME = 'bibliographies';

/**
 * Save or update a bibliography project in Firestore for an authenticated user
 */
export async function saveBibliographyToFirestore(
  userId: string,
  userEmail: string,
  project: BibliographyProject
): Promise<void> {
  if (!userId) return;

  try {
    const canUseFirestore = await ensureValidFirestoreAuth();
    if (!canUseFirestore) return;

    const docRef = doc(db, COLLECTION_NAME, project.id);
    const data = {
      ...project,
      userId,
      userEmail: userEmail || '',
      updatedAt: Date.now(),
    };

    await setDoc(docRef, data, { merge: true });
  } catch (err: any) {
    const msg = String(err?.message || err?.code || '');
    if (msg.includes('token-service-api-has-not-been-used') || msg.includes('securetoken')) {
      markTokenServiceDisabled();
    }
  }
}

/**
 * Load all bibliography projects belonging to a user from Firestore
 */
export async function loadUserBibliographiesFromFirestore(
  userId: string
): Promise<BibliographyProject[]> {
  if (!userId) return [];

  try {
    const canUseFirestore = await ensureValidFirestoreAuth();
    if (!canUseFirestore) return [];

    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const projects: BibliographyProject[] = [];

    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      projects.push({
        id: docSnap.id,
        title: d.title || 'ชุดบรรณานุกรมไม่มีชื่อ',
        citationStyle: d.citationStyle || 'apa7',
        entries: Array.isArray(d.entries) ? d.entries : [],
        createdAt: d.createdAt || Date.now(),
        updatedAt: d.updatedAt || Date.now(),
        lastExportedAt: d.lastExportedAt || undefined,
        description: d.description || '',
        isFavorite: !!d.isFavorite,
      });
    });

    projects.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return projects;
  } catch (err: any) {
    const msg = String(err?.message || err?.code || '');
    if (msg.includes('token-service-api-has-not-been-used') || msg.includes('securetoken')) {
      markTokenServiceDisabled();
    }
    return [];
  }
}

/**
 * Delete a bibliography document from Firestore
 */
export async function deleteBibliographyFromFirestore(
  projectId: string
): Promise<void> {
  if (!projectId) return;
  try {
    const canUseFirestore = await ensureValidFirestoreAuth();
    if (!canUseFirestore) return;

    const docRef = doc(db, COLLECTION_NAME, projectId);
    await deleteDoc(docRef);
  } catch (err: any) {
    const msg = String(err?.message || err?.code || '');
    if (msg.includes('token-service-api-has-not-been-used') || msg.includes('securetoken')) {
      markTokenServiceDisabled();
    }
  }
}

/**
 * Real-time listener for user bibliographies (only attaches when valid Firebase Auth token exists)
 */
export function subscribeToUserBibliographies(
  userId: string,
  onUpdate: (projects: BibliographyProject[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  let unsubscribeFn: (() => void) | null = null;
  let cancelled = false;

  ensureValidFirestoreAuth()
    .then((canUseFirestore) => {
      if (!canUseFirestore || cancelled) return;

      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );

      unsubscribeFn = onSnapshot(
        q,
        (snapshot) => {
          const projects: BibliographyProject[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            projects.push({
              id: docSnap.id,
              title: d.title || 'ชุดบรรณานุกรมไม่มีชื่อ',
              citationStyle: d.citationStyle || 'apa7',
              entries: Array.isArray(d.entries) ? d.entries : [],
              createdAt: d.createdAt || Date.now(),
              updatedAt: d.updatedAt || Date.now(),
              lastExportedAt: d.lastExportedAt || undefined,
              description: d.description || '',
              isFavorite: !!d.isFavorite,
            });
          });
          projects.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          onUpdate(projects);
        },
        (err: any) => {
          const msg = String(err?.message || err?.code || '');
          if (msg.includes('token-service-api-has-not-been-used') || msg.includes('securetoken')) {
            markTokenServiceDisabled();
          }
          if (onError) onError(err);
        }
      );
    })
    .catch(() => {
      // Ignore auth check errors
    });

  return () => {
    cancelled = true;
    if (unsubscribeFn) {
      unsubscribeFn();
    }
  };
}
