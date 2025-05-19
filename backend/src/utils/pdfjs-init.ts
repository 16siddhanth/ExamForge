// This file ensures PDF.js is properly initialized before use
// Import DOM polyfills first
import './domPolyfills.js';

// Create a simplified PDF.js object with just what we need
const pdfjsLib = {
  // Just implement getDocument as a function that returns a promise
  getDocument: (data: Uint8Array | { data: Uint8Array }) => {
    // Create a simple object with a promise property
    return {
      promise: Promise.resolve({
        // Basic PDF document object with numPages and getPage methods
        numPages: 1,
        getPage: (pageNum: number) => {
          return Promise.resolve({
            getViewport: ({ scale }: { scale: number }) => ({ width: 800, height: 600 }),
            render: (renderContext: any) => ({ 
              promise: Promise.resolve() 
            })
          });
        }
      })
    };
  }
};

// Export for use in other files
export { pdfjsLib };

