import React, { useState } from 'react';
import {
  Search,
  Edit2,
  Trash2,
  Copy,
  Check,
  Quote,
  ExternalLink,
  BookOpen,
  FileText,
  Globe,
  GraduationCap,
  Layers,
  ArrowUpDown,
  AlertTriangle,
  AlertCircle,
  Wrench,
  Loader2,
  GitMerge,
} from 'lucide-react';
import { BibliographyEntry, CitationStyle, SourceType } from '../types/bibliography';
import { formatCitation, sortBibliographyEntries } from '../utils/formatters';
import { validateEntry } from '../utils/validation/citationValidator';
import { DuplicateReport, DuplicateGroup } from '../utils/validation/duplicateDetector';
import { useLanguage } from '../contexts/LanguageContext';

interface BibliographyListProps {
  entries: BibliographyEntry[];
  currentStyle: CitationStyle;
  onEdit: (entry: BibliographyEntry) => void;
  onDelete: (id: string) => void;
  onDuplicate: (entry: BibliographyEntry) => void;
  onOpenNewModal: () => void;
  onAutoFixEntry?: (entryId: string) => void;
  autoFixingEntryIds?: string[];
  duplicateReport?: DuplicateReport;
  onMergeDuplicateGroup?: (group: DuplicateGroup) => void;
  onOpenDuplicateModal?: () => void;
}

