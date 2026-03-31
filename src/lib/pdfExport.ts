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
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-99999px";
  host.style.top = "0";
  host.style.width = "595px";
  host.style.background = "#ffffff";
  host.style.color = "#111111";
  host.style.padding = "30px";
  host.style.fontFamily = "Arial, Noto Sans, Segoe UI, sans-serif";

  // Create branding header
  const brandHeader = document.createElement("div");
  brandHeader.style.display = "flex";
  brandHeader.style.alignItems = "center";
  brandHeader.style.justifyContent = "space-between";
  brandHeader.style.marginBottom = "20px";
  brandHeader.style.paddingBottom = "15px";
  brandHeader.style.borderBottom = "2px solid #ff9933"; // Saffron border

  const logoImg = document.createElement("img");
  logoImg.src = "/logo.png";
  logoImg.style.height = "35px";
  logoImg.style.width = "auto";
  brandHeader.appendChild(logoImg);

  const brandText = document.createElement("div");
  brandText.textContent = "LEGALAI DIGITAL INDIA • OFFICIAL REPORT";
  brandText.style.fontSize = "9px";
  brandText.style.color = "#999";
  brandText.style.fontWeight = "bold";
  brandText.style.letterSpacing = "1px";
  brandHeader.appendChild(brandText);

  host.appendChild(brandHeader);

  const heading = document.createElement("h1");
  heading.textContent = sanitizeText(title) || "Document";
  heading.style.fontSize = "22px";
  heading.style.margin = "0 0 14px";
  heading.style.color = "#000080"; // Navy India
  host.appendChild(heading);

  if (metadata.length > 0) {
    const metaBox = document.createElement("div");
    metaBox.style.marginBottom = "16px";
    metaBox.style.paddingBottom = "12px";
    metaBox.style.borderBottom = "1px solid #ddd";
    metaBox.style.fontSize = "11px";
    metaBox.style.color = "#555";

    metadata.forEach((item) => {
      const row = document.createElement("div");
      row.textContent = sanitizeText(item);
      row.style.marginBottom = "4px";
      metaBox.appendChild(row);
    });

    host.appendChild(metaBox);
  }

  sections.forEach((section) => {
    const block = document.createElement("section");
    block.style.marginBottom = "14px";

    if (section.label) {
      const label = document.createElement("h2");
      label.textContent = sanitizeText(section.label);
      label.style.fontSize = "13px";
      label.style.margin = "0 0 6px";
      label.style.color = "#222";
      block.appendChild(label);
    }

    const content = document.createElement("div");
    content.textContent = sanitizeText(section.text);
    content.style.whiteSpace = "pre-wrap";
    content.style.lineHeight = "1.55";
    content.style.fontSize = "12px";
    block.appendChild(content);
    host.appendChild(block);
  });

  if (footer) {
    const foot = document.createElement("div");
    foot.textContent = sanitizeText(footer);
    foot.style.marginTop = "10px";
    foot.style.paddingTop = "10px";
    foot.style.borderTop = "1px solid #eee";
    foot.style.fontSize = "10px";
    foot.style.color = "#666";
    host.appendChild(foot);
  }

  document.body.appendChild(host);

  // Pre-load logo to avoid canvas tainting/timeout issues
  const logo = new Image();
  logo.crossOrigin = "anonymous";
  logo.src = "/logo.png";
  
  // Wait for logo or proceed anyway after 1s
  await Promise.race([
    new Promise(r => logo.onload = r),
    new Promise(r => setTimeout(r, 1000))
  ]);

  let retryCount = 0;
  const maxRetries = 2;
  const finalFileName = fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  const secureFileName = safeFileName(finalFileName);

  while (retryCount <= maxRetries) {
    try {
      const doc = new jsPDF({
        orientation: "p",
        unit: "pt",
        format: "a4",
        compress: true
      });

      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("PDF generation timed out."));
        }, 30000);

        doc.html(host, {
          x: 40,
          y: 40,
          width: 515,
          windowWidth: 800,
          autoPaging: "text",
          html2canvas: {
            scale: 1,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            // Inline the logo effectively by the time html2canvas runs
          },
          callback: () => {
            clearTimeout(timeoutId);
            resolve();
          },
        });
      });

      // Standard Download
      doc.save(secureFileName);
      break; 
      
    } catch (error) {
      retryCount++;
      console.warn(`PDF Attempt ${retryCount} failed:`, error);
      
      if (retryCount > maxRetries) {
        // Fallback to text-only mode
        try {
          const textDoc = new jsPDF("p", "pt", "a4");
          let y = 40;
          textDoc.setFont("helvetica", "bold");
          textDoc.setFontSize(18);
          textDoc.text(toPlainText(title), 40, y);
          y += 40;
          
          textDoc.setFont("helvetica", "normal");
          textDoc.setFontSize(10);
          sections.forEach(s => {
            if (y > 750) { textDoc.addPage(); y = 40; }
            if (s.label) {
              textDoc.setFont("helvetica", "bold");
              textDoc.text(toPlainText(s.label), 40, y);
              y += 15;
            }
            textDoc.setFont("helvetica", "normal");
            const lines = textDoc.splitTextToSize(toPlainText(s.text), 515);
            textDoc.text(lines, 40, y);
            y += (lines.length * 14) + 20;
          });
          
          textDoc.save(secureFileName);
          break;
        } catch (f) {
          throw new Error("Critical PDF failure.");
        }
      }
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // Final Cleanup
  if (host.parentNode) host.parentNode.removeChild(host);
};
