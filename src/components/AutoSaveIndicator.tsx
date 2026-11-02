import React from 'react';
import { Cloud, Loader2, RefreshCw } from 'lucide-react';
import { AutoSaveState } from '../types/history';
import { useLanguage } from '../contexts/LanguageContext';

interface AutoSaveIndicatorProps {
  state: AutoSaveState;
  lastSavedAt: number | null;
  onManualSave?: () => void;
  entryCount: number;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  state,
  lastSavedAt,
  onManualSave,
}) => {
  const { lang, t } = useLanguage();

  const formatTime = (ts: number | null) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString(lang === 'en' ? 'en-US' : 'th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      onClick={onManualSave}
      title={t(
        'คลิกเพื่อสั่งบันทึกข้อมูลและประวัติทันที',
        'Click to manually save bibliography and history now'
      )}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none shadow-xs ${
        state === 'saving'
          ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
          : state === 'saved'
          ? 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300 text-emerald-800'
          : 'bg-amber-50 hover:bg-amber-100/80 border-amber-300 text-amber-800'
      }`}
    >
      {state === 'saving' ? (
        <>
          <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin shrink-0" />
          <span>{t('กำลังบันทึกลงคลาวด์...', 'Saving to Cloud...')}</span>
        </>
      ) : state === 'saved' ? (
        <>
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            {t('บันทึกอัตโนมัติแล้ว', 'Auto-Saved')}{' '}
            {lastSavedAt && (
              <span className="text-emerald-700/80 font-mono text-[11px] font-normal ml-0.5">
                ({formatTime(lastSavedAt)})
              </span>
            )}
          </span>
        </>
      ) : (
        <>
          <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
          <span>{t('รอการบันทึก...', 'Pending save...')}</span>
        </>
      )}
    </div>
  );
};

