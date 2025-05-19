import express from 'express';
import * as fs from 'fs';
import path from 'path';
import { upload } from '../middleware/upload.js';
import { performOCR } from '../utils/ocr.js';
import { getPDFPageCount } from '../utils/pdfToImage.js';
import { validatePDFContent } from '../utils/pdfValidator.js';
const router = express.Router();
// POST /api/ocr/upload - OCR processing for uploaded files (PDFs/images)
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }
        const filePath = req.file.path;
        const ext = path.extname(filePath).toLowerCase();
        // For PDFs, validate content before processing
        if (ext === '.pdf') {
            const validation = await validatePDFContent(filePath);
            if (!validation.isValid) {
                // Get the first error message
                const errorMessage = validation.issues.find(i => i.severity === 'error')?.message || 'Invalid PDF file';
                // Clean up the file
                fs.unlinkSync(filePath);
                return res.status(400).json({
                    error: errorMessage,
                    issues: validation.issues,
                    recommendations: validation.recommendations
                });
            }
            // Include warnings in the response even if we'll proceed with processing
            const warnings = validation.issues.filter(i => i.severity === 'warning');
            if (warnings.length > 0) {
                console.warn(`PDF warnings for ${req.file.originalname}:`, warnings);
            }
        }
        const pageCount = ext === '.pdf' ? await getPDFPageCount(filePath) : 1;
        const startTime = Date.now();
        // Perform OCR
        const text = await performOCR(filePath);
        const processingTimeMs = Date.now() - startTime;
        // Cleanup temporary file
        fs.unlinkSync(filePath);
        // Return OCR result
        res.json({
            text,
            questions: [],
            metadata: {
                pageCount,
                documentType: ext === '.pdf' ? 'pdf' : 'image',
                language: 'en',
                processingTimeMs
            }
        });
    }
    catch (error) {
        console.error('Error in OCR upload:', error);
        // Make sure to clean up the temporary file
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            }
            catch (cleanupError) {
                console.error('Error cleaning up temp file:', cleanupError);
            }
        }
        // Provide specific error messages based on the error type
        let statusCode = 500;
        let errorMessage = 'OCR processing failed';
        if (error.message?.includes('PDF')) {
            statusCode = 400;
            errorMessage = 'PDF processing error: ' + error.message;
        }
        else if (error.message?.includes('timeout')) {
            statusCode = 408; // Request Timeout
            errorMessage = 'Processing timed out. The document may be too large or complex.';
        }
        else if (error.message?.includes('canvas') || error.message?.includes('render')) {
            statusCode = 400;
            errorMessage = 'Document rendering error: The file contains elements that cannot be processed.';
        }
        res.status(statusCode).json({
            error: errorMessage,
            details: error.message,
            suggestions: [
                "Try converting the document to a simpler format",
                "Reduce the file size or number of pages",
                "If the file is scanned, ensure it's properly oriented and has good contrast"
            ]
        });
    }
});
export default router;
//# sourceMappingURL=ocr.js.map