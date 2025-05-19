// Polyfills for DOM APIs needed by PDF.js in Node.js
import { DOMMatrix as CanvasDOMMatrix, createCanvas } from 'canvas';
import { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from 'util';
// TypeScript doesn't fully understand how to merge built-in types with new properties,
// so we use the any type override approach to prevent conflicts
// while still making the functionality available to runtime code
// Set up polyfills safely with proper ES module approach
try {
    // First check if we're in a Node.js environment (no window/document objects)
    const isNode = typeof window === 'undefined' && typeof process !== 'undefined';
    if (!isNode) {
        console.log('Browser environment detected, skipping DOM polyfills');
        // In browser environments, DOM APIs are already available
        // so we don't need to do anything
    }
    else {
        console.log('Node.js environment detected, setting up DOM polyfills');
        // Polyfill window for Node.js modules that expect it
        if (typeof globalThis.window === 'undefined') {
            globalThis.window = { location: { href: '' } };
        }
        // Apply DOMMatrix polyfill if not available
        if (typeof globalThis.DOMMatrix !== 'function') {
            globalThis.DOMMatrix = CanvasDOMMatrix;
        }
        // Workaround for the Node.js environment - set up Canvas context
        const canvas = createCanvas(1, 1);
        if (typeof globalThis.CanvasRenderingContext2D === 'undefined') {
            globalThis.CanvasRenderingContext2D = canvas.getContext('2d').constructor;
        }
        // Ensure TextDecoder/TextEncoder are available
        if (!globalThis.TextDecoder) {
            globalThis.TextDecoder = NodeTextDecoder;
        }
        if (!globalThis.TextEncoder) {
            globalThis.TextEncoder = NodeTextEncoder;
        }
        // Add Path2D which isn't available in Node.js
        if (!globalThis.Path2D) {
            globalThis.Path2D = class Path2D {
                constructor(path) {
                    // Constructor implementation
                }
                addPath(path, transform) { }
                closePath() { }
                moveTo(x, y) { }
                lineTo(x, y) { }
                bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) { }
                quadraticCurveTo(cpx, cpy, x, y) { }
                arc(x, y, radius, startAngle, endAngle, counterclockwise) { }
                arcTo(x1, y1, x2, y2, radius) { }
                ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise) { }
                rect(x, y, width, height) { }
            };
        }
        // Add missing DOM elements needed specifically for PDF.js
        if (typeof globalThis.document === 'undefined') {
            globalThis.document = {
                currentScript: { src: '' },
                documentElement: {
                    style: {},
                },
                getElementById: () => null,
                createElement: () => ({
                    style: {},
                    getContext: () => null,
                }),
                createElementNS: () => ({
                    style: {},
                    getContext: () => null,
                }),
            };
        }
        // Ensure URL is defined
        if (typeof globalThis.URL === 'undefined' || typeof globalThis.URL.createObjectURL === 'undefined') {
            if (typeof globalThis.URL === 'undefined') {
                globalThis.URL = {};
            }
            if (typeof globalThis.URL.createObjectURL === 'undefined') {
                globalThis.URL.createObjectURL = function () { return ''; };
            }
        }
    }
}
catch (error) {
    console.error('Error setting up DOM polyfills:', error?.message || error);
}
//# sourceMappingURL=domPolyfills.js.map