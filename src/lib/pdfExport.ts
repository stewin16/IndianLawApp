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

/**
 * Intelligent character mapping for PDF standard fonts (WinAnsiEncoding)
 * This prevents "random shit" or missing characters while keeping the text readable.
 */
const preparePdfText = (str: string) => {
  if (!str) return "";
  return str
    .replace(/[“”]/g, '"') // Smart double quotes
    .replace(/[‘’]/g, "'") // Smart single quotes
    .replace(/[\u2013\u2014]/g, "-") // Em and En dashes
    .replace(/₹/g, "Rs.") // Rupee symbol
    .replace(/[•●■]/g, "-") // Bullets
    .replace(/\u00A0/g, " ") // Non-breaking space
    .replace(/[^\x00-\x7F]/g, "") // Final fallback for other Unicode
    .trim();
};

export const toPlainText = (value: string) => {
  if (!value) return "";
  // 1. Strip Markdown
  const plain = value
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, ""))
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/^[-*+]\s+/gm, "- ");

  // 2. Mapping characters
  return preparePdfText(plain);
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
  return y + padding > 785;
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

    // Header Color Bar
    doc.setDrawColor(255, 153, 51);
    doc.setLineWidth(3);
    doc.line(margin, currentY, margin + pageWidth, currentY);
    currentY += 20;

    // Header Branding
    doc.setTextColor(0, 0, 128);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("LEGALAI INDIA", margin, currentY);
    
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text("ISSUED ON: " + new Date().toLocaleDateString(), margin + pageWidth, currentY, { align: "right" });
    currentY += 30;

    // Report Title
    doc.setTextColor(0, 0, 128);
    doc.setFontSize(22);
    const titleLines = doc.splitTextToSize(toPlainText(title), pageWidth);
    titleLines.forEach((line: string) => {
      if (checkYOverflow(currentY, 26)) { doc.addPage(); currentY = 50; }
      doc.text(line, margin, currentY);
      currentY += 26;
    });
    currentY += 10;

    // Metadata Section
    if (metadata.length > 0) {
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, margin + pageWidth, currentY);
      currentY += 15;
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      metadata.forEach(m => {
        const mLines = doc.splitTextToSize(toPlainText(m), pageWidth);
        mLines.forEach((l: string) => {
          if (checkYOverflow(currentY, 12)) { doc.addPage(); currentY = 50; }
          doc.text(l, margin, currentY);
          currentY += 13;
        });
      });
      currentY += 15;
    }

    // Process Content Sections
    sections.forEach(s => {
      if (s.label) {
        if (checkYOverflow(currentY, 22)) { doc.addPage(); currentY = 50; }
        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(toPlainText(s.label), margin, currentY);
        currentY += 18;
      }

      doc.setTextColor(70, 70, 70);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const textLines = doc.splitTextToSize(toPlainText(s.text), pageWidth);
      
      textLines.forEach((line: string) => {
        if (checkYOverflow(currentY, 14)) { 
          doc.addPage(); 
          currentY = 50;
          doc.setDrawColor(255, 153, 51); // Saffron brand line on new pages
          doc.line(margin, 35, margin + pageWidth, 35);
        }
        doc.text(line, margin, currentY);
        currentY += 14;
      });
      currentY += 20;
    });

    // Final Footer
    if (footer) {
      const footerText = toPlainText(footer);
      const footerLines = doc.splitTextToSize(footerText, pageWidth);
      if (checkYOverflow(currentY, (footerLines.length * 10) + 20)) { doc.addPage(); currentY = 50; }
      
      doc.setDrawColor(240, 240, 240);
      doc.line(margin, currentY, margin + pageWidth, currentY);
      currentY += 15;
      doc.setTextColor(180, 180, 180);
      doc.setFontSize(8);
      
      footerLines.forEach((fl: string) => {
        doc.text(fl, margin, currentY);
        currentY += 10;
      });
    }

    doc.save(secureFileName);

  } catch (err) {
    console.error("PDF Fail:", err);
    alert("Export failed. Please copy text instead.");
  }
};
