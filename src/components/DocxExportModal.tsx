import React, { useState, useEffect } from 'react';
import {
  X,
  FileDown,
  Settings,
  Type,
  Layout,
  AlignLeft,
  Check,
  AlertTriangle,
  Loader2,
  BookOpen,
  Sliders,
  Sparkles
} from 'lucide-react';
import { BibliographyEntry, CitationStyle } from '../types/bibliography';
import { DocxExportOptions, DocxMargins, exportBibliographyToDocx } from '../utils/exportDocx';
import { saveDocxToCache } from '../utils/storage/projectHistoryStorage';

interface DocxExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: BibliographyEntry[];
  currentStyle: CitationStyle;
  projectId: string;
  projectTitle: string;
  validationErrorsCount: number;
  onOpenAuditor: () => void;
  onExportSuccess: (filename: string) => void;
}

type MarginPreset = 'normal' | 'thesis' | 'narrow' | 'custom';

export const DocxExportModal: React.FC<DocxExportModalProps> = ({
  isOpen,
  onClose,
  entries,
  currentStyle,
  projectId,
  projectTitle,
  validationErrorsCount,
  onOpenAuditor,
  onExportSuccess
}) => {
  // Settings State
  const [fontFamily, setFontFamily] = useState<string>('TH Sarabun New');
  const [fontSizePt, setFontSizePt] = useState<number>(16);
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('thesis');
  const [margins, setMargins] = useState<DocxMargins>({
    top: 1.0,
    bottom: 1.0,
    left: 1.5,
    right: 1.0
  });
  const [lineSpacing, setLineSpacing] = useState<number>(1.15);
  const [hangingIndent, setHangingIndent] = useState<number>(0.5);
  const [thaiFirst, setThaiFirst] = useState<boolean>(true);

  // Document Heading
  const hasThai = entries.some((e) => e.language === 'th');
  const defaultHeading =
    currentStyle === 'mla9'
      ? hasThai
        ? 'รายการเอกสารอ้างอิง (Works Cited)'
        : 'Works Cited'
      : currentStyle === 'vancouver'
      ? hasThai
        ? 'เอกสารอ้างอิง (References)'
        : 'References'
      : hasThai
      ? 'บรรณานุกรม'
      : 'References';

  const [documentHeading, setDocumentHeading] = useState<string>(defaultHeading);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Auto-adjust font size when switching between Thai fonts and Western fonts
  useEffect(() => {
    if (fontFamily === 'Times New Roman' || fontFamily === 'Calibri') {
      setFontSizePt(12);
    } else {
      setFontSizePt(16);
    }
  }, [fontFamily]);

  // Update margins when preset changes
  const handleMarginPresetChange = (preset: MarginPreset) => {
    setMarginPreset(preset);
    if (preset === 'normal') {
      setMargins({ top: 1.0, bottom: 1.0, left: 1.0, right: 1.0 });
    } else if (preset === 'thesis') {
      // Standard Thai thesis binding: Left 1.5 in (3.81 cm), Top/Right/Bottom 1.0 in
      setMargins({ top: 1.0, bottom: 1.0, left: 1.5, right: 1.0 });
    } else if (preset === 'narrow') {
      setMargins({ top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 });
    }
  };

  const handleCustomMarginChange = (field: keyof DocxMargins, val: number) => {
    setMarginPreset('custom');
    setMargins((prev) => ({
      ...prev,
      [field]: val
    }));
  };

  if (!isOpen) return null;

  const handleExecuteExport = async () => {
    if (entries.length === 0) {
      alert('ไม่มีรายการบรรณานุกรมสำหรับส่งออก');
      return;
    }

    setIsExporting(true);
    try {
      const options: DocxExportOptions = {
        title: documentHeading.trim() || defaultHeading,
        fontFamily,
        fontSizePt,
        lineSpacingMultiple: lineSpacing,
        hangingIndentInches: hangingIndent,
        margins,
        thaiFirst,
        saveToFile: true
      };

      const result = await exportBibliographyToDocx(entries, currentStyle, options);

      // Cache Word document Blob in IndexedDB
      if (projectId) {
        await saveDocxToCache(projectId, result.blob, result.filename);
      }

      onExportSuccess(result.filename);
      onClose();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ Word (.docx)');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                ตั้งค่าการส่งออกไฟล์ Word (.docx)
              </h2>
              <p className="text-xs text-slate-500">
                ปรับแต่งรูปแบบฟอนต์, ระยะขอบกระดาษ, และการจัดหน้าก่อนดาวน์โหลดไฟล์
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Warning Alert (if any) */}
        {validationErrorsCount > 0 && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>แจ้งเตือน:</strong> พบข้อมูลสำคัญขาดหาย {validationErrorsCount} จุดในบรรณานุกรม
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenAuditor();
              }}
              className="text-amber-800 font-bold underline hover:text-amber-950 shrink-0 cursor-pointer"
            >
              ตรวจสอบข้อผิดพลาด
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700 flex-1">
          {/* Section 1: Font Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-4 h-4 text-indigo-600" />
                <span>รูปแบบฟอนต์ (Font Family) & ขนาด (Font Size)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                มาตรฐานราชการ/วิจัย: TH Sarabun New 16pt
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* TH Sarabun New */}
              <button
                type="button"
                onClick={() => setFontFamily('TH Sarabun New')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  fontFamily === 'TH Sarabun New'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200 text-indigo-900 shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm font-sarabun">TH Sarabun New</span>
                  {fontFamily === 'TH Sarabun New' && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  มาตรฐานหน่วยงานรัฐและวิทยานิพนธ์ไทย (16pt)
                </p>
              </button>

              {/* Times New Roman */}
              <button
                type="button"
                onClick={() => setFontFamily('Times New Roman')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  fontFamily === 'Times New Roman'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200 text-indigo-900 shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm font-serif">Times New Roman</span>
                  {fontFamily === 'Times New Roman' && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  มาตรฐานสากล APA/MLA/Chicago (12pt)
                </p>
              </button>

              {/* TH Sarabun PSK */}
              <button
                type="button"
                onClick={() => setFontFamily('TH Sarabun PSK')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  fontFamily === 'TH Sarabun PSK'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200 text-indigo-900 shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm font-sarabun">TH Sarabun PSK</span>
                  {fontFamily === 'TH Sarabun PSK' && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  ฟอนต์วิจัยภาษาไทยยอดนิยม (16pt)
                </p>
              </button>
            </div>

            {/* Other Font & Size Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">ฟอนต์ทางเลือกอื่นๆ</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full p-2 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-xs outline-hidden focus:border-indigo-500"
                >
                  <option value="TH Sarabun New">TH Sarabun New (แนะนำสำหรับงานไทย)</option>
                  <option value="TH Sarabun PSK">TH Sarabun PSK</option>
                  <option value="Times New Roman">Times New Roman (แนะนำสำหรับงานสากล)</option>
                  <option value="Cordia New">Cordia New</option>
                  <option value="Angsana New">Angsana New</option>
                  <option value="Calibri">Calibri</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  ขนาดตัวอักษร (Font Size)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={fontSizePt}
                    onChange={(e) => setFontSizePt(parseInt(e.target.value, 10))}
                    className="w-full p-2 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-xs outline-hidden focus:border-indigo-500 font-mono"
                  >
                    <option value={11}>11 pt (Calibri ทั่วไป)</option>
                    <option value={12}>12 pt (มาตรฐานสากล Times New Roman)</option>
                    <option value={14}>14 pt</option>
                    <option value={16}>16 pt (มาตรฐานวิจัยไทย TH Sarabun)</option>
                    <option value={18}>18 pt (ขนาดใหญ่)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Page Margins */}
          <div className="space-y-2.5 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layout className="w-4 h-4 text-indigo-600" />
                <span>การตั้งค่าระยะขอบกระดาษ (Page Margins)</span>
              </label>
              <span className="text-[11px] text-indigo-600 font-medium">
                {marginPreset === 'thesis' && '⭐ ซ้าย 1.5 นิ้ว สำหรับเย็บเล่ม'}
              </span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleMarginPresetChange('thesis')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  marginPreset === 'thesis'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="block font-bold text-xs mb-0.5">เข้าเล่มวิทยานิพนธ์</span>
                <span className="text-[10px] text-slate-500 block">ซ้าย 1.5" อื่นๆ 1.0"</span>
              </button>

              <button
                type="button"
                onClick={() => handleMarginPresetChange('normal')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  marginPreset === 'normal'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="block font-bold text-xs mb-0.5">มาตรฐานทั่วไป</span>
                <span className="text-[10px] text-slate-500 block">1.0 นิ้ว ทุกด้าน</span>
              </button>

              <button
                type="button"
                onClick={() => handleMarginPresetChange('narrow')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  marginPreset === 'narrow'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="block font-bold text-xs mb-0.5">ระยะขอบแคบ</span>
                <span className="text-[10px] text-slate-500 block">0.5 นิ้ว ทุกด้าน</span>
              </button>

              <button
                type="button"
                onClick={() => setMarginPreset('custom')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  marginPreset === 'custom'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="block font-bold text-xs mb-0.5">กำหนดเอง</span>
                <span className="text-[10px] text-slate-500 block">ระบุตัวเลขเอง</span>
              </button>
            </div>

            {/* Custom Margin Inputs */}
            <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1 text-center">
                  ด้านบน (Top)
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    max="3.0"
                    value={margins.top}
                    onChange={(e) =>
                      handleCustomMarginChange('top', parseFloat(e.target.value) || 1.0)
                    }
                    className="w-full p-1.5 text-center bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 ml-1">นิ้ว</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1 text-center">
                  ด้านล่าง (Bottom)
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    max="3.0"
                    value={margins.bottom}
                    onChange={(e) =>
                      handleCustomMarginChange('bottom', parseFloat(e.target.value) || 1.0)
                    }
                    className="w-full p-1.5 text-center bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 ml-1">นิ้ว</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1 text-center">
                  ด้านซ้าย (Left)
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    max="3.0"
                    value={margins.left}
                    onChange={(e) =>
                      handleCustomMarginChange('left', parseFloat(e.target.value) || 1.0)
                    }
                    className="w-full p-1.5 text-center bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-indigo-700"
                  />
                  <span className="text-[10px] text-slate-400 ml-1">นิ้ว</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1 text-center">
                  ด้านขวา (Right)
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    max="3.0"
                    value={margins.right}
                    onChange={(e) =>
                      handleCustomMarginChange('right', parseFloat(e.target.value) || 1.0)
                    }
                    className="w-full p-1.5 text-center bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 ml-1">นิ้ว</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Title, Line Spacing & Indentation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-200 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                หัวข้อเอกสาร (Heading)
              </label>
              <input
                type="text"
                value={documentHeading}
                onChange={(e) => setDocumentHeading(e.target.value)}
                placeholder="เช่น บรรณานุกรม"
                className="w-full p-2 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-xs outline-hidden focus:border-indigo-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                ระยะห่างบรรทัด (Line Spacing)
              </label>
              <select
                value={lineSpacing}
                onChange={(e) => setLineSpacing(parseFloat(e.target.value))}
                className="w-full p-2 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-xs outline-hidden focus:border-indigo-500"
              >
                <option value={1.0}>1.0x (ปกติ ชิด)</option>
                <option value={1.15}>1.15x (มาตรฐานวิจัยไทย)</option>
                <option value={1.5}>1.5x (มาตรฐานมหาวิทยาลัย)</option>
                <option value={2.0}>2.0x (Double Spacing ตาม APA สากล)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                ย่อหน้าเยื้องแขวน (Hanging)
              </label>
              <select
                value={hangingIndent}
                onChange={(e) => setHangingIndent(parseFloat(e.target.value))}
                className="w-full p-2 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-xs outline-hidden focus:border-indigo-500 font-mono"
              >
                <option value={0.5}>0.5 นิ้ว (1.27 ซม. - มาตรฐาน)</option>
                <option value={0.75}>0.75 นิ้ว</option>
                <option value={1.0}>1.0 นิ้ว</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl">
          <div className="text-xs text-slate-500">
            เอกสาร: <strong className="text-slate-800">{entries.length}</strong> รายการ • รูปแบบ{' '}
            <strong className="uppercase text-indigo-700">{currentStyle}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={handleExecuteExport}
              disabled={isExporting || entries.length === 0}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-200 cursor-pointer disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังสร้างเอกสาร Word...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์ Word (.docx)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
