import React, { useState } from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Scale,
  GraduationCap,
  FileDown,
  Loader2,
  Globe,
  FileText,
  Mail,
  Check,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  THAI_MANUAL_PAGES,
  ENGLISH_MANUAL_PAGES,
  exportUserManualToPdf,
  ManualLanguageEdition,
} from '../utils/exportManualPdf';

interface StyleMetadataItem {
  id: string;
  name: string;
  badge: string;
  description: string;
  keyRules: string[];
}

const STYLE_METADATA: StyleMetadataItem[] = [
  {
    id: 'apa7',
    name: 'APA 7th Edition (2020)',
    badge: 'นิยมสูงสุด / Most Popular',
    description:
      'มาตรฐานหลักสำหรับสังคมศาสตร์ ศึกษาศาสตร์ จิตวิทยา และบริหารธุรกิจ (Social Sciences, Education, Psychology)',
    keyRules: [
      'แสดงชื่อผู้แต่งได้สูงสุดถึง 20 คนก่อนใช้เครื่องหมาย ... (Up to 20 authors listed in reference)',
      'ตัดเมืองที่พิมพ์ (Place of Publication) ออกจากรายการหนังสือ (No publisher location required)',
      'ใช้ลิงก์ https://doi.org/... โดยตรง และตัดคำว่า "Retrieved from" สำหรับเว็บไซต์ทั่วไป',
    ],
  },
  {
    id: 'apa6',
    name: 'APA 6th Edition (2010)',
    badge: 'เกณฑ์ดั้งเดิม / Legacy Standard',
    description:
      'มาตรฐานรุ่นก่อนหน้าที่บัณฑิตวิทยาลัยบางแห่งยังกำหนดใช้ในคู่มือวิทยานิพนธ์',
    keyRules: [
      'ต้องระบุ "เมืองที่พิมพ์: สำนักพิมพ์" สำหรับหนังสือ เช่น กรุงเทพฯ: สุวีริยาสาส์น',
      'แสดงชื่อผู้แต่งได้สูงสุด 7 คน (หากเกิน 7 คน ให้ใส่ 6 คนแรก ตามด้วย ... และคนสุดท้าย)',
      'การอ้างอิงเว็บไซต์ต้องมีคำว่า "สืบค้นจาก" หรือ "Retrieved from" นำหน้า URL',
    ],
  },
  {
    id: 'mla9',
    name: 'MLA 9th Edition (2021)',
    badge: 'มนุษยศาสตร์ / Humanities',
    description:
      'เหมาะสำหรับสาขาภาษาศาสตร์ วรรณคดี อักษรศาสตร์ และศิลปกรรมศาสตร์ (Literature, Arts, Humanities)',
    keyRules: [
      'ใช้ระบบ Author–Page ในเนื้อหา เช่น (สมชาย ใจดี 45) หรือ (Smith 45)',
      'เขียนชื่อเต็มของผู้แต่งคนแรก (นามสกุล, ชื่อเต็ม) และวางปีที่พิมพ์ไว้ท้ายรายการ',
      'หากมีผู้แต่งตั้งแต่ 3 คนขึ้นไป ใช้ "และคณะ" หรือ "et al." ทันทีทั้งในเนื้อหาและท้ายเล่ม',
    ],
  },
  {
    id: 'chicago',
    name: 'Chicago 17th Edition (Author-Date)',
    badge: 'ประวัติศาสตร์ / Social & History',
    description:
      'มาตรฐานสากลสำหรับงานวิจัยทางประวัติศาสตร์ สังคมศาสตร์ และรัฐศาสตร์',
    keyRules: [
      'วางปีที่พิมพ์ต่อท้ายชื่อผู้แต่งโดยไม่ต้องใส่วงเล็บ เช่น Smith, John. 2024.',
      'ชื่อบทความอยู่ในเครื่องหมายอัญประกาศ "..." ส่วนชื่อหนังสือและวารสารใช้ตัวเอน',
      'ระบุทั้งสถานที่พิมพ์และชื่อสำนักพิมพ์อย่างชัดเจน (Place: Publisher)',
    ],
  },
  {
    id: 'harvard',
    name: 'Harvard Referencing Style',
    badge: 'บริหารธุรกิจ / Business & Law',
    description:
      'นิยมแพร่หลายในมหาวิทยาลัยเครือจักรภพยุโรป สาขาบริหารธุรกิจ เศรษฐศาสตร์ และนิติศาสตร์',
    keyRules: [
      'ใช้ระบบผู้แต่ง-ปี (Author-Date) โดยชื่อเรื่องบทความมักอยู่ในเครื่องหมาย Single Quotes',
      'ระบุ Vol., No. และ pp. อย่างชัดเจนสำหรับบทความวารสาร เช่น pp. 112–125',
      'เว็บไซต์ต้องระบุ [Online], Available at: URL และ (Accessed: วันที่สืบค้น)',
    ],
  },
  {
    id: 'vancouver',
    name: 'Vancouver Style (Numbered)',
    badge: 'การแพทย์และวิศวกรรม / Medical & STEM',
    description:
      'มาตรฐานระบบตัวเลขลำดับ [1], [2] สำหรับแพทยศาสตร์ พยาบาลศาสตร์ เภสัชศาสตร์ และวิศวกรรมศาสตร์',
    keyRules: [
      'อ้างอิงในเนื้อหาด้วยตัวเลขในวงเล็บก้ามปู [1] เรียงตามลำดับการปรากฏในเอกสาร',
      'ชื่อผู้แต่งต่างประเทศใช้นามสกุลตามด้วยอักษรย่อชื่อติดกันโดยไม่มีจุดคั่น เช่น He K, Zhang X',
      'รูปแบบวารสารกระชับ: ปีพิมพ์;ปีที่(ฉบับที่):เลขหน้า เช่น 2016;39(3):770-8.',
    ],
  },
];

