import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";

export const downloadReportAsWord = async (
  content: string,
  filename: string = "ZWDS_Analysis_Report.docx",
) => {
  // Split per garis baru
  const lines = content.split("\n");

  const docParagraphs = [];

  for (let line of lines) {
    line = line.trim();

    // ==== DETECT TITLE ====
    if (/^ZWDS MAP/i.test(line)) {
      docParagraphs.push(
        new Paragraph({
          text: line,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 },
        }),
      );
      continue;
    }

    // ==== SECTION TITLE: "**1. SELF (Diri)**" ====
    if (/^\*\*\d+\./.test(line)) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace(/\*\*/g, ""),
              bold: true,
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),
      );
      continue;
    }

    // ==== BULLET LIST: "* something" ====
    if (/^\* /g.test(line)) {
      docParagraphs.push(
        new Paragraph({
          text: line.replace("* ", "• "),
          bullet: { level: 0 },
        }),
      );
      continue;
    }

    // ==== NORMAL PARAGRAPH ====
    docParagraphs.push(
      new Paragraph({
        children: parseMarkdown(line),
      }),
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
};

// Utility — convert **bold** text
function parseMarkdown(text: string) {
  const parts: (string | { bold: string })[] = [];
  const regex = /\*\*(.*?)\*\*/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push({ bold: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // Convert to docx TextRun[]
  return parts.map((part) => {
    if (typeof part === "string") return new TextRun(part);
    return new TextRun({ text: part.bold, bold: true });
  });
}
