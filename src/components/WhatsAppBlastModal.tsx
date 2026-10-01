import React, { useState } from 'react';
import { CreationEvent, CampMember } from '../types';
import {
  WHATSAPP_TEMPLATES,
  buildWhatsAppPersonalLink,
  buildWhatsAppShareLink,
} from '../services/whatsapp';
import {
  X,
  MessageSquare,
  Send,
  Copy,
  Check,
  Users,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Search,
  Sparkles,
} from 'lucide-react';

interface WhatsAppBlastModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CreationEvent;
  allMembers: CampMember[];
}

export const WhatsAppBlastModal: React.FC<WhatsAppBlastModalProps> = ({
  isOpen,
  onClose,
  event,
  allMembers,
}) => {
  const [activeTab, setActiveTab] = useState<'group' | 'individual'>('group');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [customText, setCustomText] = useState('');
  const [copied, setCopied] = useState(false);
  const [notifiedMembers, setNotifiedMembers] = useState<Record<string, boolean>>({});
  const [memberSearch, setMemberSearch] = useState('');

  if (!isOpen) return null;

  const appUrl = window.location.href;

  // Unregistered members (who haven't said attending, maybe, or not_attending)
  const registeredIds = new Set(event.registeredMembers.map((r) => r.memberId));
  const unregisteredMembers = allMembers.filter(
    (m) => !registeredIds.has(m.id) && m.status !== 'לא באים'
  );

  const filteredUnregistered = unregisteredMembers.filter(
    (m) =>
      m.name.includes(memberSearch) ||
      (m.phone && m.phone.includes(memberSearch)) ||
      (m.city && m.city.includes(memberSearch))
  );

  const selectedTemplate = WHATSAPP_TEMPLATES[selectedTemplateIndex];
  const messageBody = customText || selectedTemplate.generate(event, appUrl);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGroupWhatsApp = () => {
    window.open(buildWhatsAppShareLink(messageBody), '_blank');
  };

  const handleSendIndividualPoke = (member: CampMember) => {
    const pokeText = `היי ${member.name.split(' ')[0]} יקר/ה! 🌵✨
כאן אקסטטיקה. אנחנו מתכוננים בטירוף ל-${event.title} (${event.dateStr}) וממש צריכים אותך איתנו!

הכנו ממשק הרשמה מהיר במיוחד מהנייד, אפשר לסמן הגעה בלחיצה אחת:
${appUrl}

מחכים לראות אותך! 🤍🔨`;

    setNotifiedMembers((prev) => ({ ...prev, [member.id]: true }));
    window.open(buildWhatsAppPersonalLink(member.phone, pokeText), '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#15192c] border border-emerald-500/40 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-right">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#162132] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                תזכורות וואטסאפ לימי יצירה
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-[280px] sm:max-w-none">
                {event.title} • {event.dateStr}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-2 bg-[#121526] border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('group')}
            className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'group'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            הודעה מרוכזת לקבוצה
          </button>

          <button
            onClick={() => setActiveTab('individual')}
            className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'individual'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            תזכורת אישית 1-על-1
            <span className="bg-emerald-950 text-emerald-300 text-[11px] px-1.5 py-0.2 rounded-full border border-emerald-500/30">
              {unregisteredMembers.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Group Blast */}
        {activeTab === 'group' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Template selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                בחר תבנית הודעה מנצחת:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WHATSAPP_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedTemplateIndex(idx);
                      setCustomText('');
                    }}
                    className={`text-right p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                      selectedTemplateIndex === idx && !customText
                        ? 'bg-emerald-950/40 border-emerald-400 text-white font-semibold'
                        : 'bg-[#1b2038] border-slate-700/80 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="font-bold">{tmpl.name}</span>
                    <span className="text-[10px] text-emerald-400 mt-1">{tmpl.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Editable message preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  נוסח ההודעה שתישלח (ניתן לערוך חופשי):
                </label>
                <button
                  onClick={() => setCustomText(selectedTemplate.generate(event, appUrl))}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  אפס לנוסח המקורי
                </button>
              </div>

              <textarea
                rows={8}
                value={messageBody}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full bg-[#121526] border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-200 leading-relaxed font-mono focus:border-emerald-400 focus:outline-none text-right resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={handleOpenGroupWhatsApp}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                <Send className="w-4 h-4" />
                שגר עכשיו לוואטסאפ (WhatsApp)
              </button>

              <button
                onClick={handleCopy}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border border-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    הועתק ללוח!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    העתק טקסט
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Tab 2: Individual 1-on-1 Pokes */
          <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-3">
            
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>תזכורת ישירה 1-על-1 מביאה עד פי 3 יותר נוכחות!</strong>
                <p className="text-slate-300 mt-0.5">
                  לחיצה על כפתור הוואטסאפ פותחת צ'אט אישי ישיר עם החבר/ה עם קישור להרשמה בלחיצה מהטלפון.
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="חיפוש חבר שטרם ענה..."
                className="w-full bg-[#1b2038] border border-slate-700 rounded-xl px-3.5 py-2 pr-9 text-xs text-white placeholder-slate-400 text-right focus:border-emerald-400 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute top-3 right-3" />
            </div>

            {/* Unregistered List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800 max-h-[45vh]">
              {filteredUnregistered.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  {memberSearch
                    ? 'לא נמצאו חברים התואמים לחיפוש'
                    : '🎉 מדהים! כל חברי הקמפ כבר ענו על אירוע זה!'}
                </div>
              ) : (
                filteredUnregistered.map((member) => {
                  const wasNotified = notifiedMembers[member.id];
                  return (
                    <div
                      key={member.id}
                      className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-800/40 rounded-lg text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          {member.name}
                          {wasNotified && (
                            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/30 flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> נשלחה
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5">
                          {member.city && <span>{member.city}</span>}
                          {member.phone && <span dir="ltr">{member.phone}</span>}
                        </div>
                      </div>

                      <button
                        onClick={() => handleSendIndividualPoke(member)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                          wasNotified
                            ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                        }`}
                        title={`שלח הודעה אישית לוואטסאפ של ${member.name}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{wasNotified ? 'שלח שוב' : 'שלח תזכורת'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="text-slate-400 text-[11px] pt-2 border-t border-slate-800 flex items-center justify-between">
              <span>{filteredUnregistered.length} חברים טרם ענו</span>
              <button
                onClick={() => {
                  const numbers = filteredUnregistered
                    .map((m) => m.phone)
                    .filter(Boolean)
                    .join(', ');
                  navigator.clipboard.writeText(numbers);
                  alert('רשימת הטלפונים הועתקה ללוח');
                }}
                className="text-amber-400 hover:underline"
              >
                העתק טלפונים של כולם
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
