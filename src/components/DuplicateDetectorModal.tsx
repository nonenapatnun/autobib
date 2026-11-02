import React, { useState } from 'react';
import {
  X,
  Layers,
  GitMerge,
  Trash2,
  CheckCircle2,
  Sparkles,
  FlaskConical,
  Hash,
  BookOpen,
  FileText,
  Edit2,
  CopyCheck,
} from 'lucide-react';
import { BibliographyEntry, CitationStyle } from '../types/bibliography';
import {
  DuplicateReport,
  DuplicateGroup,
  DuplicateMatchReason,
  getEntryCompletenessScore,
  mergeDuplicateEntries,
} from '../utils/validation/duplicateDetector';
import { formatCitation } from '../utils/formatters';
import { useLanguage } from '../contexts/LanguageContext';

interface DuplicateDetectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: BibliographyEntry[];
  style: CitationStyle;
  duplicateReport: DuplicateReport;
  onMergeGroup: (group: DuplicateGroup, preferredPrimaryId?: string) => void;
  onMergeAllGroups: () => void;
  onDeleteRedundantInGroup: (group: DuplicateGroup, keepEntryId: string) => void;
  onDeleteAllRedundant: () => void;
  onDeleteSingleEntry: (entryId: string) => void;
  onEditEntry: (entry: BibliographyEntry) => void;
  onAddSampleDuplicates: () => void;
}

