import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ExternalHyperlink,
  convertInchesToTwip
} from 'docx';
import { saveAs } from 'file-saver';
import { BibliographyEntry, CitationStyle } from '../types/bibliography';
import { formatCitation, sortBibliographyEntries } from './formatters';

export interface DocxMargins {
  top: number;    // inches, e.g., 1.0
  bottom: number; // inches, e.g., 1.0
  left: number;   // inches, e.g., 1.5 for thesis binding or 1.0 standard
  right: number;  // inches, e.g., 1.0
}

export interface DocxExportOptions {
  title?: string;
  fontFamily?: string; // 'TH Sarabun New', 'TH Sarabun PSK', 'Times New Roman', 'Cordia New', 'Angsana New', 'Calibri'
  fontSizePt?: number; // e.g. 16 for TH Sarabun New, 12 for Times New Roman
  lineSpacingMultiple?: number; // 1.0, 1.15, 1.5, or 2.0
  hangingIndentInches?: number; // 0.5 inches
  margins?: DocxMargins;
  thaiFirst?: boolean;
  saveToFile?: boolean;
  customFileName?: string;
}

export async function exportBibliographyToDocx(
  entries: BibliographyEntry[],
  style: CitationStyle,
  options: DocxExportOptions = {}
): Promise<{ blob: Blob; filename: string }> {
  const {
    title = getDefaultHeading(style, entries),
    fontFamily = 'TH Sarabun New',
    fontSizePt = fontFamily === 'Times New Roman' ? 12 : 16,
    lineSpacingMultiple = 1.15,
    hangingIndentInches = 0.5,
    margins = { top: 1.0, bottom: 1.0, left: 1.0, right: 1.0 },
    thaiFirst = true,
    saveToFile = true,
    customFileName
  } = options;

  // Half-points for docx (16 pt = 32 half-points, 12 pt = 24 half-points)
  const sizeHalfPoints = fontSizePt * 2;
  const hangingTwips = convertInchesToTwip(hangingIndentInches);
  const lineSpacingTwips = Math.round(240 * lineSpacingMultiple);

  // Sort entries
  const sortedEntries = sortBibliographyEntries(entries, { thaiFirst, style });

  // Build document paragraphs
  const paragraphs: Paragraph[] = [];

  // Document Heading (Title)
  paragraphs.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 280,
        before: 100
      },
      children: [
        new TextRun({
          text: title,
          bold: true,
          font: fontFamily,
          size: sizeHalfPoints + 4
        })
      ]
    })
  );

  sortedEntries.forEach((entry, idx) => {
    const formatted = formatCitation(entry, style, idx + 1);
    const runs: (TextRun | ExternalHyperlink)[] = [];

    formatted.spans.forEach((span) => {
      if (span.isUrl) {
        const urlStr = span.text.trim();
        runs.push(
          new ExternalHyperlink({
            children: [
              new TextRun({
                text: span.text,
                font: fontFamily,
                size: sizeHalfPoints,
                color: '0563C1',
                underline: {}
              })
            ],
            link: urlStr
          })
        );
      } else {
        runs.push(
          new TextRun({
            text: span.text,
            font: fontFamily,
            size: sizeHalfPoints,
            italics: span.italic,
            bold: span.bold
          })
        );
      }
    });

    // Hanging Indent Paragraph
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        indent: {
          left: hangingTwips,
          hanging: hangingTwips
        },
        spacing: {
          line: lineSpacingTwips,
          after: 160
        },
        children: runs
      })
    );
  });

  // Create docx document with customizable margins and font
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: fontFamily,
            size: sizeHalfPoints
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(margins.top),
              bottom: convertInchesToTwip(margins.bottom),
              left: convertInchesToTwip(margins.left),
              right: convertInchesToTwip(margins.right)
            }
          }
        },
        children: paragraphs
      }
    ]
  });

  // Generate blob
  const blob = await Packer.toBlob(doc);
  const fileNameStyle = style.toUpperCase();
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFileName || `Bibliography_${fileNameStyle}_${dateStr}.docx`;

  if (saveToFile) {
    saveAs(blob, filename);
  }

  return { blob, filename };
}

function getDefaultHeading(style: CitationStyle, entries: BibliographyEntry[]): string {
  const hasThai = entries.some((e) => e.language === 'th');
  if (style === 'mla9') {
    return hasThai ? 'รายการเอกสารอ้างอิง (Works Cited)' : 'Works Cited';
  }
  if (style === 'vancouver') {
    return hasThai ? 'เอกสารอ้างอิง (References)' : 'References';
  }
  return hasThai ? 'บรรณานุกรม' : 'References';
}
