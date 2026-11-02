import React from 'react';
import { UserX, Mail, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const SuspendedNotice: React.FC = () => {
  const { user, signOutUser } = useAuth();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-rose-200 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2 font-sarabun">
          บัญชีของคุณถูกระงับการใช้งานชั่วคราว
        </h2>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed font-sarabun">
          บัญชีผู้ใช้งาน ({user?.email}) ถูกระงับการเข้าถึงโดยผู้ดูแลระบบ
          หากคุณเชื่อว่านี่เป็นข้อผิดพลาด หรือต้องการยื่นคำร้องขอปลดการระงับบัญชี
          กรุณาติดต่อผู้ดูแลระบบหลักทางอีเมลด้านล่าง
        </p>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-xs text-slate-700 flex items-center justify-center gap-2">
          <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-semibold select-all">nonenapatnunwipat@gmail.com</span>
        </div>

        <div className="flex flex-col gap-2">
          <a
            href="mailto:nonenapatnunwipat@gmail.com?subject=คำร้องขอปลดการระงับการใช้งานระบบ AutoBiblio"
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>ติดต่อผู้ดูแลระบบ</span>
          </a>

          <button
            onClick={() => signOutUser()}
            className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
