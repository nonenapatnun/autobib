import { BibliographyProject } from '../../types/history';
import { BibliographyEntry, CitationStyle } from '../../types/bibliography';

const LOCAL_STORAGE_HISTORY_KEY = 'autobiblio_projects_history_v1';
const LOCAL_STORAGE_ACTIVE_ID_KEY = 'autobiblio_active_project_id_v1';

const DB_NAME = 'AutoBiblioDB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_DOCX = 'docx_files';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_DOCX)) {
        db.createObjectStore(STORE_DOCX, { keyPath: 'projectId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Loads all projects from storage (IndexedDB with LocalStorage fallback)
 */
export async function loadAllProjects(): Promise<BibliographyProject[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as BibliographyProject[];
        if (results && results.length > 0) {
          // Sort by updatedAt descending (newest first)
          results.sort((a, b) => b.updatedAt - a.updatedAt);
          resolve(results);
        } else {
          // Fallback to localStorage
          resolve(loadFromLocalStorage());
        }
      };
      req.onerror = () => resolve(loadFromLocalStorage());
    });
  } catch {
    return loadFromLocalStorage();
  }
}

function loadFromLocalStorage(): BibliographyProject[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
      }
    }
  } catch (e) {
    console.error('LocalStorage load failed:', e);
  }
  return [];
}

/**
 * Save or update a project in storage
 */
export async function saveProject(project: BibliographyProject): Promise<void> {
  // 1. Update in LocalStorage for instant sync
  try {
    const existing = loadFromLocalStorage();
    const idx = existing.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      existing[idx] = project;
    } else {
      existing.unshift(project);
    }
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(existing));
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_ID_KEY, project.id);
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }

  // 2. Persist in IndexedDB
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    store.put(project);
  } catch (e) {
    console.warn('IndexedDB save failed:', e);
  }
}

/**
 * Delete a project from storage
 */
export async function deleteProject(projectId: string): Promise<void> {
  try {
    const existing = loadFromLocalStorage().filter((p) => p.id !== projectId);
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(existing));
  } catch {
    // ignore
  }

  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_PROJECTS, STORE_DOCX], 'readwrite');
    tx.objectStore(STORE_PROJECTS).delete(projectId);
    tx.objectStore(STORE_DOCX).delete(projectId);
  } catch (e) {
    console.warn('IndexedDB delete failed:', e);
  }
}

/**
 * Save generated Word document (.docx) Blob to IndexedDB cache
 */
export async function saveDocxToCache(
  projectId: string,
  blob: Blob,
  filename: string
): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_DOCX, 'readwrite');
    const store = tx.objectStore(STORE_DOCX);
    store.put({
      projectId,
      blob,
      filename,
      savedAt: Date.now()
    });
  } catch (e) {
    console.warn('Save Docx cache failed:', e);
  }
}

/**
 * Retrieve cached Word document (.docx) Blob from IndexedDB
 */
export async function getDocxFromCache(
  projectId: string
): Promise<{ blob: Blob; filename: string; savedAt: number } | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_DOCX, 'readonly');
      const store = tx.objectStore(STORE_DOCX);
      const req = store.get(projectId);
      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Get active project ID from LocalStorage
 */
export function getActiveProjectId(): string | null {
  try {
    return localStorage.getItem(LOCAL_STORAGE_ACTIVE_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Set active project ID in LocalStorage
 */
export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_ID_KEY, id);
  } catch {
    // ignore
  }
}

/**
 * Export all projects to JSON backup string
 */
export function exportBackupJson(projects: BibliographyProject[]): string {
  const payload = {
    app: 'AutoBiblio',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    projects
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Parse and validate JSON backup string
 */
export function importBackupJson(rawJson: string): BibliographyProject[] {
  const data = JSON.parse(rawJson);
  if (data && Array.isArray(data.projects)) {
    return data.projects;
  }
  if (Array.isArray(data)) {
    return data;
  }
  throw new Error('รูปแบบไฟล์สำรองไม่ถูกต้อง ไม่พบรายการโครงงาน');
}
