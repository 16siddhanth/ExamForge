import { createCanvas } from 'canvas';
import { URL } from 'url';
import { TextDecoder, TextEncoder } from 'util';

// Polyfill window and window.URL at the very top for tesseract.js and PDF.js
(globalThis as any).window = (globalThis as any).window || {};
(globalThis as any).window.location = { href: 'file://' };
(globalThis as any).window.URL = URL;

// Polyfill globalThis.URL for modules that expect it
if (typeof globalThis.URL === 'undefined') {
  (globalThis as any).URL = URL;
}

// Polyfill TextDecoder/TextEncoder if missing
if (!globalThis.TextDecoder) {
  (globalThis as any).TextDecoder = TextDecoder;
}
if (!globalThis.TextEncoder) {
  (globalThis as any).TextEncoder = TextEncoder;
}

// Polyfill CanvasRenderingContext2D if missing
const canvas = createCanvas(1, 1);
if (typeof globalThis.CanvasRenderingContext2D === 'undefined') {
  (globalThis as any).CanvasRenderingContext2D = canvas.getContext('2d').constructor;
}

// Polyfill minimal document for PDF.js
if (typeof globalThis.document === 'undefined') {
  (globalThis as any).document = {
    currentScript: { src: '' },
    documentElement: { style: {} },
    getElementById: () => null,
    createElement: () => ({ style: {}, getContext: () => null }),
    createElementNS: () => ({ style: {}, getContext: () => null }),
  };
}

export { };

