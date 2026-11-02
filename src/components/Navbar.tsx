import React, { useState } from 'react';
import {
  BookMarked,
  Plus,
  FileText,
  ListFilter,
  ShieldAlert,
  ShieldCheck,
  History,
  Sparkles,
  Mail,
  LogOut,
  Database,
  User,
  Shield,
  FolderOpen,
  Globe,
  BookOpen,
  Layers,
  Eye,
} from 'lucide-react';
import { CitationStyle } from '../types/bibliography';
import { AutoSaveState } from '../types/history';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface NavbarProps {
  currentStyle: CitationStyle;
  onChangeStyle: (style: CitationStyle) => void;
  activeTab: 'document' | 'list';
  onChangeTab: (tab: 'document' | 'list') => void;
  onOpenNewModal: () => void;
  onOpenGuideModal: () => void;
  onOpenCheatSheet?: () => void;
  onOpenAuditor: () => void;
  onOpenDuplicateDetector?: () => void;
  duplicateGroupsCount?: number;
  onOpenExternalFileInspector?: () => void;
  onOpenHistory: () => void;
  validationIssuesCount: number;
  validationErrorsCount: number;
  onExportDocx: () => void;
  onOpenEmailModal?: () => void;
  entryCount: number;
  autoSaveState: AutoSaveState;
  lastSavedAt: number | null;
  onManualSave: () => void;
  projectTitle: string;
  onOpenSearchGrounding?: () => void;
  onOpenAdminPanel?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onChangeTab,
  onOpenNewModal,
  onOpenGuideModal,
  onOpenCheatSheet,
  onOpenAuditor,
  onOpenDuplicateDetector,
  duplicateGroupsCount = 0,
  onOpenExternalFileInspector,
  onOpenHistory,
  validationIssuesCount,
  validationErrorsCount,
  onExportDocx,
  onOpenEmailModal,
  entryCount,
  autoSaveState,
  lastSavedAt,
  onManualSave,
  onOpenSearchGrounding,
  onOpenAdminPanel,
}) => {
  const { user, isAdmin, signOutUser } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleSignOut = async () => {
    setShowSignOutConfirm(false);
    try {
      await signOutUser();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* TIER 1: Prominent App Name & System Statuses */}
        <div className="flex flex-wrap items-center justify-between py-2.5 sm:py-3 border-b border-slate-100 gap-3">
          {/* Brand & Full App Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <BookMarked className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-extrabold text-slate-900 text-base sm:text-lg lg:text-xl tracking-tight leading-tight">
                  {t(
                    'ระบบจัดการบรรณานุกรมสำหรับงานวิจัยและวิทยานิพนธ์',
                    'Academic Bibliography Management System for Research & Thesis'
                  )}
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0 shadow-2xs">
                  AutoBiblio
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sarabun mt-0.5 hidden sm:block">
                {t(
                  'รองรับมาตรฐาน APA 6/7, MLA, Chicago, Harvard, Vancouver • บันทึกฐานข้อมูลคลาวด์อัตโนมัติ',
                  'Supports APA 6/7, MLA, Chicago, Harvard, Vancouver • Real-Time Cloud Auto-Save'
                )}
              </p>
            </div>
          </div>

          {/* System Statuses, Language Menu & User Account */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* Status 1: AutoSave Status */}
            <AutoSaveIndicator
              state={autoSaveState}
              lastSavedAt={lastSavedAt}
              onManualSave={onManualSave}
              entryCount={entryCount}
            />

            {/* Status 2: Cloud Database Status */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs"
              title={t(
                'เชื่อมต่อฐานข้อมูล Firestore Cloud พร้อมจัดเก็บถาวรและบันทึกอัตโนมัติ',
                'Connected to Cloud Firestore with permanent storage and real-time auto-save'
              )}
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{t('ฐานข้อมูลคลาวด์ Firestore', 'Cloud Firestore DB')}</span>
            </div>

            {/* ปุ่มจัดการสมาชิก (วางไว้ข้างหลัง ฐานข้อมูลคลาวด์ Firestore) */}
            {onOpenAdminPanel && (
              <button
                type="button"
                onClick={onOpenAdminPanel}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-300/40 shadow-2xs transition-all cursor-pointer shrink-0"
                title={t(
                  'เปิดระบบจัดการสมาชิกสำหรับผู้ดูแลระบบ (Admin Panel)',
                  'Open Admin Member Management Panel'
                )}
              >
                <Shield className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{t('จัดการสมาชิก', 'Members')}</span>
              </button>
            )}

            {/* เมนูสลับภาษา ไทย / English (Language Switcher Menu) */}
            <div
              className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 shadow-2xs shrink-0"
              role="group"
              aria-label="Language Switcher"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600 ml-1.5 mr-1 shrink-0" />
              <button
                type="button"
                onClick={() => setLang('th')}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  lang === 'th'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="สลับเป็นเมนูภาษาไทย (Thai Menu)"
              >
                TH ไทย
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to English Menu (เมนูภาษาอังกฤษ)"
              >
                EN Eng
              </button>
            </div>

            {/* Status 3: User Role & Sign Out */}
            {user && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-xs text-slate-800 border border-slate-200 font-medium max-w-[190px] transition-colors"
                  title={t(`บัญชีผู้ใช้: ${user.email}`, `Account: ${user.email}`)}
                >
                  <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate text-xs">{user.email}</span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300 shrink-0">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowSignOutConfirm(true)}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                  title={t(`ออกจากระบบ (${user.email})`, `Sign Out (${user.email})`)}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('ออกจากระบบ', 'Sign Out')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TIER 2: Complete Command Toolbar */}
        <div className="flex items-center justify-between py-2 gap-2 overflow-x-auto no-scrollbar">
          {/* Left: View Switcher (สลับหน้าเอกสาร vs รายการ) */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => onChangeTab('document')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'document'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t('หน้าเอกสาร A4', 'A4 Document View')}</span>
            </button>
            <button
              onClick={() => onChangeTab('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>
                {t(`รายการบรรณานุกรม (${entryCount})`, `Bibliography List (${entryCount})`)}
              </span>
            </button>
          </div>

          {/* Right: All Menu Commands */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Command 1: Add New Entry (Primary) */}
            <button
              onClick={onOpenNewModal}
              className="h-8.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
              title={t('เพิ่มรายการบรรณานุกรมใหม่ด้วยตนเอง', 'Add a new bibliography entry manually')}
            >
              <Plus className="w-4 h-4" />
              <span>{t('เพิ่มรายการ', 'Add Entry')}</span>
            </button>

            {/* Command 2: Google Search Grounding */}
            {onOpenSearchGrounding && (
              <button
                onClick={onOpenSearchGrounding}
                className="h-8.5 px-3 bg-gradient-to-r from-amber-50 to-indigo-50 hover:from-amber-100 hover:to-indigo-100 text-indigo-950 border border-indigo-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0"
                title={t(
                  'ค้นหาข้อมูลบทความและหนังสือด้วย Google Search Grounding',
                  'Search articles and books via Google Search Grounding'
                )}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Google Search</span>
              </button>
            )}

            {/* Command 3: Export to Word (.docx) */}
            <button
              onClick={onExportDocx}
              disabled={entryCount === 0}
              className="h-8.5 px-3 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:cursor-not-allowed"
              title={t(
                'ส่งออกเอกสาร Word (.docx) พร้อมตั้งค่าฟอนต์และระยะขอบ',
                'Export to Microsoft Word (.docx) with custom font and margin settings'
              )}
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('ส่งออก Word', 'Export Word')}</span>
            </button>

            {/* Command 4: Send to Email */}
            {onOpenEmailModal && (
              <button
                onClick={onOpenEmailModal}
                disabled={entryCount === 0}
                className="h-8.5 px-3 bg-sky-50 hover:bg-sky-100 disabled:opacity-50 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:cursor-not-allowed"
                title={t(
                  'ส่งเอกสารบรรณานุกรมไปยังอีเมลของคุณโดยตรง',
                  'Send formatted bibliography directly to your email'
                )}
              >
                <Mail className="w-3.5 h-3.5 text-sky-600" />
                <span>{t('ส่งไปที่อีเมล', 'Send to Email')}</span>
              </button>
            )}

            {/* Command 5: History and Cloud Library */}
            <button
              onClick={onOpenHistory}
              className="h-8.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer shrink-0"
              title={t(
                'ดูประวัติชุดบรรณานุกรมที่เคยจัดทำ และดึงกลับมาแก้ไข',
                'View saved bibliography projects and cloud history'
              )}
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t('ประวัติและคลัง', 'History & Cloud')}</span>
            </button>

            {/* Command 5.5: External File Bibliography Inspector */}
            {onOpenExternalFileInspector && (
              <button
                onClick={onOpenExternalFileInspector}
                className="h-8.5 px-3 bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title={t(
                  'อัปโหลดและตรวจสอบบรรณานุกรมจากไฟล์ภายนอก (.docx, .bib, .ris, .csv, .json, .txt)',
                  'Upload and inspect bibliography from external files (.docx, .bib, .ris, .csv, .json, .txt)'
                )}
              >
                <FolderOpen className="w-3.5 h-3.5 text-violet-700" />
                <span>{t('ตรวจไฟล์ภายนอก', 'Inspect External File')}</span>
              </button>
            )}

            {/* Command 5.8: User Manual (TH/EN) & PDF Download */}
            <button
              onClick={onOpenGuideModal}
              className="h-8.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
              title={t(
                'เปิดคู่มือการใช้งานระบบทั้งภาษาไทยและภาษาอังกฤษ พร้อมดาวน์โหลดเป็นไฟล์ PDF',
                'Open Thai & English User Manual and download in PDF format'
              )}
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-700" />
              <span>{t('คู่มือการใช้งาน (PDF)', 'User Manual (PDF)')}</span>
            </button>

            {/* Command 5.85: Visual Citation Style Cheat Sheets */}
            {onOpenCheatSheet && (
              <button
                onClick={onOpenCheatSheet}
                className="h-8.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                title={t(
                  'ตารางเทียบโครงสร้างและตัวอย่างบรรณานุกรม (APA, MLA, Chicago, Harvard, Vancouver) พร้อมเทียบเคียงกับรายการของคุณ',
                  'Visual Citation Style Cheat Sheets (APA, MLA, Chicago, Harvard, Vancouver) with live output verification'
                )}
              >
                <Eye className="w-3.5 h-3.5 text-indigo-700" />
                <span>{t('ตารางเทียบตัวอย่าง (Cheat Sheets)', 'Style Cheat Sheets')}</span>
              </button>
            )}

            {/* Command 5.9: Duplicate Citation Detector */}
            {onOpenDuplicateDetector && (
              <button
                onClick={onOpenDuplicateDetector}
                className={`h-8.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border shrink-0 ${
                  duplicateGroupsCount > 0
                    ? 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title={t(
                  'ตรวจสอบและผสานรายการบรรณานุกรมที่ซ้ำซ้อน (Title / DOI / ISBN)',
                  'Detect and merge duplicate citations (Title / DOI / ISBN)'
                )}
              >
                <Layers
                  className={`w-3.5 h-3.5 ${
                    duplicateGroupsCount > 0 ? 'text-amber-700' : 'text-indigo-600'
                  }`}
                />
                <span>
                  {duplicateGroupsCount > 0
                    ? t(`พบซ้ำ ${duplicateGroupsCount} กลุ่ม`, `${duplicateGroupsCount} Duplicates`)
                    : t('ตรวจรายการซ้ำ', 'Duplicates (0)')}
                </span>
              </button>
            )}

            {/* Command 6: Auditor / Validation Status Button */}
            <button
              onClick={onOpenAuditor}
              className={`h-8.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border shrink-0 ${
                validationErrorsCount > 0
                  ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                  : validationIssuesCount > 0
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
              title={t(
                'ตรวจสอบความสมบูรณ์และข้อผิดพลาดของบรรณานุกรม',
                'Audit bibliography completeness and missing fields'
              )}
            >
              {validationErrorsCount > 0 ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>
                    {t(`${validationErrorsCount} ข้อผิดพลาด`, `${validationErrorsCount} Errors`)}
                  </span>
                </>
              ) : validationIssuesCount > 0 ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {t(`${validationIssuesCount} ข้อแนะนำ`, `${validationIssuesCount} Warnings`)}
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('ข้อมูลครบถ้วน', '100% Valid')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation Modal (Works 100% inside iframes without window.confirm) */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-sarabun mb-1">
              {t('ยืนยันการออกจากระบบ?', 'Confirm Sign Out?')}
            </h3>
            <p className="text-xs text-slate-500 font-sarabun mb-5 leading-relaxed">
              {t(
                'ข้อมูลบรรณานุกรมของคุณถูกบันทึกบนฐานข้อมูลคลาวด์อัตโนมัติแล้ว คุณสามารถเข้าสู่ระบบใหม่ได้ตลอดเวลา',
                'Your bibliography projects are automatically saved to Cloud Firestore. You can sign back in anytime.'
              )}
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {t('ยกเลิก', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('ออกจากระบบทันที', 'Sign Out Now')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

