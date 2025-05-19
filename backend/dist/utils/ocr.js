import mammoth from 'mammoth';
import * as path from 'path';
// @ts-ignore: import Node.js build of Tesseract to avoid browser 'window' errors
import { createWorker } from 'tesseract.js/lib/node/index.js';
import { createPDFPagePreview, getPDFPageCount, renderPDFPageToImage } from './pdfToImage.js';
// Max pages to process to prevent timeout
const MAX_PAGES = 8;
// Timeout per page (ms)
const PAGE_TIMEOUT = 25000;
export async function performOCR(filePath) {
    // Create and initialize Tesseract worker for Node.js
    const worker = createWorker({ logger: m => console.log(m) });
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    let text = '';
    const fileExt = path.extname(filePath).toLowerCase();
    // Handle DOCX files by extracting raw text
    if (fileExt === '.docx') {
        try {
            const { value: docxText } = await mammoth.extractRawText({ path: filePath });
            return docxText;
        }
        catch (err) {
            console.error('DOCX extraction error:', err);
            throw new Error(`DOCX processing failed: ${err?.message || 'Unknown error'}`);
        }
    }
    try {
        if (fileExt === '.pdf') {
            const pageCount = await getPDFPageCount(filePath);
            // For large PDFs, only process first MAX_PAGES pages to avoid timeouts
            const pagesToProcess = Math.min(pageCount, MAX_PAGES);
            console.log(`Processing PDF with ${pageCount} pages (limiting to ${pagesToProcess} pages)`);
            // Process pages in smaller batches to reduce memory pressure
            const BATCH_SIZE = 2;
            for (let batch = 0; batch < Math.ceil(pagesToProcess / BATCH_SIZE); batch++) {
                const startPage = batch * BATCH_SIZE + 1;
                const endPage = Math.min(startPage + BATCH_SIZE - 1, pagesToProcess);
                console.log(`Processing batch ${batch + 1}: pages ${startPage}-${endPage}`);
                // Process each page in batch
                for (let i = startPage; i <= endPage; i++) {
                    // Create a timeout promise for each page
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => {
                            reject(new Error(`Processing page ${i} timed out after ${PAGE_TIMEOUT / 1000} seconds`));
                        }, PAGE_TIMEOUT);
                    });
                    try {
                        // Try to convert the PDF page to an image with a timeout
                        const imagePromise = renderPDFPageToImage(filePath, i);
                        const imageBuffer = await Promise.race([imagePromise, timeoutPromise]);
                        // Process the image with Tesseract OCR
                        const { data: { text: pageText } } = await worker.recognize(imageBuffer);
                        text += pageText + '\n\n';
                        // Force garbage collection between pages (effective in environments where --expose-gc is used)
                        if (global.gc) {
                            global.gc();
                        }
                    }
                    catch (pageError) {
                        console.error(`Error processing page ${i}:`, pageError);
                        // Try with the preview mode which is more reliable for complex PDFs
                        try {
                            console.log(`Attempting fallback with simplified preview renderer for page ${i}...`);
                            const previewBuffer = await createPDFPagePreview(filePath, i);
                            // Process the preview image
                            const { data: { text: fallbackText } } = await worker.recognize(previewBuffer);
                            // Add a note about using the fallback renderer
                            text += `[Note: Using simplified rendering for page ${i} due to complexity]\n`;
                            text += fallbackText + '\n\n';
                            console.log(`Successfully processed page ${i} with fallback renderer`);
                        }
                        catch (fallbackError) {
                            // If the fallback also fails, add a note about the failed page and continue
                            console.error(`Fallback rendering also failed for page ${i}:`, fallbackError);
                            text += `[Error: Unable to process page ${i} - The page contains elements that cannot be rendered]\n\n`;
                        }
                        // Instead of failing completely, add a note about the failed page and continue
                        text += `[Error: Unable to process page ${i} - ${pageError.message}]\n\n`;
                        // If this is a DOM/canvas error, provide more context
                        if (pageError.message.includes('canvas') || pageError.message.includes('DOM')) {
                            console.warn(`Canvas rendering error detected on page ${i}. This may indicate complex PDF content.`);
                        }
                        // Continue with next page rather than failing the entire process
                        continue;
                    }
                }
                // Brief pause between batches to let the system recover
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            if (pageCount > pagesToProcess) {
                text += `\n[Note: Only the first ${pagesToProcess} pages were processed due to document size]\n`;
            }
        }
        else {
            // For non-PDF files (images), process directly
            const { data: { text: result } } = await worker.recognize(filePath);
            text = result;
        }
    }
    catch (error) {
        console.error('OCR Error:', error);
        throw new Error(`OCR processing failed: ${error?.message || 'Unknown error'}`);
    }
    finally {
        await worker.terminate();
    }
    return text;
}
//# sourceMappingURL=ocr.js.map