import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont } from 'pdf-lib';
import type { DiagnosisResult } from '../types/diagnosis';

const BASE_MARGIN = 56.7; // 20mm margins on A4
const LINE_HEIGHT = 18;
const PAGE_SIZE = { width: 595.28, height: 841.89 }; // A4 portrait in points
const WATERMARK_TARGET_WIDTH = 320;
const WATERMARK_OPACITY = 0.12;
const FOOTER_TEXT = 'Analyse generee par Agrisense';
const FOOTER_FONT_SIZE = 11;
const FOOTER_GAP = 8;
const FOOTER_LOGO_WIDTH = 68;
const FOOTER_OPACITY = 0.8;
type PDFImage = Awaited<ReturnType<PDFDocument['embedPng']>>;

const toArrayBuffer = (view: Uint8Array): ArrayBuffer => {
  const source = view.buffer;
  if (source instanceof ArrayBuffer) {
    if (view.byteOffset === 0 && view.byteLength === source.byteLength) {
      return source;
    }
    return source.slice(view.byteOffset, view.byteOffset + view.byteLength);
  }
  const buffer = new ArrayBuffer(view.byteLength);
  new Uint8Array(buffer).set(view);
  return buffer;
};

const toUint8Array = (base64: string): Uint8Array => {
  if (typeof globalThis.atob === 'function') {
    const binaryString = globalThis.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  const bufferCtor = (globalThis as typeof globalThis & { Buffer?: { from: (input: string, encoding: string) => Uint8Array } }).Buffer;
  if (bufferCtor) {
    return bufferCtor.from(base64, 'base64');
  }
  throw new Error('No base64 decoder available');
};

const fromDataUrl = (url: string): { bytes: Uint8Array; mime: string } | null => {
  const [metadata, base64] = url.split(',');
  if (!metadata || !base64) {
    return null;
  }
  const mimeMatch = metadata.match(/data:(.*?);/);
  const mime = mimeMatch?.[1] ?? 'image/jpeg';
  return { bytes: toUint8Array(base64), mime };
};

const fetchImageBytes = async (url: string): Promise<{ bytes: Uint8Array; mime: string } | null> => {
  if (url.startsWith('data:image/')) {
    return fromDataUrl(url);
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const mime = response.headers.get('Content-Type') ?? 'image/jpeg';
    return { bytes: new Uint8Array(arrayBuffer), mime };
  } catch (error) {
    console.warn('Unable to fetch image for report', error);
    return null;
  }
};

const fetchWatermarkImage = async (document: PDFDocument): Promise<PDFImage | null> => {
  if (typeof fetch !== 'function') {
    return null;
  }

  const url =
    typeof window !== 'undefined' && window.location?.origin ? `${window.location.origin}/logo.png` : '/logo.png';

  try {
    const response = await fetch(url);
    if (!response || !('ok' in response) || !response.ok) {
      throw new Error('Invalid watermark response');
    }
    const arrayBuffer = await response.arrayBuffer();
    const mime = response.headers.get('Content-Type') ?? 'image/png';
    const bytes = new Uint8Array(arrayBuffer);
    return mime.includes('png') ? await document.embedPng(bytes) : await document.embedJpg(bytes);
  } catch (error) {
    console.warn('Unable to fetch watermark image', error);
    return null;
  }
};

const drawWatermark = (page: ReturnType<PDFDocument['addPage']>, watermark: PDFImage | null) => {
  if (!watermark) return;
  const scale = Math.min(WATERMARK_TARGET_WIDTH / watermark.width, 1);
  const width = watermark.width * scale;
  const height = watermark.height * scale;
  const x = (page.getWidth() - width) / 2;
  const y = (page.getHeight() - height) / 2;

  page.drawImage(watermark, {
    x,
    y,
    width,
    height,
    opacity: WATERMARK_OPACITY
  });
};

const drawFooterOnAllPages = (document: PDFDocument, font: PDFFont, watermark: PDFImage | null) => {
  const pages = document.getPages();
  pages.forEach((page) => {
    const pageWidth = page.getWidth();
    const footerY = BASE_MARGIN / 2;

    const textWidth = font.widthOfTextAtSize(FOOTER_TEXT, FOOTER_FONT_SIZE);

    const hasLogo = Boolean(watermark);
    const logoWidth = hasLogo ? FOOTER_LOGO_WIDTH : 0;
    const logoHeight = hasLogo && watermark ? (watermark.height * (FOOTER_LOGO_WIDTH / watermark.width)) : 0;
    const totalWidth = textWidth + (hasLogo ? FOOTER_GAP + logoWidth : 0);
    const startX = (pageWidth - totalWidth) / 2;

    if (hasLogo && watermark) {
      page.drawImage(watermark, {
        x: startX,
        y: footerY - logoHeight / 2,
        width: logoWidth,
        height: logoHeight,
        opacity: FOOTER_OPACITY
      });
    }

    page.drawText(FOOTER_TEXT, {
      x: startX + (hasLogo ? logoWidth + FOOTER_GAP : 0),
      y: footerY,
      size: FOOTER_FONT_SIZE,
      font,
      color: rgb(0.07, 0.34, 0.24)
    });
  });
};

const wrapText = (text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    const testLine = current.length > 0 ? `${current} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth <= maxWidth) {
      current = testLine;
    } else {
      if (current.length > 0) lines.push(current);
      current = word;
    }
  });

  if (current.length > 0) {
    lines.push(current);
  }

  return lines;
};

const drawWrappedText = ({
  page,
  text,
  x,
  y,
  font,
  size,
  color,
  maxWidth,
  lineHeight = LINE_HEIGHT
}: {
  page: ReturnType<PDFDocument['addPage']>;
  text: string;
  x: number;
  y: number;
  font: PDFFont;
  size: number;
  color: ReturnType<typeof rgb>;
  maxWidth: number;
  lineHeight?: number;
}) => {
  const lines = wrapText(text, maxWidth, font, size);
  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - index * lineHeight,
      size,
      font,
      color
    });
  });
  return lines.length * lineHeight;
};

const measureKeyValueHeight = (value: string, font: PDFFont, maxWidth: number) => {
  const valueLines = wrapText(value, maxWidth, font, 10);
  return LINE_HEIGHT + valueLines.length * (LINE_HEIGHT - 2) + 2;
};

export type ReportOptions = {
  appName?: string;
  locale?: string;
};

export const generateDiagnosisReport = async (
  result: DiagnosisResult,
  options: ReportOptions = {}
): Promise<Blob> => {
  const document = await PDFDocument.create();
  const [regularFont, boldFont, watermark] = await Promise.all([
    document.embedFont(StandardFonts.Helvetica),
    document.embedFont(StandardFonts.HelveticaBold),
    fetchWatermarkImage(document)
  ]);

  const addPageWithWatermark = () => {
    const newPage = document.addPage([PAGE_SIZE.width, PAGE_SIZE.height]);
    drawWatermark(newPage, watermark);
    return newPage;
  };

  let page = addPageWithWatermark();
  let currentY = page.getHeight() - BASE_MARGIN;

  const appName = options.appName ?? 'Agricole AI Companion';
  const created = new Date(result.createdAt);
  const formattedDate = created.toLocaleString(options.locale ?? 'fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const ensureSpace = (neededHeight: number) => {
    if (currentY - neededHeight < BASE_MARGIN) {
      page = addPageWithWatermark();
      currentY = page.getHeight() - BASE_MARGIN;
    }
  };

  const drawHeader = () => {
    const headerHeight = 80;
    ensureSpace(headerHeight + 16);
    const headerY = currentY - headerHeight;
    page.drawRectangle({
      x: BASE_MARGIN,
      y: headerY,
      width: page.getWidth() - BASE_MARGIN * 2,
      height: headerHeight,
      color: rgb(0.04, 0.45, 0.31)
    });
    page.drawText(appName, {
      x: BASE_MARGIN + 16,
      y: headerY + headerHeight - 28,
      size: 20,
      font: boldFont,
      color: rgb(1, 1, 1)
    });
    page.drawText(formattedDate, {
      x: BASE_MARGIN + 16,
      y: headerY + headerHeight - 48,
      size: 12,
      font: regularFont,
      color: rgb(0.85, 0.94, 0.89)
    });
    currentY = headerY - 24;
  };

  const drawTitleBlock = () => {
    ensureSpace(LINE_HEIGHT * 4);
    page.drawText(result.primary.label, {
      x: BASE_MARGIN,
      y: currentY,
      size: 18,
      font: boldFont,
      color: rgb(0.07, 0.34, 0.24)
    });
    currentY -= LINE_HEIGHT;
    page.drawText(`Confiance ${(result.confidence * 100).toFixed(0)}%`, {
      x: BASE_MARGIN,
      y: currentY,
      size: 12,
      font: regularFont,
      color: rgb(0.16, 0.19, 0.2)
    });
    currentY -= LINE_HEIGHT;
    const descHeight = drawWrappedText({
      page,
      text: result.primary.description,
      x: BASE_MARGIN,
      y: currentY,
      size: 11,
      font: regularFont,
      color: rgb(0.16, 0.19, 0.2),
      maxWidth: page.getWidth() - BASE_MARGIN * 2
    });
    currentY -= descHeight + 12;
  };

  const drawMetaRow = (pairs: Array<{ label: string; value: string }>) => {
    const columnWidth = (page.getWidth() - BASE_MARGIN * 2 - 24) / 2;
    const heights = pairs.map((item) => measureKeyValueHeight(item.value, regularFont, columnWidth));
    const rowHeight = Math.max(...heights) + 6;
    ensureSpace(rowHeight);

    pairs.forEach((item, index) => {
      const x = BASE_MARGIN + index * (columnWidth + 24);
      page.drawText(item.label.toUpperCase(), {
        x,
        y: currentY,
        size: 10,
        font: boldFont,
        color: rgb(0.07, 0.34, 0.24)
      });
      drawWrappedText({
        page,
        text: item.value,
        x,
        y: currentY - LINE_HEIGHT,
        font: regularFont,
        size: 10,
        color: rgb(0.16, 0.19, 0.2),
        maxWidth: columnWidth,
        lineHeight: LINE_HEIGHT - 2
      });
    });

    currentY -= rowHeight;
  };

  const drawMetaSection = () => {
    drawMetaRow([
      { label: 'Culture', value: result.crop },
      { label: 'Stade', value: result.stage }
    ]);
    drawMetaRow([
      { label: 'Symptomes observes', value: result.symptoms.join(', ') },
      { label: 'Contexte', value: result.context }
    ]);
    currentY -= 12;
  };

  const toText = (action: unknown): string => {
    if (typeof action === 'string') return action;
    if (action && typeof action === 'object') {
      const a = action as Record<string, unknown>;
      const label = typeof a.label === 'string' ? a.label : undefined;
      const description = typeof a.description === 'string' ? a.description : undefined;
      if (label && description) return `${label} - ${description}`;
      if (label) return label;
      if (description) return description;
      try {
        return JSON.stringify(a);
      } catch {
        return String(action);
      }
    }
    return String(action ?? '');
  };

  const drawActions = () => {
    ensureSpace(LINE_HEIGHT * 2);
    page.drawText('Actions recommandees', {
      x: BASE_MARGIN,
      y: currentY,
      size: 14,
      font: boldFont,
      color: rgb(0.07, 0.34, 0.24)
    });
    currentY -= LINE_HEIGHT * 1.2;

    const bulletWidth = 8;
    const actionMaxWidth = page.getWidth() - BASE_MARGIN * 2 - bulletWidth - 10;
    result.actions.forEach((action) => {
      const text = toText(action);
      const lines = wrapText(text, actionMaxWidth, regularFont, 11);
      const blockHeight = lines.length * (LINE_HEIGHT - 2);
      ensureSpace(blockHeight + 8);

      page.drawRectangle({
        x: BASE_MARGIN,
        y: currentY - 3,
        width: bulletWidth,
        height: bulletWidth,
        color: rgb(0.11, 0.69, 0.42)
      });
      drawWrappedText({
        page,
        text,
        x: BASE_MARGIN + bulletWidth + 6,
        y: currentY,
        font: regularFont,
        size: 11,
        color: rgb(0.16, 0.19, 0.2),
        maxWidth: actionMaxWidth,
        lineHeight: LINE_HEIGHT - 2
      });
      currentY -= blockHeight + 8;
    });
    currentY -= LINE_HEIGHT * 0.5;
  };

  const drawAlternatives = () => {
    if (result.alternatives.length === 0) return;
    ensureSpace(LINE_HEIGHT * 2);
    page.drawText('Hypotheses alternatives', {
      x: BASE_MARGIN,
      y: currentY,
      size: 14,
      font: boldFont,
      color: rgb(0.07, 0.34, 0.24)
    });
    currentY -= LINE_HEIGHT;
    result.alternatives.forEach((item) => {
      const score = (item.confidence * 100).toFixed(0);
      const text = `${item.label} - ${score}%`;
      const lines = wrapText(text, page.getWidth() - BASE_MARGIN * 2, regularFont, 11);
      const blockHeight = lines.length * (LINE_HEIGHT - 2);
      ensureSpace(blockHeight + 6);
      drawWrappedText({
        page,
        text,
        x: BASE_MARGIN,
        y: currentY,
        font: regularFont,
        size: 11,
        color: rgb(0.16, 0.19, 0.2),
        maxWidth: page.getWidth() - BASE_MARGIN * 2,
        lineHeight: LINE_HEIGHT - 2
      });
      currentY -= blockHeight + 6;
    });
    currentY -= LINE_HEIGHT * 0.5;
  };

  const drawImages = async () => {
    if (result.images.length === 0) return;

    ensureSpace(LINE_HEIGHT * 2);
    page.drawText('Observations visuelles', {
      x: BASE_MARGIN,
      y: currentY,
      size: 14,
      font: boldFont,
      color: rgb(0.07, 0.34, 0.24)
    });
    currentY -= LINE_HEIGHT * 1.5;

    const maxWidth = 180;
    const gap = 16;
    let column = 0;
    let rowHeight = 0;

    for (const url of result.images) {
      const resource = await fetchImageBytes(url);
      if (!resource) continue;

      const { bytes, mime } = resource;
      const imageEmbed = mime.includes('png') ? await document.embedPng(bytes) : await document.embedJpg(bytes);

      const scale = Math.min(maxWidth / imageEmbed.width, 1);
      const displayWidth = imageEmbed.width * scale;
      const displayHeight = imageEmbed.height * scale;

      if (BASE_MARGIN + displayWidth * (column + 1) + gap * column > page.getWidth() - BASE_MARGIN) {
        column = 0;
        currentY -= rowHeight + gap;
        rowHeight = 0;
      }

      if (currentY - displayHeight < BASE_MARGIN) {
        page = addPageWithWatermark();
        currentY = page.getHeight() - BASE_MARGIN - LINE_HEIGHT;
        column = 0;
        rowHeight = 0;
        page.drawText('Suite des observations visuelles', {
          x: BASE_MARGIN,
          y: currentY,
          size: 14,
          font: boldFont,
          color: rgb(0.07, 0.34, 0.24)
        });
        currentY -= LINE_HEIGHT * 1.5;
      }

      const x = BASE_MARGIN + column * (maxWidth + gap);
      const y = currentY - displayHeight;
      page.drawImage(imageEmbed, {
        x,
        y,
        width: displayWidth,
        height: displayHeight
      });

      rowHeight = Math.max(rowHeight, displayHeight);
      column += 1;
    }
  };

  drawHeader();
  drawTitleBlock();
  drawMetaSection();
  drawActions();
  drawAlternatives();
  await drawImages();
  drawFooterOnAllPages(document, regularFont, watermark);

  const pdfBytes = await document.save();
  const array = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes);
  return new Blob([toArrayBuffer(array)], { type: 'application/pdf' });
};
