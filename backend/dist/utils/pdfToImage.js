// PDFs to image conversion utility
import { createCanvas } from 'canvas';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
// Import our PDF.js initialization module
import { pdfjsLib } from './pdfjs-init.js';
// Calculate the directory for file operations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Converts a PDF page to a PNG image buffer
 * @param pdfPath Path to the PDF file
 * @param pageNumber Page number to render (1-based)
 * @returns Promise with PNG buffer
 */
export async function renderPDFPageToImage(pdfPath, pageNumber) {
    let data = null;
    let pdf = null;
    try {
        // Read the file data
        data = await fs.readFile(pdfPath);
        // Create a document loading task with the proper type handling
        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(data),
            disableFontFace: true, // Improve performance
            cMapUrl: undefined // Skip loading character maps
        });
        // Set a timeout for loading the document
        const loadingPromise = loadingTask.promise;
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('PDF loading timed out')), 15000);
        });
        pdf = await Promise.race([loadingPromise, timeoutPromise]);
        const page = await pdf.getPage(pageNumber);
        // Use a moderate scale for faster processing and reasonable quality
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        // Create a reasonably sized canvas for large pages
        const maxDimension = 1500;
        let width = viewport.width;
        let height = viewport.height;
        if (width > maxDimension || height > maxDimension) {
            const aspectRatio = width / height;
            if (width > height) {
                width = maxDimension;
                height = width / aspectRatio;
            }
            else {
                height = maxDimension;
                width = height * aspectRatio;
            }
        }
        const canvas = createCanvas(width, height);
        const context = canvas.getContext('2d');
        const renderContext = {
            canvasContext: context,
            viewport: page.getViewport({ scale: scale * (width / viewport.width) }),
            enableWebGL: false,
            renderInteractiveForms: false
        };
        // Set a timeout for rendering
        const renderPromise = page.render(renderContext).promise;
        const renderTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('PDF rendering timed out')), 20000);
        });
        await Promise.race([renderPromise, renderTimeoutPromise]);
        // Generate PNG buffer from canvas
        const buffer = canvas.toBuffer('image/png');
        return buffer;
    }
    catch (error) {
        console.error('Error rendering PDF page:', error);
        // Provide more specific error messages for canvas/DOM related errors
        let errorMessage = `Failed to convert PDF page ${pageNumber} to image: ${error instanceof Error ? error.message : 'Unknown error'}`;
        if (error instanceof Error) {
            if (error.message.includes('canvas') || error.message.includes('DOM') || error.message.includes('render')) {
                errorMessage = `Canvas rendering error on page ${pageNumber}: The PDF contains elements that cannot be rendered. Try converting the PDF to a different format.`;
            }
            else if (error.message.includes('timeout')) {
                errorMessage = `Timeout while processing page ${pageNumber}: The page is too complex or contains too many elements.`;
            }
        }
        throw new Error(errorMessage);
    }
    finally {
        // Clean up resources
        try {
            if (pdf) {
                try {
                    if (typeof pdf.cleanup === 'function')
                        pdf.cleanup();
                    if (typeof pdf.destroy === 'function')
                        pdf.destroy();
                    if (typeof pdf.close === 'function')
                        pdf.close();
                }
                catch (e) {
                    // Ignore cleanup errors
                }
            }
            // Help the garbage collector
            data = null;
            pdf = null;
        }
        catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError);
        }
    }
}
/**
 * Creates a simplified PNG preview of a PDF page, optimized for reliability over quality
 * This is useful for PDFs that might have complex elements that cause rendering issues
 * @param pdfPath Path to the PDF file
 * @param pageNumber Page number to render (1-based)
 * @returns Promise with PNG buffer
 */
