/**
 * Google Sheets API Integration Service
 */

export interface SheetInfo {
  id: number;
  title: string;
  rowCount: number;
  columnCount: number;
}

export interface SpreadsheetData {
  id: string;
  title: string;
  sheets: SheetInfo[];
}

export interface SheetMapping {
  tabName: string;
  nameColumnIndex: number;
  nameColumnLetter: string;
  headerRowIndex: number;
  memberRowMap: Record<string, number>; // memberName (trimmed/normalized) -> 1-based row number
  eventColMap: Record<string, string>; // event identifier/title -> column letter (e.g. "AE")
  headers: string[];
}

export function columnIndexToLetter(colIndex: number): string {
  let temp = colIndex + 1;
  let letter = '';
  while (temp > 0) {
    const rem = (temp - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    temp = Math.floor((temp - 1) / 26);
  }
  return letter;
}

export function letterToColumnIndex(letter: string): number {
  let col = 0;
  for (let i = 0; i < letter.length; i++) {
    col = col * 26 + (letter.charCodeAt(i) - 64);
  }
  return col - 1;
}

export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken: string
): Promise<SpreadsheetData> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=spreadsheetId,properties.title,sheets.properties`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch spreadsheet (${res.status})`);
  }

  const data = await res.json();
  const sheets: SheetInfo[] = (data.sheets || []).map((s: any) => ({
    id: s.properties?.sheetId,
    title: s.properties?.title || 'Sheet1',
    rowCount: s.properties?.gridProperties?.rowCount || 100,
    columnCount: s.properties?.gridProperties?.columnCount || 50,
  }));

  return {
    id: data.spreadsheetId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    sheets,
  };
}

export async function readSheetValues(
  spreadsheetId: string,
  range: string,
  accessToken: string
): Promise<string[][]> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const encodedRange = encodeURIComponent(range);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodedRange}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to read range ${range} (${res.status})`);
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Updates a single cell or a small range directly in Google Sheets.
 * If value is boolean (true/false), Sheets checkbox will render it as checked/unchecked!
 */
export async function updateSingleCell(
  spreadsheetId: string,
  range: string,
  value: boolean | string | number,
  accessToken: string
): Promise<void> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const encodedRange = encodeURIComponent(range);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [[value]],
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to update cell ${range} (${res.status})`);
  }
}

export async function writeSheetValues(
  spreadsheetId: string,
  range: string,
  values: (string | number | boolean)[][],
  accessToken: string
): Promise<{ updatedCells: number; updatedRows: number }> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const encodedRange = encodeURIComponent(range);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to update sheet range ${range} (${res.status})`);
  }

  const data = await res.json();
  return {
    updatedCells: data.updatedCells || 0,
    updatedRows: data.updatedRows || 0,
  };
}

/**
 * Builds the row and column mapping for the sheet so we can instantly update cells.
 */
export async function buildSheetMapping(
  spreadsheetId: string,
  tabName: string,
  accessToken: string
): Promise<SheetMapping> {
  // Read top 150 rows and up to 50 columns
  const range = `'${tabName}'!A1:AZ150`;
  const rows = await readSheetValues(spreadsheetId, range, accessToken);

  if (!rows || rows.length === 0) {
    throw new Error(`הגליון ${tabName} ריק`);
  }

  // Look for header row that contains "שם"
  let nameColIdx = 1; // Default to Column B
  let headerRowIdx = 1; // 0-based index (Row 2 in 1-based)
  let foundHeader = false;

  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const cell = (row[c] || '').trim();
      if (cell === 'שם' || cell.includes('שם מלא')) {
        nameColIdx = c;
        headerRowIdx = r;
        foundHeader = true;
        break;
      }
    }
    if (foundHeader) break;
  }

  const headers = rows[headerRowIdx] || [];
  const eventColMap: Record<string, string> = {};

  // Map header columns
  headers.forEach((headerText, colIdx) => {
    if (!headerText) return;
    const colLetter = columnIndexToLetter(colIdx);
    const cleanHeader = headerText.trim().toLowerCase();
    eventColMap[cleanHeader] = colLetter;
  });

  // Map member names to 1-based row numbers
  const memberRowMap: Record<string, number> = {};
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    const name = (row[nameColIdx] || '').trim();
    if (name) {
      memberRowMap[name] = r + 1; // 1-based row
    }
  }

  return {
    tabName,
    nameColumnIndex: nameColIdx,
    nameColumnLetter: columnIndexToLetter(nameColIdx),
    headerRowIndex: headerRowIdx,
    memberRowMap,
    eventColMap,
    headers,
  };
}

/**
 * Intelligently matches an event title to the best column letter in the sheet mapping
 */
export function findMatchingColumnForEvent(
  eventTitle: string,
  eventDateStr: string,
  mapping: SheetMapping
): string | null {
  const normTitle = eventTitle.trim().toLowerCase();
  const normDate = eventDateStr.trim().toLowerCase();

  // 1. Direct exact or partial match with header
  for (const [header, col] of Object.entries(mapping.eventColMap)) {
    if (header.includes(normTitle) || normTitle.includes(header)) {
      return col;
    }
  }

  // 2. Keyword heuristic matches for Midburn dates:
  // e.g. "הקמות 30.10", "הקמות 31.10", "הקמות 1.11", "פירוקים 7.11", "מחסנים 8.11"
  const keywords = [
    { key: '30.10', match: '30.10' },
    { key: '31.10', match: '31.10' },
    { key: '1.11', match: '1.11' },
    { key: 'פירוקים', match: 'פירוקים' },
    { key: 'מחסן', match: 'מחסן' },
    { key: 'העמסות', match: 'העמסות' },
    { key: 'באגם', match: 'באגם' },
    { key: 'באומן', match: 'אומן' },
    { key: 'איסוף עם אורי', match: 'אורי' },
    { key: 'יום יצירה 1', match: 'יצירה' },
  ];

  for (const kw of keywords) {
    if (normTitle.includes(kw.key) || normDate.includes(kw.key)) {
      for (const [header, col] of Object.entries(mapping.eventColMap)) {
        if (header.includes(kw.match)) {
          return col;
        }
      }
    }
  }

  return null;
}

export async function createNewSpreadsheet(
  title: string,
  sheetName: string,
  headers: string[],
  rows: (string | number | boolean)[][],
  accessToken: string
): Promise<{ spreadsheetId: string; url: string }> {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: sheetName,
            rightToLeft: true,
            gridProperties: {
              frozenRowCount: 2,
            },
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create new spreadsheet (${res.status})`);
  }

  const created = await res.json();
  const spreadsheetId = created.spreadsheetId;

  if (headers.length > 0 || rows.length > 0) {
    const allValues = [headers, ...rows];
    await writeSheetValues(spreadsheetId, `'${sheetName}'!A1`, allValues, accessToken);
  }

  return {
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

