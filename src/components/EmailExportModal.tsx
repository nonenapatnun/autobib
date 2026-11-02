import React, { useState } from 'react';
import {
  Mail,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Paperclip,
  ExternalLink,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { BibliographyEntry, CitationStyle } from '../types/bibliography';
import { DocxExportOptions, exportBibliographyToDocx } from '../utils/exportDocx';
import { formatCitation, sortBibliographyEntries } from '../utils/formatters';

interface EmailExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: BibliographyEntry[];
  style: CitationStyle;
  projectTitle: string;
  userEmail: string;
  docxOptions?: DocxExportOptions;
}

export default function EmailExportModal({
  isOpen,
  onClose,
  entries,
  style,
  projectTitle,
  userEmail,
  docxOptions,
}: EmailExportModalProps) {
  const [recipient, setRecipient] = useState(userEmail || '');
  const [attachDocx, setAttachDocx] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    recipient: string;
    messageId?: string;
    previewUrl?: string | null;
    timestamp?: string;
  } | null>(null);

  if (!isOpen) return null;

  // Convert blob to base64 helper
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const getStyleDisplayName = (s: CitationStyle) => {
    switch (s) {
      case 'apa7': return 'APA 7th Edition';
      case 'apa6': return 'APA 6th Edition';
      case 'mla9': return 'MLA 9th Edition';
      case 'chicago': return 'Chicago 17th Edition (Author-Date)';
      case 'harvard': return 'Harvard Referencing Standard';
      case 'vancouver': return 'Vancouver Style (Numbered)';
      default: return 'มาตรฐานวิชาการ';
    }
  };

  const handleSendEmail = async () => {
    if (!recipient.trim() || !recipient.includes('@')) {
      setErrorMsg('กรุณากรอกอีเมลผู้รับที่ถูกต้อง');
      return;
    }

    setIsSending(true);
    setErrorMsg(null);
    setSendResult(null);

    try {
      // 1. Sort entries and generate formatted text/html
      const sorted = sortBibliographyEntries(entries, { thaiFirst: true, style });
      const plainTextList = sorted
        .map((entry, idx) => {
          const num = style === 'vancouver' ? `[${idx + 1}] ` : '';
          return `${num}${formatCitation(entry, style)}`;
        })
        .join('\n\n');

      const htmlList = sorted
        .map((entry, idx) => {
          const num = style === 'vancouver' ? `<strong>[${idx + 1}]</strong> ` : '';
          return `<div style="margin-bottom: 12px; text-indent: -24px; padding-left: 24px;">${num}${formatCitation(entry, style)}</div>`;
        })
        .join('');

      let docxBase64: string | undefined = undefined;
      let docxFilename: string | undefined = undefined;

      // 2. Generate Word doc if requested
      if (attachDocx && entries.length > 0) {
        try {
          const docxResult = await exportBibliographyToDocx(entries, style, {
            ...docxOptions,
            saveToFile: false,
          });
          docxBase64 = await blobToBase64(docxResult.blob);
          docxFilename = docxResult.filename;
        } catch (docxErr) {
          console.warn('Docx packaging warning for email attachment:', docxErr);
        }
      }

      // 3. Dispatch to backend endpoint
      const response = await fetch('/api/bibliography/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: recipient.trim(),
          projectTitle: projectTitle || 'ชุดบรรณานุกรมงานวิจัย',
          citationStyle: getStyleDisplayName(style),
          itemsCount: entries.length,
          formattedText: plainTextList,
          formattedHtml: htmlList,
          docxBase64,
          docxFilename,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการส่งอีเมล');
      }

      setSendResult({
        success: true,
        recipient: data.recipient || recipient,
        messageId: data.messageId,
        previewUrl: data.previewUrl,
        timestamp: data.timestamp,
      });
    } catch (err: any) {
      console.error('Email send failed:', err);
      setErrorMsg(err.message || 'ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                ส่งเอกสารบรรณานุกรมไปยังอีเมล
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ส่งเอกสารฉบับสมบูรณ์ตรงสู่กล่องจดหมายของคุณทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Summary Box */}
          <div className="bg-blue-50/70 dark:bg-slate-900/60 p-3.5 rounded-xl border border-blue-100 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">ชื่อโครงงาน:</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[240px]">
                {projectTitle || 'ชุดบรรณานุกรมงานวิจัย'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">รูปแบบการอ้างอิง:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {getStyleDisplayName(style)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">จำนวนรายการ:</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {entries.length} รายการ
              </span>
            </div>
          </div>

          {/* Form fields */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              อีเมลปลายทาง (ส่งไปยังอีเมลที่สมัครใช้งาน)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="เช่น your-email@domain.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              ระบบดึงอีเมลที่เข้าสู่ระบบมาให้โดยอัตโนมัติ และคุณสามารถเปลี่ยนเป็นอีเมลอื่นได้
            </p>
          </div>

          {/* Attachment Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
               onClick={() => setAttachDocx(!attachDocx)}>
            <input
              type="checkbox"
              id="attachDocx"
              checked={attachDocx}
              onChange={(e) => setAttachDocx(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="attachDocx" className="text-xs text-slate-700 dark:text-slate-200 cursor-pointer flex-1">
              <span className="font-semibold block">แนบไฟล์เอกสาร Microsoft Word (*.docx)</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                จัดหน้ากระดาษ กั้นหน้ากั้นหลัง และฟอนต์มาตรฐาน TH Sarabun New / Times New Roman
              </span>
            </label>
            <Paperclip className="w-4 h-4 text-blue-500 shrink-0" />
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success result box */}
          {sendResult && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>จัดส่งเอกสารบรรณานุกรมเรียบร้อยแล้ว!</span>
              </div>
              <p className="text-emerald-700 dark:text-emerald-300">
                ระบบได้ส่งรายการบรรณานุกรมไปยัง <strong>{sendResult.recipient}</strong> แล้ว
              </p>
              {sendResult.previewUrl && (
                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/80">
                  <a
                    href={sendResult.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium hover:underline text-xs"
                  >
                    <span>คลิกเพื่อดูตัวอย่างอีเมลที่จัดส่ง (Test Inbox Preview)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {sendResult ? 'ปิดหน้าต่าง' : 'ยกเลิก'}
          </button>
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={isSending || entries.length === 0}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังส่งอีเมล...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>ส่งไปยังอีเมลทันที</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
