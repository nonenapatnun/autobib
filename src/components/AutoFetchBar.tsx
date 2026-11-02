import React, { useState } from 'react';
import { Search, Loader2, Sparkles, Layers, BookCheck, AlertCircle, Globe, FolderOpen } from 'lucide-react';
import { cleanDoiString, isValidDoi, fetchByDoi } from '../utils/api/fetchDoi';
import { cleanIsbnString, isValidIsbn, fetchByIsbn } from '../utils/api/fetchIsbn';
import { isValidUrl, fetchByUrl } from '../utils/api/fetchUrl';
import { BibliographyEntry } from '../types/bibliography';
import { useLanguage } from '../contexts/LanguageContext';

interface AutoFetchBarProps {
  onEntryFetched: (entry: Partial<BibliographyEntry>) => void;
  onOpenBatchModal: () => void;
  onOpenSearchGroundingModal: (initialQuery?: string) => void;
  onOpenExternalFileInspector?: () => void;
}

export const AutoFetchBar: React.FC<AutoFetchBarProps> = ({
  onEntryFetched,
  onOpenBatchModal,
  onOpenSearchGroundingModal,
  onOpenExternalFileInspector,
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [fetchType, setFetchType] = useState<'auto' | 'doi' | 'isbn' | 'url' | 'grounding'>('auto');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFetch = async (inputQuery?: string) => {
    const textToSearch = (inputQuery !== undefined ? inputQuery : query).trim();
    if (!textToSearch) {
      setErrorMsg(
        t(
          'กรุณากรอกเลข DOI, ISBN, URL เว็บไซต์ หรือชื่อบทความ/หนังสือ',
          'Please enter a DOI, ISBN, Website URL, or Article/Book Title'
        )
      );
      return;
    }

    // If fetchType is explicitly 'grounding', open the Grounding modal
    if (fetchType === 'grounding') {
      onOpenSearchGroundingModal(textToSearch);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let resolvedType: 'doi' | 'isbn' | 'url' | 'grounding' = 'doi';

      if (fetchType === 'auto') {
        const lower = textToSearch.toLowerCase();

        // 1. Check if it's a DOI URL or raw DOI
        if (
          lower.includes('doi.org/10.') ||
          lower.startsWith('10.') ||
          (isValidDoi(textToSearch) && !lower.startsWith('http'))
        ) {
          resolvedType = 'doi';
        }
        // 2. Check if it's a Web URL
        else if (
          lower.startsWith('http://') ||
          lower.startsWith('https://') ||
          lower.startsWith('www.') ||
          isValidUrl(textToSearch)
        ) {
          resolvedType = 'url';
        }
        // 3. Check if ISBN
        else if (isValidIsbn(textToSearch) || cleanIsbnString(textToSearch).length >= 10) {
          resolvedType = 'isbn';
        }
        // 4. Otherwise, user entered a book/article title or researcher name -> Route to Google Search Grounding!
        else {
          resolvedType = 'grounding';
        }
      } else {
        resolvedType = fetchType;
      }

      if (resolvedType === 'grounding') {
        setLoading(false);
        onOpenSearchGroundingModal(textToSearch);
        return;
      }

      let result: Partial<BibliographyEntry>;

      if (resolvedType === 'doi') {
        result = await fetchByDoi(textToSearch);
        setSuccessMsg(
          t(
            `ดึงข้อมูลสำเร็จจาก CrossRef (DOI): "${result.title?.substring(0, 40)}..."`,
            `Fetched metadata from CrossRef (DOI): "${result.title?.substring(0, 40)}..."`
          )
        );
      } else if (resolvedType === 'isbn') {
        result = await fetchByIsbn(textToSearch);
        setSuccessMsg(
          t(
            `ดึงข้อมูลสำเร็จจากฐานข้อมูลหนังสือ (ISBN): "${result.title?.substring(0, 40)}..."`,
            `Fetched metadata from Book Database (ISBN): "${result.title?.substring(0, 40)}..."`
          )
        );
      } else {
        result = await fetchByUrl(textToSearch);
        setSuccessMsg(
          t(
            `ดึงข้อมูลสำเร็จจาก URL เว็บไซต์: "${result.title?.substring(0, 40)}..."`,
            `Fetched metadata from Website URL: "${result.title?.substring(0, 40)}..."`
          )
        );
      }

      onEntryFetched(result);
      setQuery('');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message ||
          t(
            'ไม่สามารถดึงข้อมูลได้ กรุณาตรวจสอบรหัสหรือลิงก์แล้วลองใหม่อีกครั้ง',
            'Unable to fetch metadata. Please verify the identifier or URL and try again.'
          )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSample = (sample: string, type: 'doi' | 'isbn' | 'url') => {
    setQuery(sample);
    setFetchType(type);
    handleFetch(sample);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {t(
                'ดึงข้อมูลอัตโนมัติด้วย Google Search Grounding, DOI, ISBN หรือ URL',
                'Auto-Fetch Reference Metadata via Google Search Grounding, DOI, ISBN, or URL'
              )}
            </h3>
            <p className="text-xs text-slate-500">
              {t(
                'ค้นหาชื่อบทความ/หนังสือด้วย Google Search Grounding หรือวาง DOI, ISBN, URL เพื่อสร้างรายการอัตโนมัติ',
                'Search article/book titles with Google Search Grounding or paste a DOI, ISBN, or URL to auto-generate citations'
              )}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenSearchGroundingModal(query.trim() || undefined)}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 rounded-lg shadow-xs hover:shadow transition-all cursor-pointer border border-indigo-500/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('ค้นหาด้วย Google Grounding', 'Google Search Grounding')}</span>
          </button>

          <button
            onClick={onOpenBatchModal}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t('นำเข้าหลายรายการ (Batch)', 'Batch Import')}</span>
          </button>

          {onOpenExternalFileInspector && (
            <button
              onClick={onOpenExternalFileInspector}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 cursor-pointer"
              title={t(
                'อัปโหลดและตรวจสอบบรรณานุกรมจากไฟล์ภายนอก (.docx, .bib, .ris, .csv, .txt)',
                'Upload and inspect bibliography from external files (.docx, .bib, .ris, .csv, .txt)'
              )}
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                {t('ตรวจสอบบรรณานุกรมจากไฟล์ภายนอก', 'Inspect External Bibliography File')}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Input + selector Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleFetch();
        }}
        className="flex flex-col md:flex-row gap-2.5"
      >
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder={t(
              'พิมพ์ชื่อบทความ, ชื่อหนังสือ, DOI (10.xxx), ISBN หรือ URL เว็บไซต์...',
              'Enter article title, book title, DOI (10.xxx), ISBN, or website URL...'
            )}
            className="w-full pl-10 pr-36 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-500 rounded-xl outline-hidden transition-all text-slate-800 placeholder-slate-400 font-sans"
            disabled={loading}
          />

          <div className="absolute inset-y-1 right-1 flex items-center">
            <select
              value={fetchType}
              onChange={(e) => setFetchType(e.target.value as any)}
              className="text-xs bg-slate-200/70 hover:bg-slate-200 text-slate-700 font-medium py-1.5 px-2 rounded-lg border-none outline-hidden cursor-pointer mr-1"
            >
              <option value="auto">{t('ตรวจจับอัตโนมัติ', 'Auto-Detect')}</option>
              <option value="grounding">✨ Google Search</option>
              <option value="doi">{t('DOI บทความ', 'Article DOI')}</option>
              <option value="isbn">{t('ISBN หนังสือ', 'Book ISBN')}</option>
              <option value="url">{t('URL เว็บไซต์', 'Website URL')}</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('กำลังดึงข้อมูล...', 'Fetching...')}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{t('ดึงข้อมูล (Fetch)', 'Fetch Metadata')}</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Test Samples */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="text-slate-400">{t('คลิกทดสอบ:', 'Quick Try:')}</span>
        <button
          type="button"
          onClick={() => onOpenSearchGroundingModal('Thinking, Fast and Slow Daniel Kahneman')}
          className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 transition-colors cursor-pointer flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Google Grounding: Thinking, Fast and Slow</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenSearchGroundingModal('งานวิจัย AI ทางการศึกษา ประเทศไทย')}
          className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 transition-colors cursor-pointer flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>
            {t(
              'Google Grounding: วิจัย AI การศึกษาไทย',
              'Google Grounding: AI in Thai Education'
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={() => handleQuickSample('https://th.wikipedia.org/wiki/ปัญญาประดิษฐ์', 'url')}
          className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
        >
          <Globe className="w-3 h-3 text-emerald-600" />
          <span>{t('URL: วิกิพีเดีย AI', 'URL: Wikipedia AI')}</span>
        </button>
        <button
          type="button"
          onClick={() => handleQuickSample('10.1038/s41586-020-2649-2', 'doi')}
          className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
        >
          DOI: Nature AlphaFold
        </button>
      </div>

      {/* Feedback messages */}
      {errorMsg && (
        <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">{t('เกิดข้อผิดพลาด: ', 'Error: ')}</span>
            {errorMsg}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <BookCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex-1 font-medium">{successMsg}</div>
        </div>
      )}
    </div>
  );
};

