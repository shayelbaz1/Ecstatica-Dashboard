export type AttendanceStatus = 'attending' | 'not_attending' | 'maybe';

export interface CampMember {
  id: string;
  name: string;
  gender: 'זכר' | 'נקבה' | 'אחר';
  email: string;
  idNumber?: string;
  city: string;
  phone: string;
  insta?: string;
  gifts?: string;
  status: 'חבר קמפ' | 'רוצה להצטרף לקמפ' | 'בבדיקה' | 'לא באים';
  allocationSource?: 'קיבל מהקמפ' | 'הקצאת ארט' | 'קיבל חיצנית' | 'טרם' | string;
  notes?: string;
}

export interface RideOffer {
  id: string;
  memberId: string;
  memberName: string;
  fromCity: string;
  departureTime?: string;
  totalSeats: number;
  availableSeats: number;
  passengers: { memberId: string; memberName: string; phone?: string }[];
  phone: string;
  notes?: string;
}

export interface CreationEvent {
  id: string;
  title: string;
  subTitle?: string;
  dateStr: string;
  exactDate?: string; // YYYY-MM-DD
  category: 'fundraiser' | 'creation_day' | 'build' | 'strike' | 'loading' | 'warehouse';
  location: string;
  description: string;
  targetParticipants: number;
  registeredMembers: {
    memberId: string;
    status: AttendanceStatus;
    updatedAt: string;
    needsRide?: boolean;
    rideFrom?: string;
    bringingSupplies?: string;
    note?: string;
  }[];
  rides: RideOffer[];
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  icon: string;
  targetAudience: 'all' | 'not_registered' | 'registered' | 'carpool';
  generateMessage: (event: CreationEvent, member?: CampMember, appUrl?: string) => string;
}
