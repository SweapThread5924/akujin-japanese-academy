// Minimal, dependency-free valid PDF 1.4 generator for downloadable study companion sheets.
// Uses standard Type1 Helvetica font so output opens cleanly in every PDF viewer.

function sanitizeAscii(text: string): string {
  return text
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface PdfSectionLine {
  text: string;
  bold?: boolean;
  size?: number;
}

export function buildStudyPdfBuffer(params: {
  title: string;
  subtitle: string;
  lines: PdfSectionLine[];
}): Buffer {
  const PAGE_WIDTH = 595; // A4 width pt
  const PAGE_HEIGHT = 842; // A4 height pt
  const MARGIN_X = 44;
  const TOP_Y = 790;
  const BOTTOM_Y = 48;

  // Paginate lines
  const pages: PdfSectionLine[][] = [];
  let currentPage: PdfSectionLine[] = [
    { text: params.title, bold: true, size: 16 },
    { text: params.subtitle, bold: false, size: 10 },
    { text: '------------------------------------------------------------------------------------', size: 9 },
  ];
  let y = TOP_Y - 58;

  for (const line of params.lines) {
    const size = line.size ?? 9.5;
    const step = size + 5;
    if (y - step < BOTTOM_Y) {
      pages.push(currentPage);
      currentPage = [
        { text: `${params.title} (cont.)`, bold: true, size: 11 },
        { text: '------------------------------------------------------------------------------------', size: 9 },
      ];
      y = TOP_Y - 34;
    }
    currentPage.push(line);
    y -= step;
  }
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  // Object layout:
  // 1: Catalog
  // 2: Pages
  // 3: Helvetica
  // 4: Helvetica-Bold
  // 5.. : Page + Content objects (2 objects per page)
  const objects: string[] = [];
  const pageCount = pages.length;
  const pageObjectIds: number[] = [];

  for (let i = 0; i < pageCount; i++) {
    pageObjectIds.push(5 + i * 2);
  }

  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push(
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`
  );
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  pages.forEach((pageLines, pageIdx) => {
    const pageObjId = 5 + pageIdx * 2;
    const contentObjId = pageObjId + 1;
    const cmds: string[] = ['BT'];
    let curY = TOP_Y;

    pageLines.forEach((line) => {
      const size = line.size ?? 9.5;
      const fontKey = line.bold ? '/F2' : '/F1';
      const safeText = sanitizeAscii(line.text).slice(0, 108);
      cmds.push(`${fontKey} ${size} Tf`);
      cmds.push(`1 0 0 1 ${MARGIN_X} ${curY} Tm`);
      cmds.push(`(${safeText}) Tj`);
      curY -= size + 5;
    });

    cmds.push(`/F1 8 Tf 1 0 0 1 ${MARGIN_X} 26 Tm (AkuJin Japanese Academy - Page ${pageIdx + 1} of ${pageCount}) Tj`);
    cmds.push('ET');
    const stream = cmds.join('\n');
    const byteLen = Buffer.byteLength(stream, 'utf-8');

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>`
    );
    objects.push(`<< /Length ${byteLen} >>\nstream\n${stream}\nendstream`);
  });

  // Assemble PDF bytes & xref table
  const chunks: Buffer[] = [Buffer.from('%PDF-1.4\n', 'ascii')];
  const offsets: number[] = [0];
  let cursor = chunks[0].length;

  objects.forEach((body, idx) => {
    const objId = idx + 1;
    const part = Buffer.from(`${objId} 0 obj\n${body}\nendobj\n`, 'utf-8');
    offsets.push(cursor);
    chunks.push(part);
    cursor += part.length;
  });

  const xrefStart = cursor;
  const xrefLines = [`xref`, `0 ${objects.length + 1}`, '0000000000 65535 f '];
  for (let i = 1; i <= objects.length; i++) {
    xrefLines.push(`${String(offsets[i]).padStart(10, '0')} 00000 n `);
  }
  const trailer = [
    ...xrefLines,
    'trailer',
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    'startxref',
    String(xrefStart),
    '%%EOF\n',
  ].join('\n');

  chunks.push(Buffer.from(trailer, 'utf-8'));
  return Buffer.concat(chunks);
}
