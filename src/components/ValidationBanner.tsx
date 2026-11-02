import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Sparkles,
  ScanSearch,
  ShieldCheck,
  Wrench,
  Edit3,
  RefreshCw,
  Loader2,
  Database,
  PlusCircle,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { BibliographyEntry, CitationStyle, EntryValidationResult } from '../types/bibliography';
import { useLanguage } from '../contexts/LanguageContext';

interface ValidationBannerProps {
  style: CitationStyle;
  validationResults: EntryValidationResult[];
  onOpenAuditor: () => void;
  onOpenExternalFileInspector?: () => void;
  onEditEntry?: (entryId: string) => void;
  onApplyQuickFix?: (entryId: string, field: keyof BibliographyEntry | 'authors', value: string) => void;
  onAutoFixEntry?: (entryId: string) => void;
  onAutoFixAll?: () => void;
  onApplyStandardPresetToAll?: (presetType: 'year' | 'place' | 'publisher' | 'accessDate' | 'authors' | 'url') => void;
  onAddIncompleteSampleEntries?: () => void;
  autoFixingEntryIds?: string[];
  isAutoFixingAll?: boolean;
}

const FIELD_LABELS_TH: Record<string, string> = {
  title: 'ชื่อเรื่อง (Title)',
  authors: 'ชื่อผู้แต่ง (Authors)',
  year: 'ปีที่พิมพ์ (Year)',
  publisher: 'สำนักพิมพ์ (Publisher)',
  place: 'สถานที่พิมพ์ (Place)',
  containerTitle: 'ชื่อวารสาร/เว็บไซต์ (Source)',
  volume: 'ปีที่วารสาร (Volume)',
  issue: 'ฉบับที่ (Issue)',
  pages: 'เลขหน้า (Pages)',
  url: 'ลิงก์ URL',
  accessDate: 'วันที่เข้าถึง (Access Date)',
  institution: 'สถาบัน/มหาวิทยาลัย',
  degreeType: 'ระดับปริญญา',
  doi: 'รหัส DOI',
};

const FIELD_LABELS_EN: Record<string, string> = {
  title: 'Title',
  authors: 'Authors',
  year: 'Publication Year',
  publisher: 'Publisher',
  place: 'Place of Publication',
  containerTitle: 'Journal / Website Source',
  volume: 'Volume',
  issue: 'Issue',
  pages: 'Pages',
  url: 'URL Link',
  accessDate: 'Access Date',
  institution: 'Institution / University',
  degreeType: 'Degree Type',
  doi: 'DOI Identifier',
};

