// Multer config for file uploads
import multer from 'multer';
import path from 'path';

// Prevent concurrent uploads - simple flag
let currentlyProcessing = false;
const uploadStartTime = new Map<string, number>();

// Function to reset processing status
export const resetProcessingStatus = () => {
  currentlyProcessing = false;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (currentlyProcessing) {
      // If another upload is already being processed, reject new uploads
      return cb(new Error('Another upload is currently being processed. Please try again in a moment.'), '');
    }
    
    // Mark as processing
    currentlyProcessing = true;
    
    // Record start time
    const requestId = Date.now().toString();
    uploadStartTime.set(requestId, Date.now());
    
    // Attach to request for later cleanup
    (req as any).uploadId = requestId;
    
    cb(null, process.env.UPLOAD_DIR || 'uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function to accept only PDFs and images
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF documents and images are allowed.'));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});
