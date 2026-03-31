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

const stripControlChars = (value: string) =>
  Array.from(value)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return (code >= 32 && code !== 127) || char === "\n" || char === "\t";
    })
    .join("");

const sanitizeText = (value: string) =>
  stripControlChars((value || "")
    .replace(/\r\n/g, "\n")
    .trim());

export const toPlainText = (value: string) =>
  sanitizeText(value)
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, ""))
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1 ($2)")
    .replace(/^[-*+]\s+/gm, "- ");

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
export const exportStructuredPdf = async ({
  title,
  fileName,
  metadata = [],
  sections,
  footer,
}: ExportStructuredPdfOptions) => {
  // 1. Prepare Filenaming
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
    const pageWidth = 515; // ~595 - (2*40)

    // Header Branding (Draw manually)
    // Saffron Top Border
    doc.setDrawColor(255, 153, 51); // Saffron
    doc.setLineWidth(2);
    doc.line(margin, currentY, margin + pageWidth, currentY);
    currentY += 15;

    // Logo Placeholder or Text (since we cannot easily base64 in this context)
    doc.setTextColor(0, 0, 128); // Navy India
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("LEGALAI INDIA", margin, currentY);
    
    doc.setTextColor(153, 153, 153); // Gray
    doc.setFontSize(8);
    doc.text("OFFICIAL REPORT • " + new Date().toLocaleDateString(), margin + pageWidth, currentY, { align: "right" });
    
    currentY += 25;

    // Title
    doc.setTextColor(0, 0, 128); // Navy India
    doc.setFontSize(22);
    const titleLines = doc.splitTextToSize(toPlainText(title), pageWidth);
    doc.text(titleLines, margin, currentY);
    currentY += (titleLines.length * 24) + 15;

    // Metadata
    if (metadata.length > 0) {
      doc.setDrawColor(221, 221, 221);
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, margin + pageWidth, currentY);
      currentY += 15;
      
      doc.setTextColor(102, 102, 102);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      metadata.forEach(m => {
        if (yOverflow(currentY, 12)) { doc.addPage(); currentY = 40; }
        doc.text(toPlainText(m), margin, currentY);
        currentY += 12;
      });
      currentY += 10;
    }

    // Sections
    sections.forEach(s => {
      // Label
      if (s.label) {
        if (yOverflow(currentY, 20)) { doc.addPage(); currentY = margin; }
        doc.setTextColor(34, 34, 34);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(toPlainText(s.label), margin, currentY);
        currentY += 15;
      }

      // Text
      doc.setTextColor(85, 85, 85);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      const textLines = doc.splitTextToSize(toPlainText(s.text), pageWidth);
      
      textLines.forEach((line: string) => {
        if (yOverflow(currentY, 14)) { 
          doc.addPage(); 
          currentY = margin; 
          // Re-draw top line on new page for branding
          doc.setDrawColor(255, 153, 51);
          doc.line(margin, 30, margin + pageWidth, 30);
          currentY = 45;
        }
        doc.text(line, margin, currentY);
        currentY += 14;
      });
      currentY += 20;
    });

    // Footer
    if (footer) {
      if (yOverflow(currentY, 40)) { doc.addPage(); currentY = 40; }
      doc.setDrawColor(238, 238, 238);
      doc.line(margin, currentY, margin + pageWidth, currentY);
      currentY += 15;
      doc.setTextColor(153, 153, 153);
      doc.setFontSize(8);
      doc.text(toPlainText(footer), margin, currentY, { maxWidth: pageWidth });
    }

    // Helper for page overflow
    function yOverflow(y: number, padding: number) {
      return y + padding > 800; // A4 height is ~841pt
    }

    // FINAL EXPORT
    // Try primary save
    try {
      doc.save(secureFileName);
    } catch (saveError) {
      console.error("Standard save failed, triggering anchor download:", saveError);
      const blob = doc.output('blob');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = secureFileName;
      a.type = 'application/pdf';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 1000);
    }

  } catch (error) {
    console.error("PDF Engine Crash:", error);
    // Absolute Last Resort: Text Area Export
    alert("Generation failed. Please copy the text manually from the screen.");
  }
};
