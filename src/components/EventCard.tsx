import React, { useState } from 'react';
import { CreationEvent, CampMember, AttendanceStatus } from '../types';
import {
  Calendar,
  MapPin,
  Users,
  Check,
  X,
  HelpCircle,
  Car,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Share2,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import { buildWhatsAppShareLink } from '../services/whatsapp';

interface EventCardProps {
  event: CreationEvent;
  activeMember: CampMember | null;
  allMembers: CampMember[];
  onUpdateAttendance: (
    eventId: string,
    memberId: string,
    status: AttendanceStatus,
    extra?: { needsRide?: boolean; rideFrom?: string; note?: string }
  ) => void;
  onOpenMemberSelector: () => void;
  onOpenWhatsAppBlast: (event: CreationEvent) => void;
  onOpenRides: (event: CreationEvent) => void;
  syncStatus?: { eventId: string; status: 'syncing' | 'synced' | 'error'; message?: string } | null;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  activeMember,
  allMembers,
  onUpdateAttendance,
  onOpenMemberSelector,
  onOpenWhatsAppBlast,
  onOpenRides,
  syncStatus,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExtraOptions, setShowExtraOptions] = useState(false);
  const [needsRide, setNeedsRide] = useState(false);
  const [rideFrom, setRideFrom] = useState(activeMember?.city || '');
  const [suppliesNote, setSuppliesNote] = useState('');

  // Find active member registration if exists
  const activeRegistration = activeMember
    ? event.registeredMembers.find((r) => r.memberId === activeMember.id)
    : undefined;

  const currentStatus: AttendanceStatus | null = activeRegistration?.status || null;

  // Breakdown of attendance
  const attendingList = event.registeredMembers
    .filter((r) => r.status === 'attending')
    .map((r) => allMembers.find((m) => m.id === r.memberId))
    .filter(Boolean) as CampMember[];

  const maybeList = event.registeredMembers
    .filter((r) => r.status === 'maybe')
    .map((r) => allMembers.find((m) => m.id === r.memberId))
    .filter(Boolean) as CampMember[];

  const attendingCount = attendingList.length;
  const target = event.targetParticipants || 15;
  const progressPercent = Math.min(Math.round((attendingCount / target) * 100), 100);

  const handleStatusClick = (status: AttendanceStatus) => {
    if (!activeMember) {
      onOpenMemberSelector();
      return;
    }

    onUpdateAttendance(event.id, activeMember.id, status, {
      needsRide,
      rideFrom,
      note: suppliesNote,
    });

    if (status === 'attending') {
      setShowExtraOptions(true);
    }
  };

  const handleShareMyAttendance = () => {
    if (!activeMember) return;
    const msg = `אהלן כולם! סימנתי עכשיו שאני מגיע/ה ל-${event.title} (${event.dateStr})! 🌵✨ מי מצטרף אליי? כנסו לסמן: ${window.location.href}`;
    window.open(buildWhatsAppShareLink(msg), '_blank');
  };

  const getCategoryBadge = () => {
    switch (event.category) {
      case 'fundraiser':
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">מסיבת גיוס</span>;
      case 'build':
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">הקמות</span>;
      case 'strike':
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">פירוקים</span>;
      case 'loading':
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">העמסות</span>;
      default:
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">יום יצירה</span>;
    }
  };

  return (
    <div
      className={`bg-[#15192c] border rounded-2xl p-4 sm:p-5 transition-all shadow-lg text-right ${
        currentStatus === 'attending'
          ? 'border-emerald-500/50 shadow-emerald-500/10'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Bar: Badge, Date & Quick Actions */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {getCategoryBadge()}
          <span className="text-xs font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/20 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {event.dateStr}
          </span>
        </div>

        {/* WhatsApp & Rides Shortcuts */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onOpenWhatsAppBlast(event)}
            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs flex items-center gap-1"
            title="שלח תזכורות וואטסאפ לאירוע זה"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-bold">תזכורת</span>
          </button>

          <button
            onClick={() => onOpenRides(event)}
            className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 text-xs flex items-center gap-1"
            title="לוח טרמפים לאירוע זה"
          >
            <Car className="w-3.5 h-3.5" />
            {event.rides.length > 0 && (
              <span className="text-[10px] bg-indigo-600 text-white px-1 rounded-full font-bold">
                {event.rides.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Title & Subtitle */}
      <div className="mb-3">
        <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
          {event.title}
        </h3>
        {event.subTitle && (
          <p className="text-xs text-slate-400 mt-0.5">{event.subTitle}</p>
        )}
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-3.5 bg-slate-900/50 p-2 rounded-xl border border-slate-800/80">
        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span className="truncate">{event.location}</span>
      </div>

      {/* Progress Bar towards Target Attendance */}
      <div className="mb-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>
              רשומים: <strong className="text-white font-bold">{attendingCount}</strong> מתוך יעד של {target}
            </span>
          </span>
          <span
            className={`font-bold ${
              progressPercent >= 100
                ? 'text-emerald-400'
                : progressPercent >= 60
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {progressPercent}%
          </span>
        </div>

        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              progressPercent >= 100
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : progressPercent >= 60
                ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                : 'bg-gradient-to-r from-rose-500 to-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Missing volunteers alert badge */}
        {attendingCount < target && (
          <p className="text-[11px] text-amber-400/90 mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            חסרים עוד {target - attendingCount} חברים להשלמת הצוות!
          </p>
        )}
      </div>

      {/* Mobile Rapid Attendance Buttons */}
      <div className="space-y-2 mb-3">
        <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>
            {activeMember ? (
              <>הסטטוס שלך ({activeMember.name}):</>
            ) : (
              <span className="text-amber-400 underline cursor-pointer" onClick={onOpenMemberSelector}>
                לחץ כאן כדי לבחור את שמך ולהירשם 👈
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            {syncStatus && syncStatus.eventId === event.id && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  syncStatus.status === 'syncing'
                    ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30 animate-pulse'
                    : syncStatus.status === 'synced'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                }`}
              >
                {syncStatus.status === 'syncing' && 'מעדכן שיטס ⏳'}
                {syncStatus.status === 'synced' && 'סונכרן לאקסל ⚡'}
                {syncStatus.status === 'error' && 'שגיאת סנכרון ⚠️'}
              </span>
            )}

            {currentStatus === 'attending' && (
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> רשום/ה בהצלחה!
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Attending Button */}
          <button
            onClick={() => handleStatusClick('attending')}
            className={`py-2.5 px-2 rounded-xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition-all border ${
              currentStatus === 'attending'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                : 'bg-[#1a2035] text-slate-300 border-slate-700 hover:bg-emerald-950/40 hover:text-emerald-300 hover:border-emerald-500/40'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>אני מגיע/ה!</span>
          </button>

          {/* Maybe Button */}
          <button
            onClick={() => handleStatusClick('maybe')}
            className={`py-2.5 px-2 rounded-xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition-all border ${
              currentStatus === 'maybe'
                ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/30'
                : 'bg-[#1a2035] text-slate-300 border-slate-700 hover:bg-amber-950/40 hover:text-amber-300 hover:border-amber-500/40'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>אולי / מתנדנד</span>
          </button>

          {/* Not Attending Button */}
          <button
            onClick={() => handleStatusClick('not_attending')}
            className={`py-2.5 px-2 rounded-xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition-all border ${
              currentStatus === 'not_attending'
                ? 'bg-rose-900/80 text-rose-200 border-rose-600'
                : 'bg-[#1a2035] text-slate-400 border-slate-700 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-500/40'
            }`}
          >
            <X className="w-4 h-4" />
            <span>לא יכול/ה</span>
          </button>
        </div>
      </div>

      {/* Micro-form for Attending Members (Ride need, note) */}
      {currentStatus === 'attending' && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 mb-3 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> איזה כיף שאת/ה בא/ה!
            </span>
            <button
              onClick={handleShareMyAttendance}
              className="text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded-lg hover:bg-emerald-500 flex items-center gap-1 font-semibold"
            >
              <Share2 className="w-3 h-3" /> שתף בוואטסאפ
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-emerald-500/20">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={needsRide}
                onChange={(e) => {
                  setNeedsRide(e.target.checked);
                  if (activeMember) {
                    onUpdateAttendance(event.id, activeMember.id, 'attending', {
                      needsRide: e.target.checked,
                      rideFrom,
                      note: suppliesNote,
                    });
                  }
                }}
                className="rounded border-slate-600 text-emerald-600 focus:ring-0"
              />
              <span className="text-slate-300">אני אצטרך טרמפ</span>
            </label>

            {needsRide && (
              <input
                type="text"
                value={rideFrom}
                onChange={(e) => {
                  setRideFrom(e.target.value);
                  if (activeMember) {
                    onUpdateAttendance(event.id, activeMember.id, 'attending', {
                      needsRide: true,
                      rideFrom: e.target.value,
                      note: suppliesNote,
                    });
                  }
                }}
                placeholder="מאיפה אתה צריך טרמפ? (עיר/אזור)"
                className="bg-[#121526] border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-right focus:border-emerald-400"
              />
            )}
          </div>
        </div>
      )}

      {/* Who is coming list toggle */}
      <div className="pt-2 border-t border-slate-800">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white py-1"
        >
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>מי עוד מגיע/ה? ({attendingCount} חברים)</span>
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Member names chips preview */}
        {!isExpanded && attendingList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {attendingList.slice(0, 5).map((m) => (
              <span
                key={m.id}
                className="text-[11px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700/60"
              >
                {m.name}
              </span>
            ))}
            {attendingList.length > 5 && (
              <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                +{attendingList.length - 5} נוספים
              </span>
            )}
          </div>
        )}

        {/* Expanded Details: Full Attendee List & Description */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-3 animate-in fade-in duration-150">
            {event.description && (
              <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                {event.description}
              </p>
            )}

            <div>
              <h4 className="text-xs font-bold text-emerald-400 mb-1.5">
                חברים שמגיעים ({attendingList.length}):
              </h4>
              {attendingList.length === 0 ? (
                <p className="text-xs text-slate-500">עדיין אף אחד לא סימן הגעה. היה הראשון!</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {attendingList.map((m) => (
                    <div
                      key={m.id}
                      className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-lg text-xs flex items-center justify-between"
                    >
                      <span className="truncate text-slate-200">{m.name}</span>
                      <span className="text-[10px] text-slate-400">{m.city}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {maybeList.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-amber-400 mb-1.5">
                  מתנדנדים / אולי ({maybeList.length}):
                </h4>
                <div className="flex flex-wrap gap-1">
                  {maybeList.map((m) => (
                    <span
                      key={m.id}
                      className="text-[11px] bg-amber-950/40 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/20"
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