export async function createPDFPagePreview(pdfPath, pageNumber) {
    let data = null;
    let pdf = null;
    try {
        // Read the file data
        data = await fs.readFile(pdfPath);
        // Create a document loading task with options for maximum compatibility
        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(data),
            disableFontFace: true, // Improve performance
            ignoreErrors: true, // Continue even with non-fatal errors
            isEvalSupported: false, // Disable JavaScript in the PDF
            useSystemFonts: false, // Don't load system fonts which might be missing
            cMapUrl: undefined // Skip loading character maps
        });
        // Set a timeout for loading the document
        const loadingPromise = loadingTask.promise;
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('PDF preview generation timed out')), 10000);
        });
        pdf = await Promise.race([loadingPromise, timeoutPromise]);
        const page = await pdf.getPage(pageNumber);
        // Use a lower scale for faster processing and better compatibility
        const scale = 1.0;
        const viewport = page.getViewport({ scale });
        // Create a smaller canvas for the preview
        const maxDimension = 800;
        let width = viewport.width;
        let height = viewport.height;
        if (width > maxDimension || height > maxDimension) {
            const aspectRatio = width / height;
            if (width > height) {
                width = maxDimension;
                height = width / aspectRatio;
            }
            else {
                height = maxDimension;
                width = height * aspectRatio;
            }
        }
        const canvas = createCanvas(width, height);
        const context = canvas.getContext('2d');
        // Set up render context with simplified options
        const renderContext = {
            canvasContext: context,
            viewport: page.getViewport({ scale: scale * (width / viewport.width) }),
            enableWebGL: false,
            renderInteractiveForms: false,
            renderTextLayer: false,
            renderAnnotations: false
        };
        // Set a timeout for rendering
        const renderPromise = page.render(renderContext).promise;
        const renderTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('PDF preview rendering timed out')), 15000);
        });
        await Promise.race([renderPromise, renderTimeoutPromise]);
        // Generate PNG buffer from canvas with higher compression for smaller size
        const buffer = canvas.toBuffer('image/png', { compressionLevel: 9 });
        return buffer;
    }
    catch (error) {
        console.error('Error creating PDF page preview:', error);
        // If we get a rendering error, create a simple error image
        try {
            const errorCanvas = createCanvas(800, 600);
            const ctx = errorCanvas.getContext('2d');
            // Fill with light gray background
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, 800, 600);
            // Add error text
            ctx.fillStyle = '#FF0000';
            ctx.font = '24px Arial';
            ctx.fillText(`Error rendering page ${pageNumber}`, 50, 100);
            ctx.font = '18px Arial';
            ctx.fillStyle = '#000000';
            ctx.fillText(`This page contains elements that cannot be rendered.`, 50, 150);
            ctx.fillText(`Try converting the PDF to a simpler format.`, 50, 180);
            return errorCanvas.toBuffer('image/png');
        }
        catch (fallbackError) {
            console.error('Error creating fallback error image:', fallbackError);
            throw new Error(`Failed to create preview for page ${pageNumber}`);
        }
    }
    finally {
        // Clean up resources
        try {
            if (pdf) {
                try {
                    if (typeof pdf.cleanup === 'function')
                        pdf.cleanup();
                    if (typeof pdf.destroy === 'function')
                        pdf.destroy();
                    if (typeof pdf.close === 'function')
                        pdf.close();
                }
                catch (e) {
                    // Ignore cleanup errors
                }
            }
            // Help the garbage collector
            data = null;
            pdf = null;
        }
        catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError);
        }
    }
}
/**
 * Gets the number of pages in a PDF document
 * @param pdfPath Path to the PDF file
 * @returns Promise with page count
 */
export async function getPDFPageCount(pdfPath) {
    try {
        const data = await fs.readFile(pdfPath);
        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(data),
            disableFontFace: true, // Improve performance
            cMapUrl: undefined // Skip loading character maps
        });
        // Handle password-protected PDFs - we'll rely on error handling instead of onPassword
        // since onPassword may not be available in all PDF.js versions
        // Set a timeout for loading the document
        const loadingPromise = loadingTask.promise;
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('PDF loading timed out after 15 seconds')), 15000);
        });
        const pdf = await Promise.race([loadingPromise, timeoutPromise]);
        const pageCount = pdf.numPages;
        // Clean up resources
        if (typeof pdf.destroy === 'function') {
            pdf.destroy();
        }
        return pageCount;
    }
    catch (error) {
        console.error('Error getting PDF page count:', error);
        if (error.message?.includes('password')) {
            throw new Error('Password-protected PDF detected. Please remove the password and try again.');
        }
        else if (error.message?.includes('timed out')) {
            throw new Error('PDF processing timed out. The file may be too large or complex.');
        }
        else {
            throw new Error(`Failed to process PDF: ${error.message || 'Unknown error'}`);
        }
    }
}
// Export the function for backward compatibility if there was a previous name
export const convertPDFPageToImage = renderPDFPageToImage;
//# sourceMappingURL=pdfToImage.js.map