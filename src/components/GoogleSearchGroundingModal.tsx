import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  ExternalLink,
  BookOpen,
  FileText,
  Globe,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit,
  X,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import {
  BibliographyEntry,
  CitationStyle,
  SourceType,
} from '../types/bibliography';
import {
  searchCitationsWithGrounding,
  convertToBibliographyEntry,
  GroundingSearchResultItem,
  GroundingSource,
} from '../utils/api/searchGrounding';
import { formatCitation } from '../utils/formatters';

interface GoogleSearchGroundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEntry: (entry: BibliographyEntry) => void;
  onAddMultipleEntries: (entries: BibliographyEntry[]) => void;
  onEditAndAdd: (entry: BibliographyEntry) => void;
  currentStyle: CitationStyle;
  initialQuery?: string;
}

const SAMPLE_SEARCHES = [
  { label: '📚 วิจัย AI การศึกษาไทย', query: 'งานวิจัย การประยุกต์ใช้ปัญญาประดิษฐ์ทางการศึกษา ประเทศไทย' },
  { label: '📖 Thinking, Fast and Slow', query: 'Thinking, Fast and Slow Daniel Kahneman 2011' },
  { label: '🎓 ระเบียบวิธีวิจัย ศิริชัย', query: 'ทฤษฎีการทดสอบแบบดั้งเดิม ศิริชัย กาญจนวาสี' },
  { label: '🤖 Attention Is All You Need', query: 'Attention Is All You Need Ashish Vaswani Noam Shazeer 2017' },
  { label: '🌱 เศรษฐกิจพอเพียง ดร.สุเมธ', query: 'ปรัชญาเศรษฐกิจพอเพียง สุเมธ ตันติเวชกุล' },
];

