import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, ensureValidFirestoreAuth, markTokenServiceDisabled } from '../lib/firebase';
import { UserMember, UserRole, UserStatus } from '../types/member';
import { BibliographyProject } from '../types/history';
import { loadAllProjects } from '../utils/storage/projectHistoryStorage';

const USERS_COLLECTION = 'users';
const BIBLIOGRAPHIES_COLLECTION = 'bibliographies';
const LOCAL_MEMBERS_STORAGE_KEY = 'autobiblio_admin_members_v1';

// Initial sample members to seed if Firestore users collection has only 1 user
const SAMPLE_ACADEMIC_MEMBERS: Omit<UserMember, 'uid'>[] = [
  {
    email: 'somchai.prasert@university.ac.th',
    displayName: 'ผศ.ดร.สมชาย ประเสริฐวิทย์',
    role: 'member',
    status: 'active',
    department: 'คณะครุศาสตร์และศึกษาศาสตร์',
    note: 'วิจัยด้านการพัฒนาระบบการเรียนรู้เชิงรุก',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    lastLoginAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    bibliographyCount: 6,
  },
  {
    email: 'aphirak.research@grad.chula.ac.th',
    displayName: 'อภิรักษ์ ชัยชนะ (นศ. ปริญญาเอก)',
    role: 'member',
    status: 'active',
    department: 'บัณฑิตวิทยาลัย สาขาวิทยาการคอมพิวเตอร์',
    note: 'จัดทำวิทยานิพนธ์ระดับดุษฎีนิพนธ์ ด้าน AI & NLP',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    lastLoginAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    bibliographyCount: 14,
  },
  {
    email: 'sasithorn.w@med.cmu.ac.th',
    displayName: 'พญ.ศศิธร วัฒนพาณิชย์',
    role: 'member',
    status: 'active',
    department: 'คณะแพทยศาสตร์ ภาควิชาเวชศาสตร์ป้องกัน',
    note: 'งานวิจัยทางคลินิกและสาธารณสุขชุมชน (Vancouver Style)',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    lastLoginAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    bibliographyCount: 9,
  },
  {
    email: 'kallaya.suspend.test@academic.th',
    displayName: 'กัลยาณี รัตนโกสินทร์',
    role: 'member',
    status: 'suspended',
    department: 'คณะสังคมศาสตร์',
    note: 'บัญชีถูกระงับชั่วคราวเนื่องจากคำขอตรวจสอบสิทธิ์การใช้งาน',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    lastLoginAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    bibliographyCount: 2,
  },
];

function getDefaultLocalMembers(): UserMember[] {
  return [
    {
      uid: 'admin-super',
      email: 'nonenapatnunwipat@gmail.com',
      displayName: 'อาจารย์ผู้ดูแลระบบ (Super Admin)',
      role: 'admin',
      status: 'active',
      department: 'ศูนย์บริการวิชาการและวิจัย',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      bibliographyCount: 3,
    },
    ...SAMPLE_ACADEMIC_MEMBERS.map((s, idx) => ({ ...s, uid: `sample-user-${idx + 1}` })),
  ];
}

