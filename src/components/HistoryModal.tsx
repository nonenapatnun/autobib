import React, { useState } from 'react';
import {
  X,
  History,
  RotateCcw,
  Trash2,
  Copy,
  FileDown,
  Plus,
  Calendar,
  CheckCircle2,
  Search,
  BookMarked,
  Sparkles,
  Download,
  Upload,
  FolderOpen,
  Edit3
} from 'lucide-react';
import { BibliographyProject } from '../types/history';
import { exportBibliographyToDocx } from '../utils/exportDocx';
import { getDocxFromCache, exportBackupJson, importBackupJson } from '../utils/storage/projectHistoryStorage';
import { saveAs } from 'file-saver';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: BibliographyProject[];
  currentProjectId: string;
  onLoadProject: (project: BibliographyProject) => void;
  onCreateNewProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (project: BibliographyProject) => void;
  onUpdateProjectTitle: (projectId: string, newTitle: string) => void;
  onImportBackup: (importedProjects: BibliographyProject[]) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onLoadProject,
  onCreateNewProject,
  onDeleteProject,
  onDuplicateProject,
  onUpdateProjectTitle,
  onImportBackup
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.citationStyle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.entries.some((e) => e.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStartRename = (project: BibliographyProject) => {
    setEditingId(project.id);
    setEditingTitle(project.title);
  };

  const handleSaveRename = (projectId: string) => {
    if (editingTitle.trim()) {
      onUpdateProjectTitle(projectId, editingTitle.trim());
    }
    setEditingId(null);
  };

  // Instant download of docx for a historical project
  const handleDownloadDocx = async (project: BibliographyProject) => {
    setDownloadingId(project.id);
    try {
      // First check if cached docx blob exists in IndexedDB
      const cached = await getDocxFromCache(project.id);
      if (cached && cached.blob) {
        saveAs(cached.blob, cached.filename || `Bibliography_${project.title}.docx`);
      } else {
        // Generate on the fly
        await exportBibliographyToDocx(project.entries, project.citationStyle, {
          title: project.title
        });
      }
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลดเอกสาร Word');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportBackupJson(projects);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const dateStr = new Date().toISOString().split('T')[0];
    saveAs(blob, `AutoBiblio_Backup_${dateStr}.json`);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const imported = importBackupJson(raw);
        onImportBackup(imported);
        alert(`กู้คืนข้อมูลสำเร็จ นำเข้าทั้งหมด ${imported.length} ชุดโครงงาน`);
      } catch (err: any) {
        alert(err.message || 'ไม่สามารถนำเข้าข้อมูลสำรองได้');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                ประวัติบรรณานุกรมและเอกสารที่เคยจัดทำ (History & Saved Projects)
              </h2>
              <p className="text-xs text-slate-500">
                ระบบจัดเก็บข้อมูลและไฟล์เอกสารอัตโนมัติ สามารถดึงกลับมาแก้ไข ปรับปรุง หรือดาวน์โหลดได้ตลอดเวลา
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

        {/* Toolbar: Search, Create New, Backup */}
        <div className="px-6 py-3 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อชุดบรรณานุกรม หรือชื่อบทความ..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onCreateNewProject();
                onClose();
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>สร้างชุดใหม่ (New)</span>
            </button>

            <button
              onClick={handleDownloadBackup}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="ส่งออกไฟล์สำรองทั้งหมด (JSON Backup)"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">สำรองข้อมูล</span>
            </button>

            <label
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="กู้คืนข้อมูลสำรองจากไฟล์ JSON"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">กู้คืน</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Project List Content */}
        <div className="p-6 overflow-y-auto space-y-3.5 text-sm text-slate-700 flex-1">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <BookMarked className="w-12 h-12 mx-auto opacity-40" />
              <p className="font-medium text-slate-600">ไม่พบประวัติบรรณานุกรมที่ตรงกับการค้นหา</p>
              <p className="text-xs">ชุดข้อมูลที่คุณสร้างหรือแก้ไขจะถูกบันทึกประวัติไว้ที่นี่อัตโนมัติ</p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const isCurrent = project.id === currentProjectId;
              const isEditing = editingId === project.id;

              return (
                <div
                  key={project.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-200/50 shadow-xs'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Title & Metadata */}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            กำลังเปิดใช้งาน
                          </span>
                        )}

                        <span className="font-mono uppercase font-bold text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                          {project.citationStyle}
                        </span>

                        <span className="text-xs text-slate-500 font-medium">
                          {project.entries.length} รายการ
                        </span>

                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(project.updatedAt)}
                        </span>
                      </div>

                      {/* Title Edit or View */}
                      {isEditing ? (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(project.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                            className="p-1 px-2 text-sm font-bold border border-indigo-400 rounded-lg outline-hidden w-full max-w-md bg-white"
                          />
                          <button
                            onClick={() => handleSaveRename(project.id)}
                            className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
                          >
                            บันทึก
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 text-slate-500 text-xs hover:bg-slate-100 rounded-lg"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pt-0.5">
                          <h3
                            onClick={() => handleStartRename(project)}
                            className="font-bold text-slate-900 text-base hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1.5 group"
                            title="คลิกเพื่อแก้ไขชื่อชุดบรรณานุกรม"
                          >
                            <span>{project.title}</span>
                            <Edit3 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </h3>
                        </div>
                      )}

                      {/* First 2 citation titles snippet */}
                      {project.entries.length > 0 && (
                        <p className="text-xs text-slate-500 line-clamp-1 italic pt-0.5 font-sarabun">
                          ตัวอย่าง: {project.entries.slice(0, 2).map((e) => e.title).join(' • ')}
                          {project.entries.length > 2 && ' ...'}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {!isCurrent && (
                        <button
                          onClick={() => {
                            onLoadProject(project);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          title="ดึงชุดข้อมูลนี้กลับมาแสดงและแก้ไขในระบบ"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>ดึงกลับมาแก้ไข</span>
                        </button>
                      )}

                      {/* Download Word Docx */}
                      <button
                        onClick={() => handleDownloadDocx(project)}
                        disabled={downloadingId === project.id || project.entries.length === 0}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold flex items-center gap-1 border border-blue-200/80 transition-colors cursor-pointer disabled:opacity-40"
                        title="ดาวน์โหลดไฟล์เอกสาร Word (.docx) ของชุดนี้"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">
                          {downloadingId === project.id ? 'กำลังสร้าง...' : 'โหลด Word'}
                        </span>
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={() => onDuplicateProject(project)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        title="ทำสำเนาชุดบรรณานุกรมนี้"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (
                            confirm(`คุณต้องการลบชุดบรรณานุกรม "${project.title}" ใช่หรือไม่?`)
                          ) {
                            onDeleteProject(project.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="ลบชุดบรรณานุกรม"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl text-xs text-slate-500">
          <span>รวมทั้งหมด {projects.length} ชุดโครงงานบันทึกในเบราว์เซอร์</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
