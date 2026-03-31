import jsPDF from "jspdf";

type PdfSection = {
  label?: string;
  text: string;
};

type ExportStructuredPdfOptions = {
  title: string;
  fileName: string;
  metadata?: string[];
  sections: PdfSection[];
  footer?: string;
};

// Clean text for PDF compatibility (Remove Unicode chars that crash standard fonts)
const sanitizeForPdf = (str: string) => {
  if (!str) return "";
  return str
    .replace(/₹/g, "Rs.") // Replace Rupee symbol with Rs. (Standard fonts don't support ₹)
    .replace(/[^\x00-\x7F]/g, "") // Remove all non-ASCII characters that cause "random shit"
    .replace(/\r\n/g, "\n")
    .trim();
};

export const toPlainText = (value: string) => {
  const sanitized = sanitizeForPdf(value);
  return sanitized
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, ""))
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1 ($2)")
    .replace(/^[-*+]\s+/gm, "- ");
};

const safeFileName = (value: string) =>
  Array.from(value)
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code < 32 || code === 127) return "_";
      if ('<>:"/\\|?*'.includes(char)) return "_";
      return char;
    })
    .join("")
    .replace(/\s+/g, "_");

const checkYOverflow = (y: number, padding: number): boolean => {
  return y + padding > 780; // Buffer for A4 height
};

export const exportStructuredPdf = async (options: ExportStructuredPdfOptions) => {
  const { title, fileName, metadata = [], sections, footer } = options;
  
  const cleanName = fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  const secureFileName = safeFileName(cleanName);

  try {
    const doc = new jsPDF({
      orientation: "p",
      unit: "pt",
      format: "a4",
      compress: true
    });

    let currentY = 50;
    const margin = 45;
    const pageWidth = 505;

    // Line height helpers
    const TITLE_STEP = 24;
    const BODY_STEP = 14;
    const META_STEP = 12;

    // Header
    doc.setDrawColor(255, 153, 51);
    doc.setLineWidth(2);
    doc.line(margin, currentY, margin + pageWidth, currentY);
    currentY += 15;

    doc.setTextColor(0, 0, 128);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("LEGALAI INDIA", margin, currentY);
    
    doc.setTextColor(153, 153, 153);
    doc.setFontSize(8);
    doc.text("REPORT • " + new Date().toLocaleDateString(), margin + pageWidth, currentY, { align: "right" });
    currentY += 25;

    // Title
    doc.setTextColor(0, 0, 128);
    doc.setFontSize(20);
    const titleLines = doc.splitTextToSize(toPlainText(title), pageWidth);
    titleLines.forEach((line: string) => {
      if (checkYOverflow(currentY, TITLE_STEP)) { doc.addPage(); currentY = 50; }
      doc.text(line, margin, currentY);
      currentY += TITLE_STEP;
    });
    currentY += 10;

    // Metadata
    if (metadata.length > 0) {
      doc.setDrawColor(221, 221, 221);
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, margin + pageWidth, currentY);
      currentY += 15;
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      metadata.forEach(m => {
        const lines = doc.splitTextToSize(toPlainText(m), pageWidth);
        lines.forEach((l: string) => {
          if (checkYOverflow(currentY, META_STEP)) { doc.addPage(); currentY = 50; }
          doc.text(l, margin, currentY);
          currentY += META_STEP;
        });
      });
      currentY += 15;
    }

    // Body Sections
    sections.forEach(s => {
      if (s.label) {
        if (checkYOverflow(currentY, 20)) { doc.addPage(); currentY = 50; }
        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(toPlainText(s.label), margin, currentY);
        currentY += 18;
      }

      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      const textLines = doc.splitTextToSize(toPlainText(s.text), pageWidth);
      
      textLines.forEach((line: string) => {
        if (checkYOverflow(currentY, BODY_STEP)) { 
          doc.addPage(); 
          currentY = 50;
          doc.setDrawColor(255, 153, 51);
          doc.line(margin, 35, margin + pageWidth, 35);
        }
        doc.text(line, margin, currentY);
        currentY += BODY_STEP;
      });
      currentY += 15;
    });

    // Footer
    if (footer) {
      if (checkYOverflow(currentY, 30)) { doc.addPage(); currentY = 50; }
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, currentY, margin + pageWidth, currentY);
      currentY += 15;
      doc.setTextColor(160, 160, 160);
      doc.setFontSize(8);
      doc.text(toPlainText(footer), margin, currentY, { maxWidth: pageWidth });
    }

    doc.save(secureFileName);

  } catch (err) {
    console.error("PDF Fail:", err);
    alert("Export failed. Please copy the text manually.");
  }
};
