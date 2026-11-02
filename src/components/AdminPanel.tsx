import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  FolderGit2,
  Calendar,
  Clock,
  Mail,
  AlertTriangle,
  X,
  Check,
  ArrowUpDown,
  BookOpen,
  Building,
  FileText,
  BadgeAlert,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { UserMember, UserRole, UserStatus } from '../types/member';
import {
  fetchAllMembers,
  updateMemberRole,
  updateMemberStatus,
  updateMemberProfile,
  addMemberManual,
  deleteMember,
  fetchMemberBibliographies,
} from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import { BibliographyProject } from '../types/history';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const { user: currentAuthUser, refreshUserProfile } = useAuth();
  const [members, setMembers] = useState<UserMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'lastLogin' | 'biblios'>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<UserMember | null>(null);
  const [inspectingMember, setInspectingMember] = useState<UserMember | null>(null);
  const [inspectingProjects, setInspectingProjects] = useState<BibliographyProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // New Member form state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('member');
  const [newNote, setNewNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await fetchAllMembers();
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members:', err);
      showToast('ไม่สามารถโหลดข้อมูลสมาชิกได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === 'active').length;
    const suspended = members.filter((m) => m.status === 'suspended').length;
    const admins = members.filter((m) => m.role === 'admin').length;
    const totalBiblios = members.reduce((sum, m) => sum + (m.bibliographyCount || 0), 0);
    return { total, active, suspended, admins, totalBiblios };
  }, [members]);

  // Filtered & Sorted Members
  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesQuery =
          !query ||
          (m.email && m.email.toLowerCase().includes(query)) ||
          (m.displayName && m.displayName.toLowerCase().includes(query)) ||
          (m.department && m.department.toLowerCase().includes(query)) ||
          (m.note && m.note.toLowerCase().includes(query));

        const matchesRole = roleFilter === 'all' || m.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

        return matchesQuery && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
          comparison = (a.displayName || '').localeCompare(b.displayName || '', 'th');
        } else if (sortBy === 'lastLogin') {
          const timeA = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
          const timeB = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
          comparison = timeA - timeB;
        } else if (sortBy === 'biblios') {
          comparison = (a.bibliographyCount || 0) - (b.bibliographyCount || 0);
        } else {
          // createdAt
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          comparison = timeA - timeB;
        }
        return sortAsc ? comparison : -comparison;
      });
  }, [members, searchQuery, roleFilter, statusFilter, sortBy, sortAsc]);

  // Actions
  const handleToggleStatus = async (member: UserMember) => {
    if (member.email === 'nonenapatnunwipat@gmail.com') {
      alert('ไม่สามารถระงับบัญชีผู้ดูแลระบบหลัก (Super Admin) ได้');
      return;
    }
    const newStatus: UserStatus = member.status === 'active' ? 'suspended' : 'active';
    const actionText = newStatus === 'suspended' ? 'ระงับการใช้งาน' : 'ปลดการระงับการใช้งาน';
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการ${actionText} สมาชิก "${member.displayName || member.email}"?`)) {
      return;
    }

    try {
      await updateMemberStatus(member.uid, newStatus);
      setMembers((prev) =>
        prev.map((m) => (m.uid === member.uid ? { ...m, status: newStatus } : m))
      );
      showToast(`${actionText} "${member.displayName || member.email}" สำเร็จแล้ว`);
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  const handleToggleRole = async (member: UserMember) => {
    if (member.email === 'nonenapatnunwipat@gmail.com') {
      alert('ผู้ดูแลระบบหลัก (Super Admin) จะต้องคงสถานะ Admin เสมอ');
      return;
    }
    const newRole: UserRole = member.role === 'admin' ? 'member' : 'admin';
    const roleText = newRole === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'สมาชิกทั่วไป (Member)';
    if (!confirm(`ต้องการเปลี่ยนบทบาทของ "${member.displayName || member.email}" เป็น "${roleText}" หรือไม่?`)) {
      return;
    }

    try {
      await updateMemberRole(member.uid, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.uid === member.uid ? { ...m, role: newRole } : m))
      );
      showToast(`เปลี่ยนบทบาทเป็น ${roleText} สำเร็จ`);
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  const handleDeleteMember = async (member: UserMember) => {
    if (member.email === 'nonenapatnunwipat@gmail.com') {
      alert('ไม่สามารถลบบัญชีผู้ดูแลระบบหลัก (Super Admin) ได้');
      return;
    }
    if (member.uid === currentAuthUser?.uid) {
      alert('ไม่สามารถลบบัญชีของตัวคุณเองที่กำลังใช้งานอยู่ได้');
      return;
    }

    if (!confirm(`ยืนยันการลบสมาชิก "${member.displayName || member.email}" ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
      return;
    }

    try {
      await deleteMember(member.uid);
      setMembers((prev) => prev.filter((m) => m.uid !== member.uid));
      showToast(`ลบสมาชิก "${member.displayName || member.email}" สำเร็จ`);
    } catch (err: any) {
      alert(`ไม่สามารถลบสมาชิกได้: ${err.message}`);
    }
  };

  const handleInspectProjects = async (member: UserMember) => {
    setInspectingMember(member);
    setLoadingProjects(true);
    try {
      const projects = await fetchMemberBibliographies(member.uid);
      setInspectingProjects(projects);
    } catch (err) {
      console.error(err);
      setInspectingProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newEmail.trim() || !newEmail.includes('@')) {
      setFormError('กรุณากรอกอีเมลที่ถูกต้อง');
      return;
    }

    if (members.some((m) => m.email?.toLowerCase() === newEmail.trim().toLowerCase())) {
      setFormError('อีเมลนี้มีอยู่ในระบบแล้ว');
      return;
    }

    setSubmitting(true);
    try {
      const added = await addMemberManual({
        email: newEmail.trim(),
        displayName: newName.trim() || newEmail.split('@')[0],
        department: newDepartment.trim(),
        role: newRole,
        status: 'active',
        note: newNote.trim(),
        createdAt: new Date().toISOString(),
      });
      setMembers((prev) => [added, ...prev]);
      setIsAddModalOpen(false);
      setNewEmail('');
      setNewName('');
      setNewDepartment('');
      setNewNote('');
      setNewRole('member');
      showToast(`เพิ่มสมาชิก "${added.displayName}" ในระบบเรียบร้อย`);
    } catch (err: any) {
      setFormError(err.message || 'เกิดข้อผิดพลาดในการเพิ่มสมาชิก');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setSubmitting(true);
    try {
      await updateMemberProfile(editingMember.uid, {
        displayName: editingMember.displayName,
        department: editingMember.department,
        note: editingMember.note,
        role: editingMember.role,
        status: editingMember.status,
      });

      setMembers((prev) =>
        prev.map((m) => (m.uid === editingMember.uid ? editingMember : m))
      );
      if (editingMember.uid === currentAuthUser?.uid) {
        await refreshUserProfile();
      }
      setEditingMember(null);
      showToast('บันทึกการแก้ไขข้อมูลสมาชิกสำเร็จ');
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs sm:text-sm font-medium flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Shield className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  ระบบจัดการสมาชิก (Member Administration)
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  สิทธิ์ผู้ดูแลระบบ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ตรวจสอบรายชื่อสมาชิก กำหนดสิทธิ์ผู้ดูแลระบบ (Admin) ควบคุมการใช้งาน และดูสถิติบรรณานุกรม
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadMembers}
              disabled={loading}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="รีเฟรชข้อมูลสมาชิก"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="ปิดหน้าต่างจัดการสมาชิก"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>สมาชิกทั้งหมด</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800">{stats.total} คน</div>
            <div className="text-[11px] text-slate-400 mt-0.5">ในฐานข้อมูลคลาวด์</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-emerald-600 text-xs mb-1 font-medium">
              <span>เปิดใช้งานปกติ</span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-700">{stats.active} คน</div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">Active Account</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-rose-600 text-xs mb-1 font-medium">
              <span>ระงับการใช้งาน</span>
              <UserX className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-rose-700">{stats.suspended} คน</div>
            <div className="text-[11px] text-rose-600/80 mt-0.5">Suspended Account</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-indigo-600 text-xs mb-1 font-medium">
              <span>ผู้ดูแลระบบ (Admin)</span>
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-indigo-700">{stats.admins} ท่าน</div>
            <div className="text-[11px] text-indigo-600/80 mt-0.5">รวม Super Admin</div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>ชุดบรรณานุกรมรวม</span>
              <BookOpen className="w-4 h-4 text-violet-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-violet-700">{stats.totalBiblios} ชุด</div>
            <div className="text-[11px] text-violet-600/80 mt-0.5">งานวิจัยทั้งหมด</div>
          </div>
        </div>

        {/* Filter & Action Controls */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, อีเมล, สังกัด หรือหมายเหตุ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Role filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  roleFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                ทุกบทบาท
              </button>
              <button
                onClick={() => setRoleFilter('admin')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  roleFilter === 'admin' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                ผู้ดูแล (Admin)
              </button>
              <button
                onClick={() => setRoleFilter('member')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  roleFilter === 'member' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                สมาชิกทั่วไป
              </button>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                ทุกสถานะ
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                ใช้งานปกติ
              </button>
              <button
                onClick={() => setStatusFilter('suspended')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  statusFilter === 'suspended' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                ถูกระงับ
              </button>
            </div>
          </div>

          {/* Right Action: Add Member */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มสมาชิกในระบบ</span>
            </button>
          </div>
        </div>

        {/* Members Table */}
        <div className="flex-1 overflow-auto bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
              <p className="text-sm font-medium">กำลังโหลดรายชื่อสมาชิกจากฐานข้อมูล...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Users className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-base font-semibold text-slate-600">ไม่พบรายชื่อสมาชิกที่ตรงกับเงื่อนไข</p>
              <p className="text-xs text-slate-400 mt-1">ลองล้างคำค้นหาหรือเปลี่ยนตัวกรองบทบาทและสถานะ</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">สมาชิก / ผู้ใช้งาน</th>
                  <th className="py-3 px-3">บทบาท (Role)</th>
                  <th className="py-3 px-3">สถานะบัญชี</th>
                  <th className="py-3 px-3 hidden lg:table-cell">สังกัด / คณะ / หน่วยงาน</th>
                  <th className="py-3 px-3 text-center">ชุดบรรณานุกรม</th>
                  <th className="py-3 px-3 hidden md:table-cell">ลงทะเบียน / ใช้งานล่าสุด</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredMembers.map((member) => {
                  const isSuperAdmin = member.email === 'nonenapatnunwipat@gmail.com';
                  const isCurrent = member.uid === currentAuthUser?.uid;

                  return (
                    <tr
                      key={member.uid}
                      className={`hover:bg-slate-50 transition-colors ${
                        member.status === 'suspended' ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                              member.role === 'admin'
                                ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {(member.displayName || member.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-900 text-xs">
                                {member.displayName || 'ไม่มีชื่อระบุ'}
                              </span>
                              {isSuperAdmin && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  Super Admin
                                </span>
                              )}
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                                  บัญชีของคุณ
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[190px] sm:max-w-xs">{member.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge & Toggle */}
                      <td className="py-3 px-3">
                        {isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <Shield className="w-3 h-3 text-indigo-600" />
                            <span>ผู้ดูแลระบบหลัก</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleRole(member)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                              member.role === 'admin'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                            title="คลิกเพื่อสลับบทบาท ผู้ดูแลระบบ / สมาชิกทั่วไป"
                          >
                            {member.role === 'admin' ? (
                              <>
                                <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                <span>ผู้ดูแล (Admin)</span>
                              </>
                            ) : (
                              <>
                                <Users className="w-3 h-3 text-slate-500" />
                                <span>สมาชิกทั่วไป</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>

                      {/* Status Badge & Toggle */}
                      <td className="py-3 px-3">
                        {isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>ใช้งานตลอด</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(member)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                              member.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                            title="คลิกเพื่อสลับสถานะบัญชี (ระงับ / ปลดระงับ)"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                member.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            <span>{member.status === 'active' ? 'ใช้งานปกติ' : 'ระงับชั่วคราว'}</span>
                          </button>
                        )}
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3 hidden lg:table-cell text-slate-600">
                        <div className="flex items-center gap-1 text-[11px]">
                          {member.department ? (
                            <>
                              <Building className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[160px]">{member.department}</span>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">ไม่ระบุสังกัด</span>
                          )}
                        </div>
                        {member.note && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5">
                            โน้ต: {member.note}
                          </div>
                        )}
                      </td>

                      {/* Bibliographies Count */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleInspectProjects(member)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 font-semibold border border-violet-200/80 transition-colors cursor-pointer"
                          title="คลิกเพื่อดูรายการชุดบรรณานุกรมของสมาชิกท่านนี้"
                        >
                          <BookOpen className="w-3 h-3 text-violet-500" />
                          <span>{member.bibliographyCount || 0} ชุด</span>
                        </button>
                      </td>

                      {/* Registration & Last Login */}
                      <td className="py-3 px-3 hidden md:table-cell text-[11px] text-slate-500">
                        <div>
                          สมัคร: {new Date(member.createdAt).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: '2-digit',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ล่าสุด:{' '}
                          {member.lastLoginAt
                            ? new Date(member.lastLoginAt).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'ยังไม่เคยเข้า'}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingMember({ ...member })}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="แก้ไขข้อมูลสมาชิก"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {!isSuperAdmin && !isCurrent && (
                            <button
                              onClick={() => handleDeleteMember(member)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="ลบสมาชิกออกจากระบบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            แสดงสมาชิก <span className="font-semibold text-slate-800">{filteredMembers.length}</span> จากทั้งหมด{' '}
            <span className="font-semibold text-slate-800">{members.length}</span> คน
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors cursor-pointer"
          >
            ปิดหน้าระบบจัดการ
          </button>
        </div>
      </div>

      {/* --- Sub Modal: Add Member --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">เพิ่มสมาชิกใหม่ในระบบ</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <BadgeAlert className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddMemberSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  อีเมลสมาชิก (จำเป็น) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="เช่น researcher@university.ac.th"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  ชื่อ-นามสกุล / ตำแหน่งวิชาการ
                </label>
                <input
                  type="text"
                  placeholder="เช่น ดร.กฤษดา มั่นคง"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  คณะ / ภาควิชา / สังกัด
                </label>
                <input
                  type="text"
                  placeholder="เช่น คณะวิทยาศาสตร์ ภาควิชาเคมี"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  บทบาทเริ่มต้น
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="member">สมาชิกทั่วไป (Member)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  หมายเหตุ / บันทึกภายในสำหรับ Admin
                </label>
                <textarea
                  rows={2}
                  placeholder="เช่น ผู้ได้รับทุนวิจัยปี 2568, อนุมัติสิทธิ์เข้าใช้งาน"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกสมาชิกใหม่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Sub Modal: Edit Member --- */}
      {editingMember && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">แก้ไขข้อมูลสมาชิก</h3>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-500 mb-1">
                  อีเมล (ไม่สามารถแก้ไขได้)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingMember.email || ''}
                  className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  ชื่อ-นามสกุล / ตำแหน่ง
                </label>
                <input
                  type="text"
                  value={editingMember.displayName || ''}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, displayName: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  คณะ / ภาควิชา / สังกัด
                </label>
                <input
                  type="text"
                  value={editingMember.department || ''}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, department: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">บทบาท</label>
                  <select
                    disabled={editingMember.email === 'nonenapatnunwipat@gmail.com'}
                    value={editingMember.role}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        role: e.target.value as UserRole,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                  >
                    <option value="member">สมาชิกทั่วไป (Member)</option>
                    <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">สถานะ</label>
                  <select
                    disabled={editingMember.email === 'nonenapatnunwipat@gmail.com'}
                    value={editingMember.status}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        status: e.target.value as UserStatus,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                  >
                    <option value="active">ใช้งานปกติ (Active)</option>
                    <option value="suspended">ระงับชั่วคราว (Suspended)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  หมายเหตุ / บันทึกภายในสำหรับ Admin
                </label>
                <textarea
                  rows={2}
                  value={editingMember.note || ''}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, note: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Sub Modal: Inspect Member Bibliographies --- */}
      {inspectingMember && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                    ชุดบรรณานุกรมของ {inspectingMember.displayName || inspectingMember.email}
                  </h3>
                  <p className="text-[11px] text-slate-400">{inspectingMember.email}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingMember(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto space-y-2.5">
              {loadingProjects ? (
                <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
                  <p className="text-xs">กำลังค้นหาชุดบรรณานุกรมในคลาวด์...</p>
                </div>
              ) : inspectingProjects.length === 0 ? (
                <div className="text-center p-8 text-slate-400">
                  <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-medium text-slate-600">ยังไม่มีชุดบรรณานุกรมในบัญชีนี้</p>
                </div>
              ) : (
                inspectingProjects.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-xs truncate">
                          {p.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium uppercase text-[10px]">
                            {p.citationStyle}
                          </span>
                          <span>• {p.entries?.length || 0} รายการอ้างอิง</span>
                          <span>
                            • อัปเดตล่าสุด:{' '}
                            {new Date(p.updatedAt).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 mt-4 flex justify-end shrink-0">
              <button
                onClick={() => setInspectingMember(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
