import React, { useState } from 'react';
import { CampMember, CreationEvent } from '../types';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  Check,
  AlertTriangle,
  ExternalLink,
  Plus,
  LogIn,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import {
  fetchSpreadsheetMetadata,
  readSheetValues,
  writeSheetValues,
  createNewSpreadsheet,
  extractSpreadsheetId,
  SpreadsheetData,
} from '../services/sheets';
import { getAccessToken, googleSignIn, logout } from '../services/auth';
import { User } from 'firebase/auth';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: CampMember[];
  events: CreationEvent[];
  googleUser: User | null;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  connectedSheetId: string | null;
  setConnectedSheetId: (id: string | null) => void;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (val: boolean) => void;
  selectedSheetTab: string;
  setSelectedSheetTab: (tab: string) => void;
  onDataImported?: (members: CampMember[], events: CreationEvent[]) => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  members,
  events,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  connectedSheetId,
  setConnectedSheetId,
  autoSyncEnabled,
  setAutoSyncEnabled,
  selectedSheetTab,
  setSelectedSheetTab,
  onDataImported,
}) => {
  const [sheetInput, setSheetInput] = useState(connectedSheetId || '');
  const [sheetMetadata, setSheetMetadata] = useState<SpreadsheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Destructive/Mutating Confirmation State (Mandatory Workspace Skill Requirement)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'push' | 'create' | null>(null);

  if (!isOpen) return null;

  const handleFetchMetadata = async () => {
    try {
      setLoading(true);
      setStatusMessage(null);
      const token = await getAccessToken();
      if (!token) {
        throw new Error('יש להתחבר עם גוגל קודם לכן');
      }

      const cleanId = extractSpreadsheetId(sheetInput);
      if (!cleanId) {
        throw new Error('אנא הזן קישור או מזהה קובץ Google Sheets תקין');
      }

      const meta = await fetchSpreadsheetMetadata(cleanId, token);
      setSheetMetadata(meta);
      setConnectedSheetId(cleanId);
      
      // Auto-detect the creation days tab from the screenshot
      const preferredTab = meta.sheets.find((s) => s.title.includes('הקמות') || s.title.includes('יצירה'));
      if (preferredTab) {
        setSelectedSheetTab(preferredTab.title);
      } else if (meta.sheets.length > 0 && !selectedSheetTab) {
        setSelectedSheetTab(meta.sheets[0].title);
      }
      
      setStatusMessage({ 
        type: 'success', 
        text: `נמצא קובץ: "${meta.title}" עם ${meta.sheets.length} גליונות! סנכרון מיידי פעיל.` 
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'שגיאה בחיבור לקובץ' });
    } finally {
      setLoading(false);
    }
  };

  // Prepares tabular matrix data for Google Sheets
  const generateExportData = () => {
    const headers = [
      'מס\'',
      'שם',
      'מין',
      'מייל',
      'ת״ז',
      'מקום מגורים',
      'טלפון נייד',
      'אינסטה',
      'מתנות / תפקיד',
      'סטאטוס',
      'הקצאה',
      ...events.map((e) => `${e.title} (${e.dateStr})`),
    ];

    const rows = members.map((m, idx) => {
      const eventStatuses = events.map((e) => {
        const reg = e.registeredMembers.find((r) => r.memberId === m.id);
        if (!reg) return '';
        if (reg.status === 'attending') return 'כן (מגיע)';
        if (reg.status === 'not_attending') return 'לא';
        return 'אולי';
      });

      return [
        idx + 1,
        m.name,
        m.gender,
        m.email,
        m.idNumber || '',
        m.city,
        m.phone,
        m.insta || '',
        m.gifts || '',
        m.status,
        m.allocationSource || '',
        ...eventStatuses,
      ];
    });

    return { headers, rows };
  };

  // Triggers confirmation modal before any mutate
  const promptPushToSheet = () => {
    setPendingAction('push');
    setShowConfirmModal(true);
  };

  const promptCreateNewSheet = () => {
    setPendingAction('create');
    setShowConfirmModal(true);
  };

  // Executes the confirmed operation
  const handleExecuteConfirmedAction = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setStatusMessage(null);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('נא להתחבר מחדש עם חשבון גוגל');

      const { headers, rows } = generateExportData();

      if (pendingAction === 'push') {
        const cleanId = extractSpreadsheetId(sheetInput);
        if (!cleanId) throw new Error('לא נבחר קובץ Sheets');

        const tab = selectedSheetTab || 'Sheet1';
        const allData = [headers, ...rows];

        const result = await writeSheetValues(cleanId, `${tab}!A1`, allData, token);
        setStatusMessage({
          type: 'success',
          text: `סונכרן בהצלחה! עודכנו ${result.updatedRows} שורות ו-${result.updatedCells} תאים ב-Google Sheets.`,
        });
      } else if (pendingAction === 'create') {
        const newSheet = await createNewSpreadsheet(
          'קמפ אקסטטיקה - ימי יצירה ומדברן 2026',
          'מעקב ימי יצירה',
          headers,
          rows,
          token
        );
        setConnectedSheetId(newSheet.spreadsheetId);
        setSheetInput(newSheet.spreadsheetId);
        setStatusMessage({
          type: 'success',
          text: `נוצר גליון חדש בהצלחה ב-Google Drive שלך! לחץ לפתיחתו למטה.`,
        });
        window.open(newSheet.url, '_blank');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'שגיאה בעדכון הגיליון' });
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  // CSV Direct Download Backup
  const handleDownloadCSV = () => {
    const { headers, rows } = generateExportData();
    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) =>
          row
            .map((val) => {
              const str = String(val ?? '');
              return `"${str.replace(/"/g, '""')}"`;
            })
            .join(',')
        )
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ecstatica_creation_days_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#15192c] border border-emerald-500/40 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-right">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#162529] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                חיבור וסנכרון Google Sheets
              </h2>
              <p className="text-xs text-slate-400">
                קריאה וכתיבה ישירה של ימי יצירה ומעקב נוכחות
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
              }`}
            >
              {statusMessage.type === 'success' && <Check className="w-4 h-4 shrink-0" />}
              {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Google Auth Status Section */}
          <div className="bg-[#121526] border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-white block">
                  {googleUser ? `מחובר כ: ${googleUser.email}` : 'חשבון Google לא מחובר'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {googleUser
                    ? 'הרשאת גישה לגוגל שיטס פעילה'
                    : 'התחבר כדי לקרוא ולעדכן גליונות בחשבונך'}
                </span>
              </div>
            </div>

            {googleUser ? (
              <button
                onClick={onGoogleSignOut}
                className="text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 flex items-center gap-1 font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                התנתק
              </button>
            ) : (
              <button
                onClick={onGoogleSignIn}
                className="bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-lg shadow flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                התחבר עם גוגל
              </button>
            )}
          </div>

          {/* Instant Live Auto-Sync Switch Card */}
          <div className="bg-gradient-to-r from-emerald-950/50 to-teal-950/30 border border-emerald-500/40 p-4 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-extrabold text-sm text-white">
                  סנכרון מיידי בזמן אמת (Live Auto-Sync)
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded-full font-bold">
                  מומלץ
                </span>
              </div>
              <p className="text-xs text-slate-300">
                ברגע שמופעל, כל חבר/ה שמסמן הגעה באתר מעדכן אוטומטית ובאופן מיידי את הצ'קבוקס (Checkbox) שלו בקובץ Google Sheets!
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer mr-3">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Connect by URL or ID */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              קישור לקובץ Google Sheets קיים או מזהה קובץ (Spreadsheet ID):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sheetInput}
                onChange={(e) => setSheetInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                dir="ltr"
                className="flex-1 bg-[#121526] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
              />
              <button
                onClick={handleFetchMetadata}
                disabled={loading || !sheetInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                טען
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              טיפ: אפשר להדביק ישירות את כתובת ה-URL של האקסל בדפדפן.
            </p>
          </div>

          {/* Sheet Details if loaded */}
          {sheetMetadata && (
            <div className="bg-[#1a2038] border border-emerald-500/30 rounded-xl p-3 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{sheetMetadata.title}</span>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${sheetMetadata.id}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <ExternalLink className="w-3 h-3" /> פתח ב-Sheets
                </a>
              </div>

              {sheetMetadata.sheets.length > 1 && (
                <div>
                  <label className="text-slate-400 block text-[11px] mb-1">
                    בחר לשונית (Tab) לעדכון:
                  </label>
                  <select
                    value={selectedSheetTab}
                    onChange={(e) => setSelectedSheetTab(e.target.value)}
                    className="w-full bg-[#121526] border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                  >
                    {sheetMetadata.sheets.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            
            {/* Push Sync Button */}
            <button
              onClick={promptPushToSheet}
              disabled={loading || !sheetInput.trim() || !googleUser}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow"
            >
              <Upload className="w-4 h-4" />
              דחוף עדכונים ל-Google Sheets
            </button>

            {/* Create New Sheet Button */}
            <button
              onClick={promptCreateNewSheet}
              disabled={loading || !googleUser}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow"
            >
              <Plus className="w-4 h-4" />
              צור קובץ Sheets חדש בדרייב
            </button>
          </div>

          {/* Backup CSV Download */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={handleDownloadCSV}
              className="w-full bg-[#1b2038] hover:bg-slate-800 text-slate-300 font-semibold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700"
            >
              <Download className="w-4 h-4 text-amber-400" />
              הורד גיבוי מלא של הטבלה כקובץ אקסל (CSV) למחשב/טלפון
            </button>
          </div>
        </div>
      </div>

      {/* Mandatory Destructive Action Confirmation Dialog */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 animate-in fade-in duration-150">
          <div className="bg-[#1b2038] border border-amber-500/60 rounded-2xl p-5 max-w-md w-full shadow-2xl text-right space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-white">
                אישור פעולת סנכרון ל-Google Sheets
              </h3>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed space-y-2 bg-[#121526] p-3 rounded-xl border border-slate-800">
              {pendingAction === 'push' ? (
                <>
                  <p>
                    פעולה זו תעדכן את הגליון <strong>"{selectedSheetTab || 'Sheet1'}"</strong> בקובץ Google Sheets.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>סה״כ שורות שיעודכנו: <strong>{members.length} חברי קמפ</strong></li>
                    <li>עמודות אירועים שיסונכרנו: <strong>{events.length} ימי יצירה ואירועים</strong></li>
                    <li>הנתונים הקיימים בטווח זה יידרסו על ידי הרישומים העדכניים מהאפליקציה.</li>
                  </ul>
                </>
              ) : (
                <p>
                  פעולה זו תיצור גיליון Google Sheets חדש בחשבון ה-Google Drive שלך בשם:
                  <br />
                  <strong>"קמפ אקסטטיקה - ימי יצירה ומדברן 2026"</strong>, ותזין לתוכו את כל {members.length} חברי הקמפ וימי היצירה.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleExecuteConfirmedAction}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow"
              >
                אישור, בצע סנכרון עכשיו
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 text-xs"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
