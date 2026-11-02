import React from 'react';
import {
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Wrench,
  Edit2,
  ShieldCheck,
  Sparkles,
  Loader2,
  Database,
  FolderOpen
} from 'lucide-react';
import { BibliographyEntry, CitationStyle, EntryValidationResult } from '../types/bibliography';

interface ValidationDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  style: CitationStyle;
  validationResults: EntryValidationResult[];
  onEditEntry: (entryId: string) => void;
  onOpenExternalFileInspector?: () => void;
  onApplyQuickFix?: (entryId: string, field: keyof BibliographyEntry | 'authors', value: string) => void;
  onAutoFixEntry?: (entryId: string) => void;
  onAutoFixAll?: () => void;
  onApplyStandardPresetToAll?: (presetType: 'year' | 'place' | 'publisher' | 'accessDate' | 'authors' | 'url') => void;
  onAddIncompleteSampleEntries?: () => void;
  autoFixingEntryIds?: string[];
  isAutoFixingAll?: boolean;
}

export const ValidationDrawerModal: React.FC<ValidationDrawerModalProps> = ({
  isOpen,
  onClose,
  style,
  validationResults,
  onEditEntry,
  onOpenExternalFileInspector,
  onApplyQuickFix,
  onAutoFixEntry,
  onAutoFixAll,
  onApplyStandardPresetToAll,
  onAddIncompleteSampleEntries,
  autoFixingEntryIds = [],
  isAutoFixingAll = false
}) => {
  if (!isOpen) return null;

  const entriesWithIssues = validationResults.filter((r) => r.issues.length > 0);
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

  // Collect all quick-fixable issues (including authors)
  const quickFixableItems: Array<{
    entryId: string;
    field: keyof BibliographyEntry | 'authors';
    value: string;
  }> = [];

  validationResults.forEach((r) => {
    r.issues.forEach((issue) => {
      if (issue.quickFixValue) {
        quickFixableItems.push({
          entryId: r.entryId,
          field: issue.field as keyof BibliographyEntry | 'authors',
          value: issue.quickFixValue
        });
      }
    });
  });

  const handleApplyAllQuickFixes = () => {
    if (onAutoFixAll) {
      onAutoFixAll();
      return;
    }
    if (!onApplyQuickFix || quickFixableItems.length === 0) return;
    quickFixableItems.forEach((item) => {
      onApplyQuickFix(item.entryId, item.field, item.value);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between bg-slate-50 rounded-t-2xl gap-3.5">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-900 text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 font-sarabun tracking-tight leading-snug">
                  ระบบสแกนตรวจสอบความสมบูรณ์ของข้อมูล
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold tracking-wide shadow-2xs">
                  Validation &amp; Missing Fields Alert
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                ดึงข้อมูลจริงจากฐานข้อมูลวิชาการและเติมค่ามาตรฐานตามเกณฑ์{' '}
                <span className="font-bold text-indigo-700">{style.toUpperCase()}</span> โดยไม่ต้องพิมพ์เอง
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenExternalFileInspector && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExternalFileInspector();
                }}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="อัปโหลดและตรวจสอบบรรณานุกรมจากไฟล์ภายนอก (.docx, .bib, .ris, .csv, .txt)"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>ตรวจสอบไฟล์ภายนอก</span>
              </button>
            )}

            {onAddIncompleteSampleEntries && (
              <button
                type="button"
                onClick={onAddIncompleteSampleEntries}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="เพิ่มรายการจำลองที่ข้อมูลแหว่งเพื่อทดสอบปุ่มแก้ไขอัตโนมัติ"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>จำลองข้อมูลขาดหาย (ทดสอบ Auto-Fix)</span>
              </button>
            )}

            <button
              type="button"
              disabled={isAutoFixingAll}
              onClick={handleApplyAllQuickFixes}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:via-teal-700 hover:to-indigo-700 disabled:opacity-60 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="ดึงข้อมูลที่ขาดหายจากฐานข้อมูลวิชาการและเติมค่ามาตรฐานให้ครบทุกรายการอัตโนมัติ โดยไม่ต้องพิมพ์เอง"
            >
              {isAutoFixingAll ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังดึงข้อมูลและซ่อมแซมทั้งหมด...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>
                    ✨ 1. แก้ไขอัตโนมัติทั้งหมด (
                    {quickFixableItems.length > 0 ? `${quickFixableItems.length} จุด` : 'ตรวจสอบทั้งหมด'}
                    )
                  </span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="px-6 py-3.5 bg-slate-100/70 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-slate-500 block text-[10px]">รายการที่สมบูรณ์</span>
              <span className="font-bold text-slate-800">
                {validationResults.length - entriesWithIssues.length} / {validationResults.length}
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <div>
              <span className="text-rose-600 block text-[10px]">ฟิลด์จำเป็นขาดหาย (Error)</span>
              <span className="font-bold text-rose-700">{totalErrors} จุด</span>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <div>
              <span className="text-amber-700 block text-[10px]">ข้อควรระบุเพิ่ม (Warning)</span>
              <span className="font-bold text-amber-800">{totalWarnings} จุด</span>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-blue-200 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <div>
              <span className="text-blue-600 block text-[10px]">คำแนะนำเพิ่มเติม (Info)</span>
              <span className="font-bold text-blue-800">{totalInfos} จุด</span>
            </div>
          </div>
        </div>

        {/* Quick Standard Presets Bar (ข้อ 3) */}
        {onApplyStandardPresetToAll && (
          <div className="px-6 py-3 bg-amber-50/70 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-700" />
              <span>ข้อที่ 3 • ปุ่มลัดแก้ไขทันทีตามเกณฑ์มาตรฐานบรรณานุกรม:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => onApplyStandardPresetToAll('year')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-slate-800 border border-amber-300 text-[11px] font-bold cursor-pointer"
              >
                + ปีพิมพ์: ม.ป.ป. / n.d.
              </button>
              <button
                type="button"
                onClick={() => onApplyStandardPresetToAll('place')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-slate-800 border border-amber-300 text-[11px] font-bold cursor-pointer"
              >
                + สถานที่: ม.ป.ท. / n.p.
              </button>
              <button
                type="button"
                onClick={() => onApplyStandardPresetToAll('publisher')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-slate-800 border border-amber-300 text-[11px] font-bold cursor-pointer"
              >
                + สำนักพิมพ์: ม.ป.ท. / n.p.
              </button>
              <button
                type="button"
                onClick={() => onApplyStandardPresetToAll('accessDate')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-slate-800 border border-amber-300 text-[11px] font-bold cursor-pointer"
              >
                + ใส่วันที่สืบค้นวันนี้
              </button>
              <button
                type="button"
                onClick={() => onApplyStandardPresetToAll('authors')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-slate-800 border border-amber-300 text-[11px] font-bold cursor-pointer"
              >
                + ซ่อมชื่อผู้แต่ง/องค์กร
              </button>
            </div>
          </div>
        )}

        {/* Issues List Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700 flex-1">
          {entriesWithIssues.length === 0 ? (
            <div className="text-center py-8 text-slate-500 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                ยอดเยี่ยม! ข้อมูลบรรณานุกรมทั้งหมด ({validationResults.length} รายการ) ครบถ้วนสมบูรณ์ 100% ตามมาตรฐาน {style.toUpperCase()}
              </h3>
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                หากต้องการทดสอบระบบสแกนและปุ่มแก้ไขอัตโนมัติ (ข้อ 1-3) สามารถกดปุ่มสีส้มด้านล่างเพื่อจำลองรายการที่ข้อมูลขาดหายแล้วกดแก้ไขอัตโนมัติได้ทันทีครับ
              </p>
              {onAddIncompleteSampleEntries && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onAddIncompleteSampleEntries}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>คลิกเพื่อจำลองรายการข้อมูลขาดหาย (ทดสอบปุ่มแก้ไขอัตโนมัติ 1-3)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            entriesWithIssues.map((result, idx) => {
              const isFixingEntry =
                isAutoFixingAll || autoFixingEntryIds.includes(result.entryId);

              return (
                <div
                  key={result.entryId}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3"
                >
                  {/* Entry Title & Auto-Fix / Edit Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-slate-400 shrink-0">
                        #{idx + 1}
                      </span>
                      <h4 className="font-semibold text-slate-800 text-sm truncate">
                        {result.entryTitle}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onAutoFixEntry && (
                        <button
                          type="button"
                          disabled={isFixingEntry}
                          onClick={() => onAutoFixEntry(result.entryId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                          title="ค้นหาข้อมูลจริงจากฐานข้อมูลวิชาการและเติมฟิลด์ที่ขาดหายของรายการนี้อัตโนมัติโดยไม่ต้องพิมพ์เอง"
                        >
                          {isFixingEntry ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>กำลังดึงข้อมูลและแก้ไขอัตโนมัติ...</span>
                            </>
                          ) : (
                            <>
                              <Database className="w-3.5 h-3.5 text-emerald-100" />
                              <span>✨ ดึงข้อมูลจริง & แก้ไขอัตโนมัติรายการนี้</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onEditEntry(result.entryId);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>ดูฟิลด์ข้อมูล</span>
                      </button>
                    </div>
                  </div>

                  {/* Issues breakdown */}
                  <div className="space-y-2">
                    {result.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className={`p-3 rounded-lg text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border ${
                          issue.severity === 'error'
                            ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                            : issue.severity === 'warning'
                            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                            : 'bg-blue-50/80 border-blue-200 text-blue-900'
                        }`}
                      >
                        <div className="flex items-start gap-2 flex-1">
                          {issue.severity === 'error' && (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          )}
                          {issue.severity === 'warning' && (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          {issue.severity === 'info' && (
                            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          )}

                          <div>
                            <div className="font-bold flex flex-wrap items-center gap-2">
                              <span>{issue.message}</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white/70 border border-slate-200 text-slate-600">
                                ฟิลด์: {String(issue.field)}
                              </span>
                            </div>
                            <p className="mt-0.5 opacity-90 leading-relaxed font-sans">
                              💡 <strong>การแก้ไขอัตโนมัติ:</strong> {issue.suggestion}
                            </p>
                          </div>
                        </div>

                        {/* Quick fix button for every issue */}
                        {issue.quickFixValue && onApplyQuickFix && (
                          <button
                            type="button"
                            onClick={() => {
                              onApplyQuickFix(
                                result.entryId,
                                issue.field as keyof BibliographyEntry | 'authors',
                                issue.quickFixValue!
                              );
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg border border-emerald-500 font-bold text-[11px] shadow-2xs transition-colors cursor-pointer shrink-0"
                            title={`คลิกเพื่อเติมค่ามาตรฐาน "${
                              issue.quickFixValue === '__CLEAN_EMPTY_AUTHORS__'
                                ? 'จัดระเบียบรายชื่อผู้แต่ง'
                                : issue.quickFixValue
                            }" อัตโนมัติโดยไม่ต้องพิมพ์`}
                          >
                            <Wrench className="w-3.5 h-3.5 text-emerald-100" />
                            <span>
                              แก้ไขอัตโนมัติ (ใส่ &ldquo;
                              {issue.quickFixValue === '__CLEAN_EMPTY_AUTHORS__'
                                ? 'จัดระเบียบผู้แต่ง'
                                : issue.quickFixValue.length > 24
                                ? issue.quickFixValue.substring(0, 22) + '...'
                                : issue.quickFixValue}
                              &rdquo;)
                            </span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl">
          <span className="text-xs text-slate-500">
            ระบบดึงข้อมูลวิชาการและเติมค่ามาตรฐานตามเกณฑ์ {style.toUpperCase()} อัตโนมัติ (ป้องกันการพิมพ์ผิดพลาด)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

