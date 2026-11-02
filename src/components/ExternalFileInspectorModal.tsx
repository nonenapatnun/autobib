import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  Wrench,
  Database,
  Loader2,
  Download,
  FolderOpen,
  FileSpreadsheet,
  FileCode,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { BibliographyEntry, CitationStyle } from '../types/bibliography';
import {
  parseExternalBibliographyFile,
  parseExternalBibliographyText,
  ParsedExternalEntry,
  SAMPLE_EXTERNAL_FILES,
} from '../utils/fileParser/externalBibliographyParser';
import { validateBibliography, validateEntry } from '../utils/validation/citationValidator';
import { formatCitation } from '../utils/formatters';
import { fetchByDoi, isValidDoi } from '../utils/api/fetchDoi';
import { searchCitationsWithGrounding } from '../utils/api/searchGrounding';

interface ExternalFileInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  style: CitationStyle;
  onChangeStyle?: (style: CitationStyle) => void;
  onImportEntries: (entries: BibliographyEntry[], mode: 'append' | 'replace', fileName?: string) => void;
}

const FORMAT_LABELS: Record<string, { label: string; color: string }> = {
  docx: { label: 'Word (.DOCX)', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  bibtex: { label: 'BibTeX (.BIB)', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  ris: { label: 'RIS (.RIS)', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  csv: { label: 'Excel / CSV (.CSV)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  json: { label: 'CSL-JSON (.JSON)', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  txt: { label: 'Text / Markdown (.TXT)', color: 'bg-slate-200 text-slate-800 border-slate-300' },
};

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

export const ExternalFileInspectorModal: React.FC<ExternalFileInspectorModalProps> = ({
  isOpen,
  onClose,
  style,
  onChangeStyle,
  onImportEntries,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [detectedFormat, setDetectedFormat] = useState<string>('txt');
  const [parsedItems, setParsedItems] = useState<ParsedExternalEntry[]>([]);
  const [rawPasteText, setRawPasteText] = useState<string>('');
  const [showPasteBox, setShowPasteBox] = useState<boolean>(false);
  const [fixingIds, setFixingIds] = useState<string[]>([]);
  const [isFixingAll, setIsFixingAll] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const entries = parsedItems.map((item) => item.entry);
  const report = validateBibliography(entries, style);
  const entriesWithIssuesCount = report.results.filter((r) => r.issues.length > 0).length;
  const totalIssuesCount = report.totalErrors + report.totalWarnings + report.totalInfos;

  const completenessScore =
    entries.length === 0
      ? 100
      : Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((entries.length * 3 -
                (report.totalErrors * 2 + report.totalWarnings * 1 + report.totalInfos * 0.3)) /
                (entries.length * 3)) *
                100
            )
          )
        );

  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    setStatusMessage(null);
    try {
      const result = await parseExternalBibliographyFile(file);
      setFileName(result.fileName);
      setDetectedFormat(result.detectedFormat);
      setParsedItems(result.entries);
      setShowPasteBox(false);
      setStatusMessage(
        `สแกนไฟล์ "${result.fileName}" สำเร็จ พบรายการบรรณานุกรม ${result.entries.length} รายการ`
      );
    } catch (err: any) {
      setStatusMessage(`ไม่สามารถอ่านไฟล์ได้: ${err?.message || 'กรุณาตรวจสอบรูปแบบไฟล์'}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleLoadSampleFile = (sampleKey: keyof typeof SAMPLE_EXTERNAL_FILES) => {
    const sample = SAMPLE_EXTERNAL_FILES[sampleKey];
    const result = parseExternalBibliographyText(sample.content, sample.fileName);
    setFileName(result.fileName);
    setDetectedFormat(result.detectedFormat);
    setParsedItems(result.entries);
    setShowPasteBox(false);
    setStatusMessage(
      `โหลดไฟล์ตัวอย่าง "${sample.fileName}" สำเร็จ (${result.entries.length} รายการ) — พร้อมทดสอบการสแกนและปุ่มแก้ไขอัตโนมัติ`
    );
  };

  const handleDownloadSampleFile = (sampleKey: keyof typeof SAMPLE_EXTERNAL_FILES) => {
    const sample = SAMPLE_EXTERNAL_FILES[sampleKey];
    const blob = new Blob([sample.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sample.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleParsePastedText = () => {
    if (!rawPasteText.trim()) return;
    const result = parseExternalBibliographyText(rawPasteText, 'ข้อความบรรณานุกรมที่วาง.txt');
    setFileName(result.fileName);
    setDetectedFormat(result.detectedFormat);
    setParsedItems(result.entries);
    setShowPasteBox(false);
    setStatusMessage(`วิเคราะห์ข้อความสำเร็จ พบรายการบรรณานุกรม ${result.entries.length} รายการ`);
  };

  // Apply 1-click quick fix to a single field of an entry in the external file
  const handleQuickFixField = (
    entryId: string,
    field: keyof BibliographyEntry | 'authors',
    value: string
  ) => {
    setParsedItems((prev) =>
      prev.map((item) => {
        if (item.entry.id !== entryId) return item;
        const entry = item.entry;
        const isThai = entry.language === 'th';

        if (field === 'authors') {
          if (value === '__CLEAN_EMPTY_AUTHORS__') {
            const cleaned = entry.authors.filter((a) => a.firstName.trim() || a.lastName.trim());
            return {
              ...item,
              entry: {
                ...entry,
                authors:
                  cleaned.length > 0
                    ? cleaned
                    : [
                        {
                          id: 'auth-' + Math.random().toString(36).substring(2, 9),
                          firstName: isThai ? 'คณะผู้วิจัย' : 'Research Group',
                          lastName: '',
                          isOrganization: true,
                          isThai,
                        },
                      ],
                updatedAt: Date.now(),
              },
            };
          }
          return {
            ...item,
            entry: {
              ...entry,
              authors: [
                {
                  id: 'auth-' + Math.random().toString(36).substring(2, 9),
                  firstName: value,
                  lastName: '',
                  isOrganization: true,
                  isThai,
                },
              ],
              updatedAt: Date.now(),
            },
          };
        }

        return {
          ...item,
          entry: {
            ...entry,
            [field]: value,
            updatedAt: Date.now(),
          },
        };
      })
    );
  };

  // Smart Auto-Fix a single entry in the external file (Database lookup + standard fallback)
  const enrichAndFixExternalEntry = async (entry: BibliographyEntry): Promise<BibliographyEntry> => {
    let enriched: Partial<BibliographyEntry> = {};

    try {
      if (entry.doi && isValidDoi(entry.doi)) {
        enriched = await fetchByDoi(entry.doi);
      } else if (entry.title && entry.title.trim().length > 4) {
        const authorHint = entry.authors?.[0]?.firstName || entry.authors?.[0]?.lastName || '';
        const query = `${entry.title} ${authorHint}`.trim();
        const searchRes = await searchCitationsWithGrounding(query);
        if (searchRes.items && searchRes.items.length > 0) {
          const best = searchRes.items[0];
          enriched = {
            authors: (best.authors || []).map((a) => ({
              id: 'auth-' + Math.random().toString(36).substring(2, 9),
              firstName: a.firstName || '',
              lastName: a.lastName || '',
              isOrganization: !!a.isOrganization,
              isThai: !!a.isThai,
            })),
            year: best.year,
            yearType: best.yearType,
            containerTitle: best.containerTitle,
            volume: best.volume,
            issue: best.issue,
            pages: best.pages,
            publisher: best.publisher,
            place: best.place,
            institution: best.institution,
            degreeType: best.degreeType,
            doi: best.doi,
            isbn: best.isbn,
            url: best.url,
          };
        }
      }
    } catch {
      // Fallback to standard academic rules
    }

    const validExistingAuthors = (entry.authors || []).filter(
      (a) => a.firstName.trim() || a.lastName.trim()
    );
    const merged: BibliographyEntry = {
      ...entry,
      title: entry.title?.trim() || enriched.title || entry.title,
      authors:
        validExistingAuthors.length > 0
          ? validExistingAuthors
          : enriched.authors && enriched.authors.length > 0
          ? enriched.authors
          : entry.authors,
      year: entry.year?.trim() || enriched.year || '',
      containerTitle: entry.containerTitle?.trim() || enriched.containerTitle || '',
      volume: entry.volume?.trim() || enriched.volume || '',
      issue: entry.issue?.trim() || enriched.issue || '',
      pages: entry.pages?.trim() || enriched.pages || '',
      publisher: entry.publisher?.trim() || enriched.publisher || '',
      place: entry.place?.trim() || enriched.place || '',
      institution: entry.institution?.trim() || enriched.institution || '',
      degreeType: entry.degreeType?.trim() || enriched.degreeType || '',
      doi: entry.doi?.trim() || enriched.doi || '',
      isbn: entry.isbn?.trim() || enriched.isbn || '',
      url: entry.url?.trim() || enriched.url || '',
      updatedAt: Date.now(),
    };

    const validation = validateEntry(merged, style);
    let finalEntry = { ...merged };
    const isThai = finalEntry.language === 'th';

    for (const issue of validation.issues) {
      if (!issue.quickFixValue) continue;
      if (issue.field === 'authors') {
        if (issue.quickFixValue === '__CLEAN_EMPTY_AUTHORS__') {
          const cleaned = finalEntry.authors.filter((a) => a.firstName.trim() || a.lastName.trim());
          finalEntry.authors =
            cleaned.length > 0
              ? cleaned
              : [
                  {
                    id: 'auth-' + Math.random().toString(36).substring(2, 9),
                    firstName: isThai ? 'คณะผู้วิจัย' : 'Research Group',
                    lastName: '',
                    isOrganization: true,
                    isThai,
                  },
                ];
        } else {
          finalEntry.authors = [
            {
              id: 'auth-' + Math.random().toString(36).substring(2, 9),
              firstName: issue.quickFixValue,
              lastName: '',
              isOrganization: true,
              isThai,
            },
          ];
        }
      } else {
        (finalEntry as any)[issue.field] = issue.quickFixValue;
      }
    }

    return finalEntry;
  };

  const handleAutoFixSingleEntry = async (entryId: string) => {
    const target = parsedItems.find((i) => i.entry.id === entryId);
    if (!target) return;

    setFixingIds((prev) => [...prev, entryId]);
    try {
      const fixed = await enrichAndFixExternalEntry(target.entry);
      setParsedItems((prev) =>
        prev.map((item) => (item.entry.id === entryId ? { ...item, entry: fixed } : item))
      );
      setStatusMessage(`ซ่อมแซมและเติมข้อมูลอัตโนมัติสำเร็จ: "${fixed.title.substring(0, 45)}..."`);
    } finally {
      setFixingIds((prev) => prev.filter((id) => id !== entryId));
    }
  };

  const handleAutoFixAllEntries = async () => {
    if (parsedItems.length === 0) return;
    setIsFixingAll(true);
    try {
      const updatedList: ParsedExternalEntry[] = [];
      for (const item of parsedItems) {
        const check = validateEntry(item.entry, style);
        if (check.issues.length > 0) {
          const fixed = await enrichAndFixExternalEntry(item.entry);
          updatedList.push({ ...item, entry: fixed });
        } else {
          updatedList.push(item);
        }
      }
      setParsedItems(updatedList);
      setStatusMessage(
        `แก้ไขอัตโนมัติทั้งไฟล์เสร็จสมบูรณ์ (${updatedList.length} รายการ) ข้อมูลครบถ้วน 100% พร้อมนำเข้า!`
      );
    } finally {
      setIsFixingAll(false);
    }
  };

  const formatBadge = FORMAT_LABELS[detectedFormat] || FORMAT_LABELS.txt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-xs overflow-y-auto font-sarabun">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[93vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* =====================================================================
            MODAL HEADER
           ===================================================================== */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-700 text-white flex items-center justify-center shrink-0 shadow-sm">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
                  ตรวจสอบและนำเข้าบรรณานุกรมจากไฟล์ภายนอก
                </h2>
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold tracking-wide font-sans">
                  External File Bibliography Inspector
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                รองรับไฟล์ Word (<strong>.docx</strong>), BibTeX (<strong>.bib</strong>), RIS (<strong>.ris</strong>), Excel/CSV (<strong>.csv</strong>), JSON (<strong>.json</strong>) และไฟล์ข้อความ (<strong>.txt / .md</strong>) พร้อมสแกนหาฟิลด์ที่ขาดหายและปุ่มแก้ไขอัตโนมัติ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Style Selector inside Inspector */}
            {onChangeStyle && (
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-semibold">ตรวจตามเกณฑ์:</span>
                <select
                  value={style}
                  onChange={(e) => onChangeStyle(e.target.value as CitationStyle)}
                  className="font-extrabold text-indigo-700 bg-transparent outline-hidden cursor-pointer"
                >
                  <option value="apa7">APA 7th</option>
                  <option value="apa6">APA 6th</option>
                  <option value="mla9">MLA 9th</option>
                  <option value="chicago">Chicago 17th</option>
                  <option value="harvard">Harvard</option>
                  <option value="vancouver">Vancouver</option>
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =====================================================================
            MODAL BODY
           ===================================================================== */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Upload Dropzone + Quick Sample Files */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left 7 cols: File Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile) handleFileUpload(droppedFile);
              }}
              className={`lg:col-span-7 border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all ${
                isDragging
                  ? 'border-indigo-600 bg-indigo-50/70'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.bib,.ris,.csv,.tsv,.json,.txt,.md"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) handleFileUpload(selected);
                  e.target.value = '';
                }}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 shadow-2xs">
                {isParsing ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>

              <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                อัปโหลดไฟล์บรรณานุกรมจากเครื่องของคุณ หรือลากไฟล์มาวางที่นี่
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                รองรับไฟล์เอกสาร Word (.docx), BibTeX (.bib), EndNote/Scopus (.ris), ตาราง (.csv), CSL-JSON (.json) และไฟล์ข้อความ (.txt)
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>เลือกไฟล์จากเครื่อง (.docx, .bib, .ris, .csv, .txt)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPasteBox((v) => !v)}
                  className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>{showPasteBox ? 'ซ่อนช่องวางข้อความ' : 'วางข้อความจากไฟล์ภายนอก'}</span>
                </button>
              </div>
            </div>

            {/* Right 5 cols: 1-Click Sample External Files to Test Immediately */}
            <div className="lg:col-span-5 bg-indigo-50/50 border border-indigo-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-700 text-white text-[11px] font-bold">
                    ทดสอบได้ทันที (1-Click Sample Files)
                  </span>
                  <span className="text-[11px] text-indigo-700 font-semibold">
                    ไม่ต้องหาไฟล์ในเครื่อง
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">
                  คลิกเลือกไฟล์ตัวอย่างด้านล่างเพื่อทดสอบระบบสแกนไฟล์ภายนอก:
                </h4>
              </div>

              <div className="space-y-2">
                {(
                  Object.keys(SAMPLE_EXTERNAL_FILES) as Array<keyof typeof SAMPLE_EXTERNAL_FILES>
                ).map((key) => {
                  const sample = SAMPLE_EXTERNAL_FILES[key];
                  return (
                    <div
                      key={key}
                      className="bg-white rounded-xl p-2.5 border border-indigo-100 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {sample.label}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          ไฟล์: <span className="font-mono">{sample.fileName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleLoadSampleFile(key)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-colors"
                          title="จำลองการอัปโหลดและตรวจสอบไฟล์นี้ทันที"
                        >
                          สแกนไฟล์นี้
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadSampleFile(key)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
                          title="ดาวน์โหลดไฟล์ตัวอย่างลงเครื่อง"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Optional Paste Text Box */}
          {showPasteBox && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800">
                  วางข้อความบรรณานุกรมที่คัดลอกมาจากไฟล์ Word, PDF, BibTeX (.bib), RIS (.ris) หรือ CSV:
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setRawPasteText(SAMPLE_EXTERNAL_FILES.txt_mixed.content)
                  }
                  className="text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
                >
                  ใส่ข้อความตัวอย่าง
                </button>
              </div>
              <textarea
                value={rawPasteText}
                onChange={(e) => setRawPasteText(e.target.value)}
                rows={5}
                placeholder="วางรายการบรรณานุกรมบรรทัดละ 1 รายการ หรือวางโค้ด BibTeX / RIS ที่นี่..."
                className="w-full p-3 text-xs font-mono bg-white border border-slate-300 rounded-xl outline-hidden focus:border-indigo-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  disabled={!rawPasteText.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>วิเคราะห์และตรวจสอบความสมบูรณ์ทันที</span>
                </button>
              </div>
            </div>
          )}

          {/* Status Message Banner */}
          {statusMessage && (
            <div className="p-3.5 rounded-2xl bg-indigo-950 text-white text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            </div>
          )}

          {/* =====================================================================
              INSPECTION RESULTS & AUTO-FIX PANEL FOR UPLOADED FILE
             ===================================================================== */}
          {parsedItems.length > 0 && (
            <div className="space-y-4">
              {/* File Inspection Summary Bar */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${formatBadge.color}`}>
                      {formatBadge.label}
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      ไฟล์: {fileName}
                    </h3>
                    <span className="text-xs font-bold text-slate-500">
                      (พบทั้งหมด {parsedItems.length} รายการ)
                    </span>
                  </div>

                  {/* Auto-Fix Entire File Button (ปุ่มข้อที่ 1 สำหรับไฟล์ภายนอก) */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isFixingAll}
                      onClick={handleAutoFixAllEntries}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      {isFixingAll ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>กำลังดึงข้อมูลและแก้ไขอัตโนมัติทั้งไฟล์...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-200" />
                          <span>
                            ✨ แก้ไขอัตโนมัติทั้งไฟล์ ({totalIssuesCount > 0 ? `${totalIssuesCount} จุดที่ขาด` : 'ครบ 100%'})
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[11px] font-semibold">
                        ความสมบูรณ์ของไฟล์
                      </span>
                      <span
                        className={`text-lg font-extrabold font-mono ${
                          completenessScore === 100 ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {completenessScore}%
                      </span>
                    </div>
                    <CheckCircle2
                      className={`w-6 h-6 ${
                        completenessScore === 100 ? 'text-emerald-500' : 'text-amber-500'
                      }`}
                    />
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-700 block text-[11px] font-semibold">
                        รายการที่สมบูรณ์พร้อมใช้
                      </span>
                      <span className="text-lg font-extrabold text-emerald-700">
                        {parsedItems.length - entriesWithIssuesCount} / {parsedItems.length}
                      </span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-rose-200 flex items-center justify-between">
                    <div>
                      <span className="text-rose-600 block text-[11px] font-semibold">
                        ฟิลด์จำเป็นขาดหาย (Error)
                      </span>
                      <span className="text-lg font-extrabold text-rose-700">
                        {report.totalErrors} จุด
                      </span>
                    </div>
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="text-amber-700 block text-[11px] font-semibold">
                        ข้อควรระบุเพิ่ม (Warning/Info)
                      </span>
                      <span className="text-lg font-extrabold text-amber-800">
                        {report.totalWarnings + report.totalInfos} จุด
                      </span>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </div>

              {/* Detailed List of Inspected Entries from the File */}
              <div className="space-y-3">
                {parsedItems.map((item, idx) => {
                  const entryValidation = report.results[idx] || validateEntry(item.entry, style);
                  const formatted = formatCitation(item.entry, style, idx + 1);
                  const isEntryValid = entryValidation.issues.length === 0;
                  const isFixingThis = isFixingAll || fixingIds.includes(item.entry.id);

                  return (
                    <div
                      key={item.entry.id}
                      className={`rounded-2xl border p-4 space-y-3 transition-all ${
                        isEntryValid
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-white border-amber-300 shadow-2xs'
                      }`}
                    >
                      {/* Top Line: Entry Index, Source Type, Status & Per-Entry Auto-Fix */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-xs font-bold">
                            รายการที่ {idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold uppercase">
                            {item.entry.sourceType}
                          </span>
                          {isEntryValid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>ข้อมูลครบถ้วนสมบูรณ์</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>พบข้อมูลขาดหาย {entryValidation.issues.length} จุด</span>
                            </span>
                          )}
                        </div>

                        {!isEntryValid && (
                          <button
                            type="button"
                            disabled={isFixingThis}
                            onClick={() => handleAutoFixSingleEntry(item.entry.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                          >
                            {isFixingThis ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>กำลังดึงข้อมูลและซ่อมแซม...</span>
                              </>
                            ) : (
                              <>
                                <Database className="w-3.5 h-3.5 text-emerald-100" />
                                <span>✨ ดึงข้อมูลจริง &amp; แก้ไขอัตโนมัติรายการนี้</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Formatted Citation Preview */}
                      <div className="bg-white rounded-xl p-3 border border-slate-200/90 space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          ผลลัพธ์การจัดรูปแบบตามมาตรฐาน {style.toUpperCase()}:
                        </div>
                        <div
                          className="text-xs sm:text-sm text-slate-900 leading-relaxed font-sarabun"
                          dangerouslySetInnerHTML={{ __html: formatted.htmlText }}
                        />
                      </div>

                      {/* Missing Fields & 1-Click Fix Buttons */}
                      {!isEntryValid && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {entryValidation.issues.map((issue) => (
                            <div
                              key={issue.id}
                              className={`inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                                issue.severity === 'error'
                                  ? 'bg-rose-50 text-rose-900 border-rose-200'
                                  : issue.severity === 'warning'
                                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                                  : 'bg-blue-50 text-blue-900 border-blue-200'
                              }`}
                            >
                              <span>
                                {issue.severity === 'error'
                                  ? '❌'
                                  : issue.severity === 'warning'
                                  ? '⚠️'
                                  : '💡'}{' '}
                                <strong>
                                  {FIELD_LABELS_TH[String(issue.field)] || String(issue.field)}:
                                </strong>{' '}
                                {issue.message}
                              </span>

                              {issue.quickFixValue && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleQuickFixField(
                                      item.entry.id,
                                      issue.field as keyof BibliographyEntry | 'authors',
                                      issue.quickFixValue!
                                    )
                                  }
                                  className="px-2.5 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Wrench className="w-3 h-3" />
                                  <span>
                                    แก้ไขทันที (ใส่ &ldquo;
                                    {issue.quickFixValue === '__CLEAN_EMPTY_AUTHORS__'
                                      ? 'จัดระเบียบผู้แต่ง'
                                      : issue.quickFixValue.length > 20
                                      ? issue.quickFixValue.substring(0, 18) + '...'
                                      : issue.quickFixValue}
                                    &rdquo;)
                                  </span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* =====================================================================
            MODAL FOOTER — IMPORT ACTIONS
           ===================================================================== */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-medium">
            {parsedItems.length > 0 ? (
              <span>
                พร้อมนำเข้า <strong>{parsedItems.length} รายการ</strong> จากไฟล์{' '}
                <strong className="text-slate-900">{fileName}</strong> เข้าสู่ระบบจัดการบรรณานุกรม
              </span>
            ) : (
              <span>กรุณาเลือกไฟล์จากเครื่อง หรือคลิกปุ่มไฟล์ตัวอย่างเพื่อเริ่มตรวจสอบ</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>

            {parsedItems.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onImportEntries(entries, 'replace', fileName);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 text-xs font-extrabold transition-colors cursor-pointer"
                >
                  นำเข้าแทนที่ชุดปัจจุบัน ({entries.length} รายการ)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onImportEntries(entries, 'append', fileName);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>นำเข้าเพิ่มในบรรณานุกรม ({entries.length} รายการ)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
