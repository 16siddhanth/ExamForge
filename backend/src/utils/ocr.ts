import * as path from 'path';
import { createWorker } from 'tesseract.js';
import { convertPDFPageToImage, getPDFPageCount } from './pdfToImage';

export async function performOCR(filePath: string): Promise<string> {
    const worker = await createWorker('eng');
    let text = '';
    
    const fileExt = path.extname(filePath).toLowerCase();
    
    try {
        if (fileExt === '.pdf') {
            const pageCount = await getPDFPageCount(filePath);
            for (let i = 1; i <= pageCount; i++) {
                const imageBuffer = await convertPDFPageToImage(filePath, i);
                const { data: { text: pageText } } = await worker.recognize(imageBuffer);
                text += pageText + '\n\n';
            }
        } else {
            // For non-PDF files (images), process directly
            const { data: { text: result } } = await worker.recognize(filePath);
            text = result;
        }
    } catch (error: any) {
        console.error('OCR Error:', error);
        throw new Error(`OCR processing failed: ${error?.message || 'Unknown error'}`);
    } finally {
        await worker.terminate();
    }
    
    return text;
}