import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateLetterPDF(letterContent, fileName = 'letter.pdf', companyName = '') {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; font-size:13px; color:#1a1a2e; background:#fff; width:794px; }
  .page { width:794px; min-height:1123px; padding:60px 72px; background:#fff; }
  .header { border-bottom:3px solid #1565c0; padding-bottom:16px; margin-bottom:32px; display:flex; justify-content:space-between; align-items:flex-end; }
  .company-name { font-size:20px; font-weight:700; color:#1565c0; }
  .company-sub { font-size:10px; color:#666; margin-top:3px; }
  .date { font-size:11px; color:#555; }
  .body { line-height:1.8; white-space:pre-wrap; word-break:break-word; }
  .footer { border-top:1px solid #dde3f0; margin-top:48px; padding-top:12px; display:flex; justify-content:space-between; }
  .footer-note { font-size:9px; color:#aaa; }
</style></head><body>
<div class="page">
  <div class="header">
    <div>
      <div class="company-name">${companyName || 'Company'}</div>
      <div class="company-sub">Official Communication</div>
    </div>
    <div class="date">${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</div>
  </div>
  <div class="body">${letterContent.replace(/\n/g, '<br/>')}</div>
  <div class="footer">
    <span class="footer-note">This is a system-generated document.</span>
    <span class="footer-note">Page 1 of 1</span>
  </div>
</div>
</body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:794px;height:1123px;border:none;';
    document.body.appendChild(iframe);
    await new Promise(r => { iframe.onload = r; iframe.srcdoc = html; });
    await new Promise(r => setTimeout(r, 200));

    const canvas = await html2canvas(iframe.contentDocument.body, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff', width: 794, windowWidth: 794,
    });
    document.body.removeChild(iframe);

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, pdfH);
    pdf.save(fileName);
}
