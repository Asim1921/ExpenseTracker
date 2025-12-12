import jsPDF from 'jspdf';

interface EstimateData {
  estimateNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  projectTitle?: string;
  description?: string;
  validUntil?: string;
  items: Array<{
    description: string;
    amount: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  additionalNotes?: string;
  createdAt?: string;
}

// Helper function to load image as base64
function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function generateEstimatePDF(estimate: EstimateData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPos = margin;
  
  // Try to load and add logo
  try {
    const logoUrl = '/logo.jpg';
    const logoData = await loadImageAsBase64(logoUrl);
    // Add logo in the footer (bottom left)
    const logoSize = 20;
    const footerY = pageHeight - 25;
    doc.addImage(logoData, 'PNG', margin, footerY, logoSize, logoSize);
  } catch (error) {
    console.warn('Could not load logo:', error);
  }
  
  // Header with dark background
  doc.setFillColor(55, 65, 81); // gray-800
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // ESTIMATE title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTIMATE', margin, 30);
  
  // Grand Total in header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Grand Total (USD)', pageWidth - margin - 60, 20);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${estimate.total.toFixed(2)}`, pageWidth - margin - 60, 35);
  
  yPos = 70;
  
  // BILL TO section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(estimate.customerName, margin, yPos + 7);
  
  if (estimate.customerEmail) {
    doc.text(estimate.customerEmail, margin, yPos + 14);
  }
  if (estimate.customerPhone) {
    doc.text(estimate.customerPhone, margin, yPos + 21);
  }
  
  // Estimate details on the right
  const rightX = pageWidth - margin - 80;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Estimate Number: ${estimate.estimateNumber}`, rightX, yPos);
  
  const estimateDate = estimate.createdAt 
    ? new Date(estimate.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Estimate Date: ${estimateDate}`, rightX, yPos + 7);
  
  if (estimate.validUntil) {
    const validDate = new Date(estimate.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Valid Until: ${validDate}`, rightX, yPos + 14);
  }
  
  doc.text(`Grand Total (USD): $${estimate.total.toFixed(2)}`, rightX, yPos + 21);
  
  yPos += 40;
  
  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 15;
  
  // Items section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Items', margin, yPos);
  
  // Column headers
  const colX = pageWidth - margin - 100;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Quantity', colX, yPos);
  doc.text('Price', colX + 30, yPos);
  doc.text('Amount', colX + 60, yPos);
  
  yPos += 10;
  
  // Items list
  estimate.items.forEach((item, index) => {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin + 20;
    }
    
    // Project title or item description
    if (index === 0 && estimate.projectTitle) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(estimate.projectTitle, margin, yPos);
      yPos += 7;
    }
    
    // Item description (can be multiline)
    const descriptionLines = doc.splitTextToSize(item.description || '', contentWidth - 100);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(descriptionLines, margin, yPos);
    
    // Quantity, Price, Amount
    const itemY = yPos + (descriptionLines.length - 1) * 5;
    doc.text(item.amount.toString(), colX, itemY);
    doc.text(`$${item.unitPrice.toFixed(2)}`, colX + 30, itemY);
    doc.text(`$${item.total.toFixed(2)}`, colX + 60, itemY);
    
    yPos = itemY + 10;
  });
  
  // Horizontal line before total
  yPos += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 10;
  
  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Grand Total (USD):', margin, yPos);
  doc.text(`$${estimate.total.toFixed(2)}`, pageWidth - margin - 20, yPos, { align: 'right' });
  
  // Footer
  const footerY = pageHeight - 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  
  // Company name (you can customize this)
  const logoSize = 20;
  doc.text('Summit core LLC', margin + logoSize + 5, footerY);
  doc.text('United States', margin + logoSize + 5, footerY + 6);
  
  // Save the PDF
  const fileName = `Estimate-${estimate.estimateNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