interface CitationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CitationGuideModal: React.FC<CitationGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    'manual-th' | 'manual-en' | 'comparison' | 'thai-rules'
  >(lang === 'en' ? 'manual-en' : 'manual-th');
  const [downloadingEdition, setDownloadingEdition] =
    useState<ManualLanguageEdition | null>(null);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(
    null
  );

  if (!isOpen) return null;

  const handleDownloadPdf = async (edition: ManualLanguageEdition) => {
    try {
      setDownloadingEdition(edition);
      setDownloadSuccessMsg(null);
      const filename = await exportUserManualToPdf(edition);
      setDownloadSuccessMsg(
        t(
          `ดาวน์โหลดไฟล์ PDF "${filename}" สำเร็จแล้ว!`,
          `Successfully downloaded PDF "${filename}"!`
        )
      );
      setTimeout(() => setDownloadSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Failed to generate manual PDF:', err);
    } finally {
      setDownloadingEdition(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header with Title & Direct PDF Download Bar */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white shrink-0">
          <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/25 border border-indigo-400/30 flex items-center justify-center text-indigo-200 shrink-0 shadow-inner">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-base sm:text-lg font-sarabun tracking-tight">
                    {t(
                      'คู่มือการใช้งานระบบจัดการบรรณานุกรมสำหรับงานวิจัยและวิทยานิพนธ์ (TH / EN)',
                      'Academic Bibliography System User Manual & Citation Guide (TH / EN)'
                    )}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-400/30">
                    PDF Ready
                  </span>
                </div>
                <p className="text-xs text-indigo-200/90 font-sarabun mt-0.5">
                  {t(
                    'คู่มือปฏิบัติการฉบับสมบูรณ์ทั้งภาษาไทยและภาษาอังกฤษ พร้อมดาวน์โหลดเป็นไฟล์เอกสาร PDF ขนาด A4',
                    'Complete bilingual user documentation in Thai and English with 1-click A4 PDF download'
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title={t('ปิดหน้าต่าง', 'Close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* PDF Download Action Bar */}
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-indigo-200 font-sarabun">
              <FileDown className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="font-semibold">
                {t(
                  'เลือกดาวน์โหลดคู่มือการใช้งานรูปแบบ PDF (ขนาด A4 คมชัดสูง):',
                  'Download User Manual in A4 PDF Format (High-DPI Print Ready):'
                )}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Button 1: Complete Bilingual TH + EN PDF */}
              <button
                type="button"
                onClick={() => handleDownloadPdf('bilingual')}
                disabled={downloadingEdition !== null}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {downloadingEdition === 'bilingual' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {t(
                    'ดาวน์โหลด PDF ฉบับสมบูรณ์ (ไทย + อังกฤษ 6 หน้า)',
                    'Download Complete Bilingual PDF (TH + EN, 6 Pages)'
                  )}
                </span>
              </button>

              {/* Button 2: Thai Only PDF */}
              <button
                type="button"
                onClick={() => handleDownloadPdf('th')}
                disabled={downloadingEdition !== null}
                className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-60 text-white border border-white/25 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {downloadingEdition === 'th' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>{t('PDF ภาษาไทย (3 หน้า)', 'Thai PDF (3 Pages)')}</span>
              </button>

              {/* Button 3: English Only PDF */}
              <button
                type="button"
                onClick={() => handleDownloadPdf('en')}
                disabled={downloadingEdition !== null}
                className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-60 text-white border border-white/25 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {downloadingEdition === 'en' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-sky-300" />
                )}
                <span>{t('PDF ภาษาอังกฤษ (3 หน้า)', 'English PDF (3 Pages)')}</span>
              </button>
            </div>
          </div>

          {/* Download confirmation banner */}
          {downloadSuccessMsg && (
            <div className="mt-3 px-3.5 py-2 rounded-xl bg-emerald-500/25 border border-emerald-400/40 text-emerald-100 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{downloadSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('manual-th')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'manual-th'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>คู่มือการใช้งาน (ภาษาไทย • 6 บท)</span>
          </button>

          <button
            onClick={() => setActiveTab('manual-en')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'manual-en'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-sky-600" />
            <span>User Manual (English • 6 Chapters)</span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'comparison'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-4 h-4 text-violet-600" />
            <span>
              {t(
                'เปรียบเทียบ 6 มาตรฐานสากล',
                '6 Citation Styles Comparison'
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('thai-rules')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'thai-rules'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>
              {t(
                'หลักเกณฑ์บรรณานุกรมภาษาไทย',
                'Thai Academic Rules'
              )}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 font-sarabun text-slate-700 flex-1 bg-slate-50/50">
          {/* TAB 1: THAI USER MANUAL */}
          {activeTab === 'manual-th' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-50 via-white to-sky-50 border border-indigo-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 mb-1.5">
                    THAI EDITION • คู่มือฉบับภาษาไทย
                  </span>
                  <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                    คู่มือการใช้งานระบบจัดการบรรณานุกรมสำหรับงานวิจัยและวิทยานิพนธ์ (ครบทั้ง 6 บท)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    อธิบายขั้นตอนการใช้งานตั้งแต่การเข้าสู่ระบบ การดึงข้อมูลอัตโนมัติ ปุ่มแก้ไขอัตโนมัติ 3 รูปแบบ การตรวจไฟล์ภายนอก จนถึงการส่งออกไฟล์ Word (.docx)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadPdf('th')}
                  disabled={downloadingEdition !== null}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shrink-0 shadow-xs cursor-pointer"
                >
                  {downloadingEdition === 'th' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                  <span>ดาวน์โหลดคู่มือภาษาไทย (.PDF)</span>
                </button>
              </div>

              {THAI_MANUAL_PAGES.map((page, pIdx) => (
                <div
                  key={pIdx}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                >
                  <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-indigo-300">
                      {page.pageCategory}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200">
                      หน้า {pIdx + 1} / {THAI_MANUAL_PAGES.length} ในไฟล์ PDF
                    </span>
                  </div>

                  <div className="p-5 space-y-6">
                    {page.sections.map((sec, sIdx) => (
                      <div key={sIdx} className="space-y-3">
                        <div className="flex items-start sm:items-center gap-2.5 pb-2 border-b border-slate-200">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-600 text-white shrink-0">
                            {sec.badge}
                          </span>
                          <div>
                            <h5 className="font-extrabold text-slate-900 text-sm sm:text-base">
                              {sec.title}
                            </h5>
                            {sec.subtitle && (
                              <p className="text-xs text-slate-500">{sec.subtitle}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {sec.items.map((item, iIdx) => (
                            <div
                              key={iIdx}
                              className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex items-start gap-3"
                            >
                              {item.step && (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0 mt-0.5">
                                  {item.step}
                                </span>
                              )}
                              <div className="space-y-1">
                                <div className="font-bold text-slate-900 text-sm">
                                  {item.heading}
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                  {item.body}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {sec.callout && (
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm space-y-1">
                            <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>{sec.callout.title}</span>
                            </div>
                            <p className="text-emerald-900 leading-relaxed">
                              {sec.callout.text}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: ENGLISH USER MANUAL */}
          {activeTab === 'manual-en' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-sky-50 via-white to-indigo-50 border border-sky-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 mb-1.5">
                    ENGLISH EDITION • OFFICIAL USER MANUAL
                  </span>
                  <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Academic Bibliography Management System — Complete User Guide (Chapters 1–6)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Step-by-step instructions covering Cloud Sync, Google Search Grounding, 3-Tier Automated Validation Repair, External File Inspection, and Word (.docx) Export.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadPdf('en')}
                  disabled={downloadingEdition !== null}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-2 shrink-0 shadow-xs cursor-pointer"
                >
                  {downloadingEdition === 'en' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                  <span>Download English Manual (.PDF)</span>
                </button>
              </div>

              {ENGLISH_MANUAL_PAGES.map((page, pIdx) => (
                <div
                  key={pIdx}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                >
                  <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-sky-300">
                      {page.pageCategory}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200">
                      Page {pIdx + 1} of {ENGLISH_MANUAL_PAGES.length} in PDF
                    </span>
                  </div>

                  <div className="p-5 space-y-6">
                    {page.sections.map((sec, sIdx) => (
                      <div key={sIdx} className="space-y-3">
                        <div className="flex items-start sm:items-center gap-2.5 pb-2 border-b border-slate-200">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-sky-600 text-white shrink-0">
                            {sec.badge}
                          </span>
                          <div>
                            <h5 className="font-extrabold text-slate-900 text-sm sm:text-base">
                              {sec.title}
                            </h5>
                            {sec.subtitle && (
                              <p className="text-xs text-slate-500">{sec.subtitle}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {sec.items.map((item, iIdx) => (
                            <div
                              key={iIdx}
                              className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex items-start gap-3"
                            >
                              {item.step && (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-sky-50 text-sky-700 border border-sky-200 shrink-0 mt-0.5">
                                  {item.step}
                                </span>
                              )}
                              <div className="space-y-1">
                                <div className="font-bold text-slate-900 text-sm">
                                  {item.heading}
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                  {item.body}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {sec.callout && (
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm space-y-1">
                            <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>{sec.callout.title}</span>
                            </div>
                            <p className="text-emerald-900 leading-relaxed">
                              {sec.callout.text}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: 6 CITATION STYLES COMPARISON */}
          {activeTab === 'comparison' && (
            <div className="space-y-6">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4">
                <h4 className="font-bold text-indigo-950 text-sm mb-1">
                  {t(
                    'ตารางเปรียบเทียบความแตกต่างของแต่ละรูปแบบการอ้างอิง (6 มาตรฐาน)',
                    'Side-by-Side Comparison of the 6 Supported Citation Standards'
                  )}
                </h4>
                <p className="text-xs text-indigo-800">
                  {t(
                    'คุณสามารถสลับรูปแบบการอ้างอิงไปมาได้ตลอดเวลาบนหน้ากระดาษ A4 โดยไม่ต้องกรอกข้อมูลใหม่',
                    'Switch between any of the 6 international citation styles in real time on the A4 Document Preview without re-entering data.'
                  )}
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-200">
                      <th className="p-3 font-bold">
                        {t('หัวข้อเปรียบเทียบ (Feature)', 'Feature')}
                      </th>
                      <th className="p-3 font-bold text-indigo-700 bg-indigo-50/50">
                        APA 7th (2020)
                      </th>
                      <th className="p-3 font-bold">APA 6th (2010)</th>
                      <th className="p-3 font-bold text-emerald-700 bg-emerald-50/40">
                        MLA 9th (2021)
                      </th>
                      <th className="p-3 font-bold text-amber-800 bg-amber-50/40">
                        Chicago / Harvard / Vancouver
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-3 font-semibold bg-slate-50">
                        {t('สาขาที่นิยมใช้ (Fields)', 'Primary Academic Fields')}
                      </td>
                      <td className="p-3 bg-indigo-50/20">
                        {t(
                          'สังคมศาสตร์, ศึกษาศาสตร์, จิตวิทยา, บริหารธุรกิจ (ปัจจุบัน)',
                          'Social Sciences, Education, Psychology, Nursing'
                        )}
                      </td>
                      <td className="p-3">
                        {t(
                          'บัณฑิตวิทยาลัยบางแห่งที่ยังใช้เกณฑ์เดิม',
                          'Legacy Graduate School Guidelines'
                        )}
                      </td>
                      <td className="p-3 bg-emerald-50/10">
                        {t(
                          'มนุษยศาสตร์, อักษรศาสตร์, ศิลปกรรม, วรรณคดี',
                          'Humanities, Literature, Arts, Linguistics'
                        )}
                      </td>
                      <td className="p-3 bg-amber-50/10">
                        {t(
                          'ประวัติศาสตร์ (Chicago), บริหาร (Harvard), แพทย์/วิศวกรรม (Vancouver)',
                          'History (Chicago), Business (Harvard), Medicine/Engineering (Vancouver)'
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold bg-slate-50">
                        {t('การเขียนชื่อผู้แต่งอังกฤษ', 'Author Name Format')}
                      </td>
                      <td className="p-3 bg-indigo-50/20">
                        นามสกุล, อักษรย่อชื่อ. (Smith, J. D.)
                      </td>
                      <td className="p-3">นามสกุล, อักษรย่อชื่อ. (Smith, J. D.)</td>
                      <td className="p-3 bg-emerald-50/10">
                        นามสกุล, ชื่อเต็ม. (Smith, John D.)
                      </td>
                      <td className="p-3 bg-amber-50/10">
                        Chicago: Smith, John D. | Vancouver: Smith JD
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold bg-slate-50">
                        {t('ตำแหน่งปีที่พิมพ์ (Year)', 'Year Placement')}
                      </td>
                      <td className="p-3 bg-indigo-50/20">
                        ในวงเล็บหลังชื่อผู้แต่ง: <code>(2567).</code>
                      </td>
                      <td className="p-3">
                        ในวงเล็บหลังชื่อผู้แต่ง: <code>(2567).</code>
                      </td>
                      <td className="p-3 bg-emerald-50/10">
                        อยู่ท้ายรายการ หลังชื่อสำนักพิมพ์/วารสาร
                      </td>
                      <td className="p-3 bg-amber-50/10">
                        Chicago: หลังชื่อผู้แต่งไม่มีวงเล็บ | Vancouver: ท้ายชื่อวารสาร
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold bg-slate-50">
                        {t('การอ้างอิงในเนื้อหา (In-Text)', 'In-Text Citation')}
                      </td>
                      <td className="p-3 bg-indigo-50/20">
                        <code>(Smith et al., 2024, p. 15)</code> (ตั้งแต่ 3 คนขึ้นไปใช้ et al. ทันที)
                      </td>
                      <td className="p-3">
                        3–5 คนต้องใส่ครบในครั้งแรก ครั้งต่อไปจึงใช้ et al.
                      </td>
                      <td className="p-3 bg-emerald-50/10">
                        <code>(Smith 15)</code> (ผู้แต่ง ตามด้วยเลขหน้า ไม่คั่นด้วยจุลภาค)
                      </td>
                      <td className="p-3 bg-amber-50/10">
                        Chicago: <code>(Smith 2024, 15)</code> | Vancouver: <code>[1]</code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {STYLE_METADATA.map((style) => (
                  <div
                    key={style.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        {style.name}
                      </span>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {style.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{style.description}</p>
                    <ul className="space-y-1.5 pt-1 border-t border-slate-100">
                      {style.keyRules.map((rule, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-slate-700 flex items-start gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: THAI ACADEMIC BIBLIOGRAPHY RULES */}
          {activeTab === 'thai-rules' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
                <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                  <span>🇹🇭</span>
                  <span>
                    {t(
                      'หลักเกณฑ์สำคัญในการเขียนบรรณานุกรมภาษาไทย (ที่ระบบจัดการให้อัตโนมัติ)',
                      'Key Rules for Thai Academic Bibliographies (Automatically Handled)'
                    )}
                  </span>
                </h4>
                <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                  {t(
                    'การเขียนบรรณานุกรมในประเทศไทยใช้โครงสร้างตามมาตรฐานสากล (เช่น APA หรือ MLA) แต่ปรับวิธีเขียนชื่อผู้แต่งและคำเชื่อมให้เป็นไปตามหลักเกณฑ์ของราชบัณฑิตยสภาและบัณฑิตวิทยาลัยของมหาวิทยาลัยไทย',
                    'Thai academic bibliographies follow international structural standards (APA, MLA, etc.) while adapting author names, eras, and abbreviations to Royal Society of Thailand and Thai university graduate school conventions.'
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900 text-sm">
                    1. ชื่อ-นามสกุลผู้แต่งชาวไทย (Thai Author Names)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    เขียน <strong>ชื่อตัว ตามด้วย นามสกุล</strong> ตามปกติ ไม่ต้องกลับเอานามสกุลขึ้นก่อน และไม่ต้องย่อชื่อ (เช่น <code>สมชาย ใจดี.</code>) ต่างจากผู้แต่งชาวต่างชาติที่ต้องเอานามสกุลขึ้นก่อน (เช่น <code>Smith, J. D.</code>)
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900 text-sm">
                    2. การตัดคำนำหน้านามและตำแหน่งทางวิชาการ (Titles & Ranks)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    ไม่ใส่คำนำหน้านามทั่วไป (นาย, นาง, นางสาว) และไม่ใส่ตำแหน่งทางวิชาการหรือยศ (ดร., ศ., รศ., ผศ., พล.ต.อ.) ยกเว้นฐานันดรศักดิ์ สมณศักดิ์ หรือบรรดาศักดิ์
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900 text-sm">
                    3. การเรียงลำดับบรรณานุกรมท้ายเล่ม (Bilingual Sorting)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    ระบบจะจัดเรียงรายการ <strong>ภาษาไทยขึ้นก่อน (ก–ฮ)</strong> แล้วจึงตามด้วยรายการ <strong>ภาษาอังกฤษ (A–Z)</strong> และเยื้องบรรทัดที่ 2 เป็นต้นไปเข้าด้านใน 0.5 นิ้ว (Hanging Indent)
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900 text-sm">
                    4. คำย่อเมื่อไม่ปรากฏข้อมูลพิมพ์ (ม.ป.ป. / ม.ป.ท.)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    หากไม่ปรากฏปีที่พิมพ์ ให้ใช้ <code>ม.ป.ป.</code> (ไม่ปรากฏปีพิมพ์) สำหรับภาษาไทย และใช้ <code>n.d.</code> (no date) สำหรับภาษาอังกฤษ หากไม่ปรากฏสำนักพิมพ์ใช้ <code>ม.ป.ท.</code>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Contact & Quick PDF Download */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-sarabun">
            <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>
              {t(
                'ติดต่อสอบถามรายละเอียดเพิ่มเติมได้ที่:',
                'For inquiries & support, contact:'
              )}
            </span>
            <a
              href="mailto:nonenapatnunwipat@gmail.com"
              className="font-bold text-indigo-700 hover:underline"
            >
              nonenapatnunwipat@gmail.com
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadPdf('bilingual')}
              disabled={downloadingEdition !== null}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              {downloadingEdition === 'bilingual' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>
                {t(
                  'ดาวน์โหลดคู่มือ PDF (TH/EN)',
                  'Download PDF Manual (TH/EN)'
                )}
              </span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {t('ปิดหน้าต่าง', 'Close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