function loadLocalMembers(): UserMember[] {
  try {
    const raw = localStorage.getItem(LOCAL_MEMBERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse error
  }
  const defaults = getDefaultLocalMembers();
  saveLocalMembers(defaults);
  return defaults;
}

function saveLocalMembers(members: UserMember[]): void {
  try {
    localStorage.setItem(LOCAL_MEMBERS_STORAGE_KEY, JSON.stringify(members));
  } catch {
    // Ignore storage error
  }
}

/**
 * Fetch all members from Firestore (when valid auth token is active) or local storage
 */
export async function fetchAllMembers(): Promise<UserMember[]> {
  try {
    const canUseFirestore = await ensureValidFirestoreAuth();
    if (!canUseFirestore) {
      return loadLocalMembers();
    }

    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    const members: UserMember[] = [];

    const biblioSnap = await getDocs(collection(db, BIBLIOGRAPHIES_COLLECTION));
    const biblioCountMap: Record<string, number> = {};
    biblioSnap.forEach((d) => {
      const data = d.data();
      const uid = data.userId;
      if (uid) {
        biblioCountMap[uid] = (biblioCountMap[uid] || 0) + 1;
      }
    });

    usersSnap.forEach((docSnap) => {
      const d = docSnap.data();
      members.push({
        uid: docSnap.id,
        email: d.email || null,
        displayName: d.displayName || (d.email ? d.email.split('@')[0] : 'ผู้ใช้งาน'),
        role: d.role === 'admin' || d.email === 'nonenapatnunwipat@gmail.com' ? 'admin' : 'member',
        status: d.status === 'suspended' ? 'suspended' : 'active',
        department: d.department || '',
        note: d.note || '',
        createdAt: d.createdAt || new Date().toISOString(),
        lastLoginAt: d.lastLoginAt || undefined,
        bibliographyCount: biblioCountMap[docSnap.id] || d.bibliographyCount || 0,
      });
    });

    if (members.length <= 1) {
      for (let i = 0; i < SAMPLE_ACADEMIC_MEMBERS.length; i++) {
        const sample = SAMPLE_ACADEMIC_MEMBERS[i];
        const sampleId = `sample-user-${i + 1}`;
        if (!members.some((m) => m.email === sample.email)) {
          const newMember: UserMember = {
            ...sample,
            uid: sampleId,
          };
          try {
            await setDoc(doc(db, USERS_COLLECTION, sampleId), newMember);
            members.push(newMember);
          } catch {
            members.push(newMember);
          }
        }
      }
    }

    members.sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (b.role === 'admin' && a.role !== 'admin') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    saveLocalMembers(members);
    return members;
  } catch (err: any) {
    const msg = String(err?.message || err?.code || '');
    if (msg.includes('token-service-api-has-not-been-used') || msg.includes('securetoken')) {
      markTokenServiceDisabled();
    }
    return loadLocalMembers();
  }
}

/**
 * Update member status (active / suspended)
 */
export async function updateMemberStatus(uid: string, status: UserStatus): Promise<void> {
  const local = loadLocalMembers().map((m) => (m.uid === uid ? { ...m, status } : m));
  saveLocalMembers(local);

  const canUseFirestore = await ensureValidFirestoreAuth();
  if (!canUseFirestore) return;
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, { status });
  } catch {
    // Saved in local storage
  }
}

/**
 * Update member role (admin / member)
 */
export async function updateMemberRole(uid: string, role: UserRole): Promise<void> {
  const local = loadLocalMembers().map((m) => (m.uid === uid ? { ...m, role } : m));
  saveLocalMembers(local);

  const canUseFirestore = await ensureValidFirestoreAuth();
  if (!canUseFirestore) return;
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, { role });
  } catch {
    // Saved in local storage
  }
}

/**
 * Update general member profile details
 */
export async function updateMemberProfile(
  uid: string,
  data: Partial<Pick<UserMember, 'displayName' | 'department' | 'note' | 'role' | 'status'>>
): Promise<void> {
  const local = loadLocalMembers().map((m) => (m.uid === uid ? { ...m, ...data } : m));
  saveLocalMembers(local);

  const canUseFirestore = await ensureValidFirestoreAuth();
  if (!canUseFirestore) return;
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, data);
  } catch {
    // Saved in local storage
  }
}

/**
 * Add a new member manually (admin pre-registration)
 */
export async function addMemberManual(
  memberData: Omit<UserMember, 'uid'>
): Promise<UserMember> {
  const uid = 'user-' + Math.random().toString(36).substring(2, 10);
  const newMember: UserMember = {
    ...memberData,
    uid,
    createdAt: new Date().toISOString(),
    lastLoginAt: undefined,
    bibliographyCount: 0,
  };

  const local = [newMember, ...loadLocalMembers()];
  saveLocalMembers(local);

  const canUseFirestore = await ensureValidFirestoreAuth();
  if (canUseFirestore) {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      await setDoc(userRef, newMember);
    } catch {
      // Saved in local storage
    }
  }
  return newMember;
}

/**
 * Delete a member record from Firestore & local storage
 */
export async function deleteMember(uid: string): Promise<void> {
  const local = loadLocalMembers().filter((m) => m.uid !== uid);
  saveLocalMembers(local);

  const canUseFirestore = await ensureValidFirestoreAuth();
  if (!canUseFirestore) return;
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await deleteDoc(userRef);
  } catch {
    // Deleted in local storage
  }
}

/**
 * Fetch bibliography projects created by a specific member
 */
export async function fetchMemberBibliographies(userId: string): Promise<BibliographyProject[]> {
  try {
    const canUseFirestore = await ensureValidFirestoreAuth();
    if (!canUseFirestore) {
      return await loadAllProjects();
    }

    const q = query(
      collection(db, BIBLIOGRAPHIES_COLLECTION),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const result: BibliographyProject[] = [];
    snap.forEach((d) => {
      const data = d.data();
      result.push({
        id: d.id,
        title: data.title || 'ชุดบรรณานุกรม',
        citationStyle: data.citationStyle || 'apa7',
        entries: Array.isArray(data.entries) ? data.entries : [],
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
        description: data.description || '',
      });
    });
    if (result.length === 0) {
      return await loadAllProjects();
    }
    return result;
  } catch {
    return await loadAllProjects();
  }
}
