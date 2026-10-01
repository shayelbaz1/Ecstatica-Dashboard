import React, { useState, useMemo } from 'react';
import { CampMember } from '../types';
import { Search, X, Check, UserPlus, Phone, MapPin, Sparkles } from 'lucide-react';

interface MemberSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: CampMember[];
  activeMember: CampMember | null;
  onSelectMember: (member: CampMember) => void;
  onAddNewMember: (name: string, phone: string, city: string) => void;
}

export const MemberSelectorModal: React.FC<MemberSelectorModalProps> = ({
  isOpen,
  onClose,
  members,
  activeMember,
  onSelectMember,
  onAddNewMember,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('');

  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members;
    const lower = searchTerm.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(lower) ||
        (m.phone && m.phone.includes(lower)) ||
        (m.city && m.city.toLowerCase().includes(lower))
    );
  }, [members, searchTerm]);

  if (!isOpen) return null;

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddNewMember(newName.trim(), newPhone.trim(), newCity.trim());
    setIsAddingNew(false);
    setNewName('');
    setNewPhone('');
    setNewCity('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#15192c] border border-amber-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-right">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#191e35]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              מי את/ה בקמפ?
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              נבחר פעם אחת בלבד ונזכור אותך בנייד להרשמה בלחיצה אחת!
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isAddingNew ? (
          <>
            {/* Search input */}
            <div className="p-4 border-b border-slate-800 bg-[#121526]/50">
              <div className="relative">
                <input
                  type="text"
                  placeholder="חיפוש לפי שם, טלפון או עיר..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full bg-[#1b2038] border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 text-right"
                />
                <Search className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute top-3 left-3 text-xs text-slate-400 hover:text-white"
                  >
                    נקה
                  </button>
                )}
              </div>
            </div>

            {/* Members List */}
            <div className="overflow-y-auto flex-1 p-3 space-y-1.5 max-h-[50vh] divide-y divide-slate-800/50">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-3">
                  <p>לא נמצא חבר קמפ בשם "{searchTerm}"</p>
                  <button
                    onClick={() => {
                      setNewName(searchTerm);
                      setIsAddingNew(true);
                    }}
                    className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/30 inline-flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    הוסף אותי כחבר קמפ חדש
                  </button>
                </div>
              ) : (
                filteredMembers.map((member) => {
                  const isSelected = activeMember?.id === member.id;
                  return (
                    <button
                      key={member.id}
                      onClick={() => {
                        onSelectMember(member);
                        onClose();
                      }}
                      className={`w-full text-right p-3 rounded-xl transition-all flex items-center justify-between group ${
                        isSelected
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
                          : 'hover:bg-slate-800/70 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                            isSelected
                              ? 'bg-amber-500 text-black'
                              : 'bg-slate-800 text-slate-300 group-hover:bg-amber-600/30 group-hover:text-amber-300'
                          }`}
                        >
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-2">
                            {member.name}
                            {member.allocationSource && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                {member.allocationSource}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            {member.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-500" />
                                <span dir="ltr">{member.phone}</span>
                              </span>
                            )}
                            {member.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {member.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 group-hover:text-amber-400">
                          בחר 👈
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer with Add New button */}
            <div className="p-3 border-t border-slate-800 bg-[#121526] flex items-center justify-between text-xs">
              <span className="text-slate-400">
                סה״כ {members.length} חברי קמפ במאגר
              </span>
              <button
                onClick={() => setIsAddingNew(true)}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
              >
                <UserPlus className="w-3.5 h-3.5" />
                לא מופיע ברשימה? הוסף את עצמך
              </button>
            </div>
          </>
        ) : (
          /* Add New Member Form */
          <form onSubmit={handleCreateNew} className="p-5 space-y-4">
            <h3 className="text-base font-bold text-white">הוספת חבר קמפ חדש</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                שם מלא <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="למשל: דנה כהן"
                className="w-full bg-[#1b2038] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 text-right"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                טלפון נייד (לוואטסאפ ולתזכורות)
              </label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="050-1234567"
                dir="ltr"
                className="w-full bg-[#1b2038] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 text-right"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                מקום מגורים (לטובת טרמפים)
              </label>
              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="למשל: תל אביב, חיפה, פרדס חנה..."
                className="w-full bg-[#1b2038] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 text-right"
              />
            </div>

            <div className="flex items-center gap-2 pt-3">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold py-2.5 rounded-xl shadow hover:opacity-95"
              >
                שמור והמשך
              </button>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
              >
                ביטול
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
