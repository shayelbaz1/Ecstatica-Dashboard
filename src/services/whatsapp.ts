import { CreationEvent, CampMember } from '../types';

/**
 * Normalizes Israeli mobile numbers for wa.me links
 * e.g. "054-2040604" -> "972542040604"
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.substring(1);
  } else if (!cleaned.startsWith('972') && cleaned.length >= 9) {
    cleaned = '972' + cleaned;
  }
  return cleaned;
}

export function buildWhatsAppPersonalLink(
  phone: string,
  message: string
): string {
  const normPhone = normalizePhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(message);
  return normPhone ? `https://wa.me/${normPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
}

export function buildWhatsAppShareLink(message: string): string {
  const encodedText = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

export const WHATSAPP_TEMPLATES = [
  {
    id: 'group_urgent_signup',
    name: 'קריאה דחופה לקבוצה (חסרות ידיים עובדות!)',
    badge: 'הגברת הרשמה',
    generate: (event: CreationEvent, appUrl: string) => {
      const registeredCount = event.registeredMembers.filter(r => r.status === 'attending').length;
      return `🔥 *משפחת אקסטטיקה, יום יצירה בפתח!* 🔥

קמפ יקר, כדי שהמחנה והרחבה שלנו במידברן 2026 יקומו כמו בחלומות - חייבים את כולכם בימי היצירה! 🌵✨

📍 *אירוע:* ${event.title}
📅 *מתי:* ${event.dateStr}
📌 *מיקום:* ${event.location}
🎯 *יעד מתנדבים:* ${event.targetParticipants} חברים
👥 *כרגע רשומים:* ${registeredCount} בלבד!

👉 *מי שעוד לא סימן - הרשמה ב-10 שניות ישר מהנייד (בלי להסתבך באקסל):*
${appUrl}

יש אפשרות לסמן טרמפים וציוד. יאללה בואו נעשה קסמים ביחד! 🛠️🎨🤍`;
    },
  },
  {
    id: 'group_24h_reminder',
    name: 'תזכורת 24 שעות לפני (מחר מתראים!)',
    badge: 'יום לפני',
    generate: (event: CreationEvent, appUrl: string) => {
      const count = event.registeredMembers.filter(r => r.status === 'attending').length;
      return `⏰ *תזכורת: מחר נפגשים ליצירה באקסטטיקה!* ⏰

${event.title} יוצא לדרך!
📅 *מתי:* ${event.dateStr}
📍 *מיקום:* ${event.location}
👥 *רשומים שמגיעים:* ${count} חברים תותחים!

⚠️ *דגשים חשובים להגעה:*
- נעלי עבודה סגורות חובה 👟
- בגדים שיכולים להתלכלך בצבע 🎨
- בקבוק מים אישי ומצב רוח שיא 💦
- מוזיקה וחיבוקים עלינו!

מי שעדיין לא הספיק להירשם או שצריך לסגור טרמפ - היכנסו עכשיו:
${appUrl}`;
    },
  },
  {
    id: 'personal_poke',
    name: 'תזכורת אישית 1-על-1 למי שטרם נרשם',
    badge: 'אישי',
    generate: (event: CreationEvent, appUrl: string, member?: CampMember) => {
      const memberName = member ? member.name.split(' ')[0] : 'אהוב/ה';
      return `היי ${memberName} יקר/ה! 🌵✨
כאן אקסטטיקה. אנחנו מתכוננים בטירוף ל-${event.title} (${event.dateStr}) וממש צריכים אותך איתנו!

הכנו ממשק הרשמה מהיר במיוחד מהנייד, אפשר לסמן הגעה בלחיצה אחת:
${appUrl}

מחכים לראות אותך! 🤍🔨`;
    },
  },
  {
    id: 'rides_reminder',
    name: 'סידור טרמפים והגעה',
    badge: 'טרמפים',
    generate: (event: CreationEvent, appUrl: string) => {
      const ridesCount = event.rides.length;
      return `🚗 *מתארגנים על טרמפים ל-${event.title}!* 🚗

מי שנוהג/ת עם מקום פנוי, או מי שצריך/ה טרמפ - אנא עדכנו בטבלה כדי שכולם יוכלו להגיע בנוחות ובקלות:

${appUrl}

כרגע מוצעים במערכת ${ridesCount} רכבים. אל תישארו בלי טרמפ! 🤝✨`;
    },
  },
];