export const ValidationBanner: React.FC<ValidationBannerProps> = ({
  style,
  validationResults,
  onOpenAuditor,
  onOpenExternalFileInspector,
  onEditEntry,
  onApplyQuickFix,
  onAutoFixEntry,
  onAutoFixAll,
  onApplyStandardPresetToAll,
  onAddIncompleteSampleEntries,
  autoFixingEntryIds = [],
  isAutoFixingAll = false,
}) => {
  const { lang, t } = useLanguage();
  const [isScanning, setIsScanning] = useState(false);
  const [selectedEntryIdForQuickFix, setSelectedEntryIdForQuickFix] = useState<string>('');
  const [lastScannedAt, setLastScannedAt] = useState<string>(() =>
    new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const totalEntries = validationResults.length;
  const entriesWithIssues = validationResults.filter((r) => r.issues.length > 0);
  const validEntriesCount = totalEntries - entriesWithIssues.length;

  const totalErrors = validationResults.reduce(
    (acc, r) => acc + r.issues.filter((i) => i.severity === 'error').length,
    0
  );
  const totalWarnings = validationResults.reduce(
    (acc, r) => acc + r.issues.filter((i) => i.severity === 'warning').length,
    0
  );
  const totalInfos = validationResults.reduce(
    (acc, r) => acc + r.issues.filter((i) => i.severity === 'info').length,
    0
  );
  const totalIssuesCount = totalErrors + totalWarnings + totalInfos;

  // Calculate completeness score (0 - 100%)
  const completenessScore =
    totalEntries === 0
      ? 100
      : Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((totalEntries * 3 - (totalErrors * 2 + totalWarnings * 1 + totalInfos * 0.3)) /
                (totalEntries * 3)) *
                100
            )
          )
        );

  const handleRunScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLastScannedAt(
        new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }, 450);
  };

  const handleQuickFixAllInEntry = (entryResult: EntryValidationResult) => {
    if (onAutoFixEntry) {
      onAutoFixEntry(entryResult.entryId);
      return;
    }
    if (onApplyQuickFix) {
      entryResult.issues.forEach((issue) => {
        if (issue.quickFixValue) {
          onApplyQuickFix(
            entryResult.entryId,
            issue.field as keyof BibliographyEntry | 'authors',
            issue.quickFixValue
          );
        }
      });
    }
  };

  const isAllValid = entriesWithIssues.length === 0;
  const isSevere = totalErrors > 0;
  const activeTargetEntryId =
    selectedEntryIdForQuickFix ||
    entriesWithIssues[0]?.entryId ||
    validationResults[0]?.entryId ||
    '';

  const fieldLabels = lang === 'en' ? FIELD_LABELS_EN : FIELD_LABELS_TH;

  return (
    <section
      className={`border-2 rounded-3xl p-5 sm:p-6 shadow-sm transition-all space-y-5 font-sarabun ${
        isAllValid
          ? 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/80 border-emerald-300/90 text-slate-900'
          : isSevere
          ? 'bg-gradient-to-br from-rose-50/90 via-white to-red-50/80 border-rose-300/90 text-slate-900'
          : 'bg-gradient-to-br from-amber-50/90 via-white to-orange-50/80 border-amber-300/90 text-slate-900'
      }`}
    >
      {/* =====================================================================
          ROW 1: CLEAN HEADER — TITLE, SUBTITLE & COMPLETENESS SCORE
         ===================================================================== */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        {/* Left: Icon + Well-formatted Title & Subtitle */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
              isAllValid
                ? 'bg-emerald-600 text-white border-emerald-500'
                : isSevere
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-amber-500 text-white border-amber-400'
            }`}
          >
            {isScanning || isAutoFixingAll ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : isAllValid ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ScanSearch className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            {/* Main Title Line */}
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-slate-900 leading-snug">
                {t(
                  'ระบบสแกนตรวจสอบความสมบูรณ์ของข้อมูล',
                  'Data Completeness & Citation Validation Scanner'
                )}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white tracking-wide font-sans shadow-2xs">
                Validation &amp; Missing Fields Alert
              </span>
            </div>

            {/* Subtitle & Metadata Line */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span
                className={`px-2 py-0.5 rounded-md font-bold uppercase border ${
                  isAllValid
                    ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300'
                    : isSevere
                    ? 'bg-rose-100/90 text-rose-800 border-rose-300'
                    : 'bg-amber-100/90 text-amber-900 border-amber-300'
                }`}
              >
                {t(`มาตรฐาน ${style.toUpperCase()}`, `Style: ${style.toUpperCase()}`)}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-slate-600">
                {t('สแกนล่าสุดเมื่อ', 'Last scanned at')}{' '}
                <strong className="font-mono text-slate-800">{lastScannedAt}</strong>
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-emerald-700 font-semibold hidden sm:inline">
                {t(
                  'มีปุ่มแก้ไขอัตโนมัติ (ไม่ต้องพิมพ์ข้อมูลเอง)',
                  '1-Click Auto-Fix Available (No manual typing required)'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Completeness Progress Card */}
        <div className="flex items-center gap-3.5 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/90 shadow-2xs w-full lg:w-auto justify-between lg:justify-end shrink-0">
          <div>
            <div className="text-[11px] font-bold text-slate-500">
              {t('ระดับความสมบูรณ์ของข้อมูล', 'Data Completeness Score')}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`text-lg font-extrabold font-mono leading-none ${
                  completenessScore === 100
                    ? 'text-emerald-600'
                    : completenessScore >= 75
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              >
                {completenessScore}%
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {t(
                  `(สมบูรณ์ ${validEntriesCount} จาก ${totalEntries} รายการ)`,
                  `(${validEntriesCount} of ${totalEntries} complete)`
                )}
              </span>
            </div>
          </div>

          <div className="w-20 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 shrink-0">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                completenessScore === 100
                  ? 'bg-emerald-500'
                  : completenessScore >= 75
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${completenessScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          ROW 2: CLEAR STATUS SUMMARY & ACTION BUTTONS
         ===================================================================== */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-white/90 rounded-2xl p-3.5 sm:px-4 border border-slate-200/80">
        {/* Status Message */}
        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          {isAllValid ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-slate-800 leading-relaxed">
                <strong className="text-emerald-700 font-extrabold">
                  {t('ข้อมูลครบถ้วนสมบูรณ์ 100%:', '100% Complete & Valid:')}
                </strong>{' '}
                {t(
                  `ผ่านการตรวจสอบทั้ง ${totalEntries} รายการ พร้อมส่งออกไฟล์ Word (.docx) หรือใช้ปุ่มแก้ไขอัตโนมัติด้านล่างได้ทันที`,
                  `All ${totalEntries} entries passed validation and are ready for Microsoft Word (.docx) export.`
                )}
              </p>
            </>
          ) : (
            <>
              <AlertTriangle
                className={`w-5 h-5 shrink-0 ${
                  isSevere ? 'text-rose-600' : 'text-amber-600'
                }`}
              />
              <p className="text-slate-800 leading-relaxed">
                <strong
                  className={`font-extrabold ${
                    isSevere ? 'text-rose-700' : 'text-amber-800'
                  }`}
                >
                  {t(
                    `ตรวจพบข้อมูลขาดหาย ${entriesWithIssues.length} รายการ (รวม ${totalIssuesCount} จุด):`,
                    `Detected ${entriesWithIssues.length} entries with missing fields (${totalIssuesCount} issues):`
                  )}
                </strong>{' '}
                {t(
                  'กรุณากดปุ่ม "แก้ไขอัตโนมัติ" ในข้อ 1, 2 หรือ 3 ด้านล่าง เพื่อเติมข้อมูลโดยไม่ต้องพิมพ์เอง',
                  'Click any "Auto-Fix" button in Tier 1, 2, or 3 below to repair fields automatically without typing.'
                )}
              </p>
            </>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenExternalFileInspector && (
            <button
              type="button"
              onClick={onOpenExternalFileInspector}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title={t(
                'อัปโหลดและตรวจสอบบรรณานุกรมจากไฟล์ภายนอก (.docx, .bib, .ris, .csv, .json, .txt)',
                'Upload and inspect bibliography from external files (.docx, .bib, .ris, .csv, .json, .txt)'
              )}
            >
              <FolderOpen className="w-3.5 h-3.5 shrink-0" />
              <span>
                {t('ตรวจสอบบรรณานุกรมจากไฟล์ภายนอก', 'Inspect External File')}
              </span>
            </button>
          )}

          {onAddIncompleteSampleEntries && (
            <button
              type="button"
              onClick={onAddIncompleteSampleEntries}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title={t(
                'เพิ่มรายการตัวอย่างที่ข้อมูลไม่ครบเพื่อทดสอบปุ่มแก้ไขอัตโนมัติข้อ 1-3',
                'Add sample entries with missing fields to test 1-click Auto-Fix Tiers 1-3'
              )}
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {t('จำลองข้อมูลขาดหาย (ทดสอบ Auto-Fix)', 'Simulate Missing Data (Test Auto-Fix)')}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRunScan}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title={t(
              'สแกนตรวจสอบความสมบูรณ์ของฟิลด์ข้อมูลใหม่',
              'Re-scan all entries for missing or incomplete fields'
            )}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{t('สแกนซ้ำ', 'Re-Scan')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAuditor}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <span>
              {t(
                `หน้าต่างตรวจสอบ (${entriesWithIssues.length})`,
                `Open Auditor (${entriesWithIssues.length})`
              )}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* =====================================================================
          ROW 3: 3-TIER AUTO-FIX PANEL (ปุ่มแก้ไขอัตโนมัติตามข้อ 1, 2, 3)
         ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold tracking-wide">
              {t('แผงปุ่มแก้ไขอัตโนมัติ 3 รูปแบบ (Auto-Fix System)', '3-Tier Automated Repair Panel (Auto-Fix System)')}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              {t(
                'ช่วยดึงข้อมูลจริงจากฐานข้อมูลวิชาการและเติมค่ามาตรฐาน โดยไม่ต้องพิมพ์ข้อมูลเอง',
                'Automatically fetches verified academic metadata and fills standard citation values without manual typing'
              )}
            </span>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 shrink-0 self-start sm:self-auto">
            {t(
              '✓ ลดความเสี่ยงพิมพ์ผิด • บรรณานุกรมน่าเชื่อถือ',
              '✓ Prevents Typos • Verified Academic Accuracy'
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* กล่องข้อที่ 1: ปุ่มแก้ไขอัตโนมัติทั้งหมด */}
          <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/50 p-4 flex flex-col justify-between gap-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-700 text-white text-xs font-bold">
                  {t('ข้อที่ 1 • ทั้งชุดบรรณานุกรม', 'Tier 1 • Entire Project')}
                </span>
                <span className="text-xs font-bold text-emerald-800">
                  {totalIssuesCount > 0
                    ? t(`รอแก้ไข ${totalIssuesCount} จุด`, `${totalIssuesCount} issues pending`)
                    : t('ครบ 100%', '100% Complete')}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900 pt-1">
                {t('1. แก้ไขอัตโนมัติทั้งหมด (Auto-Fix All)', '1. Auto-Fix All Entries')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t(
                  'ค้นหาและดึงข้อมูลจริงจากฐานข้อมูลวิชาการ (Google Search Grounding / CrossRef) พร้อมเติมค่ามาตรฐานให้ครบทุกรายการในคลิกเดียว',
                  'Searches and retrieves verified metadata from academic databases (Google Search Grounding / CrossRef) and completes all entries in one click.'
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={onAutoFixAll}
              disabled={isAutoFixingAll}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              {isAutoFixingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {t('กำลังดึงข้อมูลและแก้ไขอัตโนมัติ...', 'Fetching & Auto-Fixing All...')}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200 shrink-0" />
                  <span>
                    {t(
                      `กดแก้ไขอัตโนมัติทั้งหมด (${totalIssuesCount > 0 ? `${totalIssuesCount} จุด` : `${totalEntries} รายการ`})`,
                      `Auto-Fix All (${totalIssuesCount > 0 ? `${totalIssuesCount} Issues` : `${totalEntries} Entries`})`
                    )}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* กล่องข้อที่ 2: ปุ่มดึงข้อมูลจริง & แก้ไขอัตโนมัติรายรายการ */}
          <div className="rounded-2xl border border-indigo-200/90 bg-indigo-50/50 p-4 flex flex-col justify-between gap-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-700 text-white text-xs font-bold">
                  {t('ข้อที่ 2 • รายรายการ (Per-Entry)', 'Tier 2 • Per-Entry Repair')}
                </span>
                <span className="text-xs font-bold text-indigo-800">
                  {t('ดึงจากฐานข้อมูลจริง', 'Verified Academic DB')}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900 pt-1">
                {t(
                  '2. ดึงข้อมูลจริง & แก้ไขอัตโนมัติรายชิ้น',
                  '2. Fetch Verified Data & Auto-Fix Selected Entry'
                )}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t(
                  'เลือกรายการที่ต้องการให้ระบบค้นหาข้อมูลที่ขาดหาย (ผู้แต่ง, ปีพิมพ์, สำนักพิมพ์, วารสาร, เลขหน้า) มาเติมให้อัตโนมัติ:',
                  'Select an entry below to automatically look up and fill missing fields (authors, year, publisher, journal, pages):'
                )}
              </p>

              <select
                value={activeTargetEntryId}
                onChange={(e) => setSelectedEntryIdForQuickFix(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs bg-white border border-indigo-200 rounded-xl text-slate-800 font-semibold outline-hidden focus:border-indigo-500 cursor-pointer"
              >
                {validationResults.map((r, i) => (
                  <option key={r.entryId} value={r.entryId}>
                    {t(
                      `รายการที่ ${i + 1}: ${r.issues.length > 0 ? `(ขาด ${r.issues.length} ฟิลด์) ` : '(ข้อมูลครบ) '}`,
                      `Entry #${i + 1}: ${r.issues.length > 0 ? `(${r.issues.length} missing) ` : '(Complete) '}`
                    )}
                    {r.entryTitle.substring(0, 45)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={
                !activeTargetEntryId ||
                isAutoFixingAll ||
                autoFixingEntryIds.includes(activeTargetEntryId)
              }
              onClick={() => activeTargetEntryId && onAutoFixEntry && onAutoFixEntry(activeTargetEntryId)}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              {autoFixingEntryIds.includes(activeTargetEntryId) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('กำลังดึงข้อมูลและซ่อมแซม...', 'Fetching & Repairing...')}</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 text-indigo-200 shrink-0" />
                  <span>
                    {t(
                      'ดึงข้อมูลจริง & แก้ไขอัตโนมัติรายการนี้',
                      'Fetch Metadata & Auto-Fix This Entry'
                    )}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* กล่องข้อที่ 3: ปุ่มแก้ไขทันทีรายฟิลด์ตามเกณฑ์มาตรฐานบรรณานุกรม */}
          <div className="rounded-2xl border border-amber-200/90 bg-amber-50/50 p-4 flex flex-col justify-between gap-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-700 text-white text-xs font-bold">
                  {t('ข้อที่ 3 • รายฟิลด์มาตรฐาน', 'Tier 3 • Standard Field Presets')}
                </span>
                <span className="text-xs font-bold text-amber-900">
                  {t('กดเติมใน 1 คลิก', '1-Click Fill')}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900 pt-1">
                {t(
                  '3. แก้ไขทันทีรายฟิลด์ตามเกณฑ์สากล',
                  '3. Instant Field-Level Standard Presets'
                )}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t(
                  'คลิกปุ่มลัดเพื่อเติมตัวย่อและค่ามาตรฐานบรรณานุกรมลงในช่องที่ว่างโดยไม่ต้องพิมพ์เอง:',
                  'Click any shortcut below to populate empty fields with official citation abbreviations:'
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onApplyStandardPresetToAll && onApplyStandardPresetToAll('year')}
                className="px-2.5 py-2 rounded-xl bg-white hover:bg-amber-100/80 text-slate-800 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title={t(
                  'เติม ม.ป.ป. (ภาษาไทย) หรือ n.d. (ภาษาอังกฤษ) ในช่องปีที่พิมพ์ที่ว่าง',
                  'Fill ม.ป.ป. (Thai) or n.d. (English) in empty year fields'
                )}
              >
                <Wrench className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="truncate">{t('ปีพิมพ์: ม.ป.ป. / n.d.', 'Year: n.d. / ม.ป.ป.')}</span>
              </button>

              <button
                type="button"
                onClick={() => onApplyStandardPresetToAll && onApplyStandardPresetToAll('place')}
                className="px-2.5 py-2 rounded-xl bg-white hover:bg-amber-100/80 text-slate-800 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title={t(
                  'เติม ม.ป.ท. (ภาษาไทย) หรือ n.p. (ภาษาอังกฤษ) ในช่องสถานที่พิมพ์ที่ว่าง',
                  'Fill ม.ป.ท. (Thai) or n.p. (English) in empty place fields'
                )}
              >
                <Wrench className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="truncate">{t('สถานที่: ม.ป.ท. / n.p.', 'Place: n.p. / ม.ป.ท.')}</span>
              </button>

              <button
                type="button"
                onClick={() => onApplyStandardPresetToAll && onApplyStandardPresetToAll('publisher')}
                className="px-2.5 py-2 rounded-xl bg-white hover:bg-amber-100/80 text-slate-800 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title={t(
                  'เติม ม.ป.ท. / n.p. ในช่องสำนักพิมพ์ที่ว่าง',
                  'Fill ม.ป.ท. / n.p. in empty publisher fields'
                )}
              >
                <Wrench className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="truncate">
                  {t('สำนักพิมพ์: ม.ป.ท.', 'Publisher: n.p.')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onApplyStandardPresetToAll && onApplyStandardPresetToAll('accessDate')}
                className="px-2.5 py-2 rounded-xl bg-white hover:bg-amber-100/80 text-slate-800 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title={t(
                  'ใส่วันที่สืบค้นปัจจุบันอัตโนมัติสำหรับเว็บไซต์',
                  'Insert today as the access date for website entries'
                )}
              >
                <Wrench className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="truncate">{t('วันที่สืบค้นวันนี้', "Today's Access Date")}</span>
              </button>

              <button
                type="button"
                onClick={() => onApplyStandardPresetToAll && onApplyStandardPresetToAll('authors')}
                className="px-2.5 py-2 rounded-xl bg-white hover:bg-amber-100/80 text-slate-800 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title={t(
                  'จัดระเบียบผู้แต่งหรือใส่ชื่อหน่วยงานเจ้าของผลงานอัตโนมัติ',
                  'Clean up author names or assign institutional author'
                )}
              >
                <Wrench className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="truncate">{t('ชื่อผู้แต่ง/องค์กร', 'Authors / Org Name')}</span>
              </button>

              <button
                type="button"
                onClick={() => onApplyStandardPresetToAll && onApplyStandardPresetToAll('url')}
                className="px-2.5 py-2 rounded-xl bg-white hover:bg-amber-100/80 text-slate-800 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title={t(
                  'แนบลิงก์ DOI หรือ Google Scholar อัตโนมัติ',
                  'Attach DOI or Google Scholar URL automatically'
                )}
              >
                <Wrench className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="truncate">{t('ลิงก์ DOI / Scholar', 'DOI / Scholar URL')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          ROW 4: MISSING FIELDS BREAKDOWN (WHEN ISSUES EXIST)
         ===================================================================== */}
      {!isAllValid && (
        <div className="pt-2 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-bold text-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                {t(
                  `รายการที่ตรวจพบฟิลด์ข้อมูลขาดหาย (${entriesWithIssues.length} รายการ) — กดปุ่มสีเขียวเพื่อซ่อมแซมอัตโนมัติได้ทันที:`,
                  `Entries with Missing Fields (${entriesWithIssues.length} entries) — Click the green button to repair automatically:`
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {entriesWithIssues.slice(0, 6).map((entryResult) => {
              const isFixingThis =
                isAutoFixingAll || autoFixingEntryIds.includes(entryResult.entryId);

              return (
                <div
                  key={entryResult.entryId}
                  className="bg-white rounded-2xl p-4 border border-slate-200/90 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-sm transition-all"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                        {entryResult.entryTitle}
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-mono text-xs font-bold shrink-0">
                        {t(
                          `ขาด ${entryResult.issues.length} ฟิลด์`,
                          `${entryResult.issues.length} missing`
                        )}
                      </span>
                    </div>

                    {/* Individual missing field badges with 1-click instant fix (ข้อ 3) */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {entryResult.issues.map((issue) => (
                        <div
                          key={issue.id}
                          className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                            issue.severity === 'error'
                              ? 'bg-rose-50/90 text-rose-900 border-rose-200'
                              : issue.severity === 'warning'
                              ? 'bg-amber-50/90 text-amber-900 border-amber-200'
                              : 'bg-blue-50/90 text-blue-900 border-blue-200'
                          }`}
                          title={`${issue.message} — ${issue.suggestion}`}
                        >
                          <span>
                            {issue.severity === 'error'
                              ? '❌'
                              : issue.severity === 'warning'
                              ? '⚠️'
                              : '💡'}{' '}
                            {fieldLabels[String(issue.field)] || String(issue.field)}
                          </span>

                          {issue.quickFixValue && onApplyQuickFix && (
                            <button
                              type="button"
                              onClick={() =>
                                onApplyQuickFix(
                                  entryResult.entryId,
                                  issue.field as keyof BibliographyEntry | 'authors',
                                  issue.quickFixValue!
                                )
                              }
                              className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Wrench className="w-3 h-3" />
                              <span>
                                {t('แก้ไขทันที', 'Quick Fix')} (
                                {issue.quickFixValue === '__CLEAN_EMPTY_AUTHORS__'
                                  ? t('จัดระเบียบผู้แต่ง', 'Clean Authors')
                                  : issue.quickFixValue.length > 18
                                  ? issue.quickFixValue.substring(0, 16) + '...'
                                  : issue.quickFixValue}
                                )
                              </span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Entry-level action bar (ข้อ 2) */}
                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isFixingThis}
                      onClick={() => handleQuickFixAllInEntry(entryResult)}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                      title={t(
                        'ค้นหาข้อมูลจริงจากฐานข้อมูลวิชาการ (CrossRef / Google Grounding) และเติมฟิลด์ที่ขาดหายทั้งหมดของรายการนี้อัตโนมัติ',
                        'Fetch verified academic metadata (CrossRef / Google Grounding) and auto-fill all missing fields for this entry'
                      )}
                    >
                      {isFixingThis ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>
                            {t('กำลังดึงข้อมูลจริงและซ่อมแซม...', 'Fetching & Repairing...')}
                          </span>
                        </>
                      ) : (
                        <>
                          <Database className="w-3.5 h-3.5 text-emerald-100" />
                          <span>
                            {t(
                              '✨ ดึงข้อมูลจริง & แก้ไขอัตโนมัติครบทุกช่อง',
                              '✨ Fetch Verified Data & Auto-Fix Entry'
                            )}
                          </span>
                        </>
                      )}
                    </button>

                    {onEditEntry && (
                      <button
                        type="button"
                        onClick={() => onEditEntry(entryResult.entryId)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                        title={t('ดูรายละเอียดฟิลด์ข้อมูล', 'Inspect entry fields')}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{t('ตรวจสอบ', 'Inspect')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};



