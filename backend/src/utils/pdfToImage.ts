import { createCanvas } from 'canvas';
import * as fs from 'fs/promises';
import * as path from 'path';

// We'll use dynamic import for pdf.js
export async function convertPDFPageToImage(pdfPath: string, pageNumber: number = 1): Promise<Buffer> {
    try {
        const pdfjsLib = await import('pdfjs-dist');
        // Set worker source after importing
        pdfjsLib.GlobalWorkerOptions.workerSrc = path.resolve(__dirname, '../../node_modules/pdfjs-dist/build/pdf.worker.mjs');

        const data = await fs.readFile(pdfPath);
        const pdf = await pdfjsLib.getDocument(new Uint8Array(data)).promise;
        const page = await pdf.getPage(pageNumber);
        
        const scale = 2.0;
        const viewport = page.getViewport({ scale });
        
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');
        
        const renderContext = {
            canvasContext: context as any,
            viewport: viewport,
            enableWebGL: false,
            renderInteractiveForms: false
        };
        
        await page.render(renderContext).promise;
        return canvas.toBuffer('image/png');
    } catch (error) {
        console.error('Error rendering PDF page:', error);
        throw new Error('Failed to convert PDF page to image');
    }
}

export async function getPDFPageCount(pdfPath: string): Promise<number> {
    try {
        const pdfjsLib = await import('pdfjs-dist');
        // Set worker source after importing
        pdfjsLib.GlobalWorkerOptions.workerSrc = path.resolve(__dirname, '../../node_modules/pdfjs-dist/build/pdf.worker.mjs');

        const data = await fs.readFile(pdfPath);
        const pdf = await pdfjsLib.getDocument(new Uint8Array(data)).promise;
        return pdf.numPages;
    } catch (error) {
        console.error('Error getting PDF page count:', error);
        throw new Error('Failed to get PDF page count');
    }
}
