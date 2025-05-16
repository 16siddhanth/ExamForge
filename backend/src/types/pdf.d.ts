declare module 'pdfjs-dist' {
    interface PDFPageProxy {
        getViewport: (options: { scale: number }) => {
            width: number;
            height: number;
        };
        render: (context: {
            canvasContext: any;
            viewport: any;
            enableWebGL?: boolean;
            renderInteractiveForms?: boolean;
        }) => {
            promise: Promise<void>;
        };
    }

    interface PDFDocumentProxy {
        getPage: (pageNumber: number) => Promise<PDFPageProxy>;
        numPages: number;
    }

    const GlobalWorkerOptions: {
        workerSrc: string;
    };
    
    function getDocument(data: Uint8Array): {
        promise: Promise<PDFDocumentProxy>;
    };
}
