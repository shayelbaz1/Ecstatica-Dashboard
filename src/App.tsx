import React, { useState, useEffect } from 'react';
import { CampMember, CreationEvent, AttendanceStatus, RideOffer } from './types';
import { INITIAL_MEMBERS, INITIAL_EVENTS } from './data/initialData';
import { APP_VERSION } from './version';
import { Header } from './components/Header';
import { EventCard } from './components/EventCard';
import { MemberSelectorModal } from './components/MemberSelectorModal';
import { WhatsAppBlastModal } from './components/WhatsAppBlastModal';
import { RidesModal } from './components/RidesModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { MembersList } from './components/MembersList';
import { AddEventModal } from './components/AddEventModal';
import { initAuth, googleSignIn, logout, getAccessToken } from './services/auth';
import {
  buildSheetMapping,
  findMatchingColumnForEvent,
  updateSingleCell,
  extractSpreadsheetId,
  SheetMapping,
} from './services/sheets';
import { buildWhatsAppShareLink } from './services/whatsapp';
import { User } from 'firebase/auth';
import {
  Calendar,
  Sparkles,
  Flame,
  MessageSquare,
  Users,
  Car,
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  AlertCircle,
  Share2,
  Heart,
  Check,
  Zap,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  // Members state (persisted in localStorage)
  const [members, setMembers] = useState<CampMember[]>(() => {
    const saved = localStorage.getItem('ecstatica_members');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_MEMBERS;
  });

  // Events state (persisted in localStorage)
  const [events, setEvents] = useState<CreationEvent[]>(() => {
    const saved = localStorage.getItem('ecstatica_events');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_EVENTS;
  });

  // Active Member Identification (Mobile-first "Remember Me")
  const [activeMemberId, setActiveMemberId] = useState<string | null>(() => {
    return localStorage.getItem('ecstatica_active_member_id') || '20'; // Default to Shay Elbaz (row 22 in screenshot)
  });

  const activeMember = members.find((m) => m.id === activeMemberId) || null;

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'events' | 'members' | 'whatsapp' | 'rides' | 'sheets'>('events');

  // Modals
  const [isMemberSelectorOpen, setIsMemberSelectorOpen] = useState(false);
  const [isWhatsAppBlastOpen, setIsWhatsAppBlastOpen] = useState(false);
  const [selectedEventForBlast, setSelectedEventForBlast] = useState<CreationEvent | null>(null);
  const [isRidesOpen, setIsRidesOpen] = useState(false);
  const [selectedEventForRides, setSelectedEventForRides] = useState<CreationEvent | null>(null);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  // Google Auth & Sheets Auto-Sync
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [connectedSheetId, setConnectedSheetId] = useState<string | null>(() => {
    return localStorage.getItem('ecstatica_connected_sheet_id') || null;
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ecstatica_auto_sync') !== 'false';
  });
  const [selectedSheetTab, setSelectedSheetTab] = useState<string>(() => {
    return localStorage.getItem('ecstatica_sheet_tab') || 'ימי הקמות ויצירה 2026';
  });
  const [sheetMapping, setSheetMapping] = useState<SheetMapping | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Real-time feedback badge/toast for instant sheet updates
  const [syncToast, setSyncToast] = useState<{
    type: 'syncing' | 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const [cardSyncStatus, setCardSyncStatus] = useState<{
    eventId: string;
    status: 'syncing' | 'synced' | 'error';
    message?: string;
  } | null>(null);

  // Category filter on events tab
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>('all');

  // Quick sheet URL input on header banner
  const [quickSheetUrl, setQuickSheetUrl] = useState('');

  // Persist state
  useEffect(() => {
    localStorage.setItem('ecstatica_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('ecstatica_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    if (activeMemberId) {
      localStorage.setItem('ecstatica_active_member_id', activeMemberId);
    }
  }, [activeMemberId]);

  useEffect(() => {
    if (connectedSheetId) {
      localStorage.setItem('ecstatica_connected_sheet_id', connectedSheetId);
    } else {
      localStorage.removeItem('ecstatica_connected_sheet_id');
    }
  }, [connectedSheetId]);

  useEffect(() => {
    localStorage.setItem('ecstatica_auto_sync', String(autoSyncEnabled));
  }, [autoSyncEnabled]);

  useEffect(() => {
    localStorage.setItem('ecstatica_sheet_tab', selectedSheetTab);
  }, [selectedSheetTab]);

  // Load from Cloud SQL backend if available
  useEffect(() => {
    fetch('/api/data')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.members) && data.members.length > 0) {
          setMembers(data.members);
        }
        if (data && Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
        }
      })
      .catch((err) => {
        console.log('Using local client state (backend not yet ready or offline):', err);
      });
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setSyncToast({
          type: 'success',
          text: `חשבון גוגל מחובר בהצלחה! סנכרון חי פעיל לאקסל ⚡`,
        });
        setTimeout(() => setSyncToast(null), 4000);
      }
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      setSyncToast({
        type: 'error',
        text: 'ההתחברות לגוגל נכשלה. אנא נסה שוב.',
      });
    }
  };

  const handleGoogleSignOut = async () => {
    await logout();
    setGoogleUser(null);
    setSheetMapping(null);
  };

  // Instant Background Google Sheets Cell Update
  const triggerInstantSheetSync = async (
    member: CampMember,
    event: CreationEvent,
    status: AttendanceStatus
  ) => {
    if (!autoSyncEnabled) return;

    if (!connectedSheetId || !googleUser) {
      setSyncToast({
        type: 'info',
        text: 'ההרשמה נשמרה באתר! לחץ "חבר סנכרון מיידי לאקסל" בראש העמוד לעדכון חי ב-Google Sheets ⚡',
      });
      setTimeout(() => setSyncToast(null), 5000);
      return;
    }

    try {
      setCardSyncStatus({ eventId: event.id, status: 'syncing' });
      setSyncToast({
        type: 'syncing',
        text: `מעדכן את האקסל של הקמפ עבור ${member.name}... ⏳`,
      });

      const token = await getAccessToken();
      if (!token) throw new Error('נדרש חיבור גוגל מחדש');

      const targetTab = selectedSheetTab || 'ימי הקמות ויצירה 2026';
      let mapping = sheetMapping;

      if (!mapping || mapping.tabName !== targetTab) {
        mapping = await buildSheetMapping(connectedSheetId, targetTab, token);
        setSheetMapping(mapping);
      }

      // 1. Locate member row
      const cleanMemberName = member.name.trim();
      let rowNum = mapping.memberRowMap[cleanMemberName];
      if (!rowNum) {
        for (const [k, v] of Object.entries(mapping.memberRowMap)) {
          if (k.includes(cleanMemberName) || cleanMemberName.includes(k)) {
            rowNum = v;
            break;
          }
        }
      }

      // 2. Locate event column
      const colLetter = findMatchingColumnForEvent(event.title, event.dateStr, mapping);

      if (rowNum && colLetter) {
        const cellRange = `'${targetTab}'!${colLetter}${rowNum}`;
        const isChecked = status === 'attending';

        // Write boolean true/false to update Google Sheet Checkbox!
        await updateSingleCell(connectedSheetId, cellRange, isChecked, token);

        setCardSyncStatus({ eventId: event.id, status: 'synced' });
        setSyncToast({
          type: 'success',
          text: `⚡ עודכן מיידית באקסל! ${member.name} ➔ ${event.title} (תא ${colLetter}${rowNum}: ${isChecked ? '☑ מסומן' : '☐ לא מסומן'})`,
        });
        setTimeout(() => setSyncToast(null), 4500);
      } else {
        setCardSyncStatus({ eventId: event.id, status: 'synced' });
        setSyncToast({
          type: 'success',
          text: `הסטטוס נשמר באתר! (ניתן לסנכרן את כל העמודות דרך לשונית Sheets)`,
        });
        setTimeout(() => setSyncToast(null), 4000);
      }
    } catch (err: any) {
      console.error('Instant sync failed:', err);
      setCardSyncStatus({ eventId: event.id, status: 'error', message: err.message });
      setSyncToast({
        type: 'error',
        text: `שגיאה בעדכון גוגל שיטס: ${err.message || 'ודא שיש הרשאת עריכה לקובץ'}`,
      });
      setTimeout(() => setSyncToast(null), 6000);
    }
  };

  // Update member attendance for an event
  const handleUpdateAttendance = (
    eventId: string,
    memberId: string,
    status: AttendanceStatus,
    extra?: { needsRide?: boolean; rideFrom?: string; note?: string }
  ) => {
    // 1. Immediately update UI React state (0ms latency for mobile user)
    setEvents((prevEvents) =>
      prevEvents.map((evt) => {
        if (evt.id !== eventId) return evt;

        const existingRegIdx = evt.registeredMembers.findIndex((r) => r.memberId === memberId);
        let updatedRegs = [...evt.registeredMembers];

        const newEntry = {
          memberId,
          status,
          updatedAt: new Date().toISOString().slice(0, 10),
          needsRide: extra?.needsRide ?? (existingRegIdx >= 0 ? updatedRegs[existingRegIdx].needsRide : false),
          rideFrom: extra?.rideFrom ?? (existingRegIdx >= 0 ? updatedRegs[existingRegIdx].rideFrom : ''),
          note: extra?.note ?? (existingRegIdx >= 0 ? updatedRegs[existingRegIdx].note : ''),
        };

        if (existingRegIdx >= 0) {
          updatedRegs[existingRegIdx] = newEntry;
        } else {
          updatedRegs.push(newEntry);
        }

        return {
          ...evt,
          registeredMembers: updatedRegs,
        };
      })
    );

    // 2. Persist to Cloud SQL backend
    fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        memberId,
        status,
        needsRide: extra?.needsRide,
        rideFrom: extra?.rideFrom,
        note: extra?.note,
      }),
    }).catch((err) => console.log('Cloud SQL attendance update queued:', err));

    // 3. Trigger Instant Google Sheet Sync
    const targetMember = members.find((m) => m.id === memberId);
    const targetEvent = events.find((e) => e.id === eventId);
    if (targetMember && targetEvent) {
      triggerInstantSheetSync(targetMember, targetEvent, status);
    }
  };

  // Add a new camp member
  const handleAddNewMember = (name: string, phone: string, city: string) => {
    const newMember: CampMember = {
      id: String(Date.now()),
      name,
      phone,
      city,
      email: '',
      gender: 'זכר',
      status: 'חבר קמפ',
      allocationSource: 'קיבל מהקמפ',
    };

    setMembers((prev) => [newMember, ...prev]);
    setActiveMemberId(newMember.id);

    fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMember),
    }).catch((err) => console.log('Cloud SQL member create queued:', err));
  };

  // Add a ride offer
  const handleAddRideOffer = (
    eventId: string,
    ride: Omit<RideOffer, 'id' | 'passengers'>
  ) => {
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        const newRide: RideOffer = {
          ...ride,
          id: `ride-${Date.now()}`,
          passengers: [],
        };

        fetch('/api/rides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newRide, eventId }),
        }).catch((err) => console.log('Cloud SQL ride create queued:', err));

        return {
          ...evt,
          rides: [newRide, ...evt.rides],
        };
      })
    );
  };

  // Join a ride offer
  const handleJoinRide = (eventId: string, rideId: string, member: CampMember) => {
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        return {
          ...evt,
          rides: evt.rides.map((r) => {
            if (r.id !== rideId) return r;
            if (r.availableSeats <= 0) return r;
            if (r.passengers.some((p) => p.memberId === member.id)) return r;

            return {
              ...r,
              availableSeats: r.availableSeats - 1,
              passengers: [
                ...r.passengers,
                { memberId: member.id, memberName: member.name, phone: member.phone },
              ],
            };
          }),
        };
      })
    );
  };

  // Add a new creation event
  const handleAddEvent = (newEventData: Omit<CreationEvent, 'id' | 'registeredMembers' | 'rides'>) => {
    const newEvt: CreationEvent = {
      ...newEventData,
      id: `evt-${Date.now()}`,
      registeredMembers: [],
      rides: [],
    };
    setEvents((prev) => [...prev, newEvt]);
  };

  // Trigger modals for specific events
  const openBlastForEvent = (event: CreationEvent) => {
    setSelectedEventForBlast(event);
    setIsWhatsAppBlastOpen(true);
  };

  const openRidesForEvent = (event: CreationEvent) => {
    setSelectedEventForRides(event);
    setIsRidesOpen(true);
  };

  // Filter events
  const filteredEvents = events.filter((evt) => {
    if (eventCategoryFilter === 'all') return true;
    return evt.category === eventCategoryFilter;
  });

  const activeMemberAttendanceCount = activeMember
    ? events.filter((e) =>
        e.registeredMembers.some((r) => r.memberId === activeMember.id && r.status === 'attending')
      ).length
    : 0;

  return (
    <div className="min-h-screen bg-[#0d101d] text-slate-100 flex flex-col font-['Assistant',sans-serif] selection:bg-amber-500/30">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeMember={activeMember}
        onOpenMemberSelector={() => setIsMemberSelectorOpen(true)}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        connectedSheetId={connectedSheetId}
        isSyncing={isSyncing}
      />

      {/* Floating Instant Sync Live Notification Banner */}
      {syncToast && (
        <aside
          role="status"
          aria-live="polite"
          className="sticky top-16 sm:top-20 z-30 max-w-4xl mx-auto w-full px-4 pt-2 animate-in slide-in-from-top-3 duration-200"
        >
          <div
            className={`p-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xl backdrop-blur-md border ${
              syncToast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 shadow-emerald-950/50'
                : syncToast.type === 'syncing'
                ? 'bg-amber-950/90 border-amber-500 text-amber-200 shadow-amber-950/50'
                : syncToast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-rose-950/50'
                : 'bg-indigo-950/90 border-indigo-500 text-indigo-200 shadow-indigo-950/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {syncToast.type === 'syncing' && <span className="animate-spin text-lg">⏳</span>}
              {syncToast.type === 'success' && <Zap className="w-4 h-4 text-emerald-400 shrink-0" />}
              {syncToast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {syncToast.type === 'info' && <FileSpreadsheet className="w-4 h-4 text-indigo-400 shrink-0" />}
              <span>{syncToast.text}</span>
            </div>

            <button
              onClick={() => setSyncToast(null)}
              className="text-xs opacity-75 hover:opacity-100 px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        
        {/* Quick Link Sheet Banner (If not yet connected or Google not authenticated) */}
        {(!connectedSheetId || !googleUser) && (
          <section className="bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-900 border border-emerald-500/40 rounded-2xl p-4 mb-4 text-right shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="font-extrabold text-sm text-white">
                  סנכרון מיידי בזמן אמת לקובץ Google Sheets של אקסטטיקה ⚡
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                חיבור פעם אחת בלבד יאפשר לכל לחיצה על "אני מגיע" לסמן ישירות את הצ'קבוקס בגיליון "ימי הקמות ויצירה 2026"!
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!googleUser ? (
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs px-4 py-2 rounded-xl shadow-md flex items-center justify-center gap-2 shrink-0"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  התחבר עם Google לסנכרון מיידי
                </button>
              ) : (
                <button
                  onClick={() => setIsSheetsModalOpen(true)}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow flex items-center justify-center gap-1.5 shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  הדבק קישור לקובץ האקסל
                </button>
              )}
            </div>
          </section>
        )}

        {/* Active Member Personalized Greeting Banner */}
        <section className="bg-gradient-to-r from-amber-600/20 via-rose-600/10 to-indigo-900/20 border border-amber-500/30 rounded-2xl p-4 sm:p-5 mb-5 shadow-lg backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md shrink-0">
              {activeMember ? activeMember.name.charAt(0) : <Flame className="w-6 h-6 animate-pulse" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  {activeMember ? `שלום, ${activeMember.name}!` : 'ברוכים הבאים לאקסטטיקה!'}
                </h2>
                {activeMember?.gifts && (
                  <span className="hidden sm:inline text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    {activeMember.gifts}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {activeMember ? (
                  <>
                    רשום/ה כרגע ל-<strong>{activeMemberAttendanceCount}</strong> ימי יצירה. סימון הגעה מהיר בלחיצה אחת מהנייד!
                  </>
                ) : (
                  'הרשמה מהירה לימי יצירה, תזכורות וואטסאפ וסנכרון אקסל למידברן 2026.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setIsMemberSelectorOpen(true)}
              className="text-xs bg-[#1a203a] hover:bg-[#222b4d] text-amber-300 border border-amber-500/30 px-3 py-2 rounded-xl font-semibold transition-all shadow-sm"
            >
              {activeMember ? 'החלף משתמש' : 'מי את/ה? לחץ לבחירה'}
            </button>

            <button
              onClick={() => {
                const msg = `אהלן אקסטטיקה! 🌵 ימי היצירה לקראת מידברן 2026 נפתחו להרשמה ישירה מהטלפון! כנסו ב-10 שניות לסמן מי מגיע: ${window.location.href}`;
                window.open(buildWhatsAppShareLink(msg), '_blank');
              }}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
            >
              <Share2 className="w-3.5 h-3.5" />
              שתף קישור בוואטסאפ
            </button>
          </div>
        </section>

        {/* TAB 1: CREATION DAYS & RAPID SIGNUP */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            
            {/* Action Bar: Category Filters & Add Event Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-right">
              
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                <button
                  onClick={() => setEventCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    eventCategoryFilter === 'all'
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  כל האירועים ({events.length})
                </button>
                <button
                  onClick={() => setEventCategoryFilter('creation_day')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    eventCategoryFilter === 'creation_day'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ימי יצירה
                </button>
                <button
                  onClick={() => setEventCategoryFilter('fundraiser')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    eventCategoryFilter === 'fundraiser'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  מסיבת גיוס
                </button>
                <button
                  onClick={() => setEventCategoryFilter('build')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    eventCategoryFilter === 'build'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  הקמות
                </button>
                <button
                  onClick={() => setEventCategoryFilter('loading')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    eventCategoryFilter === 'loading'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  העמסות ומחסן
                </button>
              </div>

              {/* Add Event Button */}
              <button
                onClick={() => setIsAddEventOpen(true)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                הוסף יום יצירה
              </button>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  activeMember={activeMember}
                  allMembers={members}
                  onUpdateAttendance={handleUpdateAttendance}
                  onOpenMemberSelector={() => setIsMemberSelectorOpen(true)}
                  onOpenWhatsAppBlast={openBlastForEvent}
                  onOpenRides={openRidesForEvent}
                  syncStatus={cardSyncStatus?.eventId === event.id ? cardSyncStatus : null}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: WHATSAPP REMINDERS HUB */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-4 text-right">
            <div className="bg-[#15192c] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  מרכז תזכורות וואטסאפ (להעלאת אחוזי הגעה)
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  שיגור הודעות מלהיבות לקבוצה ופנייה אישית ישירה 1-על-1 למי שעדיין לא מילא את הטבלה.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {events.map((evt) => {
                const attending = evt.registeredMembers.filter((r) => r.status === 'attending').length;
                const missing = Math.max(0, evt.targetParticipants - attending);
                const unregistered = members.length - evt.registeredMembers.length;

                return (
                  <div
                    key={evt.id}
                    className="bg-[#15192c] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                          {evt.dateStr}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-400">
                          {attending} / {evt.targetParticipants} רשומים
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-sm mb-1">{evt.title}</h3>
                      <p className="text-xs text-slate-400 mb-3">{evt.location}</p>

                      <div className="bg-[#121526] p-2.5 rounded-xl border border-slate-800 text-xs space-y-1 mb-3">
                        <div className="flex justify-between text-slate-300">
                          <span>חברים שטרם ענו:</span>
                          <strong className="text-amber-400">{unregistered} חברים</strong>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>חסרים ליעד:</span>
                          <strong className={missing > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                            {missing > 0 ? `${missing} חברים` : 'היעד הושלם! 🎉'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => openBlastForEvent(evt)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30"
                    >
                      <MessageSquare className="w-4 h-4" />
                      פתח תזכורות וואטסאפ לאירוע זה
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: CARPOOLS / RIDES BOARD */}
        {activeTab === 'rides' && (
          <div className="space-y-4 text-right">
            <div className="bg-[#15192c] border border-indigo-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-indigo-400" />
                  לוח טרמפים וסידורי הגעה
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  אף אחד לא נשאר בבית! כל הרכבים, הנוסעים והמקומות הפנויים לימי היצירה.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-[#15192c] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-amber-400 font-semibold">{evt.dateStr}</span>
                      <span className="text-xs bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                        {evt.rides.length} רכבים פעילים
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm mb-1">{evt.title}</h3>
                    <p className="text-xs text-slate-400 mb-3">{evt.location}</p>

                    {evt.rides.length > 0 ? (
                      <div className="space-y-2 mb-3">
                        {evt.rides.map((r) => (
                          <div
                            key={r.id}
                            className="bg-[#191e36] p-2.5 rounded-xl border border-slate-800 text-xs flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-white block">{r.memberName}</span>
                              <span className="text-[11px] text-slate-400">
                                מ{r.fromCity} {r.departureTime && `(${r.departureTime})`}
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-400">
                              {r.availableSeats} מקומות פנויים
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-slate-900/50 rounded-xl text-xs text-slate-500 mb-3">
                        עדיין אין רכבים רשומים לאירוע זה
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => openRidesForEvent(evt)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <Car className="w-4 h-4" />
                    פתח לוח טרמפים והצע רכב
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MEMBERS ROSTER */}
        {activeTab === 'members' && (
          <MembersList
            members={members}
            events={events}
            activeMember={activeMember}
            onSelectMember={(m) => setActiveMemberId(m.id)}
            onOpenAddMember={() => setIsMemberSelectorOpen(true)}
          />
        )}

        {/* TAB 5: GOOGLE SHEETS SYNC DASHBOARD */}
        {activeTab === 'sheets' && (
          <div className="space-y-4 text-right">
            <div className="bg-[#15192c] border border-emerald-500/40 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      סנכרון דו-כיווני עם Google Sheets
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      מחבר ישירות בין הממשק הנייד לבין קובץ האקסל של הקמפ (גיליון: {selectedSheetTab})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsSheetsModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  הגדרות סנכרון ו-Drive
                </button>
              </div>

              {/* Status explanation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
                <div className="bg-[#121526] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">מצב חשבון גוגל:</span>
                  <strong className={googleUser ? 'text-emerald-400' : 'text-rose-400'}>
                    {googleUser ? `מחובר (${googleUser.email})` : 'לא מחובר'}
                  </strong>
                </div>

                <div className="bg-[#121526] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">סנכרון מיידי בעת סימון:</span>
                  <strong className={autoSyncEnabled && connectedSheetId ? 'text-emerald-400' : 'text-amber-400'}>
                    {autoSyncEnabled && connectedSheetId ? 'מופעל ופעיל בזמן אמת ⚡' : 'ממתין לחיבור קובץ'}
                  </strong>
                </div>

                <div className="bg-[#121526] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">גליון יעד ב-Sheets:</span>
                  <strong className="text-white">
                    {selectedSheetTab}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0b0e1a] py-6 px-4 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-slate-200">Camp Ecstatica</span>
            <span>•</span>
            <span>מידברן 2026</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-amber-400 font-semibold bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded text-[11px]">
              {APP_VERSION}
            </span>
            <span>ממשק הרשמה מהיר מהטלפון, סנכרון מיידי לשיטס ותזכורות וואטסאפ</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <MemberSelectorModal
        isOpen={isMemberSelectorOpen}
        onClose={() => setIsMemberSelectorOpen(false)}
        members={members}
        activeMember={activeMember}
        onSelectMember={(m) => setActiveMemberId(m.id)}
        onAddNewMember={handleAddNewMember}
      />

      {selectedEventForBlast && (
        <WhatsAppBlastModal
          isOpen={isWhatsAppBlastOpen}
          onClose={() => {
            setIsWhatsAppBlastOpen(false);
            setSelectedEventForBlast(null);
          }}
          event={selectedEventForBlast}
          allMembers={members}
        />
      )}

      {selectedEventForRides && (
        <RidesModal
          isOpen={isRidesOpen}
          onClose={() => {
            setIsRidesOpen(false);
            setSelectedEventForRides(null);
          }}
          event={selectedEventForRides}
          activeMember={activeMember}
          onAddRide={handleAddRideOffer}
          onJoinRide={handleJoinRide}
        />
      )}

      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        members={members}
        events={events}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        connectedSheetId={connectedSheetId}
        setConnectedSheetId={setConnectedSheetId}
        autoSyncEnabled={autoSyncEnabled}
        setAutoSyncEnabled={setAutoSyncEnabled}
        selectedSheetTab={selectedSheetTab}
        setSelectedSheetTab={setSelectedSheetTab}
      />

      <AddEventModal
        isOpen={isAddEventOpen}
        onClose={() => setIsAddEventOpen(false)}
        onAddEvent={handleAddEvent}
      />
    </div>
  );
}

