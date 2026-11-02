import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  BookOpen,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Database,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Globe,
} from 'lucide-react';

export default function AuthGate() {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    loginAsGuestOrDirect,
    resetPassword,
    authError,
    clearAuthError,
  } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const [mode, setMode] = useState<'options' | 'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  // Google Login Handler
  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearAuthError();
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setLocalError(
        err.message ||
          t(
            'ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง หรือเข้าสู่ระบบด้วยอีเมล/รหัสผ่าน',
            'Unable to sign in with Google. Please try again or sign in with email and password.'
          )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Direct 1-Click Access as Guest Researcher (Strictly Member role only)
  const handleDirectGuest = () => {
    const targetEmail =
      email.trim() && !email.toLowerCase().includes('nonenapatnunwipat')
        ? email.trim()
        : 'guest.researcher@academic.biblio';
    loginAsGuestOrDirect(
      targetEmail,
      t('นักวิจัยทดลองใช้งาน (Guest)', 'Guest Researcher')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!email.trim() || !email.includes('@')) {
      setLocalError(
        t(
          'กรุณากรอกอีเมลที่ถูกต้อง (เช่น yourname@domain.com)',
          'Please enter a valid email address (e.g., yourname@domain.com)'
        )
      );
      return;
    }

    if (mode === 'forgot') {
      setIsLoading(true);
      try {
        await resetPassword(email);
        setResetSuccess(true);
      } catch (err: any) {
        setLocalError(
          err.message ||
            t('ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้', 'Unable to send password reset link')
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password) {
      setLocalError(
        t(
          'กรุณากรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)',
          'Please enter your password (at least 6 characters)'
        )
      );
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setLocalError(
          t(
            'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร',
            'Password must be at least 6 characters long'
          )
        );
        return;
      }
      if (password !== confirmPassword) {
        setLocalError(
          t('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน', 'Passwords do not match')
        );
        return;
      }

      setIsLoading(true);
      try {
        await signUpWithEmail(email, password, displayName);
      } catch (err: any) {
        setLocalError(
          err.message ||
            t(
              'ไม่สามารถสมัครสมาชิกได้ หากมีบัญชีอยู่แล้วกรุณากดแท็บเข้าสู่ระบบ',
              'Unable to sign up. If you already have an account, please switch to the Sign In tab.'
            )
        );
      } finally {
        setIsLoading(false);
      }
    } else if (mode === 'signin') {
      setIsLoading(true);
      try {
        await signInWithEmail(email, password);
      } catch (err: any) {
        setLocalError(
          err.message ||
            t(
              'ไม่สามารถเข้าสู่ระบบได้ หากยังไม่เคยสมัคร กรุณากดแท็บสมัครสมาชิก หรือเข้าสู่ระบบด้วย Google',
              'Unable to sign in. If you are a new user, please switch to Sign Up or use Google Sign-In.'
            )
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const sharedAppUrl = 'https://ais-pre-dwwjjwuaqwkmkdisj62ybg-606321766845.asia-northeast1.run.app';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-lg bg-slate-800/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 z-10">
        {/* Language Switcher Top Row */}
        <div className="flex items-center justify-end mb-3">
          <div
            className="inline-flex items-center p-0.5 rounded-xl bg-slate-900/90 border border-slate-700 shadow-xs"
            role="group"
            aria-label="Language Switcher"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400 ml-2 mr-1 shrink-0" />
            <button
              type="button"
              onClick={() => setLang('th')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                lang === 'th'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              TH ภาษาไทย
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                lang === 'en'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN English
            </button>
          </div>
        </div>

        {/* Header Branding: Line 1 = Icon + Full App Name on the same row, Line 2 = The rest */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2.5 sm:gap-3 mb-2">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/25 shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-white font-sarabun text-left leading-snug">
              {t(
                'ระบบจัดการบรรณานุกรมสำหรับงานวิจัยและวิทยานิพนธ์',
                'Academic Bibliography Management System for Research & Thesis'
              )}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-medium font-sarabun text-center mt-1">
            {t(
              '(รองรับ APA 6/7, MLA, Chicago, Vancouver, Harvard • ค้นหา Google Search Grounding • ส่งออก Word & อีเมล)',
              '(Supports APA 6/7, MLA, Chicago, Vancouver, Harvard • Google Search Grounding • Word & Email Export)'
            )}
          </p>
        </div>

        {/* Feature Highlights: 3 equal, symmetrical, matching cards */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <div className="flex flex-col items-center justify-center text-center p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 min-h-[72px] shadow-xs">
            <Database className="w-4.5 h-4.5 text-emerald-400 mb-1.5 shrink-0" />
            <span className="font-bold text-white text-xs leading-tight">
              {t('ฐานข้อมูลคลาวด์', 'Cloud Database')}
            </span>
            <span className="text-[11px] text-slate-300 mt-0.5">
              {t('บันทึกอัตโนมัติ', 'Auto-Saved')}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 min-h-[72px] shadow-xs">
            <ShieldCheck className="w-4.5 h-4.5 text-blue-400 mb-1.5 shrink-0" />
            <span className="font-bold text-white text-xs leading-tight">
              {t('ระบบสมาชิก', 'Member System')}
            </span>
            <span className="text-[11px] text-slate-300 mt-0.5">
              {t('ปลอดภัยสูง', 'High Security')}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 min-h-[72px] shadow-xs">
            <Mail className="w-4.5 h-4.5 text-amber-400 mb-1.5 shrink-0" />
            <span className="font-bold text-white text-xs leading-tight">
              {t('ส่งออก Word', 'Word Export')}
            </span>
            <span className="text-[11px] text-slate-300 mt-0.5">
              {t('ส่งตรงถึงอีเมล', 'Direct to Email')}
            </span>
          </div>
        </div>

        {/* Active Error Notice */}
        {(localError || authError) && (
          <div className="mb-5 p-3.5 bg-rose-950/80 border border-rose-600/70 rounded-xl text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-medium">{localError || authError}</span>
              <p className="text-[11px] text-rose-300/90">
                {t(
                  '👉 คำแนะนำ: หากยังไม่มีรหัสผ่าน สามารถกดแท็บ "สมัครสมาชิกใหม่" หรือใช้ปุ่ม "เข้าสู่ระบบด้วย Google" ได้ทันที',
                  '👉 Tip: If you are a new user, click the "Sign Up" tab or use "Sign in with Google" above.'
                )}
              </p>
            </div>
          </div>
        )}

        {/* Reset Success Notice */}
        {resetSuccess && (
          <div className="mb-4 p-3 bg-emerald-950/70 border border-emerald-600/60 rounded-lg text-emerald-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              {t(
                'ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลของท่านเรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมาย',
                'Password reset link has been sent to your email. Please check your inbox.'
              )}
            </span>
          </div>
        )}

        {/* PRIMARY RECOMMENDED LOGIN OPTIONS */}
        <div className="space-y-3 mb-6">
          {/* Google Sign-In with Official Firebase Auth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-800 font-medium text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer border border-slate-300 group"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <div className="text-left">
                  <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                    {t('เข้าสู่ระบบด้วย Google (Sign in with Google)', 'Sign in with Google')}
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    {t(
                      'รวดเร็ว ปลอดภัย และยืนยันตัวตนอัตโนมัติ',
                      'Fast, secure, and automatic authentication'
                    )}
                  </div>
                </div>
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/70" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-800 px-3 text-slate-400 font-medium">
              {t('หรือเข้าสู่ระบบด้วยอีเมล / รหัสผ่าน', 'Or sign in with Email / Password')}
            </span>
          </div>
        </div>

        {/* Email Tabs */}
        <div className="flex rounded-lg bg-slate-900/80 p-1 mb-5 border border-slate-700/50">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setLocalError(null);
              clearAuthError();
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('เข้าสู่ระบบ', 'Sign In')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setLocalError(null);
              clearAuthError();
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('สมัครสมาชิกใหม่', 'Sign Up')}
          </button>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('ชื่อผู้ใช้งาน / ชื่อนักวิจัย', 'Full Name / Researcher Name')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('เช่น นภัทร นันวิพัทธ์', 'e.g., Napat Nunwipat')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('อีเมล (Email)', 'Email Address')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                required
                placeholder={t('เช่น nonenapatnunwipat@gmail.com', 'e.g., nonenapatnunwipat@gmail.com')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  {t('รหัสผ่าน', 'Password')}
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setResetSuccess(false);
                      setLocalError(null);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    {t('ลืมรหัสผ่าน?', 'Forgot Password?')}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder={t('รหัสผ่านอย่างน้อย 6 ตัวอักษร', 'At least 6 characters')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('ยืนยันรหัสผ่านอีกครั้ง', 'Confirm Password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder={t('กรอกรหัสผ่านซ้ำอีกครั้ง', 'Re-enter your password')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium text-xs sm:text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === 'signin' ? (
              <>
                <span>{t('เข้าสู่ระบบด้วยอีเมล', 'Sign In with Email')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : mode === 'signup' ? (
              <>
                <span>{t('ยืนยันการสมัครสมาชิก', 'Create Account')}</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>{t('ส่งลิงก์รีเซ็ตรหัสผ่าน', 'Send Password Reset Link')}</span>
                <Mail className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {mode === 'forgot' && (
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setResetSuccess(false);
                setLocalError(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {t('← กลับไปหน้าเข้าสู่ระบบ', '← Back to Sign In')}
            </button>
          </div>
        )}

        {/* Guest Alternative Button */}
        <div className="mt-4 pt-4 border-t border-slate-700/60 text-center">
          <button
            type="button"
            onClick={handleDirectGuest}
            disabled={isLoading}
            className="w-full py-2 px-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-600/70 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {t(
                'เข้าใช้งานทั่วไป (Guest Researcher Mode)',
                'Continue as Guest Researcher (Instant Access)'
              )}
            </span>
          </button>
        </div>

        {/* Troubleshooting Accordion */}
        <div className="mt-4 pt-3 border-t border-slate-700/50">
          <button
            type="button"
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <HelpCircle className="w-3.5 h-3.5" />
              {t(
                'เข้าระบบไม่ได้ ทำอย่างไร? (วิธีแก้ปัญหา)',
                'Trouble signing in? (Troubleshooting Guide)'
              )}
            </span>
            {showTroubleshooting ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showTroubleshooting && (
            <div className="mt-2.5 p-3 bg-slate-900/80 rounded-xl border border-slate-700/70 text-xs text-slate-300 space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-bold text-blue-400">
                  {t('วิธีที่ 1 (แนะนำ):', 'Option 1 (Recommended):')}
                </span>
                <span>
                  {t(
                    'กดปุ่มสีขาว "เข้าสู่ระบบด้วย Google" เพื่อยืนยันตัวตนด้วยบัญชี Google ของท่านทันทีโดยไม่ต้องจำรหัสผ่าน',
                    'Click "Sign in with Google" to authenticate immediately with your Google account without needing a password.'
                  )}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-indigo-400">
                  {t('วิธีที่ 2 (สำหรับผู้ใช้ใหม่):', 'Option 2 (New Users):')}
                </span>
                <span>
                  {t(
                    'หากยังไม่เคยสมัคร ให้กดแท็บ "สมัครสมาชิกใหม่" กรอกอีเมลและตั้งรหัสผ่าน 6 ตัวขึ้นไปเพื่อสร้างบัญชี',
                    'Switch to the "Sign Up" tab, enter your email and create a password (6+ characters).'
                  )}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-emerald-400">
                  {t('วิธีที่ 3 (ลืมรหัสผ่าน):', 'Option 3 (Forgot Password):')}
                </span>
                <span>
                  {t(
                    'หากจำรหัสผ่านไม่ได้ ให้กด "ลืมรหัสผ่าน?" เพื่อรับลิงก์รีเซ็ตรหัสผ่านทางอีเมล',
                    'Click "Forgot Password?" to receive a password reset link via email.'
                  )}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {t('กรณีหน้าต่างถูกบล็อก:', 'If popup is blocked:')}
                </span>
                <a
                  href={sharedAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-300 hover:text-indigo-200 underline"
                >
                  <span>{t('เปิดแอปในหน้าต่างใหม่ (New Tab)', 'Open App in New Tab')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-xs text-slate-400 max-w-md space-y-2 font-sarabun">
        <p className="text-slate-500">
          {t(
            'ระบบจัดเก็บบรรณานุกรมงานวิจัยและวิทยานิพนธ์ รองรับมาตรฐานสากล เชื่อมต่อฐานข้อมูลคลาวด์อัตโนมัติ ส่งออก Word (.docx) และส่งตรงสู่อีเมลของคุณตลอดเวลา',
            'Academic Bibliography Management System supporting international citation standards, real-time Cloud Firestore storage, Word (.docx) export, and direct email delivery.'
          )}
        </p>
        <p className="pt-2 border-t border-slate-800 text-slate-300 flex items-center justify-center gap-1.5 flex-wrap">
          <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>
            {t('ติดต่อสอบถามรายละเอียดเพิ่มเติมได้ที่', 'For more information, contact')}
          </span>
          <a
            href="mailto:nonenapatnunwipat@gmail.com"
            className="font-bold text-indigo-300 hover:text-indigo-200 underline decoration-indigo-400/50 underline-offset-4 transition-colors"
          >
            nonenapatnunwipat@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}