export const DuplicateDetectorModal: React.FC<DuplicateDetectorModalProps> = ({
  isOpen,
  onClose,
  entries,
  style,
  duplicateReport,
  onMergeGroup,
  onMergeAllGroups,
  onDeleteRedundantInGroup,
  onDeleteAllRedundant,
  onDeleteSingleEntry,
  onEditEntry,
  onAddSampleDuplicates,
}) => {
  const { t } = useLanguage();
  // Map of groupId -> selected primary entry ID
  const [selectedPrimaryMap, setSelectedPrimaryMap] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const { groups, totalDuplicateGroups, totalRedundantEntries } = duplicateReport;

  const getReasonBadge = (reason: DuplicateMatchReason, group: DuplicateGroup) => {
    if (reason === 'doi') {
      return (
        <span
          key="doi"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300"
        >
          <Hash className="w-3.5 h-3.5 text-rose-600" />
          <span>
            {t('รหัส DOI ตรงกัน', 'Matched DOI')}
            {group.matchedFieldsSummary.doi ? `: ${group.matchedFieldsSummary.doi}` : ''}
          </span>
        </span>
      );
    }
    if (reason === 'isbn') {
      return (
        <span
          key="isbn"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
          <span>
            {t('เลข ISBN ตรงกัน', 'Matched ISBN')}
            {group.matchedFieldsSummary.isbn ? `: ${group.matchedFieldsSummary.isbn}` : ''}
          </span>
        </span>
      );
    }
    return (
      <span
        key="title"
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300"
      >
        <FileText className="w-3.5 h-3.5 text-indigo-600" />
        <span>
          {t(
            `ชื่อเรื่องซ้ำกัน (${group.similarityScore}%)`,
            `Matched Title (${group.similarityScore}%)`
          )}
        </span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/65 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold font-sarabun">
                  {t(
                    'ระบบตรวจจับและผสานรายการบรรณานุกรมซ้ำซ้อน (Duplicate Citation Detector)',
                    'Duplicate Citation Detector & Smart Merger'
                  )}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    totalDuplicateGroups > 0
                      ? 'bg-rose-500 text-white'
                      : 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                  }`}
                >
                  {totalDuplicateGroups > 0
                    ? t(
                        `พบ ${totalDuplicateGroups} กลุ่มซ้ำ (${totalRedundantEntries} รายการเกิน)`,
                        `${totalDuplicateGroups} Duplicate Groups (${totalRedundantEntries} Redundant)`
                      )
                    : t('ไม่พบรายการซ้ำ (Clean)', '0 Duplicates Found')}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sarabun mt-0.5">
                {t(
                  'ตรวจสอบความซ้ำซ้อนอัตโนมัติจาก ชื่อเรื่อง (Title), รหัส DOI และเลข ISBN พร้อมระบบผสานข้อมูล (Smart Merge) เพื่อรวมฟิลด์ที่สมบูรณ์ที่สุดเข้าด้วยกัน',
                  'Automatically flags duplicate citations by Title, DOI, or ISBN and lets you merge complementary metadata or delete redundant entries.'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Sub-Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              {t(`สแกนทั้งหมด ${entries.length} รายการ:`, `Scanned ${entries.length} entries:`)}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-medium">
              {t('เกณฑ์ตรวจจับ: ชื่อเรื่อง (Title ≥ 88%) • รหัส DOI • เลข ISBN-10/13', 'Criteria: Title (≥ 88%) • DOI • ISBN-10/13')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onAddSampleDuplicates}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {t('🧪 เพิ่มข้อมูลซ้ำจำลองเพื่อทดสอบ', '🧪 Add Sample Duplicates')}
              </span>
            </button>

            {totalDuplicateGroups > 0 && (
              <>
                <button
                  type="button"
                  onClick={onMergeAllGroups}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>
                    {t(
                      `✨ ผสานรายการซ้ำทั้งหมด (${totalDuplicateGroups} กลุ่ม)`,
                      `✨ Smart Merge All (${totalDuplicateGroups} Groups)`
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onDeleteAllRedundant}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {t(
                      `ลบสำเนาที่ซ้ำทั้งหมด (${totalRedundantEntries})`,
                      `Delete All Redundant (${totalRedundantEntries})`
                    )}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-100/70">
          {totalDuplicateGroups === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 max-w-xl mx-auto my-6 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CopyCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 font-sarabun">
                  {t(
                    'ไม่พบรายการบรรณานุกรมซ้ำซ้อนในชุดข้อมูลนี้!',
                    'No Duplicate Citations Found!'
                  )}
                </h3>
                <p className="text-xs text-slate-500 font-sarabun leading-relaxed">
                  {t(
                    `ระบบได้ตรวจสอบรายการบรรณานุกรมทั้งหมด ${entries.length} รายการ โดยเปรียบเทียบทั้งชื่อเรื่อง (Title), รหัส DOI และเลขมาตรฐานหนังสือ ISBN แล้ว ไม่พบรายการที่ซ้ำกัน`,
                    `All ${entries.length} bibliography entries were checked across Title, DOI, and ISBN. Every citation in your project is unique.`
                  )}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onAddSampleDuplicates}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>
                    {t(
                      '🧪 คลิกเพื่อจำลองรายการบรรณานุกรมซ้ำ (ทดสอบระบบ Merge / Delete)',
                      '🧪 Click to Add Sample Duplicate Entries (Test Merge / Delete)'
                    )}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            groups.map((group, groupIdx) => {
              const chosenPrimaryId =
                selectedPrimaryMap[group.id] || group.recommendedPrimaryId;
              const customMergedPreview = mergeDuplicateEntries(
                group.entries,
                chosenPrimaryId
              );
              const mergedFormatted = formatCitation(customMergedPreview, style);

              return (
                <div
                  key={group.id}
                  className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm overflow-hidden"
                >
                  {/* Group Header */}
                  <div className="bg-amber-50/90 border-b border-amber-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-extrabold">
                        {t(`กลุ่มซ้ำที่ #${groupIdx + 1}`, `Duplicate Group #${groupIdx + 1}`)}
                      </span>
                      {group.reasons.map((r) => getReasonBadge(r, group))}
                      <span className="text-xs text-slate-600 font-medium">
                        {t(
                          `(${group.entries.length} รายการในกลุ่มนี้)`,
                          `(${group.entries.length} entries in cluster)`
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onMergeGroup(group, chosenPrimaryId)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>
                          {t(
                            '✨ ผสานข้อมูลกลุ่มนี้เป็น 1 รายการ',
                            '✨ Smart Merge Group into 1 Entry'
                          )}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteRedundantInGroup(group, chosenPrimaryId)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>
                          {t(
                            'เก็บรายการที่เลือก & ลบตัวที่เหลือ',
                            'Keep Selected & Delete Others'
                          )}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Comparison Cards Grid */}
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {group.entries.map((entry, idx) => {
                        const isSelectedPrimary = entry.id === chosenPrimaryId;
                        const isRecommended = entry.id === group.recommendedPrimaryId;
                        const formatted = formatCitation(entry, style);
                        const score = getEntryCompletenessScore(entry);
                        const authorStr = (entry.authors || [])
                          .map((a) => `${a.firstName} ${a.lastName}`.trim())
                          .filter(Boolean)
                          .join(', ');

                        return (
                          <div
                            key={entry.id}
                            onClick={() =>
                              setSelectedPrimaryMap((prev) => ({
                                ...prev,
                                [group.id]: entry.id,
                              }))
                            }
                            className={`rounded-2xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                              isSelectedPrimary
                                ? 'bg-indigo-50/40 border-indigo-500 shadow-xs'
                                : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-2.5">
                              {/* Entry Card Header */}
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <input
                                    type="radio"
                                    checked={isSelectedPrimary}
                                    onChange={() =>
                                      setSelectedPrimaryMap((prev) => ({
                                        ...prev,
                                        [group.id]: entry.id,
                                      }))
                                    }
                                    className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <span className="text-xs font-bold text-slate-800">
                                    {t(`รายการที่ ${idx + 1}`, `Entry #${idx + 1}`)}
                                  </span>
                                  {isRecommended && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      {t('ข้อมูลสมบูรณ์สุด', 'Most Complete')}
                                    </span>
                                  )}
                                  <span className="text-[11px] font-mono text-slate-500">
                                    ({t(`ความสมบูรณ์: ${score} คะแนน`, `Completeness: ${score} pts`)})
                                  </span>
                                </div>

                                <div
                                  className="flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => onEditEntry(entry)}
                                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                                    title={t('แก้ไขรายการนี้', 'Edit this entry')}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteSingleEntry(entry.id)}
                                    className="px-2 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                    title={t('ลบรายการซ้ำนี้', 'Delete this duplicate entry')}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>{t('ลบรายการนี้', 'Delete')}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Formatted Preview */}
                              <div
                                className="font-sarabun text-xs sm:text-sm text-slate-900 bg-white p-3 rounded-xl border border-slate-200/90 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: formatted.htmlText }}
                              />

                              {/* Field Breakdown Table */}
                              <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-white/90 p-2.5 rounded-xl border border-slate-200/70">
                                <div>
                                  <span className="text-slate-400 font-medium">
                                    {t('ผู้แต่ง:', 'Authors:')}{' '}
                                  </span>
                                  <span className="text-slate-700 font-semibold">
                                    {authorStr || t('— (ว่าง)', '— (Missing)')}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-medium">
                                    {t('ปีพิมพ์:', 'Year:')}{' '}
                                  </span>
                                  <span className="text-slate-700 font-semibold">
                                    {entry.year || t('— (ว่าง)', '— (Missing)')}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-medium">DOI: </span>
                                  <span className="text-indigo-700 font-mono font-semibold break-all">
                                    {entry.doi || '—'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-medium">ISBN: </span>
                                  <span className="text-emerald-700 font-mono font-semibold">
                                    {entry.isbn || '—'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-medium">
                                    {t('สำนักพิมพ์/วารสาร:', 'Publisher/Journal:')}{' '}
                                  </span>
                                  <span className="text-slate-700 font-semibold">
                                    {entry.containerTitle || entry.publisher || '—'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-medium">
                                    {t('ปีที่/ฉบับ/หน้า:', 'Vol/Issue/Pages:')}{' '}
                                  </span>
                                  <span className="text-slate-700 font-semibold">
                                    {[entry.volume, entry.issue, entry.pages]
                                      .filter(Boolean)
                                      .join(' / ') || '—'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Smart Merged Output Box */}
                    <div className="bg-gradient-to-r from-indigo-50 via-violet-50/70 to-emerald-50/60 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-950">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <span>
                            {t(
                              'ผลลัพธ์ที่จะได้หลังกด "ผสานข้อมูลอัจฉริยะ (Smart Merge)":',
                              'Resulting Citation after "Smart Merge":'
                            )}
                          </span>
                        </div>
                        <div
                          className="font-sarabun text-sm text-slate-900 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: mergedFormatted.htmlText }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => onMergeGroup(group, chosenPrimaryId)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shrink-0 shadow-xs transition-colors cursor-pointer"
                      >
                        <GitMerge className="w-4 h-4" />
                        <span>{t('ใช้รายการที่ผสานนี้', 'Apply Smart Merge')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-sarabun">
            {t(
              'การผสานหรือลบรายการซ้ำจะถูกบันทึกอัตโนมัติลงฐานข้อมูลคลาวด์ Firestore ทันที',
              'Merging or deleting duplicate entries is automatically synced to Cloud Firestore.'
            )}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {t('ปิดหน้าต่าง', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