export const GoogleSearchGroundingModal: React.FC<GoogleSearchGroundingModalProps> = ({
  isOpen,
  onClose,
  onAddEntry,
  onAddMultipleEntries,
  onEditAndAdd,
  currentStyle,
  initialQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GroundingSearchResultItem[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [webSearchQueries, setWebSearchQueries] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [addedIds, setAddedIds] = useState<Record<number, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // If initialQuery is changed and non-empty, auto-trigger search
  React.useEffect(() => {
    if (initialQuery && isOpen && results.length === 0 && !loading) {
      setSearchQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery, isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch !== undefined ? queryToSearch : searchQuery).trim();
    if (!q) {
      setError('กรุณาระบุชื่อบทความ หนังสือ ผู้แต่ง หรือหัวข้อที่ต้องการค้นหา');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setSources([]);
    setWebSearchQueries([]);
    setSelectedIndices([]);

    try {
      const data = await searchCitationsWithGrounding(q);
      if (data.items && data.items.length > 0) {
        setResults(data.items);
        setSources(data.sources || []);
        setWebSearchQueries(data.webSearchQueries || []);
        // Pre-select all results by default for convenience
        setSelectedIndices(data.items.map((_, i) => i));
      } else {
        setError('ไม่พบข้อมูลบรรณานุกรมที่ตรงกับคำค้นหา กรุณาลองใช้คำค้นหาอื่นหรือระบุชื่อผู้แต่งเพิ่มเติม');
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ Google Search Grounding');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSelectAll = () => {
    if (selectedIndices.length === results.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(results.map((_, i) => i));
    }
  };

  const handleSingleAdd = (item: GroundingSearchResultItem, index: number) => {
    const entry = convertToBibliographyEntry(item);
    onAddEntry(entry);
    setAddedIds((prev) => ({ ...prev, [index]: true }));
  };

  const handleSingleEdit = (item: GroundingSearchResultItem) => {
    const entry = convertToBibliographyEntry(item);
    onEditAndAdd(entry);
    onClose();
  };

  const handleAddSelected = () => {
    if (selectedIndices.length === 0) return;
    const entriesToAdd = selectedIndices.map((i) =>
      convertToBibliographyEntry(results[i])
    );
    onAddMultipleEntries(entriesToAdd);

    const newAdded: Record<number, boolean> = { ...addedIds };
    selectedIndices.forEach((i) => {
      newAdded[i] = true;
    });
    setAddedIds(newAdded);
    onClose();
  };

  const handleCopyCitation = (item: GroundingSearchResultItem, index: number) => {
    const entry = convertToBibliographyEntry(item);
    const citation = formatCitation(entry, currentStyle).plainText;
    navigator.clipboard.writeText(citation);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getSourceIcon = (type?: SourceType) => {
    switch (type) {
      case 'book':
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case 'journal':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'thesis':
        return <GraduationCap className="w-4 h-4 text-amber-600" />;
      default:
        return <Globe className="w-4 h-4 text-sky-600" />;
    }
  };

  const getSourceLabel = (type?: SourceType) => {
    switch (type) {
      case 'book':
        return 'หนังสือ';
      case 'journal':
        return 'บทความวารสาร';
      case 'thesis':
        return 'วิทยานิพนธ์';
      case 'conference':
        return 'รายงานการประชุมวิชาการ';
      case 'website':
        return 'เว็บไซต์/สื่อออนไลน์';
      default:
        return 'เอกสารวิชาการ';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  ค้นหาข้อมูลบรรณานุกรมด้วย Google Search Grounding
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Live Web Grounding
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sarabun">
                ค้นหาชื่อบทความ หนังสือ หรือหัวข้อวิจัย พร้อมดึงข้อมูลผู้แต่ง ปีพิมพ์ สำนักพิมพ์ และ DOI อัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Sample Chips */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ระบุชื่อบทความ, ชื่อหนังสือ, ชื่อผู้แต่ง, หรือหัวข้อวิจัย เช่น 'Attention Is All You Need' หรือ 'ปรัชญาเศรษฐกิจพอเพียง'"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sarabun"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังค้นหา...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>ค้นหาข้อมูลวิชาการ</span>
                </>
              )}
            </button>
          </form>

          {/* Quick sample chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs text-slate-500 font-medium mr-1">ตัวอย่างค้นหา:</span>
            {SAMPLE_SEARCHES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSearchQuery(sample.query);
                  handleSearch(sample.query);
                }}
                className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors cursor-pointer"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-sarabun">
          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                <Sparkles className="w-5 h-5 text-amber-500 absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-800 text-sm">
                  กำลังค้นหาและตรวจสอบแหล่งข้อมูลผ่าน Google Search Grounding...
                </p>
                <p className="text-xs text-slate-500">
                  ระบบกำลังค้นหาเอกสารวิชาการ ตรวจสอบชื่อผู้แต่ง ปีพิมพ์ วารสาร และแปลงเป็นรูปแบบบรรณานุกรม
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">ไม่สามารถดึงข้อมูลได้</p>
                <p className="text-xs text-rose-600">{error}</p>
                <p className="text-xs text-slate-600 pt-1">
                  💡 คำแนะนำ: ลองพิมพ์ชื่อหนังสือ หรือใส่ชื่อผู้แต่งและปีพิมพ์ เช่น "Daniel Kahneman 2011" เพื่อการค้นหาที่แม่นยำยิ่งขึ้น
                </p>
              </div>
            </div>
          )}

          {/* Empty / Intro state */}
          {!loading && !error && results.length === 0 && (
            <div className="py-12 text-center space-y-3 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Search className="w-7 h-7 text-indigo-500" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">
                ค้นหาเอกสารวิชาการและหนังสือได้ทันที
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                พิมพ์ชื่อบทความ, ชื่อหนังสือ, วารสาร หรือชื่อผู้วิจัย
                ระบบจะค้นหาข้อมูลอ้างอิงจริงบนเว็บผ่าน Google Search Grounding
                และดึงรายละเอียดผู้แต่ง ปี และสำนักพิมพ์มาสร้างบรรณานุกรมให้อัตโนมัติ
              </p>
            </div>
          )}

          {/* Results List */}
          {!loading && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-700">
                    พบ {results.length} รายการ
                  </span>
                  <button
                    onClick={handleSelectAll}
                    className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    {selectedIndices.length === results.length
                      ? 'ยกเลิกการเลือกทั้งหมด'
                      : 'เลือกทั้งหมด'}
                  </button>
                </div>
                <span className="text-slate-400">
                  พรีวิวอ้างอิง: <span className="font-medium text-slate-600 uppercase">{currentStyle}</span>
                </span>
              </div>

              <div className="space-y-3">
                {results.map((item, idx) => {
                  const entry = convertToBibliographyEntry(item);
                  const formatted = formatCitation(entry, currentStyle);
                  const isSelected = selectedIndices.includes(idx);
                  const isAdded = !!addedIds[idx];

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-indigo-300 bg-indigo-50/30 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(idx)}
                          className="mt-1 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {getSourceIcon(item.sourceType)}
                              <span>{getSourceLabel(item.sourceType)}</span>
                            </span>

                            {item.language === 'th' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                                ภาษาไทย
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                                English
                              </span>
                            )}

                            {item.doi && (
                              <span className="text-[11px] text-slate-500 font-mono">
                                DOI: {item.doi}
                              </span>
                            )}
                            {item.isbn && (
                              <span className="text-[11px] text-slate-500 font-mono">
                                ISBN: {item.isbn}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {item.title}
                          </h4>

                          {/* Authors & Publication Info */}
                          <div className="text-xs text-slate-600 flex flex-wrap gap-x-3 gap-y-1">
                            <span>
                              <strong className="text-slate-700">ผู้แต่ง:</strong>{' '}
                              {entry.authors
                                .map((a) =>
                                  a.isThai
                                    ? a.firstName
                                    : `${a.lastName}, ${a.firstName}`
                                )
                                .join('; ')}
                            </span>
                            <span>
                              <strong className="text-slate-700">ปี:</strong>{' '}
                              {entry.year} ({entry.yearType})
                            </span>
                            {item.containerTitle && (
                              <span>
                                <strong className="text-slate-700">แหล่งพิมพ์:</strong>{' '}
                                {item.containerTitle}
                              </span>
                            )}
                            {item.publisher && (
                              <span>
                                <strong className="text-slate-700">สำนักพิมพ์:</strong>{' '}
                                {item.publisher}
                              </span>
                            )}
                            {item.institution && (
                              <span>
                                <strong className="text-slate-700">สถาบัน:</strong>{' '}
                                {item.institution}
                              </span>
                            )}
                          </div>

                          {/* Snippet if present */}
                          {item.snippet && (
                            <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-150">
                              "{item.snippet}"
                            </p>
                          )}

                          {/* Citation Preview in Selected Style */}
                          <div className="pt-1">
                            <div className="p-2.5 rounded-lg bg-slate-900 text-slate-100 text-xs leading-relaxed font-sarabun border border-slate-800">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800 mb-1.5">
                                <span>ตัวอย่างการอ้างอิง ({currentStyle.toUpperCase()}):</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCitation(item, idx)}
                                  className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                                  title="คัดลอกข้อความบรรณานุกรม"
                                >
                                  {copiedIndex === idx ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">คัดลอกแล้ว</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>คัดลอก</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <div
                                className="pl-4 -indent-4 break-words"
                                dangerouslySetInnerHTML={{ __html: formatted.htmlText }}
                              />
                            </div>
                          </div>

                          {/* Official URL Link if present */}
                          {item.url && (
                            <div className="pt-0.5">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>ดูลิงก์ต้นฉบับบทความ</span>
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1.5 shrink-0 self-center">
                          {isAdded ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>เพิ่มแล้ว</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSingleAdd(item, idx)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>เพิ่มในรายการ</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleSingleEdit(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                            title="เปิดฟอร์มเพื่อตรวจสอบและแก้ไขข้อมูลก่อนบันทึก"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-500" />
                            <span>แก้ไขก่อน</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grounding Sources Info (Verified via Google Search) */}
              {(sources.length > 0 || webSearchQueries.length > 0) && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 mt-4">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    <span>แหล่งข้อมูลที่ยืนยันผ่าน Google Search Grounding:</span>
                  </div>

                  {webSearchQueries.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                      <span>คำค้นหาจริง:</span>
                      {webSearchQueries.map((q, qIdx) => (
                        <span
                          key={qIdx}
                          className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono"
                        >
                          "{q}"
                        </span>
                      ))}
                    </div>
                  )}

                  {sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {sources.slice(0, 5).map((src, sIdx) => (
                        <a
                          key={sIdx}
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline max-w-[280px] truncate"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{src.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-sarabun">
            {results.length > 0 ? (
              <span>
                เลือกอยู่ <strong>{selectedIndices.length}</strong> จากทั้งหมด {results.length} รายการ
              </span>
            ) : (
              <span>ระบบตรวจสอบความถูกต้องและดึงข้อมูลอ้างอิงจริงตามมาตรฐานสากล</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>

            {results.length > 0 && (
              <button
                type="button"
                onClick={handleAddSelected}
                disabled={selectedIndices.length === 0}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มทั้งหมดที่เลือก ({selectedIndices.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
