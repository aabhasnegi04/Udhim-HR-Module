import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Convert a number to Indian words (for net salary in words)
 */
function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convert(n) {
        if (n === 0) return '';
        if (n < 20) return ones[n] + ' ';
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '') + ' ';
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + convert(n % 100);
        if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + convert(n % 1000);
        if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + convert(n % 100000);
        return convert(Math.floor(n / 10000000)) + 'Crore ' + convert(n % 10000000);
    }

    const intPart = Math.floor(Math.abs(num));
    const result = convert(intPart).trim();
    return (result || 'Zero') + ' Only';
}

/**
 * Format currency in Indian style
 */
function fmt(amount) {
    return '₹' + (parseFloat(amount) || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Build the hidden payslip HTML element, capture it, and download as PDF.
 * @param {object} payslipData  - { employee_details, earnings, deductions, adjustments }
 * @param {object} companyInfo  - { name, address, email, phone, website }
 */
export async function generatePayslipPDF(payslipData, companyInfo = {}) {
    const { employee_details: emp, earnings = [], deductions = [], adjustments = [] } = payslipData;

    const company = {
        name: companyInfo.name || 'Your Company Pvt. Ltd.',
        address: companyInfo.address || 'Corporate Address, City - 000000',
        email: companyInfo.email || 'hr@company.com',
        phone: companyInfo.phone || '',
        website: companyInfo.website || '',
    };

    // Compute totals
    const totalEarnings = earnings.reduce((s, i) => s + (parseFloat(i.calculated_amount) || 0), 0);
    const totalDeductions = deductions.reduce((s, i) => s + (parseFloat(i.calculated_amount) || 0), 0);
    const posAdj = adjustments.filter(a => parseFloat(a.calculated_amount) > 0);
    const negAdj = adjustments.filter(a => parseFloat(a.calculated_amount) < 0);
    const totalPosAdj = posAdj.reduce((s, a) => s + parseFloat(a.calculated_amount), 0);
    const totalNegAdj = negAdj.reduce((s, a) => s + Math.abs(parseFloat(a.calculated_amount)), 0);
    const grossEarnings = totalEarnings + totalPosAdj;
    const grossDeductions = totalDeductions + totalNegAdj;
    const netSalary = grossEarnings - grossDeductions;

    // Attendance
    const daysInMonth = emp.days_in_month || 30;
    const daysWorked = emp.days_worked || daysInMonth;
    const daysAbsent = emp.days_absent || 0;
    const daysLeave = emp.days_leave || 0;

    const joiningDate = emp.date_of_joining
        ? new Date(emp.date_of_joining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : null;

    // Mask bank account
    const bankAccount = emp.bank_account_number
        ? 'XXXX' + String(emp.bank_account_number).slice(-4)
        : null;    // Build earnings rows HTML
    const earningsRows = [
        ...earnings.map(e => `
            <tr>
                <td class="item-name">${e.component_name}</td>
                <td class="item-amount">${fmt(e.calculated_amount)}</td>
            </tr>`),
        ...posAdj.map(a => `
            <tr class="adj-row">
                <td class="item-name">${a.component_name} <span class="badge badge-green">${a.adjustment_type}</span></td>
                <td class="item-amount">${fmt(a.calculated_amount)}</td>
            </tr>`)
    ].join('');

    const deductionsRows = [
        ...deductions.map(d => `
            <tr>
                <td class="item-name">${d.component_name}</td>
                <td class="item-amount">${fmt(d.calculated_amount)}</td>
            </tr>`),
        ...negAdj.map(a => `
            <tr class="adj-row">
                <td class="item-name">${a.component_name} <span class="badge badge-red">${a.adjustment_type}</span></td>
                <td class="item-amount">${fmt(Math.abs(parseFloat(a.calculated_amount)))}</td>
            </tr>`)
    ].join('');

    // Pad shorter column with empty rows so table looks balanced
    const earningsCount = earnings.length + posAdj.length;
    const deductionsCount = deductions.length + negAdj.length;
    const diff = earningsCount - deductionsCount;
    const earningsPad = diff < 0 ? Array(-diff).fill('<tr><td>&nbsp;</td><td></td></tr>').join('') : '';
    const deductionsPad = diff > 0 ? Array(diff).fill('<tr><td>&nbsp;</td><td></td></tr>').join('') : '';

    const paymentDate = emp.salary_date
        ? new Date(emp.salary_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
        : 'N/A';

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 12px;
    color: #1a1a2e;
    background: #fff;
    width: 794px;
  }
  .payslip {
    width: 794px;
    min-height: 1123px;
    padding: 32px 36px;
    background: #fff;
    position: relative;
  }

  /* ── HEADER ── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 3px solid #1565c0;
    margin-bottom: 6px;
  }
  .company-logo {
    width: 52px; height: 52px;
    background: #1565c0;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 22px; font-weight: 800;
    flex-shrink: 0;
  }
  .company-info { flex: 1; padding-left: 14px; }
  .company-name { font-size: 18px; font-weight: 700; color: #1565c0; letter-spacing: 0.5px; }
  .company-sub { font-size: 10px; color: #555; margin-top: 2px; }
  .payslip-title {
    text-align: right;
  }
  .payslip-title h2 {
    font-size: 15px; font-weight: 700; color: #1565c0;
    text-transform: uppercase; letter-spacing: 1px;
  }
  .payslip-title p { font-size: 11px; color: #555; margin-top: 3px; }

  /* ── STATUS BADGE ── */
  .status-bar {
    background: #e3f2fd;
    border-left: 4px solid #1565c0;
    padding: 6px 12px;
    margin: 10px 0;
    display: flex; justify-content: space-between; align-items: center;
    border-radius: 0 4px 4px 0;
  }
  .status-bar span { font-size: 11px; color: #1565c0; font-weight: 600; }
  .status-pill {
    background: #1565c0; color: #fff;
    padding: 2px 10px; border-radius: 20px;
    font-size: 10px; font-weight: 600; letter-spacing: 0.5px;
  }

  /* ── SECTION TITLE ── */
  .section-title {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 1px; color: #1565c0;
    background: #e8f0fe;
    padding: 4px 10px;
    margin-bottom: 0;
    border-radius: 3px 3px 0 0;
  }

  /* ── INFO GRID ── */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border: 1px solid #dde3f0;
    border-top: none;
    border-radius: 0 0 4px 4px;
    margin-bottom: 14px;
    overflow: hidden;
  }
  .info-row {
    display: flex;
    padding: 6px 10px;
    border-bottom: 1px solid #eef1f8;
  }
  .info-row:last-child { border-bottom: none; }
  .info-label { color: #666; width: 130px; flex-shrink: 0; font-size: 11px; }
  .info-value { font-weight: 600; color: #1a1a2e; font-size: 11px; }

  /* ── ATTENDANCE ── */
  .attendance-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border: 1px solid #dde3f0;
    border-top: none;
    border-radius: 0 0 4px 4px;
    margin-bottom: 14px;
    overflow: hidden;
  }
  .att-cell {
    text-align: center;
    padding: 10px 6px;
    border-right: 1px solid #eef1f8;
  }
  .att-cell:last-child { border-right: none; }
  .att-num { font-size: 20px; font-weight: 700; color: #1565c0; }
  .att-label { font-size: 10px; color: #666; margin-top: 2px; }

  /* ── EARNINGS / DEDUCTIONS TABLE ── */
  .ed-wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border: 1px solid #dde3f0;
    border-top: none;
    border-radius: 0 0 4px 4px;
    margin-bottom: 14px;
    overflow: hidden;
  }
  .ed-col { border-right: 1px solid #dde3f0; }
  .ed-col:last-child { border-right: none; }
  .ed-col-title {
    padding: 6px 10px;
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .earn-title { background: #e8f5e9; color: #2e7d32; }
  .ded-title  { background: #fce4ec; color: #c62828; }
  table.ed-table { width: 100%; border-collapse: collapse; }
  table.ed-table tr { border-bottom: 1px solid #f0f0f0; }
  table.ed-table tr:last-child { border-bottom: none; }
  table.ed-table td { padding: 5px 10px; font-size: 11px; }
  td.item-name  { color: #333; }
  td.item-amount { text-align: right; font-weight: 600; color: #1a1a2e; white-space: nowrap; }
  .adj-row td.item-name { color: #2e7d32; }
  .badge {
    display: inline-block;
    font-size: 8px; font-weight: 700;
    padding: 1px 5px; border-radius: 8px;
    vertical-align: middle; margin-left: 4px;
    text-transform: uppercase;
  }
  .badge-green { background: #c8e6c9; color: #1b5e20; }
  .badge-red   { background: #ffcdd2; color: #b71c1c; }

  /* ── TOTALS ROW ── */
  .totals-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 1px solid #dde3f0;
    border-top: 2px solid #1565c0;
    margin-bottom: 14px;
    overflow: hidden;
    border-radius: 0 0 4px 4px;
  }
  .total-cell {
    padding: 8px 10px;
    display: flex; justify-content: space-between; align-items: center;
    border-right: 1px solid #dde3f0;
  }
  .total-cell:last-child { border-right: none; }
  .total-label { font-size: 11px; font-weight: 700; color: #333; }
  .total-earn  { font-size: 13px; font-weight: 800; color: #2e7d32; }
  .total-ded   { font-size: 13px; font-weight: 800; color: #c62828; }

  /* ── NET SALARY ── */
  .net-box {
    background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
    border-radius: 8px;
    padding: 16px 24px;
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 14px;
  }
  .net-left .net-label { color: #bbdefb; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
  .net-left .net-words { color: #e3f2fd; font-size: 10px; margin-top: 4px; font-style: italic; }
  .net-amount { color: #fff; font-size: 26px; font-weight: 800; letter-spacing: 0.5px; }

  /* ── PAYMENT INFO ── */
  .payment-grid {
    display: flex;
    flex-wrap: wrap;
    border: 1px solid #dde3f0;
    border-top: none;
    border-radius: 0 0 4px 4px;
    margin-bottom: 14px;
    overflow: hidden;
  }
  .pay-cell {
    flex: 1 1 150px;
    padding: 8px 10px;
    border-right: 1px solid #eef1f8;
    border-bottom: 1px solid #eef1f8;
    text-align: center;
  }
  .pay-cell:last-child { border-right: none; }
  .pay-label { font-size: 10px; color: #666; }
  .pay-value { font-size: 11px; font-weight: 700; color: #1a1a2e; margin-top: 2px; }

  /* ── FOOTER ── */
  .footer {
    border-top: 1px solid #dde3f0;
    padding-top: 10px;
    display: flex; justify-content: space-between; align-items: center;
    margin-top: auto;
  }
  .footer-note { font-size: 9px; color: #888; }
  .footer-contact { font-size: 9px; color: #1565c0; font-weight: 600; }
  .page-num { font-size: 9px; color: #aaa; }
</style>
</head>
<body>
<div class="payslip">

  <!-- HEADER -->
  <div class="header">
    <div style="display:flex;align-items:center;">
      <div class="company-logo">${company.name.charAt(0)}</div>
      <div class="company-info">
        <div class="company-name">${company.name}</div>
        <div class="company-sub">${company.address}</div>
      </div>
    </div>
    <div class="payslip-title">
      <h2>Payslip</h2>
      <p>${emp.period_name || ''}</p>
    </div>
  </div>

  <!-- STATUS BAR -->
  <div class="status-bar">
    <span>Pay Period: ${emp.period_name || ''} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString('en-IN')}</span>
    <span class="status-pill">${emp.payment_status || 'PENDING'}</span>
  </div>

  <!-- EMPLOYEE DETAILS -->
  <div class="section-title">Employee Details</div>
  <div class="info-grid">
    <div class="info-row"><span class="info-label">Employee Name</span><span class="info-value">${emp.employee_name || ''}</span></div>
    <div class="info-row"><span class="info-label">Employee ID</span><span class="info-value">${emp.employee_code || ''}</span></div>
    <div class="info-row"><span class="info-label">Department</span><span class="info-value">${emp.department || 'N/A'}</span></div>
    <div class="info-row"><span class="info-label">Designation</span><span class="info-value">${emp.designation || 'N/A'}</span></div>
    ${joiningDate ? `<div class="info-row"><span class="info-label">Date of Joining</span><span class="info-value">${joiningDate}</span></div>` : ''}
    ${emp.employee_email ? `<div class="info-row"><span class="info-label">Email</span><span class="info-value">${emp.employee_email}</span></div>` : ''}
    ${emp.phone ? `<div class="info-row"><span class="info-label">Phone</span><span class="info-value">${emp.phone}</span></div>` : ''}
    <div class="info-row"><span class="info-label">Pay Period</span><span class="info-value">${emp.period_name || ''}</span></div>
    ${bankAccount ? `<div class="info-row"><span class="info-label">Bank Account</span><span class="info-value">${bankAccount}</span></div>` : ''}
    ${emp.bank_name ? `<div class="info-row"><span class="info-label">Bank Name</span><span class="info-value">${emp.bank_name}</span></div>` : ''}
    ${emp.bank_ifsc_code ? `<div class="info-row"><span class="info-label">IFSC Code</span><span class="info-value">${emp.bank_ifsc_code}</span></div>` : ''}
    ${emp.bank_branch ? `<div class="info-row"><span class="info-label">Branch</span><span class="info-value">${emp.bank_branch}</span></div>` : ''}
  </div>

  <!-- ATTENDANCE -->
  <div class="section-title">Attendance Summary</div>
  <div class="attendance-grid">
    <div class="att-cell">
      <div class="att-num">${daysInMonth}</div>
      <div class="att-label">Days in Month</div>
    </div>
    <div class="att-cell">
      <div class="att-num" style="color:#2e7d32">${daysWorked}</div>
      <div class="att-label">Days Worked</div>
    </div>
    <div class="att-cell">
      <div class="att-num" style="color:#ed6c02">${daysLeave}</div>
      <div class="att-label">Leave Days</div>
    </div>
    <div class="att-cell">
      <div class="att-num" style="color:#c62828">${daysAbsent}</div>
      <div class="att-label">Absent Days</div>
    </div>
  </div>

  <!-- EARNINGS / DEDUCTIONS HEADER -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;">
    <div class="section-title" style="border-radius:3px 0 0 0;margin-right:1px;">Earnings</div>
    <div class="section-title" style="border-radius:0 3px 0 0;">Deductions</div>
  </div>

  <!-- EARNINGS / DEDUCTIONS TABLE -->
  <div class="ed-wrapper">
    <div class="ed-col">
      <table class="ed-table">
        ${earningsRows}
        ${earningsPad}
      </table>
    </div>
    <div class="ed-col">
      <table class="ed-table">
        ${deductionsRows}
        ${deductionsPad}
      </table>
    </div>
  </div>

  <!-- TOTALS -->
  <div class="totals-row">
    <div class="total-cell">
      <span class="total-label">Total Earnings</span>
      <span class="total-earn">${fmt(grossEarnings)}</span>
    </div>
    <div class="total-cell">
      <span class="total-label">Total Deductions</span>
      <span class="total-ded">${fmt(grossDeductions)}</span>
    </div>
  </div>

  <!-- NET SALARY -->
  <div class="net-box">
    <div class="net-left">
      <div class="net-label">Net Salary Payable</div>
      <div class="net-words">${numberToWords(netSalary)}</div>
    </div>
    <div class="net-amount">${fmt(netSalary)}</div>
  </div>

  <!-- PAYMENT DETAILS -->
  <div class="section-title">Payment Details</div>
  <div class="payment-grid">
    <div class="pay-cell">
      <div class="pay-label">Payment Mode</div>
      <div class="pay-value">Bank Transfer</div>
    </div>
    <div class="pay-cell">
      <div class="pay-label">Payment Date</div>
      <div class="pay-value">${paymentDate}</div>
    </div>
    <div class="pay-cell">
      <div class="pay-label">Payment Status</div>
      <div class="pay-value">${emp.payment_status || 'PENDING'}</div>
    </div>
    ${bankAccount ? `
    <div class="pay-cell">
      <div class="pay-label">Account Number</div>
      <div class="pay-value">${bankAccount}</div>
    </div>` : ''}
    ${emp.bank_name ? `
    <div class="pay-cell">
      <div class="pay-label">Bank Name</div>
      <div class="pay-value">${emp.bank_name}</div>
    </div>` : ''}
    ${emp.bank_ifsc_code ? `
    <div class="pay-cell">
      <div class="pay-label">IFSC Code</div>
      <div class="pay-value">${emp.bank_ifsc_code}</div>
    </div>` : ''}
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-note">This is a system-generated payslip and does not require a signature.</div>
    <div class="page-num">Page 1 of 1</div>
  </div>

</div>
</body>
</html>`;

    // Render into a hidden off-screen iframe for accurate capture
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:794px;height:1123px;border:none;';
    document.body.appendChild(iframe);

    await new Promise(resolve => {
        iframe.onload = resolve;
        iframe.srcdoc = html;
    });

    // Small delay for fonts/layout to settle
    await new Promise(r => setTimeout(r, 300));

    const canvas = await html2canvas(iframe.contentDocument.body, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794,
    });

    document.body.removeChild(iframe);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);

    const employeeName = (emp.employee_name || 'Employee').replace(/\s+/g, '_');
    const fileName = `Payslip_${employeeName}_${emp.employee_code || 'EMP'}_${(emp.period_name || 'period').replace(/\s+/g, '_')}.pdf`;
    pdf.save(fileName);
}
