import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont } from 'pdf-lib';
import type { DiagnosisResult } from '../types/diagnosis';

const BASE_MARGIN = 48;
const LINE_HEIGHT = 18;

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

const drawKeyValue = (
  page: ReturnType<PDFDocument['addPage']>,
  font: PDFFont,
  boldFont: PDFFont,
  label: string,
  value: string,
  x: number,
  y: number
) => {
  const labelText = `${label.toUpperCase()}`;
  page.drawText(labelText, {
    x,
    y,
    size: 10,
    font: boldFont,
    color: rgb(0.07, 0.34, 0.24)
  });
  const valueLines = value.split('\n');
  valueLines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - LINE_HEIGHT - index * (LINE_HEIGHT - 2),
      size: 10,
      font,
      color: rgb(0.16, 0.19, 0.2)
    });
  });
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
  let page = document.addPage([595.28, 841.89]);
  const width = page.getWidth();
  const height = page.getHeight();

  const regularFont = await document.embedFont(StandardFonts.Helvetica);
  const boldFont = await document.embedFont(StandardFonts.HelveticaBold);

  const appName = options.appName ?? 'Agricole AI Companion';
  const created = new Date(result.createdAt);
  const formattedDate = created.toLocaleString(options.locale ?? 'fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  page.drawRectangle({
    x: BASE_MARGIN,
    y: height - 120,
    width: width - BASE_MARGIN * 2,
    height: 72,
    color: rgb(0.04, 0.45, 0.31)
  });

  page.drawText(appName, {
    x: BASE_MARGIN + 16,
    y: height - 60,
    size: 20,
    font: boldFont,
    color: rgb(1, 1, 1)
  });

  page.drawText(formattedDate, {
    x: BASE_MARGIN + 16,
    y: height - 82,
    size: 12,
    font: regularFont,
    color: rgb(0.85, 0.94, 0.89)
  });

  const summaryY = height - 160;
  page.drawText(result.primary.label, {
    x: BASE_MARGIN,
    y: summaryY,
    size: 18,
    font: boldFont,
    color: rgb(0.07, 0.34, 0.24)
  });
  page.drawText(`Confiance ${(result.confidence * 100).toFixed(0)}%`, {
    x: BASE_MARGIN,
    y: summaryY - LINE_HEIGHT,
    size: 12,
    font: regularFont,
    color: rgb(0.16, 0.19, 0.2)
  });
  page.drawText(result.primary.description, {
    x: BASE_MARGIN,
    y: summaryY - LINE_HEIGHT * 2,
    size: 11,
    font: regularFont,
    color: rgb(0.16, 0.19, 0.2)
  });

  const columnWidth = (width - BASE_MARGIN * 2 - 24) / 2;
  const metaTop = summaryY - LINE_HEIGHT * 4;
  drawKeyValue(page, regularFont, boldFont, 'Culture', result.crop, BASE_MARGIN, metaTop);
  drawKeyValue(page, regularFont, boldFont, 'Stade', result.stage, BASE_MARGIN + columnWidth + 24, metaTop);
  drawKeyValue(page, regularFont, boldFont, 'Symptomes observes', result.symptoms.join('\n'), BASE_MARGIN, metaTop - LINE_HEIGHT * 3);
  drawKeyValue(page, regularFont, boldFont, 'Contexte', result.context, BASE_MARGIN + columnWidth + 24, metaTop - LINE_HEIGHT * 3);

  const actionsY = metaTop - LINE_HEIGHT * 7;
  page.drawText('Actions recommandees', {
    x: BASE_MARGIN,
    y: actionsY,
    size: 14,
    font: boldFont,
    color: rgb(0.07, 0.34, 0.24)
  });
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
  result.actions.forEach((action, index) => {
    const y = actionsY - LINE_HEIGHT * (index + 1);
    page.drawRectangle({
      x: BASE_MARGIN,
      y: y - 3,
      width: 8,
      height: 8,
      color: rgb(0.11, 0.69, 0.42)
    });
    page.drawText(toText(action), {
      x: BASE_MARGIN + 14,
      y,
      size: 11,
      font: regularFont,
      color: rgb(0.16, 0.19, 0.2)
    });
  });

  let currentY = actionsY - LINE_HEIGHT * (result.actions.length + 2);

  if (result.alternatives.length > 0) {
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
      page.drawText(text, {
        x: BASE_MARGIN,
        y: currentY,
        size: 11,
        font: regularFont,
        color: rgb(0.16, 0.19, 0.2)
      });
      currentY -= LINE_HEIGHT;
    });
  }

  currentY -= LINE_HEIGHT;

  if (result.images.length > 0) {
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

      if (BASE_MARGIN + displayWidth * (column + 1) + gap * column > width - BASE_MARGIN) {
        column = 0;
        currentY -= rowHeight + gap;
        rowHeight = 0;
      }

      if (currentY - displayHeight < BASE_MARGIN) {
        page = document.addPage([width, height]);
        currentY = height - BASE_MARGIN;
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
      if (column > 2) {
        column = 0;
        currentY = y - gap;
        rowHeight = 0;
      }
    }
  }

  const pdfBytes = await document.save();
  const array = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes);
  const buffer = toArrayBuffer(array);
  return new Blob([buffer], {
    type: 'application/pdf'
  });
};