export const BibliographyList: React.FC<BibliographyListProps> = ({
  entries,
  currentStyle,
  onEdit,
  onDelete,
  onDuplicate,
  onAutoFixEntry,
  autoFixingEntryIds = [],
  duplicateReport,
  onMergeDuplicateGroup,
  onOpenDuplicateModal,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLang, setFilterLang] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedInTextId, setCopiedInTextId] = useState<string | null>(null);

  // Filter
  const filtered = entries.filter((entry) => {
    // Search matching
    const matchSearch =
      searchTerm.trim() === '' ||
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.year.includes(searchTerm) ||
      entry.authors.some(
        (a) =>
          a.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      (entry.containerTitle &&
        entry.containerTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.doi && entry.doi.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.isbn && entry.isbn.includes(searchTerm));

    // Type matching
    const matchType = filterType === 'all' || entry.sourceType === filterType;

    // Lang matching
    const matchLang = filterLang === 'all' || entry.language === filterLang;

    return matchSearch && matchType && matchLang;
  });

  // Alphabetical sort
  const sorted = sortBibliographyEntries(filtered, { thaiFirst: true });

  const handleCopyCitation = (entry: BibliographyEntry) => {
    const formatted = formatCitation(entry, currentStyle);
    navigator.clipboard.writeText(formatted.plainText);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyInText = (entry: BibliographyEntry) => {
    const formatted = formatCitation(entry, currentStyle);
    navigator.clipboard.writeText(formatted.inTextParenthetical);
    setCopiedInTextId(entry.id);
    setTimeout(() => setCopiedInTextId(null), 2000);
  };

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'book':
        return <BookOpen className="w-3.5 h-3.5 text-amber-600" />;
      case 'journal':
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case 'website':
        return <Globe className="w-3.5 h-3.5 text-emerald-600" />;
      case 'thesis':
        return <GraduationCap className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getSourceLabel = (type: SourceType) => {
    switch (type) {
      case 'book':
        return t('หนังสือ', 'Book');
      case 'journal':
        return t('วารสาร', 'Journal Article');
      case 'chapter':
        return t('บทความในหนังสือ', 'Book Chapter');
      case 'website':
        return t('เว็บไซต์', 'Website');
      case 'thesis':
        return t('วิทยานิพนธ์', 'Thesis / Dissertation');
      case 'conference':
        return t('การประชุมวิชาการ', 'Conference Paper');
      default:
        return t('ทั่วไป', 'General');
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls: Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t(
                'ค้นหาตามชื่อผู้แต่ง, ชื่อเรื่อง, วารสาร, ปี, DOI, ISBN...',
                'Search by author, title, journal, year, DOI, ISBN...'
              )}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-hidden transition-all text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Language filter */}
            <select
              value={filterLang}
              onChange={(e) => setFilterLang(e.target.value)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-3 rounded-xl border border-slate-200 outline-hidden cursor-pointer"
            >
              <option value="all">
                {t(`ทุกภาษา (${entries.length})`, `All Languages (${entries.length})`)}
              </option>
              <option value="th">
                {t(
                  `🇹🇭 ภาษาไทย (${entries.filter((e) => e.language === 'th').length})`,
                  `🇹🇭 Thai (${entries.filter((e) => e.language === 'th').length})`
                )}
              </option>
              <option value="en">
                {t(
                  `🌐 ภาษาอังกฤษ (${entries.filter((e) => e.language === 'en').length})`,
                  `🌐 English (${entries.filter((e) => e.language === 'en').length})`
                )}
              </option>
            </select>

            {/* Source Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-3 rounded-xl border border-slate-200 outline-hidden cursor-pointer"
            >
              <option value="all">{t('ทุกประเภท', 'All Source Types')}</option>
              <option value="book">{t('หนังสือ (Book)', 'Book')}</option>
              <option value="journal">{t('บทความวารสาร (Journal)', 'Journal Article')}</option>
              <option value="chapter">{t('บทความในหนังสือ (Chapter)', 'Book Chapter')}</option>
              <option value="website">{t('เว็บไซต์ (Website)', 'Website')}</option>
              <option value="thesis">{t('วิทยานิพนธ์ (Thesis)', 'Thesis / Dissertation')}</option>
            </select>
          </div>
        </div>

        {/* Count & Sort notification */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1.5 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
            {t(
              `เรียงลำดับตามตัวอักษรชื่อผู้แต่ง (ก-ฮ / A-Z) อัตโนมัติ (${sorted.length} รายการ)`,
              `Automatically sorted alphabetically by author (${sorted.length} entries)`
            )}
          </span>
          <span className="font-mono text-slate-400 uppercase">
            {t(
              `รูปแบบแสดงผล: ${currentStyle.toUpperCase()}`,
              `Style: ${currentStyle.toUpperCase()}`
            )}
          </span>
        </div>
      </div>

      {/* List of Entry Cards */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          <p className="text-sm font-semibold">
            {t(
              'ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา',
              'No bibliography entries match your search filters'
            )}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              'ลองล้างคำค้นหาหรือเพิ่มรายการใหม่',
              'Try clearing your search query or adding a new entry'
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((entry, index) => {
            const formatted = formatCitation(entry, currentStyle, index + 1);
            const validation = validateEntry(entry, currentStyle);
            const hasErrors = validation.issues.some((i) => i.severity === 'error');
            const hasWarnings = validation.issues.length > 0;
            const isAutoFixing = autoFixingEntryIds.includes(entry.id);
            const duplicateGroup = duplicateReport?.entryToGroupMap[entry.id];

            return (
              <div
                key={entry.id}
                className={`rounded-2xl border shadow-xs hover:shadow-md transition-all p-4 sm:p-5 group ${
                  duplicateGroup
                    ? 'bg-amber-50/35 border-amber-300 ring-1 ring-amber-200/80'
                    : 'bg-white border-slate-200/90'
                }`}
              >
                {/* Header row: Index, Badges & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400 w-6">
                      #{index + 1}
                    </span>

                    {/* Source badge */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                      {getSourceIcon(entry.sourceType)}
                      <span>{getSourceLabel(entry.sourceType)}</span>
                    </span>

                    {/* Language badge */}
                    <span
                      className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${
                        entry.language === 'th'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {entry.language === 'th' ? t('🇹🇭 ไทย', '🇹🇭 TH') : '🌐 EN'}
                    </span>

                    {/* Year */}
                    {entry.year && (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-mono font-medium">
                        {entry.year}
                      </span>
                    )}

                    {/* Duplicate Citation Flag + Smart Merge Action */}
                    {duplicateGroup && (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenDuplicateModal && onOpenDuplicateModal()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 text-xs font-bold transition-colors cursor-pointer"
                          title={t(
                            'ตรวจพบรายการซ้ำซ้อน คลิกเพื่อเปรียบเทียบและจัดการ',
                            'Duplicate citation detected. Click to compare and resolve.'
                          )}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>
                            {t(
                              `รายการซ้ำ (${duplicateGroup.reasons
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
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                            title={t(
                              'ผสานข้อมูลรายการที่ซ้ำกันในกลุ่มนี้ให้เป็น 1 รายการที่สมบูรณ์ที่สุด',
                              'Merge duplicate entries in this group into a single complete citation'
                            )}
                          >
                            <GitMerge className="w-3 h-3 text-indigo-100" />
                            <span>{t('ผสานรายการซ้ำ', 'Merge Duplicate')}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Validation Issue Indicator + 1-Click Auto-Fix */}
                    {hasWarnings && (
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${
                            hasErrors
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                          title={validation.issues.map((i) => i.message).join(' | ')}
                        >
                          {hasErrors ? (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span>
                            {t(
                              `ขาด ${validation.issues.length} ฟิลด์`,
                              `${validation.issues.length} missing`
                            )}
                          </span>
                        </span>

                        {onAutoFixEntry && (
                          <button
                            type="button"
                            disabled={isAutoFixing}
                            onClick={() => onAutoFixEntry(entry.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                            title={t(
                              'ดึงข้อมูลจริงจากฐานข้อมูลวิชาการและเติมฟิลด์ที่ขาดหายอัตโนมัติ โดยไม่ต้องพิมพ์เอง',
                              'Fetch verified academic metadata and auto-fill missing fields without manual typing'
                            )}
                          >
                            {isAutoFixing ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>{t('กำลังแก้ไขอัตโนมัติ...', 'Auto-Fixing...')}</span>
                              </>
                            ) : (
                              <>
                                <Wrench className="w-3 h-3 text-emerald-100" />
                                <span>{t('✨ แก้ไขอัตโนมัติ', '✨ Auto-Fix')}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* DOI or ISBN tag */}
                    {entry.doi && (
                      <span className="hidden sm:inline-flex text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 truncate max-w-[200px]">
                        DOI: {entry.doi}
                      </span>
                    )}
                    {entry.isbn && (
                      <span className="hidden sm:inline-flex text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                        ISBN: {entry.isbn}
                      </span>
                    )}
                  </div>

                  {/* Actions: Edit, Duplicate, Delete, Copy */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyCitation(entry)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title={t('คัดลอกข้อความบรรณานุกรม', 'Copy citation text')}
                    >
                      {copiedId === entry.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">
                            {t('คัดลอกแล้ว', 'Copied')}
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                          <span className="hidden sm:inline">{t('คัดลอก', 'Copy')}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onEdit(entry)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title={t('แก้ไขข้อมูล', 'Edit entry')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDuplicate(entry)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title={t('ทำสำเนา', 'Duplicate entry')}
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDelete(entry.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title={t('ลบรายการ', 'Delete entry')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Formatted citation display with hanging indent */}
                <div
                  className="font-sarabun text-sm sm:text-base text-slate-900 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-200/70"
                  style={{
                    paddingLeft: '2rem',
                    textIndent: '-2rem',
                  }}
                >
                  <span dangerouslySetInnerHTML={{ __html: formatted.htmlText }} />
                </div>

                {/* In-Text Citation Quick Copy Pill */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Quote className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{t('การอ้างอิงในเนื้อหา (In-Text):', 'In-Text Citation:')}</span>
                    <button
                      onClick={() => handleCopyInText(entry)}
                      className="font-sarabun font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title={t('คลิกเพื่อคัดลอกการอ้างอิงในเนื้อหา', 'Click to copy in-text citation')}
                    >
                      {copiedInTextId === entry.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">{t('คัดลอกแล้ว', 'Copied')}</span>
                        </>
                      ) : (
                        <>
                          <span>{formatted.inTextParenthetical}</span>
                          <Copy className="w-3 h-3 opacity-60" />
                        </>
                      )}
                    </button>
                    <span className="text-slate-400 hidden sm:inline">
                      {t(
                        `หรือแบบบรรยาย: ${formatted.inTextNarrative}`,
                        `or Narrative: ${formatted.inTextNarrative}`
                      )}
                    </span>
                  </div>

                  {entry.url && (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                    >
                      <span>{t('เปิดลิงก์', 'Open URL')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

