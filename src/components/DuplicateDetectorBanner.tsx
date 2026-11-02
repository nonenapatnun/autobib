import React, { useState } from 'react';
import {
  CopyCheck,
  GitMerge,
  Trash2,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  FlaskConical,
  Eye,
  CheckCircle2,
  Hash,
  BookOpen,
  FileText,
} from 'lucide-react';
import { BibliographyEntry, CitationStyle } from '../types/bibliography';
import {
  DuplicateReport,
  DuplicateGroup,
  DuplicateMatchReason,
  getEntryCompletenessScore,
} from '../utils/validation/duplicateDetector';
import { formatCitation } from '../utils/formatters';
import { useLanguage } from '../contexts/LanguageContext';

interface DuplicateDetectorBannerProps {
  entries: BibliographyEntry[];
  style: CitationStyle;
  duplicateReport: DuplicateReport;
  onMergeGroup: (group: DuplicateGroup, preferredPrimaryId?: string) => void;
  onMergeAllGroups: () => void;
  onDeleteRedundantInGroup: (group: DuplicateGroup, keepEntryId: string) => void;
  onDeleteAllRedundant: () => void;
  onDeleteSingleEntry: (entryId: string) => void;
  onOpenDuplicateModal: () => void;
  onAddSampleDuplicates: () => void;
}

