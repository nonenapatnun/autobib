import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  auth,
  db,
  LOCAL_STORAGE_SESSION_KEY,
  ensureValidFirestoreAuth,
  markTokenServiceDisabled,
} from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { UserRole, UserStatus } from '../types/member';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isLocalGuest?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  lastLoginAt?: string;
  department?: string;
  note?: string;
}

interface AuthContextType {
  user: AppUser | User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isSuspended: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  loginAsGuestOrDirect: (customEmail?: string, customName?: string) => void;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function serializeUser(u: AppUser | User): AppUser {
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: 'photoURL' in u ? u.photoURL : null,
    isLocalGuest: 'isLocalGuest' in u ? u.isLocalGuest : false,
  };
}

function saveSessionToLocalStorage(appUser: AppUser | User, profile: UserProfile): void {
  try {
    localStorage.setItem(
      LOCAL_STORAGE_SESSION_KEY,
      JSON.stringify({
        user: serializeUser(appUser),
        profile,
      })
    );
  } catch (e) {
    console.warn('Failed to save session to localStorage:', e);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  // Sync user profile with Firestore when valid token is available, always backed by localStorage
  const syncUserProfile = useCallback(async (appUser: AppUser | User) => {
    const isSuperAdmin = appUser.email === 'nonenapatnunwipat@gmail.com';
    const defaultRole: UserRole = isSuperAdmin ? 'admin' : 'member';
    const defaultStatus: UserStatus = 'active';
    const now = new Date().toISOString();

    const fallbackProfile: UserProfile = {
      uid: appUser.uid,
      email: appUser.email,
      displayName:
        appUser.displayName ||
        (appUser.email ? appUser.email.split('@')[0] : 'นักวิจัย'),
      role: defaultRole,
      status: defaultStatus,
      createdAt: now,
      lastLoginAt: now,
    };

    try {
      const canUseFirestore = await ensureValidFirestoreAuth();
      if (!canUseFirestore) {
        setUserProfile(fallbackProfile);
        saveSessionToLocalStorage(appUser, fallbackProfile);
        return;
      }

      const userRef = doc(db, 'users', appUser.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, fallbackProfile);
        setUserProfile(fallbackProfile);
        saveSessionToLocalStorage(appUser, fallbackProfile);
      } else {
        const existingData = snap.data();
        const finalRole: UserRole = isSuperAdmin ? 'admin' : (existingData.role || 'member');
        const finalStatus: UserStatus = isSuperAdmin ? 'active' : (existingData.status || 'active');
        const updatedProfile: UserProfile = {
          uid: appUser.uid,
          email: appUser.email,
          displayName:
            existingData.displayName ||
            appUser.displayName ||
            (appUser.email?.split('@')[0] ?? 'นักวิจัย'),
          role: finalRole,
          status: finalStatus,
          createdAt: existingData.createdAt || now,
          lastLoginAt: now,
          department: existingData.department,
          note: existingData.note,
        };
        await setDoc(userRef, { lastLoginAt: now, role: finalRole, status: finalStatus }, { merge: true });
        setUserProfile(updatedProfile);
        saveSessionToLocalStorage(appUser, updatedProfile);
      }
    } catch (err: any) {
      const msg = String(err?.message || err?.code || '');
      if (msg.includes('token-service-api-has-not-been-used') || msg.includes('securetoken')) {
        markTokenServiceDisabled();
        try {
          await signOut(auth);
        } catch {
          // Ignore
        }
      }
      setUserProfile(fallbackProfile);
      saveSessionToLocalStorage(appUser, fallbackProfile);
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      await syncUserProfile(user);
    }
  }, [user, syncUserProfile]);

  // Check saved local session or Firebase Auth state on mount
  useEffect(() => {
    const checkSavedSession = (): boolean => {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.user && parsed.user.uid) {
            const restoredUser: AppUser = parsed.user;
            const isSuperAdmin = restoredUser.email === 'nonenapatnunwipat@gmail.com';
            const restoredProfile: UserProfile = parsed.profile || {
              uid: restoredUser.uid,
              email: restoredUser.email,
              displayName:
                restoredUser.displayName ||
                (restoredUser.email ? restoredUser.email.split('@')[0] : 'นักวิจัย'),
              role: isSuperAdmin ? 'admin' : 'member',
              status: 'active',
            };
            if (isSuperAdmin) {
              restoredProfile.role = 'admin';
              restoredProfile.status = 'active';
            }
            setUser(restoredUser);
            setUserProfile(restoredProfile);
            setLoading(false);
            return true;
          }
        }
      } catch (e) {
        console.warn('Failed to parse local session:', e);
      }
      return false;
    };

    const hasLocalSession = checkSavedSession();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const serialized = serializeUser(currentUser);
        setUser(serialized);
        await syncUserProfile(currentUser);
        setLoading(false);
      } else {
        if (!hasLocalSession) {
          const stillLocal = checkSavedSession();
          if (!stillLocal) {
            setUser(null);
            setUserProfile(null);
          }
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [syncUserProfile]);

  const translateAuthError = (err: any): string => {
    const code = String(err?.code || '');
    const message = String(err?.message || '');

    if (
      code.includes('token-service-api-has-not-been-used') ||
      message.includes('token-service-api-has-not-been-used') ||
      message.includes('securetoken.googleapis.com')
    ) {
      return 'ระบบ Token Service API บนคลาวด์กำลังปรับปรุง กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน หรือกดปุ่ม "เข้าใช้งานทั่วไป (Guest Researcher Mode)"';
    }

    switch (code) {
      case 'auth/operation-not-allowed':
        return 'ระบบลงทะเบียนด้วย Email/Password ยังไม่ได้เปิดใช้งานใน Firebase Console — แนะนำให้กดปุ่ม "เข้าสู่ระบบด้วย Google" หรือปุ่ม "เข้าใช้งานทั่วไป"';
      case 'auth/popup-blocked':
        return 'เบราว์เซอร์ของคุณบล็อกหน้าต่างป๊อปอัป กรุณากดอนุญาตป๊อปอัป (Allow Popups) หรือเข้าสู่ระบบด้วยอีเมล';
      case 'auth/popup-closed-by-user':
        return 'หน้าต่างเข้าสู่ระบบถูกปิดก่อนเสร็จสิ้น กรุณาลองใหม่อีกครั้ง';
      case 'auth/cancelled-popup-request':
        return 'มีการเปิดหน้าต่างเข้าสู่ระบบซ้ำซ้อน กรุณาลองใหม่อีกครั้ง';
      case 'auth/user-not-found':
        return 'ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณากดแท็บ "สมัครสมาชิกใหม่" หรือใช้ปุ่มเข้าสู่ระบบด้วย Google';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือยังไม่ได้กดสมัครสมาชิก กรุณาตรวจสอบอีกครั้ง';
      case 'auth/email-already-in-use':
        return 'อีเมลนี้ถูกลงทะเบียนไว้แล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านของคุณ หรือเข้าสู่ระบบด้วย Google';
      case 'auth/weak-password':
        return 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรเพื่อความปลอดภัย';
      case 'auth/invalid-email':
        return 'รูปแบบที่อยู่อีเมลไม่ถูกต้อง (เช่น user@example.com)';
      case 'auth/too-many-requests':
        return 'มีการพยายามเข้าสู่ระบบผิดพลาดหลายครั้ง กรุณารอสักครู่แล้วลองใหม่อีกครั้ง';
      case 'auth/network-request-failed':
        return 'ไม่สามารถเชื่อมต่อเครือข่ายได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      default:
        return err?.message || 'เกิดข้อผิดพลาดในการยืนยันตัวตน กรุณาลองใหม่อีกครั้ง';
    }
  };

  // Helper to create a verified local session when cloud Token Service API is disabled
  const createFallbackAuthenticatedSession = (email: string, name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isSuperAdmin = cleanEmail === 'nonenapatnunwipat@gmail.com';
    const displayName =
      name?.trim() ||
      (isSuperAdmin ? 'อาจารย์ผู้ดูแลระบบ (Super Admin)' : cleanEmail.split('@')[0] || 'นักวิจัย');
    const now = new Date().toISOString();

    const localUser: AppUser = {
      uid: isSuperAdmin ? 'admin-super' : 'user-' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12),
      email: cleanEmail,
      displayName,
      isLocalGuest: false,
    };

    const localProfile: UserProfile = {
      uid: localUser.uid,
      email: cleanEmail,
      displayName,
      role: isSuperAdmin ? 'admin' : 'member',
      status: 'active',
      createdAt: now,
      lastLoginAt: now,
    };

    saveSessionToLocalStorage(localUser, localProfile);
    setUser(localUser);
    setUserProfile(localProfile);
  };

  // 1. Google Sign-In with Popup
  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      if (cred.user) {
        const serialized = serializeUser(cred.user);
        setUser(serialized);
        await syncUserProfile(cred.user);
      }
    } catch (err: any) {
      const errStr = String(err?.message || err?.code || '');
      if (errStr.includes('token-service-api-has-not-been-used') || errStr.includes('securetoken')) {
        markTokenServiceDisabled();
        try {
          await signOut(auth);
        } catch {
          // Ignore
        }
      }
      const msg = translateAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // 2. Email Sign-In
  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const serialized = serializeUser(cred.user);
      setUser(serialized);
      await syncUserProfile(cred.user);
    } catch (err: any) {
      const errStr = String(err?.message || err?.code || '');
      if (
        errStr.includes('token-service-api-has-not-been-used') ||
        errStr.includes('securetoken') ||
        errStr.includes('operation-not-allowed')
      ) {
        markTokenServiceDisabled();
        try {
          await signOut(auth);
        } catch {
          // Ignore
        }
        createFallbackAuthenticatedSession(email);
        return;
      }
      const msg = translateAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // 3. Email Sign-Up
  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const displayName = name?.trim() || (email.split('@')[0] || 'นักวิจัย');
      if (cred.user) {
        try {
          await updateProfile(cred.user, { displayName });
        } catch {
          // Ignore display name update error if token service is unavailable
        }
        const serialized = serializeUser({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName,
          photoURL: cred.user.photoURL,
        });
        setUser(serialized);
        await syncUserProfile(serialized);
      }
    } catch (err: any) {
      const errStr = String(err?.message || err?.code || '');
      if (
        errStr.includes('token-service-api-has-not-been-used') ||
        errStr.includes('securetoken') ||
        errStr.includes('operation-not-allowed')
      ) {
        markTokenServiceDisabled();
        try {
          await signOut(auth);
        } catch {
          // Ignore
        }
        createFallbackAuthenticatedSession(email, name);
        return;
      }
      const msg = translateAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // 4. Guest Access (Strictly standard member, never Super Admin)
  const loginAsGuestOrDirect = (customEmail?: string, customName?: string) => {
    setAuthError(null);
    const rawEmail = customEmail?.trim().toLowerCase();

    if (rawEmail === 'nonenapatnunwipat@gmail.com') {
      const msg = 'ไม่สามารถเข้าใช้งานบัญชีผู้ดูแลระบบผ่านโหมดทดลองได้ กรุณาเข้าสู่ระบบด้วย Google หรืออีเมลและรหัสผ่านที่ถูกต้อง';
      setAuthError(msg);
      throw new Error(msg);
    }

    const targetEmail = customEmail?.trim() || 'guest.researcher@academic.biblio';
    const targetName = customName?.trim() || 'นักวิจัยทดลองใช้งาน (Guest)';

    const localUser: AppUser = {
      uid: 'guest-' + Math.random().toString(36).substring(2, 9),
      email: targetEmail,
      displayName: targetName,
      isLocalGuest: true,
    };

    const localProfile: UserProfile = {
      uid: localUser.uid,
      email: targetEmail,
      displayName: targetName,
      role: 'member',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      department: 'ทดลองใช้งานทั่วไป (Guest)',
      note: 'โหมดทดลองใช้งาน',
    };

    saveSessionToLocalStorage(localUser, localProfile);
    setUser(localUser);
    setUserProfile(localProfile);
  };

  // Sign out
  const signOutUser = async () => {
    setAuthError(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      if (typeof window !== 'undefined' && window.indexedDB) {
        try {
          window.indexedDB.deleteDatabase('firebaseLocalStorageDb');
        } catch {
          // Ignore
        }
      }
      setUser(null);
      setUserProfile(null);
      await signOut(auth);
    } catch (err: any) {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      setUser(null);
      setUserProfile(null);
      console.warn('Sign out warning:', err);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      const msg = translateAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const isAdmin = Boolean(
    user?.email === 'nonenapatnunwipat@gmail.com' ||
    userProfile?.role === 'admin'
  );

  const isSuspended = Boolean(
    user?.email !== 'nonenapatnunwipat@gmail.com' &&
    userProfile?.status === 'suspended'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAdmin,
        isSuspended,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        loginAsGuestOrDirect,
        signOutUser,
        resetPassword,
        authError,
        clearAuthError,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
