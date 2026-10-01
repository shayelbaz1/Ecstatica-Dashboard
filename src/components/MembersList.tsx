import React, { useState, useMemo } from 'react';
import { CampMember, CreationEvent } from '../types';
import {
  Search,
  Users,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Filter,
  UserPlus,
} from 'lucide-react';
import { buildWhatsAppPersonalLink } from '../services/whatsapp';

interface MembersListProps {
  members: CampMember[];
  events: CreationEvent[];
  activeMember: CampMember | null;
  onSelectMember: (member: CampMember) => void;
  onOpenAddMember: () => void;
}

export const MembersList: React.FC<MembersListProps> = ({
  members,
  events,
  activeMember,
  onSelectMember,
  onOpenAddMember,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAllocation, setFilterAllocation] = useState<string>('all');

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.phone && m.phone.includes(searchTerm)) ||
        (m.city && m.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.gifts && m.gifts.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (filterAllocation === 'all') return true;
      if (filterAllocation === 'camp') return m.allocationSource === 'קיבל מהקמפ';
      if (filterAllocation === 'art') return m.allocationSource === 'הקצאת ארט';
      if (filterAllocation === 'external') return m.allocationSource === 'קיבל חיצנית';
      if (filterAllocation === 'pending') return m.allocationSource === 'טרם';
      return true;
    });
  }, [members, searchTerm, filterAllocation]);

  // Calculate stats
  const totalWithAttendance = members.filter((m) =>
    events.some((e) =>
      e.registeredMembers.some((r) => r.memberId === m.id && r.status === 'attending')
    )
  ).length;

  return (
    <div className="space-y-4 text-right">
      
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-[#121526] border border-amber-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            חברי קמפ אקסטטיקה ({members.length})
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            מעקב נוכחות ופעילות, חלוקת תפקידים ומתנות לקראת מידברן 2026
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#121526]/80 border border-slate-800 px-3 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block">רשומים לפחות ליום אחד</span>
            <span className="text-sm font-extrabold text-emerald-400">
              {totalWithAttendance} / {members.length}
            </span>
          </div>

          <button
            onClick={onOpenAddMember}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow"
          >
            <UserPlus className="w-4 h-4" />
            הוסף חבר קמפ
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#15192c] border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לפי שם, טלפון, עיר או מתנה/כישורים..."
              className="w-full bg-[#1b2038] border border-slate-700 rounded-xl px-4 py-2 pr-10 text-xs text-white placeholder-slate-400 focus:border-amber-400 focus:outline-none text-right"
            />
            <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-3" />
          </div>

          {/* Allocation Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setFilterAllocation('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                filterAllocation === 'all'
                  ? 'bg-amber-500 text-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              הכל ({members.length})
            </button>
            <button
              onClick={() => setFilterAllocation('camp')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                filterAllocation === 'camp'
                  ? 'bg-amber-500 text-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              מהקמפ
            </button>
            <button
              onClick={() => setFilterAllocation('art')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                filterAllocation === 'art'
                  ? 'bg-amber-500 text-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              הקצאת ארט
            </button>
            <button
              onClick={() => setFilterAllocation('pending')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                filterAllocation === 'pending'
                  ? 'bg-amber-500 text-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              טרם קיבלו
            </button>
          </div>
        </div>
      </div>

      {/* Members Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredMembers.map((member) => {
          const isActive = activeMember?.id === member.id;
          
          // Number of events this member is attending
          const attendedEventsCount = events.filter((e) =>
            e.registeredMembers.some((r) => r.memberId === member.id && r.status === 'attending')
          ).length;

          return (
            <div
              key={member.id}
              className={`bg-[#15192c] border rounded-xl p-3.5 flex flex-col justify-between transition-all ${
                isActive
                  ? 'border-amber-500/80 shadow-md shadow-amber-500/10 bg-[#191e38]'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-amber-300">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                        {member.name}
                        {isActive && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded">
                            זה את/ה!
                          </span>
                        )}
                      </h4>
                      <span className="text-[11px] text-slate-400">{member.city || 'לא צוין'}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      member.allocationSource === 'קיבל מהקמפ'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                        : member.allocationSource === 'הקצאת ארט'
                        ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {member.allocationSource || member.status}
                  </span>
                </div>

                {/* Gifts / Skills if present */}
                {member.gifts && (
                  <div className="bg-amber-950/20 border border-amber-500/20 p-2 rounded-lg text-[11px] text-amber-200/90 mb-2">
                    <span className="font-bold text-amber-400">מתנות: </span>
                    {member.gifts}
                  </div>
                )}

                {/* Attendance Summary */}
                <div className="flex items-center justify-between text-[11px] text-slate-300 py-1 border-t border-slate-800/80">
                  <span>ימי יצירה שרשום/ה:</span>
                  <span
                    className={`font-bold ${
                      attendedEventsCount > 0 ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {attendedEventsCount} אירועים
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800 mt-2">
                {member.phone && (
                  <button
                    onClick={() => {
                      const text = `היי ${member.name.split(' ')[0]}! 🌵✨ תזכורת מאקסטטיקה לגבי ימי היצירה לקראת מידברן 2026. היכנס לסמן הגעה: ${window.location.href}`;
                      window.open(buildWhatsAppPersonalLink(member.phone, text), '_blank');
                    }}
                    className="flex-1 p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center justify-center gap-1 font-semibold"
                    title="שלח הודעת וואטסאפ"
                  >
                    <MessageSquare className="w-3 h-3" />
                    וואטסאפ
                  </button>
                )}

                <button
                  onClick={() => onSelectMember(member)}
                  className={`p-1.5 px-3 rounded-lg text-[11px] font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isActive ? 'פעיל' : 'בחר פרופיל'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
