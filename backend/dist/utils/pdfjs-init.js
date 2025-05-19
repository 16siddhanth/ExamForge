// This file ensures PDF.js is properly initialized before use
// Import DOM polyfills first
import './domPolyfills.js';
// Import PDF.js - we use a relative import to ensure ESM compatibility
import * as pdfjsLib from 'pdfjs-dist';
// Try to safely configure worker
try {
    // Only set worker source if GlobalWorkerOptions exists and we're in a Node environment
    if (pdfjsLib.GlobalWorkerOptions && typeof window === 'undefined') {
        // For Node.js environments, we can run without a separate worker process
        // Setting an empty string tells PDF.js to run workers in the main thread
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        console.log('PDF.js initialized in main thread mode');
    }
}
catch (error) {
    console.warn('Could not configure PDF.js worker:', error);
}
// Export for use in other files
export { pdfjsLib };
//# sourceMappingURL=pdfjs-init.js.map