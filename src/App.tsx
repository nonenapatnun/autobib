/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import AuthGate from './components/AuthGate';
import { Navbar } from './components/Navbar';
import { AutoFetchBar } from './components/AutoFetchBar';
import { DocumentPaperPreview } from './components/DocumentPaperPreview';
import { BibliographyList } from './components/BibliographyList';
import { EntryModal } from './components/EntryModal';
import { CitationGuideModal } from './components/CitationGuideModal';
import { CitationCheatSheetModal } from './components/CitationCheatSheetModal';
import { BatchImportModal } from './components/BatchImportModal';
import { ValidationBanner } from './components/ValidationBanner';
import { ValidationDrawerModal } from './components/ValidationDrawerModal';
import { HistoryModal } from './components/HistoryModal';
import { DocxExportModal } from './components/DocxExportModal';
import EmailExportModal from './components/EmailExportModal';
import { GoogleSearchGroundingModal } from './components/GoogleSearchGroundingModal';
import { ExternalFileInspectorModal } from './components/ExternalFileInspectorModal';
import { DuplicateDetectorBanner } from './components/DuplicateDetectorBanner';
import { DuplicateDetectorModal } from './components/DuplicateDetectorModal';
import { AdminPanel } from './components/AdminPanel';
import { SuspendedNotice } from './components/SuspendedNotice';
import { BibliographyEntry, CitationStyle } from './types/bibliography';
import { BibliographyProject, AutoSaveState } from './types/history';
import { INITIAL_ENTRIES } from './data/sampleData';
import { validateBibliography, validateEntry } from './utils/validation/citationValidator';
import {
  detectDuplicates,
  mergeDuplicateEntries,
  DuplicateGroup,
} from './utils/validation/duplicateDetector';
import {
  loadAllProjects,
  saveProject,
  deleteProject as deleteStoredProject,
  getActiveProjectId,
  setActiveProjectId,
} from './utils/storage/projectHistoryStorage';
import {
  saveBibliographyToFirestore,
  loadUserBibliographiesFromFirestore,
  deleteBibliographyFromFirestore,
  subscribeToUserBibliographies,
} from './services/firestoreService';
import {
  RotateCcw,
  Sparkles,
  CheckCircle,
  History,
  Edit3,
  Loader2,
  Mail,
  Database,
  Shield,
  BookOpen,
  FolderOpen,
  Layers,
  Eye,
} from 'lucide-react';

