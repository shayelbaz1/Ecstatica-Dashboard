import React, { useState } from 'react';
import { CampMember } from '../types';
import { APP_VERSION } from '../version';
import {
  Flame,
  User as UserIcon,
  FileSpreadsheet,
  Calendar,
  Users,
  Car,
  MessageSquare,
  Menu,
  X,
  Sparkles,
  RefreshCw,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  activeTab: 'events' | 'members' | 'whatsapp' | 'rides' | 'sheets';
  setActiveTab: (tab: 'events' | 'members' | 'whatsapp' | 'rides' | 'sheets') => void;
  activeMember: CampMember | null;
  onOpenMemberSelector: () => void;
  googleUser: User | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  onOpenSheetsModal: () => void;
  connectedSheetId: string | null;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeMember,
  onOpenMemberSelector,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  onOpenSheetsModal,
  connectedSheetId,
  isSyncing,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#121526]/90 backdrop-blur-md border-b border-amber-500/20 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Camp Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-rose-500 to-amber-300 p-0.5 shadow-md shadow-rose-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#121526] rounded-[14px] flex items-center justify-center">
                <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5 font-['Outfit']">
                  ECSTATICA
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    מדברן 2026
                  </span>
                </h1>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.5 rounded">
                  {APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                הרשמה מהירה לימי יצירה, תזכורות וואטסאפ וסנכרון שיטס
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#1a1f36]/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'events'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
              ימי יצירה
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              תזכורות וואטסאפ
            </button>
            <button
              onClick={() => setActiveTab('rides')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'rides'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Car className="w-4 h-4 text-indigo-400" />
              טרמפים
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'members'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              חברי קמפ
            </button>
            <button
              onClick={() => setActiveTab('sheets')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'sheets'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              סנכרון Sheets
              {connectedSheetId && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </button>
          </nav>

          {/* Right Action: Active User Button & Mobile Toggle */}
          <div className="flex items-center gap-2">
            
            {/* Instant Google Sheets Auto-Sync Indicator */}
            {connectedSheetId && googleUser ? (
              <button
                onClick={onOpenSheetsModal}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs hover:bg-emerald-900/60 transition-all shadow-sm"
                title="סנכרון מיידי לאקסל פעיל! כל סימון באתר נרשם ישירות ב-Google Sheets"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold">סנכרון מיידי פעיל ⚡</span>
              </button>
            ) : (
              <button
                onClick={onOpenSheetsModal}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs hover:bg-amber-500/25 transition-all"
                title="לחץ לחבר את קובץ האקסל לסנכרון מיידי"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">חבר סנכרון מיידי לאקסל ⚡</span>
              </button>
            )}

            {/* Active Member Selection Button (Mobile-first priority) */}
            <button
              onClick={onOpenMemberSelector}
              className={`flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
                activeMember
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 hover:bg-amber-500/20'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-200 animate-bounce hover:bg-rose-500/30'
              }`}
              title="בחר את שמך להרשמה מהירה מהנייד"
            >
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <UserIcon className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block leading-tight">
                  {activeMember ? 'נרשם כ:' : 'מי את/ה?'}
                </span>
                <span className="font-bold truncate max-w-[90px] sm:max-w-[130px] block">
                  {activeMember ? activeMember.name : 'בחר פרופיל'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Google Sheets Sync status icon button */}
            <button
              onClick={onOpenSheetsModal}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center relative ${
                connectedSheetId
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-[#1b2034] border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title={connectedSheetId ? 'Google Sheets מחובר' : 'חיבור Google Sheets'}
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              {connectedSheetId && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#121526]"></span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 hover:bg-slate-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#15192c] border-b border-amber-500/20 px-4 py-3 space-y-2 animate-in slide-in-from-top duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
            <span>תפריט אקסטטיקה</span>
            <span className="font-mono text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
              גרסה: {APP_VERSION}
            </span>
          </div>

          <button
            onClick={() => {
              setActiveTab('events');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm ${
              activeTab === 'events'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white'
                : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> ימי יצירה והרשמה מהירה
            </span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded">ראשי</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('whatsapp');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" /> תזכורות וואטסאפ (1-על-1 וקבוצה)
            </span>
            <span className="text-xs bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
              העלאת אחוזי הגעה
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('rides');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm ${
              activeTab === 'rides'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Car className="w-4 h-4 text-indigo-400" /> לוח טרמפים
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('members');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm ${
              activeTab === 'members'
                ? 'bg-amber-600 text-white'
                : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" /> חברי קמפ וסטטוס (70+ חברים)
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('sheets');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm ${
              activeTab === 'sheets'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> סנכרון Google Sheets
            </span>
            {connectedSheetId && (
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
                מחובר
              </span>
            )}
          </button>

          {/* User Sign In Status in Drawer */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            {googleUser ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-slate-400 truncate max-w-[180px]">
                  מחובר: {googleUser.email}
                </span>
                <button
                  onClick={onGoogleSignOut}
                  className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> התנתק
                </button>
              </div>
            ) : (
              <button
                onClick={onGoogleSignIn}
                className="text-xs text-amber-300 hover:underline flex items-center gap-1 w-full justify-center py-1 bg-amber-500/10 rounded-lg border border-amber-500/20"
              >
                חיבור עם חשבון גוגל
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
