import React, { useState } from 'react';
import { X, Layers, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { cleanDoiString, isValidDoi, fetchByDoi } from '../utils/api/fetchDoi';
import { cleanIsbnString, isValidIsbn, fetchByIsbn } from '../utils/api/fetchIsbn';
import { isValidUrl, fetchByUrl } from '../utils/api/fetchUrl';
import { BibliographyEntry } from '../types/bibliography';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportBatch: (entries: BibliographyEntry[]) => void;
}

interface BatchItemStatus {
  raw: string;
  type: 'doi' | 'isbn' | 'url';
  status: 'pending' | 'loading' | 'success' | 'error';
  entry?: Partial<BibliographyEntry>;
  error?: string;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  onImportBatch
}) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [items, setItems] = useState<BatchItemStatus[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen) return null;

  const handleStartImport = async () => {
    const lines = inputText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    // Prepare item list
    const batchList: BatchItemStatus[] = lines.map((line) => {
      const lower = line.toLowerCase();
      let type: 'doi' | 'isbn' | 'url' = 'doi';

      if (lower.includes('doi.org/10.') || lower.startsWith('10.')) {
        type = 'doi';
      } else if (lower.startsWith('http://') || lower.startsWith('https://') || isValidUrl(line)) {
        type = 'url';
      } else if (isValidIsbn(line) || (!line.includes('/') && cleanIsbnString(line).length >= 10)) {
        type = 'isbn';
      } else {
        type = 'doi';
      }

      return {
        raw: line,
        type,
        status: 'pending'
      };
    });

    setItems(batchList);
    setIsProcessing(true);

    const successfulEntries: BibliographyEntry[] = [];

    for (let i = 0; i < batchList.length; i++) {
      setCurrentIndex(i + 1);
      batchList[i].status = 'loading';
      setItems([...batchList]);

      const item = batchList[i];
      try {
        let partial: Partial<BibliographyEntry>;
        if (item.type === 'doi') {
          partial = await fetchByDoi(item.raw);
        } else if (item.type === 'isbn') {
          partial = await fetchByIsbn(item.raw);
        } else {
          partial = await fetchByUrl(item.raw);
        }

        const completeEntry: BibliographyEntry = {
          id: 'bib-' + Math.random().toString(36).substring(2, 9),
          sourceType: partial.sourceType || 'journal',
          language: partial.language || 'en',
          title: partial.title || 'Untitled',
          authors: partial.authors || [],
          year: partial.year || '',
          yearType: partial.yearType || 'CE',
          monthDay: partial.monthDay,
          containerTitle: partial.containerTitle,
          volume: partial.volume,
          issue: partial.issue,
          pages: partial.pages,
          publisher: partial.publisher,
          place: partial.place,
          edition: partial.edition,
          doi: partial.doi,
          isbn: partial.isbn,
          url: partial.url,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        batchList[i].status = 'success';
        batchList[i].entry = completeEntry;
        successfulEntries.push(completeEntry);
      } catch (err: any) {
        batchList[i].status = 'error';
        batchList[i].error = err.message || 'ไม่สามารถดึงข้อมูลได้';
      }

      setItems([...batchList]);
      // Small delay to prevent rate limits
      await new Promise((res) => setTimeout(res, 200));
    }

    setIsProcessing(false);
  };

  const handleFinishAndAdd = () => {
    const successList = items
      .filter((i) => i.status === 'success' && i.entry)
      .map((i) => i.entry as BibliographyEntry);

    if (successList.length > 0) {
      onImportBatch(successList);
      onClose();
    }
  };

  const successCount = items.filter((i) => i.status === 'success').length;
  const errorCount = items.filter((i) => i.status === 'error').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">นำเข้าพร้อมกันหลายรายการ (Batch Import)</h2>
              <p className="text-xs text-slate-500">วางรหัส DOI, ISBN หรือ URL เว็บไซต์ทีละบรรทัด ระบบจะดึงข้อมูลให้ทั้งหมดในครั้งเดียว</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700">
          {!isProcessing && items.length === 0 ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                รายการ DOI, ISBN หรือ URL เว็บไซต์ (วางบรรทัดละ 1 รายการ)
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={8}
                placeholder={`10.1038/s41586-020-2649-2\nhttps://th.wikipedia.org/wiki/ปัญญาประดิษฐ์\n9780132350884\n9781506386706`}
                className="w-full p-3 font-mono text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-500 rounded-xl outline-hidden transition-all text-slate-800"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>จำนวนบรรทัด: {inputText.split('\n').filter((l) => l.trim()).length} รายการ</span>
                <button
                  type="button"
                  onClick={() =>
                    setInputText(
                      `10.1038/s41586-020-2649-2\n10.1109/CVPR.2016.90\n9780132350884\n9781506386706`
                    )
                  }
                  className="text-indigo-600 hover:underline cursor-pointer"
                >
                  โหลดตัวอย่างทดสอบ
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center text-xs font-medium text-slate-700 mb-1.5">
                  <span>
                    {isProcessing
                      ? `กำลังประมวลผล ${currentIndex} จาก ${items.length} รายการ...`
                      : `ประมวลผลเสร็จสิ้น (สำเร็จ ${successCount}, ผิดพลาด ${errorCount})`}
                  </span>
                  <span>{Math.round((currentIndex / items.length) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${(currentIndex / items.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs gap-3"
                  >
                    <div className="flex items-center gap-2 truncate flex-1">
                      {item.status === 'pending' && <span className="w-4 h-4 rounded-full bg-slate-200 inline-block" />}
                      {item.status === 'loading' && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />}
                      {item.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      {item.status === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                      <div className="truncate">
                        <span className="font-mono text-slate-500 mr-2">[{item.type.toUpperCase()}]</span>
                        <span className="font-medium text-slate-800">
                          {item.entry?.title || item.raw}
                        </span>
                      </div>
                    </div>
                    {item.status === 'error' && (
                      <span className="text-rose-600 shrink-0">{item.error}</span>
                    )}
                    {item.status === 'success' && (
                      <span className="text-emerald-700 shrink-0 font-medium">สำเร็จ</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl">
          <button
            onClick={() => {
              setItems([]);
              setCurrentIndex(0);
            }}
            disabled={isProcessing || items.length === 0}
            className="text-xs text-slate-600 hover:text-slate-800 disabled:opacity-40"
          >
            ล้างและเริ่มใหม่
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-40"
            >
              ยกเลิก
            </button>

            {!isProcessing && items.length === 0 ? (
              <button
                onClick={handleStartImport}
                disabled={!inputText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>เริ่มดึงข้อมูล (Fetch All)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinishAndAdd}
                disabled={isProcessing || successCount === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>เพิ่ม {successCount} รายการลงในบรรณานุกรม</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