export default function App() {
  const { user, isAdmin, isSuspended, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  // State for all saved projects & active project ID
  const [projects, setProjects] = useState<BibliographyProject[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string>('project-initial');
  const [projectTitle, setProjectTitle] = useState<string>('ระบบจัดการบรรณานุกรมสำหรับงานวิจัยและวิทยานิพนธ์');
  const [currentStyle, setCurrentStyle] = useState<CitationStyle>('apa7');
  const [entries, setEntries] = useState<BibliographyEntry[]>(INITIAL_ENTRIES);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'document' | 'list'>('document');

  // Auto-Save State
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(Date.now());
  const autoSaveTimerRef = useRef<any>(null);
  const isInitialMount = useRef(true);

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Partial<BibliographyEntry> | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isCheatSheetModalOpen, setIsCheatSheetModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isAuditorModalOpen, setIsAuditorModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isGroundingModalOpen, setIsGroundingModalOpen] = useState(false);
  const [isExternalFileModalOpen, setIsExternalFileModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [groundingInitialQuery, setGroundingInitialQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [autoFixingEntryIds, setAutoFixingEntryIds] = useState<string[]>([]);
  const [isAutoFixingAll, setIsAutoFixingAll] = useState(false);

  // Sync projects with Firestore and LocalStorage when user changes
  useEffect(() => {
    if (!user) {
      setProjects([]);
      return;
    }

    let isSubscribed = true;

    async function initUserProjects() {
      try {
        // 1. Try to load from Firestore cloud database first
        let loaded = await loadUserBibliographiesFromFirestore(user!.uid);

        // 2. If empty in Firestore, check local storage
        if (!loaded || loaded.length === 0) {
          const localProjects = await loadAllProjects();
          if (localProjects && localProjects.length > 0) {
            loaded = localProjects;
            // Seed Firestore with local projects
            for (const p of loaded) {
              await saveBibliographyToFirestore(user!.uid, user!.email || '', p);
            }
          }
        }

        if (loaded && loaded.length > 0 && isSubscribed) {
          setProjects(loaded);
          const savedActiveId = getActiveProjectId();
          const target = loaded.find((p) => p.id === savedActiveId) || loaded[0];

          if (
            target.title === 'ชุดบรรณานุกรมงานวิจัยและวิทยานิพนธ์' ||
            target.title === 'ชุดบรรณานุกรมงานวิจัย'
          ) {
            target.title = 'ระบบจัดการบรรณานุกรมสำหรับงานวิจัยและวิทยานิพนธ์';
          }

          setActiveProjectIdState(target.id);
          setProjectTitle(target.title);
          setCurrentStyle(target.citationStyle || 'apa7');
          setEntries(target.entries || []);
          setLastSavedAt(target.updatedAt);
        } else if (isSubscribed) {
          // Create initial user project in cloud Firestore
          const defaultProject: BibliographyProject = {
            id: 'proj-' + Math.random().toString(36).substring(2, 9),
            title: 'ระบบจัดการบรรณานุกรมสำหรับงานวิจัยและวิทยานิพนธ์',
            citationStyle: 'apa7',
            entries: INITIAL_ENTRIES,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          await saveProject(defaultProject);
          await saveBibliographyToFirestore(user!.uid, user!.email || '', defaultProject);

          setProjects([defaultProject]);
          setActiveProjectIdState(defaultProject.id);
          setProjectTitle(defaultProject.title);
          setCurrentStyle(defaultProject.citationStyle);
          setEntries(defaultProject.entries);
          setLastSavedAt(defaultProject.updatedAt);
        }
      } catch (err) {
        console.error('Failed to init user projects:', err);
      } finally {
        if (isSubscribed) {
          setTimeout(() => {
            isInitialMount.current = false;
          }, 400);
        }
      }
    }

    initUserProjects();

    // Set up real-time listener for Firestore changes
    const unsubscribe = subscribeToUserBibliographies(user.uid, (remoteProjects) => {
      if (remoteProjects && remoteProjects.length > 0 && isSubscribed) {
        setProjects((prev) => {
          // If remote has changes not yet locally reflected, update list
          return remoteProjects;
        });
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [user]);

  // Real-time Auto-Save Debounce to Firestore & Local Storage
  useEffect(() => {
    if (isInitialMount.current || !user) return;

    setAutoSaveState('saving');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      const updatedProject: BibliographyProject = {
        id: activeProjectId,
        title: projectTitle,
        citationStyle: currentStyle,
        entries: entries,
        createdAt:
          projects.find((p) => p.id === activeProjectId)?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      try {
        // Save to local storage & Firestore cloud database simultaneously
        await saveProject(updatedProject);
        await saveBibliographyToFirestore(user.uid, user.email || '', updatedProject);

        setProjects((prev) => {
          const idx = prev.findIndex((p) => p.id === activeProjectId);
          if (idx >= 0) {
            const list = [...prev];
            list[idx] = updatedProject;
            return list.sort((a, b) => b.updatedAt - a.updatedAt);
          }
          return [updatedProject, ...prev];
        });
        setAutoSaveState('saved');
        setLastSavedAt(Date.now());
      } catch (err) {
        console.error('Auto-save error:', err);
        setAutoSaveState('unsaved');
      }
    }, 450); // 450ms debounce

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [entries, currentStyle, projectTitle, activeProjectId, user]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Immediate manual save trigger
  const handleManualSave = async () => {
    if (!user) return;
    setAutoSaveState('saving');
    const updatedProject: BibliographyProject = {
      id: activeProjectId,
      title: projectTitle,
      citationStyle: currentStyle,
      entries: entries,
      createdAt:
        projects.find((p) => p.id === activeProjectId)?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await saveProject(updatedProject);
    await saveBibliographyToFirestore(user.uid, user.email || '', updatedProject);

    setAutoSaveState('saved');
    setLastSavedAt(Date.now());
    showNotification(`บันทึกลงฐานข้อมูลคลาวด์สำหรับ "${projectTitle}" สำเร็จ`);
  };

  // Validation Report & Duplicate Citation Report
  const validationReport = validateBibliography(entries, currentStyle);
  const duplicateReport = detectDuplicates(entries);

  // Handlers for Entry CRUD
  const handleEntryFetched = (partial: Partial<BibliographyEntry>) => {
    setEditingEntry({
      ...partial,
      id: undefined,
    });
    setIsEntryModalOpen(true);
    showNotification(`ดึงข้อมูลอัตโนมัติสำเร็จ! กำลังเปิดหน้าต่างให้ตรวจสอบและบันทึก`);
  };

  const handleSaveEntry = (saved: BibliographyEntry) => {
    setEntries((prev) => {
      const exists = prev.findIndex((e) => e.id === saved.id);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = saved;
        return updated;
      } else {
        return [saved, ...prev];
      }
    });
    showNotification(`บันทึกรายการ "${saved.title.substring(0, 30)}..." เรียบร้อยแล้ว`);
  };

  const handleDeleteEntry = (id: string) => {
    const toDelete = entries.find((e) => e.id === id);
    if (!toDelete) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    showNotification(`ลบรายการ "${toDelete.title.substring(0, 35)}..." เรียบร้อยแล้ว`);
  };

  const handleDuplicateEntry = (entry: BibliographyEntry) => {
    const duplicated: BibliographyEntry = {
      ...entry,
      id: 'bib-' + Math.random().toString(36).substring(2, 9),
      title: `${entry.title} (สำเนา)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setEntries((prev) => [duplicated, ...prev]);
    showNotification('ทำสำเนารายการเรียบร้อยแล้ว');
  };

  const handleImportBatch = (newEntries: BibliographyEntry[]) => {
    setEntries((prev) => [...newEntries, ...prev]);
    showNotification(`นำเข้า ${newEntries.length} รายการสำเร็จ`);
  };

  // Helper to apply a single quick-fix to an entry object
  const applyFieldFixToEntry = (
    entry: BibliographyEntry,
    field: keyof BibliographyEntry | 'authors',
    value: string
  ): BibliographyEntry => {
    if (field === 'authors') {
      if (value === '__CLEAN_EMPTY_AUTHORS__') {
        const validAuthors = (entry.authors || []).filter(
          (a) => a.firstName.trim() || a.lastName.trim()
        );
        if (validAuthors.length > 0) {
          return { ...entry, authors: validAuthors, updatedAt: Date.now() };
        }
        const fallbackOrg =
          entry.institution?.trim() ||
          entry.publisher?.trim() ||
          entry.containerTitle?.trim() ||
          (entry.language === 'th' ? 'คณะผู้วิจัย / หน่วยงานเจ้าของผลงาน' : 'Corporate Author');
        return {
          ...entry,
          authors: [
            {
              id: 'auth-auto-' + Math.random().toString(36).substring(2, 8),
              firstName: fallbackOrg,
              lastName: '',
              isOrganization: true,
              isThai: entry.language === 'th',
            },
          ],
          updatedAt: Date.now(),
        };
      }
      return {
        ...entry,
        authors: [
          {
            id: 'auth-auto-' + Math.random().toString(36).substring(2, 8),
            firstName: value,
            lastName: '',
            isOrganization: true,
            isThai: /[\u0E00-\u0E7F]/.test(value) || entry.language === 'th',
          },
        ],
        updatedAt: Date.now(),
      };
    }

    return {
      ...entry,
      [field]: value,
      updatedAt: Date.now(),
    };
  };

  const handleApplyQuickFix = (
    entryId: string,
    field: keyof BibliographyEntry | 'authors',
    value: string
  ) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? applyFieldFixToEntry(e, field, value) : e))
    );
    const displayValue =
      value === '__CLEAN_EMPTY_AUTHORS__' ? 'จัดระเบียบรายชื่อผู้แต่ง' : value;
    showNotification(`✨ แก้ไขอัตโนมัติสำเร็จ: อัปเดต "${String(field)}" เป็น "${displayValue}"`);
  };

  // Smart Database Enrichment + Standard Academic Auto-Fix for a single entry
  const enrichAndAutoFixSingleEntry = async (
    entry: BibliographyEntry,
    style: CitationStyle
  ): Promise<{ updated: BibliographyEntry; enrichedFromDb: boolean }> => {
    let workingEntry: BibliographyEntry = { ...entry };
    let enrichedFromDb = false;

    // 1. Try to enrich missing fields from verified academic databases via /api/citation/search-grounding
    const querySeed =
      workingEntry.doi?.trim() ||
      workingEntry.isbn?.trim() ||
      [
        workingEntry.title?.trim(),
        (workingEntry.authors || [])
          .map((a) => `${a.firstName} ${a.lastName}`.trim())
          .filter(Boolean)
          .join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

    if (querySeed && querySeed.length >= 3) {
      try {
        const res = await fetch('/api/citation/search-grounding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: querySeed,
            language: workingEntry.language,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const bestMatch = data?.items?.[0];
          if (bestMatch) {
            // Merge only missing fields so we never overwrite valid user data
            const hasValidAuthors =
              workingEntry.authors &&
              workingEntry.authors.length > 0 &&
              workingEntry.authors.some((a) => a.firstName.trim() || a.lastName.trim());

            if (!hasValidAuthors && Array.isArray(bestMatch.authors) && bestMatch.authors.length > 0) {
              workingEntry.authors = bestMatch.authors.map((a: any, idx: number) => ({
                id: `auth-db-${Date.now()}-${idx}`,
                firstName: a.firstName || '',
                lastName: a.lastName || '',
                isOrganization: !!a.isOrganization,
                isThai:
                  typeof a.isThai === 'boolean'
                    ? a.isThai
                    : /[\u0E00-\u0E7F]/.test(`${a.firstName || ''} ${a.lastName || ''}`),
              }));
              enrichedFromDb = true;
            }

            const mergeStringField = (fieldKey: keyof BibliographyEntry) => {
              const currentVal = workingEntry[fieldKey];
              const incomingVal = bestMatch[fieldKey];
              if (
                (!currentVal || (typeof currentVal === 'string' && !currentVal.trim())) &&
                typeof incomingVal === 'string' &&
                incomingVal.trim()
              ) {
                (workingEntry as any)[fieldKey] = incomingVal.trim();
                enrichedFromDb = true;
              }
            };

            mergeStringField('title');
            mergeStringField('year');
            mergeStringField('publisher');
            mergeStringField('place');
            mergeStringField('containerTitle');
            mergeStringField('volume');
            mergeStringField('issue');
            mergeStringField('pages');
            mergeStringField('doi');
            mergeStringField('isbn');
            mergeStringField('url');
            mergeStringField('institution');
            mergeStringField('degreeType');
          }
        }
      } catch (err) {
        console.warn('Smart database lookup skipped, falling back to academic standards:', err);
      }
    }

    // 2. Apply deterministic academic standard auto-fixes for any still-missing fields
    const validationAfterDb = validateEntry(workingEntry, style);
    for (const issue of validationAfterDb.issues) {
      if (issue.quickFixValue) {
        workingEntry = applyFieldFixToEntry(
          workingEntry,
          issue.field as keyof BibliographyEntry | 'authors',
          issue.quickFixValue
        );
      }
    }

    workingEntry.updatedAt = Date.now();
    return { updated: workingEntry, enrichedFromDb };
  };

  const handleAutoFixEntry = async (entryId: string) => {
    const target = entries.find((e) => e.id === entryId);
    if (!target) return;

    setAutoFixingEntryIds((prev) => (prev.includes(entryId) ? prev : [...prev, entryId]));
    try {
      const { updated, enrichedFromDb } = await enrichAndAutoFixSingleEntry(target, currentStyle);
      setEntries((prev) => prev.map((e) => (e.id === entryId ? updated : e)));
      showNotification(
        enrichedFromDb
          ? `✨ ดึงข้อมูลจริงจากฐานข้อมูลวิชาการและแก้ไขอัตโนมัติครบทุกช่องสำหรับ "${updated.title.substring(0, 30)}..." สำเร็จ!`
          : `✨ แก้ไขอัตโนมัติตามเกณฑ์มาตรฐานบรรณานุกรมสำหรับ "${updated.title.substring(0, 30)}..." สำเร็จ!`
      );
    } finally {
      setAutoFixingEntryIds((prev) => prev.filter((id) => id !== entryId));
    }
  };

  const handleAutoFixAll = async () => {
    const entriesNeedingFix = entries.filter(
      (e) => validateEntry(e, currentStyle).issues.length > 0
    );
    if (entriesNeedingFix.length === 0) {
      setIsAutoFixingAll(true);
      setTimeout(() => {
        setIsAutoFixingAll(false);
        showNotification(
          `✅ ตรวจสอบครบทั้ง ${entries.length} รายการแล้ว ข้อมูลบรรณานุกรมสมบูรณ์ 100% ทุกช่องตามมาตรฐาน ${currentStyle.toUpperCase()}!`
        );
      }, 450);
      return;
    }

    setIsAutoFixingAll(true);
    try {
      const updatedMap = new Map<string, BibliographyEntry>();
      let dbEnrichedCount = 0;

      for (const entry of entriesNeedingFix) {
        const { updated, enrichedFromDb } = await enrichAndAutoFixSingleEntry(entry, currentStyle);
        updatedMap.set(entry.id, updated);
        if (enrichedFromDb) dbEnrichedCount++;
      }

      setEntries((prev) => prev.map((e) => updatedMap.get(e.id) || e));
      showNotification(
        dbEnrichedCount > 0
          ? `✨ แก้ไขอัตโนมัติทั้งหมด ${entriesNeedingFix.length} รายการสำเร็จ! (ดึงข้อมูลจริงจากฐานข้อมูลวิชาการ ${dbEnrichedCount} รายการ + เติมค่ามาตรฐานครบ 100%)`
          : `✨ แก้ไขอัตโนมัติทั้งหมด ${entriesNeedingFix.length} รายการครบ 100% ตามมาตรฐาน ${currentStyle.toUpperCase()} สำเร็จ!`
      );
    } finally {
      setIsAutoFixingAll(false);
    }
  };

  const handleApplyStandardPresetToAll = (
    presetType: 'year' | 'place' | 'publisher' | 'accessDate' | 'authors' | 'url'
  ) => {
    let fixedCount = 0;
    const todayTh = new Date().toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const todayEn = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    setEntries((prev) =>
      prev.map((entry) => {
        const isTh = entry.language === 'th';
        if (presetType === 'year' && (!entry.year || !entry.year.trim())) {
          fixedCount++;
          return { ...entry, year: isTh ? 'ม.ป.ป.' : 'n.d.', updatedAt: Date.now() };
        }
        if (presetType === 'place' && (!entry.place || !entry.place.trim())) {
          fixedCount++;
          return { ...entry, place: isTh ? 'ม.ป.ท.' : 'n.p.', updatedAt: Date.now() };
        }
        if (presetType === 'publisher' && (!entry.publisher || !entry.publisher.trim())) {
          fixedCount++;
          return { ...entry, publisher: isTh ? 'ม.ป.ท.' : 'n.p.', updatedAt: Date.now() };
        }
        if (presetType === 'accessDate' && (!entry.accessDate || !entry.accessDate.trim())) {
          fixedCount++;
          return { ...entry, accessDate: isTh ? todayTh : todayEn, updatedAt: Date.now() };
        }
        if (
          presetType === 'authors' &&
          (!entry.authors ||
            entry.authors.length === 0 ||
            entry.authors.every((a) => !a.firstName.trim() && !a.lastName.trim()))
        ) {
          fixedCount++;
          return applyFieldFixToEntry(
            entry,
            'authors',
            entry.institution?.trim() ||
              entry.publisher?.trim() ||
              (isTh ? 'คณะผู้วิจัย / หน่วยงานเจ้าของผลงาน' : 'Corporate Author')
          );
        }
        if (presetType === 'url' && (!entry.url || !entry.url.trim()) && !entry.doi) {
          fixedCount++;
          return {
            ...entry,
            url: `https://scholar.google.com/scholar?q=${encodeURIComponent(entry.title || '')}`,
            updatedAt: Date.now(),
          };
        }
        return entry;
      })
    );

    if (fixedCount > 0) {
      showNotification(`⚡ แก้ไขทันทีสำเร็จ: เติมค่ามาตรฐานลงใน ${fixedCount} รายการที่ช่องข้อมูลว่างเรียบร้อยแล้ว`);
    } else {
      showNotification(
        `✅ ตรวจสอบแล้ว: ทุกรายการมีข้อมูลในช่อง "${presetType}" ครบถ้วนอยู่แล้ว (กดปุ่มสีส้ม "จำลองข้อมูลขาดหาย" หากต้องการทดสอบ)`
      );
    }
  };

  const handleAddIncompleteSampleEntries = () => {
    const sampleIncomplete: BibliographyEntry[] = [
      {
        id: 'test-inc-1-' + Math.random().toString(36).substring(2, 7),
        sourceType: 'book',
        language: 'th',
        title: 'ระเบียบวิธีวิจัยทางการศึกษาและการประเมินผลการเรียนรู้ยุคดิจิทัล',
        authors: [
          {
            id: 'auth-inc-1',
            firstName: 'ศิริชัย',
            lastName: 'กาญจนวาสี',
            isOrganization: false,
            isThai: true,
          },
        ],
        year: '', // จงใจเว้นว่างเพื่อทดสอบปุ่มแก้ไขอัตโนมัติ (ม.ป.ป. หรือดึงจากฐานข้อมูล)
        publisher: '', // จงใจเว้นว่างเพื่อทดสอบปุ่มแก้ไขอัตโนมัติ (ม.ป.ท.)
        place: '', // จงใจเว้นว่างเพื่อทดสอบปุ่มแก้ไขอัตโนมัติ
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'test-inc-2-' + Math.random().toString(36).substring(2, 7),
        sourceType: 'journal',
        language: 'en',
        title: 'Attention is all you need',
        authors: [
          {
            id: 'auth-inc-2',
            firstName: 'Ashish',
            lastName: 'Vaswani',
            isOrganization: false,
            isThai: false,
          },
        ],
        year: '', // จงใจเว้นว่างเพื่อให้ดึงจากฐานข้อมูลวิชาการ
        containerTitle: '', // จงใจเว้นว่าง
        volume: '', // จงใจเว้นว่าง
        pages: '', // จงใจเว้นว่าง
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 1000,
      },
    ];

    setEntries((prev) => [...sampleIncomplete, ...prev]);
    showNotification(
      '🧪 เพิ่ม 2 รายการจำลองที่ข้อมูลขาดหายแล้ว! ลองกดปุ่มแก้ไขอัตโนมัติ ข้อ 1, 2 หรือ 3 ได้เลยครับ'
    );
  };

  const handleImportExternalFileEntries = (
    importedEntries: BibliographyEntry[],
    mode: 'append' | 'replace',
    sourceFileName?: string
  ) => {
    if (mode === 'replace') {
      setEntries(importedEntries);
      showNotification(
        `📂 นำเข้าและแทนที่บรรณานุกรมจากไฟล์ "${sourceFileName || 'ไฟล์ภายนอก'}" จำนวน ${importedEntries.length} รายการเรียบร้อยแล้ว`
      );
    } else {
      setEntries((prev) => [...importedEntries, ...prev]);
      showNotification(
        `📂 นำเข้าบรรณานุกรมจากไฟล์ "${sourceFileName || 'ไฟล์ภายนอก'}" เพิ่มจำนวน ${importedEntries.length} รายการเรียบร้อยแล้ว`
      );
    }
  };

  // Duplicate Citation Detector Handlers (Smart Merge & Delete Redundant)
  const handleMergeDuplicateGroup = (
    group: DuplicateGroup,
    preferredPrimaryId?: string
  ) => {
    const primaryId = preferredPrimaryId || group.recommendedPrimaryId;
    const merged = mergeDuplicateEntries(group.entries, primaryId);
    const redundantIds = new Set(
      group.entries.filter((e) => e.id !== merged.id).map((e) => e.id)
    );

    setEntries((prev) =>
      prev
        .filter((e) => !redundantIds.has(e.id))
        .map((e) => (e.id === merged.id ? merged : e))
    );

    showNotification(
      t(
        `✨ ผสานข้อมูลรายการซ้ำ "${merged.title.substring(0, 32)}..." เป็น 1 รายการที่สมบูรณ์เรียบร้อยแล้ว!`,
        `✨ Smart merged duplicate group "${merged.title.substring(0, 32)}..." into 1 complete entry!`
      )
    );
  };

  const handleMergeAllDuplicateGroups = () => {
    if (duplicateReport.groups.length === 0) return;

    const mergedByPrimaryId = new Map<string, BibliographyEntry>();
    const redundantIds = new Set<string>();

    for (const group of duplicateReport.groups) {
      const merged = mergeDuplicateEntries(group.entries, group.recommendedPrimaryId);
      mergedByPrimaryId.set(merged.id, merged);
      for (const e of group.entries) {
        if (e.id !== merged.id) {
          redundantIds.add(e.id);
        }
      }
    }

    setEntries((prev) =>
      prev
        .filter((e) => !redundantIds.has(e.id))
        .map((e) => mergedByPrimaryId.get(e.id) || e)
    );

    showNotification(
      t(
        `✨ ผสานรายการซ้ำทั้งหมด ${duplicateReport.totalDuplicateGroups} กลุ่ม (รวมข้อมูลและลบสำเนาซ้ำ ${duplicateReport.totalRedundantEntries} รายการ) สำเร็จ!`,
        `✨ Smart merged all ${duplicateReport.totalDuplicateGroups} duplicate groups (removed ${duplicateReport.totalRedundantEntries} redundant entries)!`
      )
    );
  };

  const handleDeleteRedundantInGroup = (
    group: DuplicateGroup,
    keepEntryId: string
  ) => {
    const idsToDelete = new Set(
      group.entries.filter((e) => e.id !== keepEntryId).map((e) => e.id)
    );
    setEntries((prev) => prev.filter((e) => !idsToDelete.has(e.id)));
    showNotification(
      t(
        `🗑️ ลบรายการที่ซ้ำออก ${idsToDelete.size} รายการ และเก็บรายการหลักไว้เรียบร้อยแล้ว`,
        `🗑️ Removed ${idsToDelete.size} redundant duplicate(s) and kept the selected entry.`
      )
    );
  };

  const handleDeleteAllRedundantEntries = () => {
    if (duplicateReport.groups.length === 0) return;
    const idsToDelete = new Set<string>();
    for (const group of duplicateReport.groups) {
      for (const e of group.entries) {
        if (e.id !== group.recommendedPrimaryId) {
          idsToDelete.add(e.id);
        }
      }
    }
    setEntries((prev) => prev.filter((e) => !idsToDelete.has(e.id)));
    showNotification(
      t(
        `🗑️ ลบสำเนาที่ซ้ำซ้อนทั้งหมด ${idsToDelete.size} รายการเรียบร้อยแล้ว`,
        `🗑️ Deleted all ${idsToDelete.size} redundant duplicate entries.`
      )
    );
  };

  const handleAddSampleDuplicateEntries = () => {
    const now = Date.now();
    const sampleDuplicates: BibliographyEntry[] = [
      // Pair 1: Duplicate by DOI + Title (Deep Learning - LeCun, Bengio, Hinton)
      {
        id: 'dup-doi-a-' + Math.random().toString(36).substring(2, 7),
        sourceType: 'journal',
        language: 'en',
        title: 'Deep learning',
        authors: [
          { id: 'da1', firstName: 'Yann', lastName: 'LeCun', isOrganization: false, isThai: false },
          { id: 'da2', firstName: 'Yoshua', lastName: 'Bengio', isOrganization: false, isThai: false },
          { id: 'da3', firstName: 'Geoffrey', lastName: 'Hinton', isOrganization: false, isThai: false },
        ],
        year: '2015',
        containerTitle: 'Nature',
        volume: '521',
        issue: '', // Missing issue & pages in copy A
        pages: '',
        doi: '10.1038/nature14539',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'dup-doi-b-' + Math.random().toString(36).substring(2, 7),
        sourceType: 'journal',
        language: 'en',
        title: 'Deep Learning (Copy)',
        authors: [
          { id: 'db1', firstName: 'Yann', lastName: 'LeCun', isOrganization: false, isThai: false },
        ],
        year: '2015',
        containerTitle: 'Nature',
        volume: '521',
        issue: '7553', // Present in copy B
        pages: '436-444', // Present in copy B
        doi: 'https://doi.org/10.1038/nature14539',
        url: 'https://www.nature.com/articles/nature14539',
        createdAt: now - 500,
        updatedAt: now - 500,
      },
      // Pair 2: Duplicate by ISBN + Title (Thai Research Book)
      {
        id: 'dup-isbn-a-' + Math.random().toString(36).substring(2, 7),
        sourceType: 'book',
        language: 'th',
        title: 'การวิจัยทางการศึกษา: หลักการและวิธีการนำไปใช้',
        authors: [
          { id: 'ia1', firstName: 'วรรณี', lastName: 'แกมเกตุ', isOrganization: false, isThai: true },
        ],
        year: '2565',
        publisher: 'สำนักพิมพ์แห่งจุฬาลงกรณ์มหาวิทยาลัย',
        place: '', // Missing place in copy A
        edition: '4',
        isbn: '978-974-03-3850-5',
        createdAt: now - 1000,
        updatedAt: now - 1000,
      },
      {
        id: 'dup-isbn-b-' + Math.random().toString(36).substring(2, 7),
        sourceType: 'book',
        language: 'th',
        title: 'การวิจัยทางการศึกษา หลักการและวิธีการนำไปใช้',
        authors: [
          { id: 'ib1', firstName: 'วรรณี', lastName: 'แกมเกตุ', isOrganization: false, isThai: true },
        ],
        year: '2565',
        publisher: '', // Missing publisher in copy B, but has place
        place: 'กรุงเทพฯ',
        isbn: '9789740338505',
        createdAt: now - 1500,
        updatedAt: now - 1500,
      },
    ];

    setEntries((prev) => [...sampleDuplicates, ...prev]);
    showNotification(
      t(
        '🧪 เพิ่มรายการจำลองที่ซ้ำกัน 2 กลุ่ม (ซ้ำด้วย DOI, ISBN และชื่อเรื่อง) แล้ว! ลองกดปุ่ม "ผสานข้อมูลอัจฉริยะ (Smart Merge)" ได้เลยครับ',
        '🧪 Added 2 sample duplicate groups (matched by DOI, ISBN, and Title)! Try clicking "Smart Merge".'
      )
    );
  };

  // Project History Handlers
  const handleLoadProject = (proj: BibliographyProject) => {
    setActiveProjectIdState(proj.id);
    setActiveProjectId(proj.id);
    setProjectTitle(proj.title);
    setCurrentStyle(proj.citationStyle);
    setEntries(proj.entries);
    setLastSavedAt(proj.updatedAt);
    showNotification(`ดึงชุดบรรณานุกรม "${proj.title}" กลับมาแก้ไขเรียบร้อยแล้ว`);
  };

  const handleCreateNewProject = async () => {
    const newId = 'proj-' + Math.random().toString(36).substring(2, 9);
    const newProj: BibliographyProject = {
      id: newId,
      title: `ชุดบรรณานุกรมใหม่ (${projects.length + 1})`,
      citationStyle: 'apa7',
      entries: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveProject(newProj);
    if (user) {
      await saveBibliographyToFirestore(user.uid, user.email || '', newProj);
    }

    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectIdState(newId);
    setActiveProjectId(newId);
    setProjectTitle(newProj.title);
    setCurrentStyle(newProj.citationStyle);
    setEntries([]);
    setLastSavedAt(newProj.updatedAt);
    showNotification(`สร้างชุดบรรณานุกรมใหม่ในฐานข้อมูลเรียบร้อยแล้ว`);
  };

  const handleDeleteProject = async (projectId: string) => {
    await deleteStoredProject(projectId);
    if (user) {
      try {
        await deleteBibliographyFromFirestore(projectId);
      } catch (e) {
        console.warn('Firestore delete error:', e);
      }
    }

    const remaining = projects.filter((p) => p.id !== projectId);
    setProjects(remaining);
    if (activeProjectId === projectId) {
      if (remaining.length > 0) {
        handleLoadProject(remaining[0]);
      } else {
        handleCreateNewProject();
      }
    }
    showNotification('ลบชุดบรรณานุกรมออกจากฐานข้อมูลเรียบร้อยแล้ว');
  };

  const handleDuplicateProject = async (projectToDup: BibliographyProject) => {
    const dupId = 'proj-' + Math.random().toString(36).substring(2, 9);
    const duplicated: BibliographyProject = {
      ...projectToDup,
      id: dupId,
      title: `${projectToDup.title} (สำเนา)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveProject(duplicated);
    if (user) {
      await saveBibliographyToFirestore(user.uid, user.email || '', duplicated);
    }

    setProjects((prev) => [duplicated, ...prev]);
    showNotification(`ทำสำเนาชุดบรรณานุกรมเรียบร้อยแล้ว`);
  };

  const handleUpdateProjectTitle = async (projectId: string, newTitle: string) => {
    if (projectId === activeProjectId) {
      setProjectTitle(newTitle);
    }
    const updated = projects.map((p) =>
      p.id === projectId ? { ...p, title: newTitle, updatedAt: Date.now() } : p
    );
    setProjects(updated);

    const target = updated.find((p) => p.id === projectId);
    if (target && user) {
      await saveProject(target);
      await saveBibliographyToFirestore(user.uid, user.email || '', target);
    }
    showNotification('เปลี่ยนชื่อชุดบรรณานุกรมเรียบร้อยแล้ว');
  };

  const handleImportBackup = async (importedList: BibliographyProject[]) => {
    for (const p of importedList) {
      await saveProject(p);
      if (user) {
        await saveBibliographyToFirestore(user.uid, user.email || '', p);
      }
    }
    const all = await loadAllProjects();
    setProjects(all);
    if (importedList.length > 0) {
      handleLoadProject(importedList[0]);
    }
    showNotification(`กู้คืนข้อมูลสำเร็จ ${importedList.length} โครงการ`);
  };

  const handleResetToSample = () => {
    setEntries(INITIAL_ENTRIES);
    showNotification('รีเซ็ตข้อมูลตัวอย่างเรียบร้อยแล้ว');
  };

  const handleClearAll = () => {
    setEntries([]);
    showNotification('ล้างรายการทั้งหมดเรียบร้อยแล้ว');
  };

  // Google Search Grounding Handlers
  const handleOpenGroundingModal = (initialQuery?: string) => {
    setGroundingInitialQuery(initialQuery || '');
    setIsGroundingModalOpen(true);
  };

  const handleAddGroundingEntry = (entry: BibliographyEntry) => {
    setEntries((prev) => [entry, ...prev]);
    showNotification(`เพิ่มรายการ "${entry.title.substring(0, 30)}..." เรียบร้อยแล้ว`);
  };

  const handleAddMultipleGroundingEntries = (newEntries: BibliographyEntry[]) => {
    if (newEntries.length === 0) return;
    setEntries((prev) => [...newEntries, ...prev]);
    showNotification(`เพิ่มข้อมูลจาก Google Search Grounding สำเร็จ ${newEntries.length} รายการ`);
  };

  const handleEditAndAddGroundingEntry = (entry: BibliographyEntry) => {
    setEditingEntry(entry);
    setIsEntryModalOpen(true);
  };

  // Word Export with Settings Modal (Font, Margins, Spacing)
  const handleExportDocx = () => {
    if (entries.length === 0) {
      showNotification('ไม่มีรายการบรรณานุกรมสำหรับส่งออก');
      return;
    }
    setIsExportModalOpen(true);
  };

  // Loading state while checking Firebase Auth status
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-300">
          {t(
            'กำลังเตรียมระบบฐานข้อมูลและยืนยันตัวตน...',
            'Initializing cloud database and authentication...'
          )}
        </p>
      </div>
    );
  }

  // Gatekeeper: Require user authentication before using the system
  if (!user) {
    return <AuthGate />;
  }

  // Account suspended by admin check
  if (isSuspended) {
    return <SuspendedNotice />;
  }

  const displayProjectTitle =
    projectTitle === 'ระบบจัดการบรรณานุกรมสำหรับงานวิจัยและวิทยานิพนธ์'
      ? t(
          'ระบบจัดการบรรณานุกรมสำหรับงานวิจัยและวิทยานิพนธ์',
          'Academic Bibliography Management System for Research & Thesis'
        )
      : projectTitle;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-800">
      {/* Navbar with AutoSave status, Cloud badge, Email trigger & Admin panel */}
      <Navbar
        currentStyle={currentStyle}
        onChangeStyle={setCurrentStyle}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenNewModal={() => {
          setEditingEntry(null);
          setIsEntryModalOpen(true);
        }}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        onOpenCheatSheet={() => setIsCheatSheetModalOpen(true)}
        onOpenAuditor={() => setIsAuditorModalOpen(true)}
        onOpenDuplicateDetector={() => setIsDuplicateModalOpen(true)}
        duplicateGroupsCount={duplicateReport.totalDuplicateGroups}
        onOpenExternalFileInspector={() => setIsExternalFileModalOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        validationIssuesCount={validationReport.entriesWithIssuesCount}
        validationErrorsCount={validationReport.totalErrors}
        onExportDocx={handleExportDocx}
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
        entryCount={entries.length}
        autoSaveState={autoSaveState}
        lastSavedAt={lastSavedAt}
        onManualSave={handleManualSave}
        projectTitle={projectTitle}
        onOpenSearchGrounding={() => handleOpenGroundingModal()}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
      />

      {/* Floating Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-medium animate-bounce border border-slate-700">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Section / Quick Info Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3.5">
            {/* Line 1: Icon and App Name on the exact same row */}
            <div className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 backdrop-blur-xs text-indigo-200 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <BookOpen className="w-5 h-5 text-indigo-200" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white font-sarabun leading-tight">
                {displayProjectTitle}
              </h1>
              <button
                onClick={() => {
                  setIsHistoryModalOpen(true);
                }}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title={t('คลิกเพื่อจัดการหรือเปลี่ยนชื่อชุดบรรณานุกรม', 'Click to manage or rename bibliography project')}
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {/* Line 2: The rest (Description) */}
            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed font-sarabun">
              {t(
                'ค้นหาข้อมูลผ่าน Google Search Grounding หรือดึงอัตโนมัติจาก DOI, ISBN และ URL เว็บไซต์ พร้อมระบบจัดเก็บฐานข้อมูลคลาวด์อัตโนมัติ (Auto-Save) ตรวจสอบความถูกต้อง ส่งออก Word (.docx) และส่งตรงสู่กล่องข้อความอีเมลของคุณได้ทันที',
                'Search references via Google Search Grounding or auto-fetch metadata from DOI, ISBN, and Web URLs. Equipped with Cloud Firestore Auto-Save, completeness validation, Microsoft Word (.docx) export, and direct email delivery.'
              )}
            </p>

            {/* Line 3: Quick Action Buttons & Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>
                  {t(
                    'รองรับ 6 มาตรฐาน: APA 7th • APA 6th • MLA 9th • Chicago • Harvard • Vancouver',
                    '6 Citation Styles: APA 7th • APA 6th • MLA 9th • Chicago • Harvard • Vancouver'
                  )}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {t('ฐานข้อมูลคลาวด์ Firestore บันทึกอัตโนมัติ', 'Cloud Firestore Auto-Save')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsAdminPanelOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400/25 via-amber-300/20 to-indigo-500/30 hover:from-amber-400/35 hover:to-indigo-500/40 text-amber-200 text-xs font-semibold transition-all cursor-pointer border border-amber-300/40 shadow-xs"
              >
                <Shield className="w-3.5 h-3.5 text-amber-300" />
                <span>{t('จัดการสมาชิก', 'Member Management')}</span>
              </button>

              <button
                onClick={() => setIsEmailModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 text-xs font-semibold transition-colors cursor-pointer border border-blue-400/30"
              >
                <Mail className="w-3.5 h-3.5 text-blue-300" />
                <span>
                  {t(`ส่งเอกสารไปที่อีเมล (${user.email})`, `Send to Email (${user.email})`)}
                </span>
              </button>

              <button
                onClick={() => handleOpenGroundingModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-xs font-semibold transition-colors cursor-pointer border border-amber-300/30"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{t('ค้นหาด้วย Google Grounding', 'Google Search Grounding')}</span>
              </button>

              <button
                onClick={() => setIsExternalFileModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/30 hover:bg-violet-500/45 text-violet-100 text-xs font-semibold transition-colors cursor-pointer border border-violet-300/40"
              >
                <FolderOpen className="w-3.5 h-3.5 text-violet-200" />
                <span>
                  {t(
                    'ตรวจสอบบรรณานุกรมจากไฟล์ภายนอก (.docx / .bib / .ris / .csv / .txt)',
                    'Inspect Bibliography from External File (.docx / .bib / .ris / .csv / .txt)'
                  )}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsGuideModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-500/30 hover:bg-teal-500/45 text-teal-100 text-xs font-bold transition-colors cursor-pointer border border-teal-300/45 shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-200" />
                <span>
                  {t(
                    'คู่มือการใช้งานระบบ (ไทย / อังกฤษ) & ดาวน์โหลด PDF',
                    'User Manual (TH / EN) & Download PDF'
                  )}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsCheatSheetModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/35 hover:bg-indigo-500/50 text-indigo-100 text-xs font-bold transition-colors cursor-pointer border border-indigo-300/45 shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {t(
                    'ตารางเทียบโครงสร้างและตัวอย่างบรรณานุกรม (Visual Style Cheat Sheets)',
                    'Visual Citation Style Cheat Sheets & Output Verifier'
                  )}
                </span>
              </button>
            </div>

            {/* Quick Feature Badges */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1.5 font-medium">
                {t('✓ ฐานข้อมูลคลาวด์ (Firestore Database)', '✓ Cloud Firestore Database')}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-200 border border-blue-400/30 flex items-center gap-1.5 font-medium">
                {t(`✓ ส่งเอกสารทางอีเมล (${user.email})`, `✓ Email Delivery (${user.email})`)}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-200 border border-amber-300/30 flex items-center gap-1.5 font-medium">
                {t('✨ ค้นหาผ่าน Google Search Grounding', '✨ Google Search Grounding')}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white/90 border border-white/15 flex items-center gap-1.5">
                {t('✓ ดึงข้อมูลอัตโนมัติ (DOI / ISBN / URL)', '✓ Auto-Fetch (DOI / ISBN / URL)')}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white/90 border border-white/15 flex items-center gap-1.5">
                {t('✓ บันทึกข้อมูลอัตโนมัติ (Auto-Saved)', '✓ Real-Time Auto-Save')}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white/90 border border-white/15 flex items-center gap-1.5">
                {t('✓ จัดเก็บประวัติและดึงกลับมาแก้ไขได้', '✓ Cloud History & Version Restore')}
              </span>
              <button
                type="button"
                onClick={() => setIsAuditorModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 flex flex-wrap items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                title={t(
                  'คลิกเพื่อเปิดหน้าต่างระบบสแกนตรวจสอบความสมบูรณ์ของข้อมูล',
                  'Click to open Validation & Missing Fields Alert Auditor'
                )}
              >
                <span className="font-bold text-emerald-300">✓</span>
                <span className="font-semibold tracking-tight">
                  {t('ระบบสแกนตรวจสอบความสมบูรณ์ของข้อมูล', 'Completeness Scanner')}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-900/70 text-indigo-200 text-[11px] font-bold tracking-wide border border-white/15">
                  Validation &amp; Missing Fields Alert
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsDuplicateModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-100 border border-amber-300/40 flex flex-wrap items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                title={t(
                  'คลิกเพื่อเปิดระบบตรวจจับและผสานรายการบรรณานุกรมซ้ำซ้อน (Title / DOI / ISBN)',
                  'Click to open Duplicate Citation Detector (Title / DOI / ISBN)'
                )}
              >
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-semibold tracking-tight">
                  {t('ระบบตรวจจับรายการบรรณานุกรมซ้ำซ้อน', 'Duplicate Citation Detector')}
                </span>
                {duplicateReport.totalDuplicateGroups > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-bold">
                    {duplicateReport.totalDuplicateGroups}
                  </span>
                )}
              </button>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white/90 border border-white/15 flex items-center gap-1.5">
                {t(
                  '✓ ส่งออก Word (.docx) ฟอนต์ & ขอบหน้า',
                  '✓ Export Word (.docx) Custom Font & Margins'
                )}
              </span>
              {isAdmin && (
                <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400/25 to-indigo-500/30 text-amber-200 border border-amber-300/40 flex items-center gap-1.5 font-medium">
                  {t('🛡️ สิทธิ์ผู้ดูแลระบบ (Admin Access)', '🛡️ Admin Access')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Auto Fetch Bar */}
        <AutoFetchBar
          onEntryFetched={handleEntryFetched}
          onOpenBatchModal={() => setIsBatchModalOpen(true)}
          onOpenSearchGroundingModal={handleOpenGroundingModal}
          onOpenExternalFileInspector={() => setIsExternalFileModalOpen(true)}
        />

        {/* Validation & Missing Fields Alert Scanner */}
        <ValidationBanner
          style={currentStyle}
          validationResults={validationReport.results}
          onOpenAuditor={() => setIsAuditorModalOpen(true)}
          onOpenExternalFileInspector={() => setIsExternalFileModalOpen(true)}
          onEditEntry={(entryId) => {
            const found = entries.find((e) => e.id === entryId);
            if (found) {
              setEditingEntry(found);
              setIsEntryModalOpen(true);
            }
          }}
          onApplyQuickFix={handleApplyQuickFix}
          onAutoFixEntry={handleAutoFixEntry}
          onAutoFixAll={handleAutoFixAll}
          onApplyStandardPresetToAll={handleApplyStandardPresetToAll}
          onAddIncompleteSampleEntries={handleAddIncompleteSampleEntries}
          autoFixingEntryIds={autoFixingEntryIds}
          isAutoFixingAll={isAutoFixingAll}
        />

        {/* Duplicate Citation Detector Banner (Title / DOI / ISBN) */}
        <DuplicateDetectorBanner
          entries={entries}
          style={currentStyle}
          duplicateReport={duplicateReport}
          onMergeGroup={handleMergeDuplicateGroup}
          onMergeAllGroups={handleMergeAllDuplicateGroups}
          onDeleteRedundantInGroup={handleDeleteRedundantInGroup}
          onDeleteAllRedundant={handleDeleteAllRedundantEntries}
          onDeleteSingleEntry={handleDeleteEntry}
          onOpenDuplicateModal={() => setIsDuplicateModalOpen(true)}
          onAddSampleDuplicates={handleAddSampleDuplicateEntries}
        />

        {/* Tab Content */}
        {activeTab === 'document' ? (
          <DocumentPaperPreview
            entries={entries}
            currentStyle={currentStyle}
            onChangeStyle={setCurrentStyle}
            onEditEntry={(entry) => {
              setEditingEntry(entry);
              setIsEntryModalOpen(true);
            }}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onOpenEmailModal={() => setIsEmailModalOpen(true)}
            onOpenCheatSheet={() => setIsCheatSheetModalOpen(true)}
            duplicateReport={duplicateReport}
            onMergeDuplicateGroup={handleMergeDuplicateGroup}
            onOpenDuplicateModal={() => setIsDuplicateModalOpen(true)}
          />
        ) : (
          <BibliographyList
            entries={entries}
            currentStyle={currentStyle}
            onEdit={(entry) => {
              setEditingEntry(entry);
              setIsEntryModalOpen(true);
            }}
            onDelete={handleDeleteEntry}
            onDuplicate={handleDuplicateEntry}
            onOpenNewModal={() => {
              setEditingEntry(null);
              setIsEntryModalOpen(true);
            }}
            onAutoFixEntry={handleAutoFixEntry}
            autoFixingEntryIds={autoFixingEntryIds}
            duplicateReport={duplicateReport}
            onMergeDuplicateGroup={handleMergeDuplicateGroup}
            onOpenDuplicateModal={() => setIsDuplicateModalOpen(true)}
          />
        )}

        {/* Footer controls: History, Reset & Clear */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-200 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="hover:text-indigo-600 flex items-center gap-1 cursor-pointer transition-colors font-medium"
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                {t(
                  `ประวัติและคลังข้อมูลคลาวด์ (${projects.length})`,
                  `Cloud History & Library (${projects.length})`
                )}
              </span>
            </button>
            <button
              onClick={handleResetToSample}
              className="hover:text-indigo-600 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('คืนค่าข้อมูลตัวอย่าง', 'Reset to Sample Data')}</span>
            </button>
            <button
              onClick={handleClearAll}
              className="hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{t('ล้างรายการในชุดนี้', 'Clear All Entries')}</span>
            </button>
          </div>

          <div className="text-slate-400">
            {t(
              'AutoBiblio • ระบบจัดเก็บและสร้างบรรณานุกรมอัตโนมัติบนฐานข้อมูลคลาวด์',
              'AutoBiblio • Automated Academic Bibliography & Cloud Management System'
            )}
          </div>
        </div>
      </main>

      {/* Bottom-most Contact Footer */}
      <footer className="bg-white border-t border-slate-200/90 py-4 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm text-slate-600 font-sarabun text-center">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              {t('ติดต่อสอบถามรายละเอียดเพิ่มเติมได้ที่', 'For inquiries & support, contact')}
            </span>
            <a
              href="mailto:nonenapatnunwipat@gmail.com"
              className="font-bold text-indigo-700 hover:text-indigo-900 underline decoration-indigo-300 underline-offset-4 transition-colors"
            >
              nonenapatnunwipat@gmail.com
            </a>
          </span>
        </div>
      </footer>

      {/* Modals */}
      <EntryModal
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
        initialData={editingEntry}
        currentStyle={currentStyle}
      />

      <CitationGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      <CitationCheatSheetModal
        isOpen={isCheatSheetModalOpen}
        onClose={() => setIsCheatSheetModalOpen(false)}
        currentStyle={currentStyle}
        onChangeStyle={setCurrentStyle}
        entries={entries}
        onEditEntry={(entry) => {
          setEditingEntry(entry);
          setIsEntryModalOpen(true);
        }}
      />

      <BatchImportModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onImportBatch={handleImportBatch}
      />

      <ValidationDrawerModal
        isOpen={isAuditorModalOpen}
        onClose={() => setIsAuditorModalOpen(false)}
        style={currentStyle}
        validationResults={validationReport.results}
        onEditEntry={(id) => {
          const found = entries.find((e) => e.id === id);
          if (found) {
            setEditingEntry(found);
            setIsEntryModalOpen(true);
          }
        }}
        onOpenExternalFileInspector={() => setIsExternalFileModalOpen(true)}
        onApplyQuickFix={handleApplyQuickFix}
        onAutoFixEntry={handleAutoFixEntry}
        onAutoFixAll={handleAutoFixAll}
        onApplyStandardPresetToAll={handleApplyStandardPresetToAll}
        onAddIncompleteSampleEntries={handleAddIncompleteSampleEntries}
        autoFixingEntryIds={autoFixingEntryIds}
        isAutoFixingAll={isAutoFixingAll}
      />

      <ExternalFileInspectorModal
        isOpen={isExternalFileModalOpen}
        onClose={() => setIsExternalFileModalOpen(false)}
        style={currentStyle}
        onChangeStyle={setCurrentStyle}
        onImportEntries={handleImportExternalFileEntries}
      />

      <DuplicateDetectorModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        entries={entries}
        style={currentStyle}
        duplicateReport={duplicateReport}
        onMergeGroup={handleMergeDuplicateGroup}
        onMergeAllGroups={handleMergeAllDuplicateGroups}
        onDeleteRedundantInGroup={handleDeleteRedundantInGroup}
        onDeleteAllRedundant={handleDeleteAllRedundantEntries}
        onDeleteSingleEntry={handleDeleteEntry}
        onEditEntry={(entry) => {
          setIsDuplicateModalOpen(false);
          setEditingEntry(entry);
          setIsEntryModalOpen(true);
        }}
        onAddSampleDuplicates={handleAddSampleDuplicateEntries}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        projects={projects}
        currentProjectId={activeProjectId}
        onLoadProject={handleLoadProject}
        onCreateNewProject={handleCreateNewProject}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={handleDuplicateProject}
        onUpdateProjectTitle={handleUpdateProjectTitle}
        onImportBackup={handleImportBackup}
      />

      <DocxExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        entries={entries}
        currentStyle={currentStyle}
        projectId={activeProjectId}
        projectTitle={projectTitle}
        validationErrorsCount={validationReport.totalErrors}
        onOpenAuditor={() => setIsAuditorModalOpen(true)}
        onExportSuccess={(filename) => {
          showNotification(`ดาวน์โหลดไฟล์เอกสาร Word "${filename}" สำเร็จ!`);
          setProjects((prev) =>
            prev.map((p) =>
              p.id === activeProjectId ? { ...p, lastExportedAt: Date.now() } : p
            )
          );
        }}
      />

      <EmailExportModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        entries={entries}
        style={currentStyle}
        projectTitle={projectTitle}
        userEmail={user.email || ''}
        docxOptions={{
          title: projectTitle,
          fontFamily: 'TH Sarabun New',
        }}
      />

      <GoogleSearchGroundingModal
        isOpen={isGroundingModalOpen}
        onClose={() => setIsGroundingModalOpen(false)}
        onAddEntry={handleAddGroundingEntry}
        onAddMultipleEntries={handleAddMultipleGroundingEntries}
        onEditAndAdd={handleEditAndAddGroundingEntry}
        currentStyle={currentStyle}
        initialQuery={groundingInitialQuery}
      />

      {/* Admin Member Management Panel */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
      />
    </div>
  );
}
