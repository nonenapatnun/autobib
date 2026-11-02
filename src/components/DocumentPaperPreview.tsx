import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  FileDown,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Edit2,
  Mail,
  AlertTriangle,
  GitMerge,
  Eye,
} from 'lucide-react';
import { BibliographyEntry, CitationStyle } from '../types/bibliography';
import { formatCitation, sortBibliographyEntries } from '../utils/formatters';
import { exportBibliographyToDocx } from '../utils/exportDocx';
import { DuplicateReport, DuplicateGroup } from '../utils/validation/duplicateDetector';
import { useLanguage } from '../contexts/LanguageContext';

interface DocumentPaperPreviewProps {
  entries: BibliographyEntry[];
  currentStyle: CitationStyle;
  onChangeStyle: (style: CitationStyle) => void;
  onEditEntry?: (entry: BibliographyEntry) => void;
  onOpenExportModal?: () => void;
  onOpenEmailModal?: () => void;
  onOpenCheatSheet?: () => void;
  duplicateReport?: DuplicateReport;
  onMergeDuplicateGroup?: (group: DuplicateGroup) => void;
  onOpenDuplicateModal?: () => void;
}

export const DocumentPaperPreview: React.FC<DocumentPaperPreviewProps> = ({
  entries,
  currentStyle,
  onChangeStyle,
  onEditEntry,
  onOpenExportModal,
  onOpenEmailModal,
  onOpenCheatSheet,
  duplicateReport,
  onMergeDuplicateGroup,
  onOpenDuplicateModal,
}) => {
  const { lang, t } = useLanguage();
  const [copiedRich, setCopiedRich] = useState(false);
  const [copiedPlain, setCopiedPlain] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Settings
  const [thaiFirst, setThaiFirst] = useState(true);
  const [fontFamily, setFontFamily] = useState('TH Sarabun New');
  const [fontSizePt] = useState(16);
  const [lineSpacing, setLineSpacing] = useState(1.15);
  const [showSettings, setShowSettings] = useState(false);

  // Sort entries
  const sortedEntries = sortBibliographyEntries(entries, { thaiFirst });

  // Determine Title
  const hasThai = entries.some((e) => e.language === 'th');
  const defaultTitle =
    currentStyle === 'mla9'
      ? hasThai && lang === 'th'
        ? 'รายการเอกสารอ้างอิง (Works Cited)'
        : 'Works Cited'
      : hasThai && lang === 'th'
      ? 'บรรณานุกรม'
      : 'References';

  const [documentTitle, setDocumentTitle] = useState(defaultTitle);

  const displayedDocumentTitle =
    documentTitle === 'บรรณานุกรม' || documentTitle === 'References'
      ? t('บรรณานุกรม', 'References')
      : documentTitle === 'รายการเอกสารอ้างอิง (Works Cited)' || documentTitle === 'Works Cited'
      ? t('รายการเอกสารอ้างอิง (Works Cited)', 'Works Cited')
      : documentTitle === 'รายการอ้างอิง (References)' || documentTitle === 'เอกสารอ้างอิง (References)'
      ? t(documentTitle, 'References')
      : documentTitle;

  // Copy HTML (Rich text) to clipboard
  const handleCopyRichText = async () => {
    try {
      const container = document.getElementById('academic-paper-content');
      if (!container) return;

      const htmlContent = container.innerHTML;
      const plainContent = sortedEntries
        .map((e, idx) => formatCitation(e, currentStyle, idx + 1).plainText)
        .join('\n\n');

      const blobHtml = new Blob([htmlContent], { type: 'text/html' });
      const blobText = new Blob([plainContent], { type: 'text/plain' });

      // @ts-ignore
      const clipboardItem = new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText,
      });

      await navigator.clipboard.write([clipboardItem]);
      setCopiedRich(true);
      setTimeout(() => setCopiedRich(false), 2500);
    } catch {
      // Fallback
      handleCopyPlainText();
    }
  };

  const handleCopyPlainText = () => {
    const plainContent = sortedEntries
      .map((e, idx) => formatCitation(e, currentStyle, idx + 1).plainText)
      .join('\n\n');
    navigator.clipboard.writeText(plainContent);
    setCopiedPlain(true);
    setTimeout(() => setCopiedPlain(false), 2500);
  };

  const handleExportDocx = async () => {
    if (entries.length === 0 || isExporting) return;
    setIsExporting(true);
    try {
      await exportBibliographyToDocx(entries, currentStyle, {
        title: displayedDocumentTitle,
        fontFamily,
        fontSizePt,
        lineSpacingMultiple: lineSpacing,
        thaiFirst,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar with Format Controls & Export */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Style Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => {
              onChangeStyle('apa7');
              setDocumentTitle(hasThai ? 'บรรณานุกรม' : 'References');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentStyle === 'apa7'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            APA 7th
          </button>

          <button
            onClick={() => {
              onChangeStyle('apa6');
              setDocumentTitle(hasThai ? 'บรรณานุกรม' : 'References');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentStyle === 'apa6'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            APA 6th
          </button>

          <button
            onClick={() => {
              onChangeStyle('mla9');
              setDocumentTitle(hasThai ? 'รายการเอกสารอ้างอิง (Works Cited)' : 'Works Cited');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentStyle === 'mla9'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            MLA 9th
          </button>

          <button
            onClick={() => {
              onChangeStyle('chicago');
              setDocumentTitle(hasThai ? 'รายการอ้างอิง (References)' : 'References');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentStyle === 'chicago'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chicago 17th
          </button>

          <button
            onClick={() => {
              onChangeStyle('harvard');
              setDocumentTitle(hasThai ? 'รายการอ้างอิง (References)' : 'References');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentStyle === 'harvard'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Harvard
          </button>

          <button
            onClick={() => {
              onChangeStyle('vancouver');
              setDocumentTitle(hasThai ? 'เอกสารอ้างอิง (References)' : 'References');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentStyle === 'vancouver'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vancouver
            <span className="hidden sm:inline ml-1 text-[10px] font-normal text-purple-600">
              [1, 2]
            </span>
          </button>
        </div>

        {/* Action Buttons: Cheat Sheets, Settings, Word .docx & Copy */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Visual Cheat Sheets & Output Verifier Button */}
          {onOpenCheatSheet && (
            <button
              type="button"
              onClick={onOpenCheatSheet}
              className="px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title={t(
                'เปิดตารางเทียบโครงสร้างและตัวอย่างบรรณานุกรมแต่ละรูปแบบ พร้อมตรวจเช็คกับรายการของคุณ',
                'Open Visual Citation Style Cheat Sheets and verify your output against official examples'
              )}
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t('เทียบตัวอย่างมาตรฐาน (Cheat Sheets)', 'Style Cheat Sheets')}</span>
            </button>
          )}

          {/* Settings Toggle: Button 1 aligned with Buttons 2 and 3 */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showSettings
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title={t('ตั้งค่าฟอนต์และการจัดเรียง', 'Configure document font and sorting settings')}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t('ตั้งค่าเอกสาร', 'Page Settings')}</span>
          </button>

          {/* Copy HTML */}
          <button
            onClick={handleCopyRichText}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t(
              'คัดลอกแบบมีตัวเอียงและย่อหน้าเยื้องแขวน นำไปวางใน Word หรือ Google Docs ได้ทันที',
              'Copy with italics and hanging indent ready to paste into Microsoft Word or Google Docs'
            )}
          >
            {copiedRich || copiedPlain ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">
                  {t('คัดลอกสำเร็จ!', 'Copied!')}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {t('คัดลอกพร้อมจัดรูปแบบ (Rich Text)', 'Copy Formatted (Rich Text)')}
                </span>
              </>
            )}
          </button>

          {/* Export Word (.docx) */}
          <button
            onClick={() => {
              if (onOpenExportModal) {
                onOpenExportModal();
              } else {
                handleExportDocx();
              }
            }}
            disabled={entries.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4" />
            <span>{t('ดาวน์โหลด Word (.docx)', 'Download Word (.docx)')}</span>
          </button>

          {/* Send to Email */}
          {onOpenEmailModal && (
            <button
              onClick={onOpenEmailModal}
              disabled={entries.length === 0}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title={t(
                'ส่งเอกสารบรรณานุกรมไปยังอีเมลที่สมัครใช้งาน',
                'Send formatted bibliography document to your email'
              )}
            >
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>{t('ส่งไปที่อีเมล', 'Send to Email')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Settings Drawer */}
      {showSettings && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-indigo-600" />
              {t(
                'การตั้งค่าเอกสารและการส่งออก Word (.docx)',
                'Document & Microsoft Word (.docx) Export Settings'
              )}
            </span>
            <button
              onClick={() => setShowSettings(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {t('ปิด', 'Close')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                {t('หัวข้อเอกสาร', 'Document Heading')}
              </label>
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                {t('ฟอนต์มาตรฐาน', 'Standard Font')}
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="TH Sarabun New">
                  {t('TH Sarabun New (ไทย/ราชการ แนะนำ)', 'TH Sarabun New (Thai Official)')}
                </option>
                <option value="TH Sarabun PSK">
                  {t('TH Sarabun PSK (ไทย/วิจัย)', 'TH Sarabun PSK (Thai Research)')}
                </option>
                <option value="Times New Roman">
                  {t('Times New Roman (สากล)', 'Times New Roman (International)')}
                </option>
                <option value="Cordia New">Cordia New</option>
                <option value="Angsana New">Angsana New</option>
                <option value="Calibri">Calibri</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                {t('ระยะห่างบรรทัด (Line Spacing)', 'Line Spacing')}
              </label>
              <select
                value={lineSpacing}
                onChange={(e) => setLineSpacing(parseFloat(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value={1.0}>{t('1.0 (ปกติ ชิด)', '1.0 (Single Spacing)')}</option>
                <option value={1.15}>
                  {t('1.15 (มาตรฐานวิจัยไทย)', '1.15 (Standard Research)')}
                </option>
                <option value={1.5}>{t('1.5 (มาตรฐานมหาวิทยาลัย)', '1.5 (University Standard)')}</option>
                <option value={2.0}>
                  {t('2.0 (Double Spacing ตาม APA สากล)', '2.0 (APA Double Spacing)')}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                {t('ลำดับการเรียงภาษา', 'Language Sort Order')}
              </label>
              <select
                value={thaiFirst ? 'yes' : 'no'}
                onChange={(e) => setThaiFirst(e.target.value === 'yes')}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="yes">
                  {t(
                    'ภาษาไทยก่อน (ก-ฮ) แล้วตามด้วย A-Z',
                    'Thai Entries First (ก-ฮ) followed by English (A-Z)'
                  )}
                </option>
                <option value="no">
                  {t('เรียงรวมตามตัวอักษรทั้งหมด', 'Combined Alphabetical Sort')}
                </option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Realistic A4 Paper Document Preview */}
      <div className="bg-slate-200/80 p-3 sm:p-8 rounded-2xl flex justify-center overflow-x-auto shadow-inner">
        <div
          className="bg-white text-slate-900 shadow-xl rounded-md w-full max-w-[800px] min-h-[960px] p-6 sm:p-12 md:p-16 border border-slate-300 transition-all font-sarabun"
          style={{
            lineHeight: lineSpacing * 1.6,
          }}
        >
          {/* Paper Header / Ruler info */}
          <div className="border-b border-dashed border-slate-200 pb-3 mb-6 flex items-center justify-between text-[11px] text-slate-400 select-none">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {t(
                'จำลองหน้ากระดาษ A4 (ขอบ 1 นิ้ว / ย่อหน้าเยื้องแขวน 0.5 นิ้ว)',
                'A4 Paper Preview (1-inch Margins / 0.5-inch Hanging Indent)'
              )}
            </span>
            <span className="font-mono uppercase font-bold text-slate-500">
              {currentStyle.toUpperCase()} •{' '}
              {t(`${sortedEntries.length} รายการ`, `${sortedEntries.length} Entries`)}
            </span>
          </div>

          <div id="academic-paper-content" className="space-y-6">
            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-center text-slate-900 mb-8 tracking-wide">
              {displayedDocumentTitle}
            </h1>

            {/* Empty state */}
            {sortedEntries.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-base font-medium">
                  {t(
                    'ยังไม่มีรายการบรรณานุกรมในเอกสาร',
                    'No bibliography entries in this document yet'
                  )}
                </p>
                <p className="text-xs mt-1">
                  {t(
                    'วางรหัส DOI หรือ ISBN ด้านบนเพื่อดึงข้อมูล หรือคลิกปุ่มเพิ่มรายการด้วยตนเอง',
                    'Paste a DOI or ISBN above to auto-fetch metadata, or click Add Entry to create one manually.'
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedEntries.map((entry, idx) => {
                  const formatted = formatCitation(entry, currentStyle, idx + 1);
                  const duplicateGroup = duplicateReport?.entryToGroupMap[entry.id];

                  return (
                    <div
                      key={entry.id}
                      onClick={() => onEditEntry && onEditEntry(entry)}
                      className={`group relative text-sm sm:text-base text-slate-800 transition-all p-2 rounded-xl ${
                        duplicateGroup
                          ? 'bg-amber-50/80 ring-1 ring-amber-300 hover:bg-amber-100/70 cursor-pointer'
                          : onEditEntry
                          ? 'hover:bg-indigo-50/70 hover:ring-1 hover:ring-indigo-300 cursor-pointer'
                          : 'hover:bg-slate-50/70'
                      }`}
                      title={
                        duplicateGroup
                          ? t(
                              'รายการนี้ซ้ำซ้อน (DOI/ISBN/ชื่อเรื่อง) คลิกปุ่มด้านหลังเพื่อผสานหรือจัดการ',
                              'Duplicate entry detected (DOI/ISBN/Title)'
                            )
                          : onEditEntry
                          ? t('คลิกเพื่อแก้ไขข้อมูลรายการนี้', 'Click to edit this entry')
                          : undefined
                      }
                      style={{
                        paddingLeft: '2.5rem', // Hanging indent 0.5 inch equivalent
                        textIndent: '-2.5rem',
                      }}
                    >
                      {/* Citation Text with Italics & formatting */}
                      <span
                        dangerouslySetInnerHTML={{ __html: formatted.htmlText }}
                        className="leading-relaxed"
                      />

                      {/* Duplicate Indicator Badge & Quick Merge Button */}
                      {duplicateGroup && (
                        <span
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 ml-2 align-middle"
                          style={{ textIndent: '0' }}
                        >
                          <button
                            type="button"
                            onClick={() => onOpenDuplicateModal && onOpenDuplicateModal()}
                            className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded-md border border-rose-300 transition-colors cursor-pointer"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>
                              {t(
                                `ซ้ำ (${duplicateGroup.reasons
                                  .map((r) =>
                                    r === 'doi' ? 'DOI' : r === 'isbn' ? 'ISBN' : 'ชื่อเรื่อง'
                                  )
                                  .join('/')})`,
                                `Duplicate (${duplicateGroup.reasons
                                  .map((r) => r.toUpperCase())
                                  .join('/')})`
                              )}
                            </span>
                          </button>

                          {onMergeDuplicateGroup && (
                            <button
                              type="button"
                              onClick={() => onMergeDuplicateGroup(duplicateGroup)}
                              className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-0.5 rounded-md shadow-2xs transition-colors cursor-pointer"
                            >
                              <GitMerge className="w-3 h-3" />
                              <span>{t('ผสานข้อมูล', 'Merge')}</span>
                            </button>
                          )}
                        </span>
                      )}

                      {/* Edit hint on hover */}
                      {onEditEntry && (
                        <span
                          className="hidden group-hover:inline-flex items-center gap-1 ml-2 text-[11px] font-sans font-medium text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200 shadow-2xs"
                          style={{ textIndent: '0' }}
                        >
                          <Edit2 className="w-3 h-3 text-indigo-600" />
                          {t('แก้ไข', 'Edit')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Helper Footer notice */}
      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {t(
              `พร้อมใช้งานทันที: เมื่อดาวน์โหลดเป็น .docx ไฟล์จะถูกจัดหน้ากระดาษ A4 พร้อมย่อหน้าแบบเยื้องแขวน (Hanging Indent 0.5 นิ้ว) และตัวเอียงตรงตามหลักเกณฑ์ ${currentStyle.toUpperCase()}`,
              `Ready to use: Exported .docx files are pre-formatted on A4 pages with a 0.5-inch hanging indent and italics matching ${currentStyle.toUpperCase()} guidelines.`
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

