import { strToU8, zipSync } from "fflate";

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function xmlEscape(value) {
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function excelDate(value) {
  const milliseconds = new Date(value).getTime();
  if (!Number.isFinite(milliseconds)) {
    throw new Error("The event or booking contains an invalid date.");
  }
  return ((milliseconds - EXCEL_EPOCH_MS) / 86_400_000).toFixed(10);
}

function inlineStringCell(reference, value, style = "") {
  return `<c r="${reference}" t="inlineStr"${style}><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
}

function numberCell(reference, value, style = "") {
  return `<c r="${reference}"${style}><v>${value}</v></c>`;
}

function worksheetXml(event, bookings) {
  const attendeeRows = bookings.map((booking, index) => {
    const rowNumber = index + 5;
    return `<row r="${rowNumber}">${inlineStringCell(`A${rowNumber}`, booking.user_name)}${numberCell(`B${rowNumber}`, booking.id)}${numberCell(`C${rowNumber}`, booking.quantity ?? 1)}${numberCell(`D${rowNumber}`, excelDate(booking.booking_date), ' s="1"')}</row>`;
  });
  const lastRow = Math.max(4, bookings.length + 4);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:D${lastRow}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols><col min="1" max="1" width="32" customWidth="1"/><col min="2" max="2" width="16" customWidth="1"/><col min="3" max="3" width="14" customWidth="1"/><col min="4" max="4" width="26" customWidth="1"/></cols>
  <sheetData>
    <row r="1">${inlineStringCell("A1", "Event")}${inlineStringCell("B1", event.name)}</row>
    <row r="2">${inlineStringCell("A2", "Event date (UTC)")}${numberCell("B2", excelDate(event.date), ' s="1"')}</row>
    <row r="4">${inlineStringCell("A4", "Attendee name", ' s="2"')}${inlineStringCell("B4", "Booking ID", ' s="2"')}${inlineStringCell("C4", "Seats", ' s="2"')}${inlineStringCell("D4", "Booking date (UTC)", ' s="2"')}</row>
    ${attendeeRows.join("\n    ")}
  </sheetData>
  <autoFilter ref="A4:D${lastRow}"/>
</worksheet>`;
}

function workbookFiles(event, bookings) {
  return {
    "[Content_Types].xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    ),
    "_rels/.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    ),
    "xl/workbook.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Attendees" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    ),
    "xl/styles.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="mmm d, yyyy h:mm AM/PM"/></numFmts>
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`,
    ),
    "xl/worksheets/sheet1.xml": strToU8(worksheetXml(event, bookings)),
  };
}

function safeFileName(event) {
  const eventName = event.name
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${eventName || `event-${event.id}`}-attendees.xlsx`;
}

export function createEventBookingsWorkbook(event, bookings) {
  return zipSync(workbookFiles(event, bookings), { level: 6 });
}

export function downloadEventBookings(event, bookings) {
  const workbook = createEventBookingsWorkbook(event, bookings);
  const blob = new Blob([workbook], { type: XLSX_MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFileName(event);
  document.body.appendChild(link);

  try {
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
