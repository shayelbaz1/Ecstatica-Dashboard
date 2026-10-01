import React, { useState } from 'react';
import { CreationEvent, CampMember, RideOffer } from '../types';
import {
  X,
  Car,
  Plus,
  Users,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  Check,
  UserCheck,
} from 'lucide-react';
import { buildWhatsAppPersonalLink } from '../services/whatsapp';

interface RidesModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CreationEvent;
  activeMember: CampMember | null;
  onAddRide: (
    eventId: string,
    ride: Omit<RideOffer, 'id' | 'passengers'>
  ) => void;
  onJoinRide: (eventId: string, rideId: string, member: CampMember) => void;
}

export const RidesModal: React.FC<RidesModalProps> = ({
  isOpen,
  onClose,
  event,
  activeMember,
  onAddRide,
  onJoinRide,
}) => {
  const [isOfferingRide, setIsOfferingRide] = useState(false);
  const [fromCity, setFromCity] = useState(activeMember?.city || 'תל אביב');
  const [departureTime, setDepartureTime] = useState('');
  const [totalSeats, setTotalSeats] = useState(3);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmitOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMember) return;

    onAddRide(event.id, {
      memberId: activeMember.id,
      memberName: activeMember.name,
      fromCity,
      departureTime,
      totalSeats,
      availableSeats: totalSeats,
      phone: activeMember.phone || '',
      notes,
    });

    setIsOfferingRide(false);
    setNotes('');
  };

  const membersNeedingRide = event.registeredMembers
    .filter((r) => r.needsRide && r.status === 'attending')
    .map((r) => ({
      memberId: r.memberId,
      rideFrom: r.rideFrom,
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#15192c] border border-indigo-500/40 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-right">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#171b33] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                לוח טרמפים ורכבים
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Action button to offer a ride */}
          {!isOfferingRide ? (
            <div className="flex items-center justify-between bg-indigo-950/30 border border-indigo-500/30 p-3 rounded-xl">
              <div>
                <span className="font-bold text-sm text-indigo-200 block">
                  יוצא/ת עם רכב?
                </span>
                <span className="text-xs text-slate-400">
                  הציע/י מקומות פנויים לחברים כדי שאף אחד לא יישאר בבית!
                </span>
              </div>
              <button
                onClick={() => setIsOfferingRide(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                הצע טרמפ
              </button>
            </div>
          ) : (
            /* Offer Ride Form */
            <form onSubmit={handleSubmitOffer} className="bg-[#1a203a] border border-indigo-500/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="font-bold text-sm text-white">הצעת טרמפ ברכב</span>
                <button
                  type="button"
                  onClick={() => setIsOfferingRide(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ביטול
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    מאיפה יוצאים?
                  </label>
                  <input
                    type="text"
                    required
                    value={fromCity}
                    onChange={(e) => setFromCity(e.target.value)}
                    placeholder="עיר / צומת"
                    className="w-full bg-[#121526] border border-slate-700 rounded-lg p-2 text-xs text-white text-right"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    שעת יציאה משוערת
                  </label>
                  <input
                    type="text"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    placeholder="למשל: שישי ב-08:30"
                    className="w-full bg-[#121526] border border-slate-700 rounded-lg p-2 text-xs text-white text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    כמה מקומות פנויים?
                  </label>
                  <select
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(Number(e.target.value))}
                    className="w-full bg-[#121526] border border-slate-700 rounded-lg p-2 text-xs text-white text-right"
                  >
                    <option value={1}>1 מקום</option>
                    <option value={2}>2 מקומות</option>
                    <option value={3}>3 מקומות</option>
                    <option value={4}>4 מקומות</option>
                    <option value={5}>5 מקומות</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    הערה (ציוד / נקודת איסוף)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="יש בגאז' גדול, עובר ברכבת..."
                    className="w-full bg-[#121526] border border-slate-700 rounded-lg p-2 text-xs text-white text-right"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs shadow mt-2"
              >
                פרסם טרמפ בלוח
              </button>
            </form>
          )}

          {/* List of Available Rides */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-indigo-400" />
              רכבים שיוצאים לאירוע ({event.rides.length}):
            </h3>

            {event.rides.length === 0 ? (
              <div className="text-center py-6 bg-slate-900/40 rounded-xl border border-slate-800 text-xs text-slate-400">
                עדיין אין רכבים רשומים. היה הראשון להציע טרמפ!
              </div>
            ) : (
              <div className="space-y-2.5">
                {event.rides.map((ride) => {
                  const isDriver = activeMember?.id === ride.memberId;
                  const isPassenger = activeMember
                    ? ride.passengers.some((p) => p.memberId === activeMember.id)
                    : false;

                  return (
                    <div
                      key={ride.id}
                      className="bg-[#191e36] border border-slate-800 rounded-xl p-3 text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-white text-sm block">
                            הנהג/ת: {ride.memberName}
                          </span>
                          <div className="flex items-center gap-2 text-slate-300 text-[11px] mt-0.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-rose-400" />
                              {ride.fromCity}
                            </span>
                            {ride.departureTime && (
                              <span className="flex items-center gap-1 text-amber-300">
                                <Clock className="w-3 h-3" />
                                {ride.departureTime}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Seats badge */}
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            ride.availableSeats > 0
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {ride.availableSeats > 0
                            ? `${ride.availableSeats} מקומות פנויים`
                            : 'מלא!'}
                        </span>
                      </div>

                      {ride.notes && (
                        <p className="text-[11px] text-slate-400 bg-slate-900/60 p-1.5 rounded">
                          {ride.notes}
                        </p>
                      )}

                      {/* Passengers list */}
                      {ride.passengers.length > 0 && (
                        <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                          <span className="text-slate-500">נוסעים:</span>
                          {ride.passengers.map((p) => (
                            <span
                              key={p.memberId}
                              className="bg-indigo-950/50 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30"
                            >
                              {p.memberName}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                        {/* WhatsApp contact driver */}
                        {ride.phone && (
                          <button
                            onClick={() => {
                              const text = `היי ${ride.memberName.split(' ')[0]}! ראיתי שאת/ה יוצא/ת מ-${ride.fromCity} ל-${event.title}. אפשר להצטרף לטרמפ? 🚗✨`;
                              window.open(buildWhatsAppPersonalLink(ride.phone, text), '_blank');
                            }}
                            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold text-[11px]"
                          >
                            <MessageSquare className="w-3 h-3" />
                            תאם עם הנהג/ת בוואטסאפ
                          </button>
                        )}

                        {/* Join ride action */}
                        {activeMember && !isDriver && !isPassenger && ride.availableSeats > 0 && (
                          <button
                            onClick={() => onJoinRide(event.id, ride.id, activeMember)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            הצטרף לרכב
                          </button>
                        )}

                        {isPassenger && (
                          <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> את/ה רשום/ה ברכב זה
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
