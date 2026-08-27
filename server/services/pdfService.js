const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const payslipsDir = path.join(__dirname, '..', 'uploads', 'payslips');
if (!fs.existsSync(payslipsDir)) fs.mkdirSync(payslipsDir, { recursive: true });

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatCurrency(n) {
  return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Renders a professional payslip PDF to disk and returns the relative file path.
 *
 * @param {Object} data
 * @param {Object} data.company - { companyName, address, email, phone, logo }
 * @param {Object} data.employee - Employee document (populated department)
 * @param {Object} data.payroll - Payroll document
 * @param {String} data.payslipNumber
 */
async function generatePayslipPDF({ company, employee, payroll, payslipNumber }) {
  const fileName = `${payslipNumber}.pdf`;
  const filePath = path.join(payslipsDir, fileName);
  const relativePath = path.join('uploads', 'payslips', fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const blue = '#4338ca';
    const gray = '#6b7280';
    const lightGray = '#f3f4f6';
    const black = '#111827';

    // ---- Header: company info ----
    doc.fillColor(blue).fontSize(20).font('Helvetica-Bold').text(company.companyName || 'Company Name', 50, 50);
    doc.fillColor(gray).fontSize(9).font('Helvetica')
      .text(company.address || '', 50, 75)
      .text(`${company.email || ''}   ${company.phone || ''}`, 50, 88);

    doc.fillColor(black).fontSize(16).font('Helvetica-Bold').text('PAYSLIP', 400, 50, { width: 145, align: 'right' });
    doc.fillColor(gray).fontSize(9).font('Helvetica')
      .text(`Pay Period: ${MONTH_NAMES[payroll.month - 1]} ${payroll.year}`, 400, 72, { width: 145, align: 'right' })
      .text(`Payslip No: ${payslipNumber}`, 400, 85, { width: 145, align: 'right' })
      .text(`Status: ${payroll.status}`, 400, 98, { width: 145, align: 'right' });

    doc.moveTo(50, 115).lineTo(545, 115).strokeColor('#e5e7eb').stroke();

    // ---- Employee info ----
    let y = 130;
    doc.fillColor(black).fontSize(11).font('Helvetica-Bold').text('Employee Information', 50, y);
    y += 18;
    const empCol1 = [
      ['Employee Name', `${employee.firstName} ${employee.lastName}`],
      ['Employee ID', employee.employeeId],
      ['Department', employee.department?.name || '-'],
      ['Position', employee.position],
    ];
    const empCol2 = [
      ['Bank Account', employee.bankDetails?.accountNumber || '-'],
      ['IFSC / Routing', employee.bankDetails?.ifsc || '-'],
      ['Employment Type', employee.employmentType],
      ['Joining Date', new Date(employee.joiningDate).toLocaleDateString('en-US')],
    ];
    doc.fontSize(9).font('Helvetica');
    empCol1.forEach(([label, val], i) => {
      doc.fillColor(gray).text(`${label}:`, 50, y + i * 15, { continued: true }).fillColor(black).text(`  ${val}`);
    });
    empCol2.forEach(([label, val], i) => {
      doc.fillColor(gray).text(`${label}:`, 300, y + i * 15, { continued: true }).fillColor(black).text(`  ${val}`);
    });

    y += empCol1.length * 15 + 20;
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
    y += 15;

    // ---- Earnings / Deductions table ----
    const tableTop = y;
    const colWidths = { label: 220, amount: 100 };
    doc.fontSize(10).font('Helvetica-Bold').fillColor(black);
    doc.rect(50, tableTop, 245, 20).fill(lightGray);
    doc.rect(300, tableTop, 245, 20).fill(lightGray);
    doc.fillColor(black).text('Earnings', 58, tableTop + 5);
    doc.text('Amount', 50 + colWidths.label, tableTop + 5, { width: colWidths.amount, align: 'right' });
    doc.text('Deductions', 308, tableTop + 5);
    doc.text('Amount', 300 + colWidths.label, tableTop + 5, { width: colWidths.amount, align: 'right' });

    const earningsRows = [
      ['Basic Salary', payroll.basicSalary],
      ['HRA', payroll.earnings.hra],
      ['Transport Allowance', payroll.earnings.transportAllowance],
      ['Medical Allowance', payroll.earnings.medicalAllowance],
      ['Special Allowance', payroll.earnings.specialAllowance],
      ['Bonus', payroll.earnings.bonus],
      ['Overtime', payroll.earnings.overtime],
    ];
    const deductionsRows = [
      ['Provident Fund (PF)', payroll.deductions.pf],
      ['Professional Tax', payroll.deductions.professionalTax],
      ['TDS', payroll.deductions.tds],
      ['Insurance', payroll.deductions.insurance],
      ['Loan Deduction', payroll.deductions.loanDeduction],
      ['Other Deductions', payroll.deductions.otherDeductions],
    ];

    let rowY = tableTop + 25;
    doc.font('Helvetica').fontSize(9);
    const maxRows = Math.max(earningsRows.length, deductionsRows.length);
    for (let i = 0; i < maxRows; i += 1) {
      if (earningsRows[i]) {
        doc.fillColor(gray).text(earningsRows[i][0], 58, rowY);
        doc.fillColor(black).text(formatCurrency(earningsRows[i][1]), 50 + colWidths.label, rowY, { width: colWidths.amount, align: 'right' });
      }
      if (deductionsRows[i]) {
        doc.fillColor(gray).text(deductionsRows[i][0], 308, rowY);
        doc.fillColor(black).text(formatCurrency(deductionsRows[i][1]), 300 + colWidths.label, rowY, { width: colWidths.amount, align: 'right' });
      }
      rowY += 16;
    }

    rowY += 8;
    doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor('#e5e7eb').stroke();
    rowY += 12;

    // ---- Totals ----
    doc.font('Helvetica-Bold').fontSize(10);
    doc.fillColor(black).text('Gross Salary', 58, rowY);
    doc.text(formatCurrency(payroll.grossSalary), 50 + colWidths.label, rowY, { width: colWidths.amount, align: 'right' });
    doc.fillColor(black).text('Total Deductions', 308, rowY);
    doc.text(formatCurrency(payroll.totalDeductions), 300 + colWidths.label, rowY, { width: colWidths.amount, align: 'right' });

    rowY += 30;
    doc.rect(50, rowY, 495, 34).fill(blue);
    doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold')
      .text('NET SALARY', 65, rowY + 10)
      .text(formatCurrency(payroll.netSalary), 300, rowY + 10, { width: 230, align: 'right' });

    rowY += 55;
    doc.fillColor(gray).fontSize(8).font('Helvetica')
      .text(
        'This is a computer-generated payslip and does not require a signature. For questions about this payslip, please contact HR/Payroll.',
        50,
        rowY,
        { width: 495 }
      );

    doc.end();
    stream.on('finish', () => resolve(relativePath));
    stream.on('error', reject);
  });
}

module.exports = { generatePayslipPDF };
