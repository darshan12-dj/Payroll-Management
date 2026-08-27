const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Converts an array of flat row objects to CSV text.
 */
function toCSV(rows, columns) {
  const header = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  return [header, ...lines].join('\n');
}

/**
 * Builds an .xlsx workbook buffer from rows + column definitions.
 */
async function toExcelBuffer(rows, columns, sheetName = 'Report') {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ header: c.label, key: c.key, width: c.width || 20 }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));
  return workbook.xlsx.writeBuffer();
}

/**
 * Builds a simple tabular PDF report buffer.
 */
function toPDFBuffer(title, rows, columns) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, layout: 'landscape' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).font('Helvetica-Bold').fillColor('#4338ca').text(title, { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('#6b7280').font('Helvetica').text(`Generated: ${new Date().toLocaleString('en-US')}`);
    doc.moveDown(1);

    const startX = 40;
    let y = doc.y;
    const colWidth = (doc.page.width - 80) / columns.length;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827');
    columns.forEach((c, i) => doc.text(c.label, startX + i * colWidth, y, { width: colWidth - 4 }));
    y += 16;
    doc.moveTo(startX, y).lineTo(doc.page.width - 40, y).strokeColor('#e5e7eb').stroke();
    y += 6;

    doc.font('Helvetica').fontSize(8).fillColor('#111827');
    rows.forEach((row) => {
      if (y > doc.page.height - 60) {
        doc.addPage({ layout: 'landscape' });
        y = 40;
      }
      columns.forEach((c, i) => {
        doc.text(String(row[c.key] ?? ''), startX + i * colWidth, y, { width: colWidth - 4 });
      });
      y += 14;
    });

    doc.end();
  });
}

module.exports = { toCSV, toExcelBuffer, toPDFBuffer };
