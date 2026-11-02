import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Building2,
  User,
  Sparkles,
  Eye,
  Check,
  RefreshCw
} from 'lucide-react';
import { BibliographyEntry, SourceType, LanguageType, Author, CitationStyle } from '../types/bibliography';
import { formatCitation } from '../utils/formatters';
import { validateEntry } from '../utils/validation/citationValidator';
import { AlertCircle, AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: BibliographyEntry) => void;
  initialData?: Partial<BibliographyEntry> | null;
  currentStyle: CitationStyle;
}

export const EntryModal: React.FC<EntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  currentStyle
}) => {
  const [sourceType, setSourceType] = useState<SourceType>('book');
  const [language, setLanguage] = useState<LanguageType>('th');
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState<Author[]>([]);
  const [year, setYear] = useState('');
  const [yearType, setYearType] = useState<'CE' | 'BE'>('BE');
  const [monthDay, setMonthDay] = useState('');

  // Publication
  const [containerTitle, setContainerTitle] = useState('');
  const [volume, setVolume] = useState('');
  const [issue, setIssue] = useState('');
  const [pages, setPages] = useState('');
  const [edition, setEdition] = useState('');
  const [publisher, setPublisher] = useState('');
  const [place, setPlace] = useState('');

  // Identifiers
  const [doi, setDoi] = useState('');
  const [isbn, setIsbn] = useState('');
  const [url, setUrl] = useState('');
  const [accessDate, setAccessDate] = useState('');

  // Specific
  const [institution, setInstitution] = useState('');
  const [degreeType, setDegreeType] = useState('');

  const [previewStyle, setPreviewStyle] = useState<CitationStyle>(currentStyle);

  useEffect(() => {
    if (initialData) {
      setSourceType(initialData.sourceType || 'book');
      setLanguage(initialData.language || 'th');
      setTitle(initialData.title || '');
      setAuthors(
        initialData.authors && initialData.authors.length > 0
          ? initialData.authors
          : [
              {
                id: Math.random().toString(36).substring(2, 9),
                firstName: '',
                lastName: '',
                isOrganization: false,
                isThai: initialData.language === 'th'
              }
            ]
      );
      setYear(initialData.year || '');
      setYearType(initialData.yearType || (initialData.language === 'th' ? 'BE' : 'CE'));
      setMonthDay(initialData.monthDay || '');
      setContainerTitle(initialData.containerTitle || '');
      setVolume(initialData.volume || '');
      setIssue(initialData.issue || '');
      setPages(initialData.pages || '');
      setEdition(initialData.edition || '');
      setPublisher(initialData.publisher || '');
      setPlace(initialData.place || '');
      setDoi(initialData.doi || '');
      setIsbn(initialData.isbn || '');
      setUrl(initialData.url || '');
      setAccessDate(initialData.accessDate || '');
      setInstitution(initialData.institution || '');
      setDegreeType(initialData.degreeType || '');
    } else {
      // Default blank
      resetForm();
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    setPreviewStyle(currentStyle);
  }, [currentStyle]);

  const resetForm = () => {
    setSourceType('book');
    setLanguage('th');
    setTitle('');
    setAuthors([
      {
        id: Math.random().toString(36).substring(2, 9),
        firstName: '',
        lastName: '',
        isOrganization: false,
        isThai: true
      }
    ]);
    setYear('');
    setYearType('BE');
    setMonthDay('');
    setContainerTitle('');
    setVolume('');
    setIssue('');
    setPages('');
    setEdition('');
    setPublisher('');
    setPlace('');
    setDoi('');
    setIsbn('');
    setUrl('');
    setAccessDate('');
    setInstitution('');
    setDegreeType('');
  };

  if (!isOpen) return null;

  // Author handlers
  const handleAddAuthor = () => {
    setAuthors([
      ...authors,
      {
        id: Math.random().toString(36).substring(2, 9),
        firstName: '',
        lastName: '',
        isOrganization: false,
        isThai: language === 'th'
      }
    ]);
  };

  const handleRemoveAuthor = (index: number) => {
    setAuthors(authors.filter((_, idx) => idx !== index));
  };

  const handleMoveAuthor = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= authors.length) return;
    const list = [...authors];
    const temp = list[index];
    list[index] = list[newIdx];
    list[newIdx] = temp;
    setAuthors(list);
  };

  const handleUpdateAuthor = (index: number, fields: Partial<Author>) => {
    const list = [...authors];
    list[index] = { ...list[index], ...fields };
    setAuthors(list);
  };

  // Year converter พ.ศ. <-> ค.ศ.
  const handleConvertYear = () => {
    const num = parseInt(year, 10);
    if (!isNaN(num)) {
      if (yearType === 'BE' && num > 2400) {
        setYear(String(num - 543));
        setYearType('CE');
      } else if (yearType === 'CE' && num < 2200) {
        setYear(String(num + 543));
        setYearType('BE');
      }
    }
  };

  // Build current entry for live preview
  const currentEntry: BibliographyEntry = {
    id: initialData?.id || 'temp-id',
    sourceType,
    language,
    title: title || 'ชื่อผลงาน / ชื่อเรื่อง',
    authors: authors.filter((a) => a.firstName.trim() || a.lastName.trim()),
    year: year || '',
    yearType,
    monthDay,
    containerTitle,
    volume,
    issue,
    pages,
    edition,
    publisher,
    place,
    doi,
    isbn,
    url,
    accessDate,
    institution,
    degreeType,
    createdAt: initialData?.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  const liveFormatted = formatCitation(currentEntry, previewStyle);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('กรุณากรอกชื่อเรื่อง (Title)');
      return;
    }

    onSave({
      ...currentEntry,
      id: initialData?.id || 'bib-' + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      updatedAt: Date.now()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {initialData?.id ? 'แก้ไขข้อมูลบรรณานุกรม' : 'เพิ่มรายการบรรณานุกรมใหม่'}
            </h2>
            <p className="text-xs text-slate-500">
              กรอกรายละเอียดเอกสารเพื่อจัดรูปแบบบรรณานุกรมตามมาตรฐาน APA 6, APA 7 หรือ MLA 9
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Row: Type & Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                ประเภทแหล่งข้อมูล (Source Type)
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as SourceType)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:border-indigo-500 outline-hidden"
              >
                <option value="book">📖 หนังสือ (Book)</option>
                <option value="journal">📄 บทความวารสารวิชาการ (Journal Article)</option>
                <option value="chapter">📚 บทความในหนังสือรวมเรื่อง (Book Chapter)</option>
                <option value="website">🌐 เว็บไซต์ / สื่อออนไลน์ (Website)</option>
                <option value="thesis">🎓 วิทยานิพนธ์ / ดุษฎีนิพนธ์ (Thesis / Dissertation)</option>
                <option value="conference">🏛️ เอกสารการประชุมวิชาการ (Conference Proceeding)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                ภาษาของผลงาน (Language)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('th');
                    setYearType('BE');
                  }}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    language === 'th'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  🇹🇭 ภาษาไทย (พ.ศ.)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('en');
                    setYearType('CE');
                  }}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  🌐 ภาษาอังกฤษ / สากล (ค.ศ.)
                </button>
              </div>
            </div>
          </div>

          {/* Authors Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  ผู้แต่ง / คณะผู้จัดทำ (Authors)
                </label>
                <p className="text-xs text-slate-500">
                  {language === 'th'
                    ? 'ภาษาไทย: ใส่ "ชื่อ" และ "นามสกุล" โดยไม่ต้องใส่ ดร./ผศ./นาย'
                    : 'ภาษาอังกฤษ: Last Name (นามสกุล), First Name/Initial (ชื่อ)'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddAuthor}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มผู้แต่ง
              </button>
            </div>

            {authors.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-xl">
                ไม่ระบุผู้แต่ง (ระบบจะถือว่าเป็นผลงานที่ไม่ปรากฏชื่อผู้แต่ง)
              </div>
            ) : (
              <div className="space-y-2">
                {authors.map((author, index) => (
                  <div
                    key={author.id}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200"
                  >
                    <span className="text-xs font-mono font-semibold text-slate-400 w-5 text-center">
                      #{index + 1}
                    </span>

                    {/* Organization toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateAuthor(index, { isOrganization: !author.isOrganization })
                      }
                      title={author.isOrganization ? 'เปลี่ยนเป็นบุคคล' : 'เปลี่ยนเป็นนิติบุคคล/หน่วยงาน'}
                      className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                        author.isOrganization
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {author.isOrganization ? (
                        <>
                          <Building2 className="w-3.5 h-3.5" />
                          <span>หน่วยงาน/องค์กร</span>
                        </>
                      ) : (
                        <>
                          <User className="w-3.5 h-3.5" />
                          <span>บุคคล</span>
                        </>
                      )}
                    </button>

                    {author.isOrganization ? (
                      <input
                        type="text"
                        value={author.firstName}
                        onChange={(e) => handleUpdateAuthor(index, { firstName: e.target.value })}
                        placeholder="ชื่อหน่วยงาน เช่น ราชบัณฑิตยสภา หรือ กระทรวงศึกษาธิการ..."
                        className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs outline-hidden focus:border-indigo-500"
                      />
                    ) : (
                      <>
                        <input
                          type="text"
                          value={author.firstName}
                          onChange={(e) => handleUpdateAuthor(index, { firstName: e.target.value })}
                          placeholder={language === 'th' ? 'ชื่อจริง (ไม่ต้องมีคำนำหน้า)' : 'First Name / Initials'}
                          className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs outline-hidden focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          value={author.lastName}
                          onChange={(e) => handleUpdateAuthor(index, { lastName: e.target.value })}
                          placeholder={language === 'th' ? 'นามสกุล' : 'Last Name (Surname)'}
                          className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs outline-hidden focus:border-indigo-500"
                        />
                      </>
                    )}

                    {/* Order & delete */}
                    <div className="flex items-center gap-1 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleMoveAuthor(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                        title="เลื่อนขึ้น"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveAuthor(index, 'down')}
                        disabled={index === authors.length - 1}
                        className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                        title="เลื่อนลง"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAuthor(index)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer"
                        title="ลบผู้แต่ง"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Title & Year */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                ชื่อเรื่อง / ชื่อบทความ (Title) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ชื่อหนังสือ หรือชื่อบทความวิจัย..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-hidden focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  ปีที่พิมพ์ ({yearType === 'BE' ? 'พ.ศ.' : 'ค.ศ.'})
                </label>
                <button
                  type="button"
                  onClick={handleConvertYear}
                  className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  title="คลิกเพื่อสลับระหว่าง พ.ศ. และ ค.ศ."
                >
                  <RefreshCw className="w-3 h-3" />
                  สลับ {yearType === 'BE' ? 'ค.ศ.' : 'พ.ศ.'}
                </button>
              </div>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder={yearType === 'BE' ? 'เช่น 2566' : 'เช่น 2023'}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Conditional Fields based on Source Type */}
          {(sourceType === 'journal' || sourceType === 'chapter' || sourceType === 'conference' || sourceType === 'website') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {sourceType === 'journal'
                    ? 'ชื่อวารสาร (Journal Title)'
                    : sourceType === 'chapter'
                    ? 'ชื่อหนังสือรวมเรื่อง (Book Title)'
                    : sourceType === 'website'
                    ? 'ชื่อเว็บไซต์ (Website Name)'
                    : 'ชื่อการประชุมวิชาการ (Conference Name)'}
                </label>
                <input
                  type="text"
                  value={containerTitle}
                  onChange={(e) => setContainerTitle(e.target.value)}
                  placeholder={sourceType === 'journal' ? 'เช่น วารสารวิจัย มข.' : 'เช่น Wikipedia, ไทยรัฐออนไลน์'}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-hidden focus:border-indigo-500 italic"
                />
              </div>

              {sourceType === 'journal' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      ปีที่ (Vol)
                    </label>
                    <input
                      type="text"
                      value={volume}
                      onChange={(e) => setVolume(e.target.value)}
                      placeholder="24"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      ฉบับที่ (No)
                    </label>
                    <input
                      type="text"
                      value={issue}
                      onChange={(e) => setIssue(e.target.value)}
                      placeholder="2"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      หน้า (pp.)
                    </label>
                    <input
                      type="text"
                      value={pages}
                      onChange={(e) => setPages(e.target.value)}
                      placeholder="112-125"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Book / Chapter Specifics */}
          {(sourceType === 'book' || sourceType === 'chapter') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  สำนักพิมพ์ (Publisher)
                </label>
                <input
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="เช่น ซีเอ็ดยูเคชั่น, McGraw-Hill"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    สถานที่พิมพ์ (City, Country)
                  </label>
                  <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    สำหรับ APA 6
                  </span>
                </div>
                <input
                  type="text"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="เช่น กรุงเทพฯ หรือ New York, NY"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  พิมพ์ครั้งที่ (Edition)
                </label>
                <input
                  type="text"
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  placeholder="เช่น 2 หรือ 3rd"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Thesis specifics */}
          {sourceType === 'thesis' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  ระดับปริญญา (Degree Type)
                </label>
                <input
                  type="text"
                  value={degreeType}
                  onChange={(e) => setDegreeType(e.target.value)}
                  placeholder="เช่น วิทยานิพนธ์ปริญญามหาบัณฑิต หรือ Doctoral dissertation"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-hidden focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  สถาบัน / มหาวิทยาลัย (Institution)
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="เช่น จุฬาลงกรณ์มหาวิทยาลัย, Harvard University"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Website specifics */}
          {sourceType === 'website' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  วันเดือนที่เผยแพร่ (Day Month)
                </label>
                <input
                  type="text"
                  value={monthDay}
                  onChange={(e) => setMonthDay(e.target.value)}
                  placeholder="เช่น 15 มีนาคม หรือ March 15"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-hidden focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  วันที่สืบค้น (Access Date)
                </label>
                <input
                  type="text"
                  value={accessDate}
                  onChange={(e) => setAccessDate(e.target.value)}
                  placeholder="เช่น 1 พฤศจิกายน 2569"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Identifiers & Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                DOI
              </label>
              <input
                type="text"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                placeholder="10.1016/j.jbusres..."
                className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                ISBN
              </label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-616-08..."
                className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                URL / เว็บลิงก์
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Validation Checklist for Current Style */}
          {(() => {
            const liveValidation = validateEntry(currentEntry, previewStyle);
            return (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    {liveValidation.issues.length === 0 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">
                          ข้อมูลครบถ้วนสมบูรณ์ตามเกณฑ์ {previewStyle.toUpperCase()}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>
                          การตรวจสอบข้อมูลตามเกณฑ์ {previewStyle.toUpperCase()} ({liveValidation.issues.length} ข้อควรตรวจ)
                        </span>
                      </>
                    )}
                  </span>
                </div>

                {liveValidation.issues.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {liveValidation.issues.map((iss) => (
                      <div
                        key={iss.id}
                        className={`p-2 rounded-lg flex items-start justify-between gap-2 border ${
                          iss.severity === 'error'
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : iss.severity === 'warning'
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : 'bg-blue-50 border-blue-200 text-blue-900'
                        }`}
                      >
                        <div className="flex items-start gap-1.5">
                          {iss.severity === 'error' ? (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-semibold">{iss.message}</span>: {iss.suggestion}
                          </div>
                        </div>

                        {iss.quickFixValue && (
                          <button
                            type="button"
                            onClick={() => {
                              if (iss.field === 'year') setYear(iss.quickFixValue!);
                              if (iss.field === 'place') setPlace(iss.quickFixValue!);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-300 rounded text-[11px] font-medium text-slate-700 hover:bg-slate-100 shrink-0 cursor-pointer"
                          >
                            <Wrench className="w-3 h-3 text-indigo-600" />
                            <span>ใส่ "{iss.quickFixValue}"</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Live Preview Box */}
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  ตัวอย่างผลลัพธ์แบบเรียลไทม์ (Live Preview)
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(['apa7', 'apa6', 'mla9', 'chicago', 'harvard', 'vancouver'] as CitationStyle[]).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setPreviewStyle(style)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase transition-colors cursor-pointer ${
                      previewStyle === style
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 font-sarabun text-sm text-slate-200 leading-relaxed pl-8 -indent-8">
              <div dangerouslySetInnerHTML={{ __html: liveFormatted.htmlText }} />
            </div>

            <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1 pt-1">
              <span>
                <strong className="text-slate-300">อ้างอิงในเนื้อหา (In-Text):</strong> {liveFormatted.inTextParenthetical}
              </span>
              <span>
                <strong className="text-slate-300">แบบบรรยาย:</strong> {liveFormatted.inTextNarrative}
              </span>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl">
          <button
            type="button"
            onClick={resetForm}
            className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
          >
            ล้างฟอร์ม
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกรายการ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
