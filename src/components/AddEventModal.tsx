import React, { useState } from 'react';
import { CreationEvent } from '../types';
import { X, Calendar, MapPin, Users, Plus } from 'lucide-react';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (event: Omit<CreationEvent, 'id' | 'registeredMembers' | 'rides'>) => void;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onAddEvent,
}) => {
  const [title, setTitle] = useState('');
  const [subTitle, setSubTitle] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [category, setCategory] = useState<CreationEvent['category']>('creation_day');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [targetParticipants, setTargetParticipants] = useState(20);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dateStr.trim()) return;

    onAddEvent({
      title: title.trim(),
      subTitle: subTitle.trim(),
      dateStr: dateStr.trim(),
      category,
      location: location.trim() || 'תל אביב',
      description: description.trim(),
      targetParticipants,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#15192c] border border-amber-500/40 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-right">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#191e36] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              הוספת יום יצירה / פעילות חדשה
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              שם האירוע / יום היצירה <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="למשל: יום יצירה 5 - בניית שלד בר וציורי קיר"
              className="w-full bg-[#1b2038] border border-slate-700 rounded-xl p-2.5 text-white text-right focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              תת כותרת / פירוט קצר
            </label>
            <input
              type="text"
              value={subTitle}
              onChange={(e) => setSubTitle(e.target.value)}
              placeholder="למשל: סגירת פינות לקראת העמסות"
              className="w-full bg-[#1b2038] border border-slate-700 rounded-xl p-2.5 text-white text-right focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                תאריך ושעה <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                placeholder="למשל: שישי 24.10 (10:00)"
                className="w-full bg-[#1b2038] border border-slate-700 rounded-xl p-2.5 text-white text-right focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                סוג פעילות
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#1b2038] border border-slate-700 rounded-xl p-2.5 text-white text-right"
              >
                <option value="creation_day">יום יצירה</option>
                <option value="fundraiser">מסיבת גיוס</option>
                <option value="build">הקמות</option>
                <option value="strike">פירוקים</option>
                <option value="loading">העמסות</option>
                <option value="warehouse">מחסן</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                מיקום
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="למשל: סדנת תל אביב / מתחם האגם"
                className="w-full bg-[#1b2038] border border-slate-700 rounded-xl p-2.5 text-white text-right focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                יעד משתתפים רצוי
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={targetParticipants}
                onChange={(e) => setTargetParticipants(Number(e.target.value))}
                className="w-full bg-[#1b2038] border border-slate-700 rounded-xl p-2.5 text-white text-right focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              תיאור מפורט וציוד נדרש
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="מה עושים ביום זה, איזה כלי עבודה כדאי להביא..."
              className="w-full bg-[#1b2038] border border-slate-700 rounded-xl p-2.5 text-white text-right focus:border-amber-400 focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold py-2.5 rounded-xl shadow text-xs"
            >
              צור והוסף לרשימה
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 text-xs"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
