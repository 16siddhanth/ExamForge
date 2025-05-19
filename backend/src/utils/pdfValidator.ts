// Utility to pre-validate PDF files before processing
import * as fs from 'fs/promises';
import { stat } from 'fs/promises';

// Maximum file size (100 MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Maximum number of pages to allow
const MAX_PAGE_COUNT = 200;

/**
 * Performs enhanced validation of a PDF file beyond basic header checks
 * @param filePath Path to the PDF file
 * @returns Promise with detailed validation results
 */
export async function validatePDFContent(filePath: string): Promise<{
  isValid: boolean;
  issues: Array<{
    severity: 'warning' | 'error';
    message: string;
  }>;
  recommendations?: string[];
}> {
  const issues: Array<{ severity: 'warning' | 'error'; message: string }> = [];
  const recommendations: string[] = [];
  let isValid = true;

  try {
    // Read just the first 8KB to check the PDF contents
    const fileHandle = await fs.open(filePath, 'r');
    const { buffer } = await fileHandle.read(Buffer.alloc(8192), 0, 8192, 0);
    await fileHandle.close();
    
    const fileContent = buffer.toString('utf-8');

    // Check for PDF header
    if (!fileContent.startsWith('%PDF-')) {
      issues.push({
        severity: 'error',
        message: 'Not a valid PDF file. The file does not have a proper PDF header.'
      });
      isValid = false;
    }

    // Check for encryption/protection
    if (fileContent.includes('/Encrypt') || fileContent.includes('/Encryption')) {
      issues.push({
        severity: 'error',
        message: 'The PDF file appears to be encrypted or password-protected.'
      });
      recommendations.push('Remove the password protection and try again.');
      isValid = false;
    }

    // Check for potential 3D content which might cause rendering issues
    if (fileContent.includes('/3D') || fileContent.includes('/PRC') || fileContent.includes('/U3D')) {
      issues.push({
        severity: 'warning',
        message: 'The PDF appears to contain 3D content, which may cause rendering issues.'
      });
      recommendations.push('Save the PDF as a flattened 2D document before uploading.');
    }

    // Check for complex graphics that might be problematic
    if (fileContent.includes('/Shader') || fileContent.includes('/Pattern') || fileContent.includes('/XObject')) {
      issues.push({
        severity: 'warning',
        message: 'The PDF contains complex graphics elements that might affect processing.'
      });
    }

    // Check file size
    const fileStats = await stat(filePath);
    if (fileStats.size > MAX_FILE_SIZE) {
      issues.push({
        severity: 'error',
        message: `File is too large (${Math.round(fileStats.size / (1024 * 1024))} MB). Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`
      });
      recommendations.push('Reduce the file size or split the document into smaller parts.');
      isValid = false;
    }

    return {
      isValid: isValid && issues.filter(i => i.severity === 'error').length === 0,
      issues,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    };
  } catch (error) {
    console.error('Error validating PDF content:', error);
    return {
      isValid: false,
      issues: [{
        severity: 'error',
        message: `Failed to validate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

/**
 * Performs basic validation of a PDF file by checking its header and size
 * @param filePath Path to the PDF file
 * @returns {Promise<{isValid: boolean, reason?: string}>} Validation result
 */
export async function validatePDF(filePath: string): Promise<{isValid: boolean, reason?: string}> {
  try {
    // Check file size first
    const fileStats = await stat(filePath);
    if (fileStats.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        reason: `File is too large (${Math.round(fileStats.size / (1024 * 1024))} MB). Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`
      };
    }
    
    // Read just the first 1024 bytes to check the PDF header
    const fileHandle = await fs.open(filePath, 'r');
    const { buffer } = await fileHandle.read(Buffer.alloc(1024), 0, 1024, 0);
    await fileHandle.close();
    
    const pdfHeader = buffer.toString('utf-8', 0, 8);
    
    // Check for PDF header %PDF-1.x
    if (!pdfHeader.startsWith('%PDF-1.')) {
      return { 
        isValid: false, 
        reason: 'Not a valid PDF file. The file does not have a proper PDF header.' 
      };
    }
    
    // Check for encrypted PDF (very basic check - not 100% reliable)
    const fileContent = buffer.toString('utf-8');
    if (fileContent.includes('/Encrypt') || fileContent.includes('/Encryption')) {
      return { 
        isValid: false, 
        reason: 'The PDF file appears to be encrypted or password-protected. Please remove the protection and try again.'
      };
    }
    
    // Check for potential 3D content which might cause rendering issues
    if (fileContent.includes('/3D') || fileContent.includes('/PRC') || fileContent.includes('/U3D')) {
      return {
        isValid: false,
        reason: 'The PDF appears to contain 3D content, which is not supported for processing. Please flatten or simplify the PDF and try again.'
      };
    }

    // Basic check passed
    return { isValid: true };
    
  } catch (error) {
    console.error('Error validating PDF:', error);
    return { 
      isValid: false, 
      reason: `Error validating PDF: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * A simple function to estimate PDF page count without using PDF.js
 * This won't be accurate but is a fallback if PDF.js fails
 */
export async function estimatePDFPageCount(filePath: string): Promise<number> {
  try {
    // Read the entire file as text
    const data = await fs.readFile(filePath, { encoding: 'latin1' });
    
    // Count occurrences of "/Page" which is a rough estimate of pages
    // This is not reliable but better than nothing as a fallback
    const pageMarkers = data.match(/\/Type\s*\/Page/g);
    
    if (pageMarkers && pageMarkers.length > 0) {
      return pageMarkers.length;
    }
    
    // Another approach: Count occurrences of "obj" as a rough approximate
    const objMatches = data.match(/\d+\s+\d+\s+obj/g);
    if (objMatches && objMatches.length > 5) {
      // Very rough approximation, dividing by 10 as each page typically has multiple objects
      return Math.max(1, Math.ceil(objMatches.length / 10));
    }
    
    // Default to 1 if we can't determine
    return 1;
  } catch (error) {
    console.error('Error estimating PDF page count:', error);
    return 1; // Default to 1 page on error
  }
}