export const DuplicateDetectorBanner: React.FC<DuplicateDetectorBannerProps> = ({
  entries,
  style,
  duplicateReport,
  onMergeGroup,
  onMergeAllGroups,
  onDeleteRedundantInGroup,
  onDeleteAllRedundant,
  onDeleteSingleEntry,
  onOpenDuplicateModal,
  onAddSampleDuplicates,
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);

  const { groups, totalDuplicateGroups, totalRedundantEntries } = duplicateReport;

  const getReasonBadge = (reason: DuplicateMatchReason, group: DuplicateGroup) => {
    if (reason === 'doi') {
      return (
        <span
          key="doi"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300"
        >
          <Hash className="w-3 h-3 text-rose-600" />
          <span>
            {t('DOI ซ้ำกัน', 'Duplicate DOI')}
            {group.matchedFieldsSummary.doi ? `: ${group.matchedFieldsSummary.doi}` : ''}
          </span>
        </span>
      );
    }
    if (reason === 'isbn') {
      return (
        <span
          key="isbn"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
        >
          <BookOpen className="w-3 h-3 text-amber-700" />
          <span>
            {t('ISBN ซ้ำกัน', 'Duplicate ISBN')}
            {group.matchedFieldsSummary.isbn ? `: ${group.matchedFieldsSummary.isbn}` : ''}
          </span>
        </span>
      );
    }
    return (
      <span
        key="title"
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300"
      >
        <FileText className="w-3 h-3 text-indigo-600" />
        <span>
          {t(
            `ชื่อเรื่องซ้ำกัน (${group.similarityScore}%)`,
            `Duplicate Title (${group.similarityScore}%)`
          )}
        </span>
      </span>
    );
  };

  if (entries.length === 0) return null;

  // Clean state: No duplicates detected
  if (totalDuplicateGroups === 0) {
    return (
      <div className="bg-gradient-to-r from-teal-50/90 via-emerald-50/80 to-white border border-teal-200/90 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CopyCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 font-sarabun">
                {t(
                  'ระบบตรวจจับรายการบรรณานุกรมซ้ำซ้อน',
                  'Duplicate Citation Detector'
                )}
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[11px] font-bold border border-teal-300">
                {t('ไม่พบรายการซ้ำ (0 Duplicates)', 'No Duplicates Found (0)')}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-sarabun mt-0.5">
              {t(
                `สแกนตรวจสอบทั้ง ${entries.length} รายการจาก ชื่อเรื่อง (Title), รหัส DOI และ ISBN เรียบร้อยแล้ว ไม่พบข้อมูลซ้ำซ้อน`,
                `Scanned all ${entries.length} citations across Title, DOI, and ISBN — no redundant entries detected.`
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={onAddSampleDuplicates}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title={t(
              'เพิ่มรายการบรรณานุกรมซ้ำจำลอง (Title / DOI / ISBN) เพื่อทดสอบการผสานข้อมูล (Merge) หรือลบรายการซ้ำ',
              'Add sample duplicate citations (Title / DOI / ISBN) to test merging and deduplication'
            )}
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {t(
                '🧪 จำลองข้อมูลซ้ำเพื่อทดสอบ',
                '🧪 Add Sample Duplicates'
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenDuplicateModal}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-teal-600" />
            <span>{t('เปิดหน้าต่างตรวจสอบรายการซ้ำ', 'Open Detector')}</span>
          </button>
        </div>
      </div>
    );
  }

  // Alert state: Duplicates detected!
  return (
    <div className="bg-gradient-to-br from-amber-50/95 via-orange-50/80 to-rose-50/70 border-2 border-amber-300/90 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 font-sarabun">
                {t(
                  'ระบบตรวจจับและผสานรายการบรรณานุกรมซ้ำซ้อนอัตโนมัติ',
                  'Duplicate Citation Detector & Smart Merger'
                )}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-xs font-extrabold shadow-2xs flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {t(
                    `พบ ${totalDuplicateGroups} กลุ่มซ้ำกัน (${totalRedundantEntries} รายการซ้ำซ้อน)`,
                    `${totalDuplicateGroups} Duplicate Groups (${totalRedundantEntries} Redundant)`
                  )}
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-700 font-sarabun leading-relaxed">
              {t(
                'ตรวจพบรายการที่มี ชื่อเรื่อง (Title), รหัส DOI หรือเลข ISBN ซ้ำกัน ระบบสามารถ "ผสานข้อมูลอัจฉริยะ (Smart Merge)" เพื่อรวมฟิลด์ที่สมบูรณ์ที่สุดเข้าด้วยกันเป็น 1 รายการ หรือลบสำเนาที่ซ้ำออกได้ทันที',
                'Entries with matching Title, DOI, or ISBN were detected. Use "Smart Merge" to combine complementary metadata fields into a single complete citation, or delete redundant copies.'
              )}
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onMergeAllGroups}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title={t(
              'ผสานข้อมูลทุกกลุ่มที่ซ้ำกันให้เหลือกลุ่มละ 1 รายการที่สมบูรณ์ที่สุดอัตโนมัติ',
              'Automatically merge all duplicate groups into single complete entries'
            )}
          >
            <GitMerge className="w-4 h-4" />
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
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title={t(
              'เก็บรายการที่สมบูรณ์ที่สุดไว้ และลบรายการที่ซ้ำออกทั้งหมด',
              'Keep the most complete entry in each group and delete all redundant copies'
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>
              {t(
                `ลบรายการซ้ำทั้งหมด (${totalRedundantEntries})`,
                `Delete Redundant (${totalRedundantEntries})`
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenDuplicateModal}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t('เปรียบเทียบแบบละเอียด', 'Detailed Compare')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-600 border border-slate-300 transition-colors cursor-pointer"
            title={t('ย่อ/ขยายรายการที่ซ้ำ', 'Toggle duplicate list')}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Duplicate Groups List */}
      {isExpanded && (
        <div className="space-y-3 pt-2 border-t border-amber-200/80">
          {groups.map((group, groupIdx) => {
            const mergedFormatted = formatCitation(group.mergedPreview, style);

            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-amber-200/90 shadow-xs p-4 space-y-3"
              >
                {/* Group Top Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-bold">
                      {t(`กลุ่มซ้ำที่ #${groupIdx + 1}`, `Duplicate Group #${groupIdx + 1}`)}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {t(
                        `(${group.entries.length} รายการที่ข้อมูลตรงกัน)`,
                        `(${group.entries.length} matching entries)`
                      )}
                    </span>
                    {group.reasons.map((r) => getReasonBadge(r, group))}
                    {group.complementaryFieldsCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>
                          {t(
                            `เติมเต็มข้อมูลที่ขาดกันได้อีก ${group.complementaryFieldsCount} ฟิลด์`,
                            `Combines ${group.complementaryFieldsCount} complementary fields`
                          )}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Group Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onMergeGroup(group)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>
                        {t(
                          '✨ ผสานข้อมูลกลุ่มนี้เป็น 1 รายการ',
                          '✨ Smart Merge into 1 Entry'
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onDeleteRedundantInGroup(group, group.recommendedPrimaryId)
                      }
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>
                        {t('เก็บตัวที่สมบูรณ์สุด & ลบตัวซ้ำ', 'Keep Best & Delete Copy')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Entries inside this Duplicate Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {group.entries.map((entry, idx) => {
                    const isRecommended = entry.id === group.recommendedPrimaryId;
                    const formatted = formatCitation(entry, style);
                    const score = getEntryCompletenessScore(entry);

                    return (
                      <div
                        key={entry.id}
                        className={`rounded-xl p-3 border text-xs flex flex-col justify-between gap-2.5 transition-all ${
                          isRecommended
                            ? 'bg-emerald-50/40 border-emerald-300'
                            : 'bg-slate-50/80 border-slate-200'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-500">
                                #{idx + 1}
                              </span>
                              {isRecommended ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  {t('ข้อมูลสมบูรณ์กว่า (แนะนำ)', 'Most Complete (Recommended)')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                                  {t('รายการซ้ำซ้อน (Redundant)', 'Redundant Entry')}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono">
                                {t(`คะแนนข้อมูล: ${score}`, `Score: ${score}`)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onDeleteRedundantInGroup(group, entry.id)}
                                className="px-2 py-0.5 rounded-md bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition-colors cursor-pointer"
                                title={t(
                                  'เก็บเฉพาะรายการนี้ และลบรายการอื่นในกลุ่มนี้',
                                  'Keep only this entry and delete others in this group'
                                )}
                              >
                                {t('เก็บเฉพาะรายการนี้', 'Keep Only This')}
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteSingleEntry(entry.id)}
                                className="p-1 rounded-md bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                                title={t('ลบรายการนี้', 'Delete this entry')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Formatted citation text */}
                          <div
                            className="font-sarabun text-xs sm:text-sm text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: formatted.htmlText }}
                          />
                        </div>

                        {/* Metadata Pills showing what this entry contains */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {entry.year && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 text-[10px] font-mono">
                              {t('ปี:', 'Year:')} {entry.year}
                            </span>
                          )}
                          {entry.doi && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono truncate max-w-[180px]">
                              DOI: {entry.doi}
                            </span>
                          )}
                          {entry.isbn && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono">
                              ISBN: {entry.isbn}
                            </span>
                          )}
                          {entry.publisher && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] truncate max-w-[150px]">
                              {t('สนพ.:', 'Pub:')} {entry.publisher}
                            </span>
                          )}
                          {entry.pages && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-mono">
                              {t('หน้า:', 'pp.')} {entry.pages}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Smart Merged Result Preview Bar */}
                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-900">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        {t(
                          'ตัวอย่างผลลัพธ์หลังผสานข้อมูลอัจฉริยะ (Smart Merged Citation):',
                          'Preview after Smart Merge (Combined Complete Citation):'
                        )}
                      </span>
                    </div>
                    <div
                      className="font-sarabun text-xs sm:text-sm text-slate-900"
                      dangerouslySetInnerHTML={{ __html: mergedFormatted.htmlText }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
