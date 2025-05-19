import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface FileUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (documentData: any) => void;
  subjects: string[];
  subjectId: string;
}

const FileUploader = ({ isOpen, onClose, onUploadSuccess, subjects, subjectId }: FileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || "");
  const [newSubject, setNewSubject] = useState("");
  const [isAddingNewSubject, setIsAddingNewSubject] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Log props for debugging
  useEffect(() => {
    if (isOpen) {
      console.log("FileUploader opened with props:", { 
        subjects, 
        subjectId,
        userId: localStorage.getItem('userId')
      });
    }
  }, [isOpen, subjects, subjectId]);

  const resetForm = () => {
    setFile(null);
    setFileError("");
    setDocumentTitle("");
    setSelectedSubject(subjects[0] || "");
    setNewSubject("");
    setIsAddingNewSubject(false);
    setIsUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFileError("");
    
    if (!selectedFile) {
      return;
    }      // Check file type
      const fileType = selectedFile.type;
      if (fileType !== "application/pdf" && 
          fileType !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        setFileError("Please upload a PDF or DOCX file");
        console.log("File rejected. Type:", fileType);
        return;
      }
      
      // Check if PDF file is valid (not corrupted)
      if (fileType === "application/pdf") {
        // Just log that we detected a PDF file
        console.log("PDF file selected:", selectedFile.name);
      }
    
    // Check file size (limit to 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setFileError("File size exceeds 10MB limit");
      return;
    }
    
    setFile(selectedFile);
    
    // Set default document title based on file name
    const fileName = selectedFile.name.split('.')[0];
    if (!documentTitle) {
      setDocumentTitle(fileName);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    
    if (droppedFile) {
      // Check file type
      const fileType = droppedFile.type;
      if (fileType !== "application/pdf" && 
          fileType !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        setFileError("Please upload a PDF or DOCX file");
        console.log("File rejected by drop. Type:", fileType);
        return;
      }
      
      // Check file size (limit to 10MB)
      if (droppedFile.size > 10 * 1024 * 1024) {
        setFileError("File size exceeds 10MB limit");
        return;
      }
      
      setFile(droppedFile);
      
      // Set default document title based on file name
      const fileName = droppedFile.name.split('.')[0];
      if (!documentTitle) {
        setDocumentTitle(fileName);
      }
    }
  };
  const handleUpload = async () => {
    if (!file) {
      setFileError("Please select a file to upload");
      return;
    }
    
    if (!documentTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your document",
        variant: "destructive",
      });
      return;
    }
    
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to upload documents. Please log in and try again.",
        variant: "destructive",
      });
      return;
    }
    
    if (!subjectId) {
      toast({
        title: "Subject error",
        description: "No subject ID was provided. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }    let subject = selectedSubject;
    if (isAddingNewSubject && newSubject.trim()) {
      subject = newSubject.trim();    
    } else if (isAddingNewSubject && !newSubject.trim()) {
      toast({
        title: "Subject name required",
        description: "Please enter a name for the new subject",
        variant: "destructive",
      });
      return;
    }
    
    // Double-check all required values before proceeding
    if (!documentTitle.trim() || !userId || !subjectId || !file) {
      console.error("Missing required values:", {
        documentTitle: !documentTitle.trim(),
        userId: !userId,
        subjectId: !subjectId,
        file: !file
      });
      toast({
        title: "Form validation error",
        description: "Some required fields are missing. Please try again.",
        variant: "destructive",
      });
      return;
    }
      setIsUploading(true);
    try {
      // Upload file and metadata to backend
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', documentTitle);
      formData.append('userId', userId);
      
      // Ensure subjectId is treated as a string and properly added to the form
      if (typeof subjectId === 'string') {
        formData.append('subjectId', subjectId.trim());
      } else if (subjectId) {
        formData.append('subjectId', String(subjectId));
      }
      
      // Verify form data contents before sending
      console.log('Form data verification:', {
        hasFile: !!formData.get('file'),
        hasTitle: !!formData.get('title'),
        hasUserId: !!formData.get('userId'),
        hasSubjectId: !!formData.get('subjectId')
      });
        // Log form data for debugging
      console.log('Form data being sent:', {
        title: documentTitle,
        userId,
        subjectId: typeof subjectId === 'string' ? subjectId : String(subjectId),
        fileSize: file.size,
        fileName: file.name
      });
        // For PDF specific issues, verify file type
      if (file.type === 'application/pdf') {
        console.log('PDF file detected. File details:', {
          type: file.type,
          size: file.size,
          lastModified: new Date(file.lastModified).toISOString()
        });
        
        // For PDF files, remind about file compatibility
        console.log('Checking PDF compatibility...');
        
        if (file.size < 100) {
          console.warn('PDF file is suspiciously small, might be corrupted');
        }
      }
      
      // Add loading toast with id to reference it later
      const toastId = toast({ 
        title: 'Processing document', 
        description: 'This may take a moment while we analyze your document...',
        duration: 60000, // Long duration since we'll dismiss manually on success
      });
      
      // Set a timeout to help prevent channel closing errors
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timed out after 120 seconds'));
        }, 120000); // 120 second timeout - longer to accommodate server processing
      });
      
      // Configure Axios with a longer timeout
      const axiosConfig = {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 120 second Axios timeout
        // Progress event for large files
        onUploadProgress: (progressEvent: any) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      };
      
      // Race the actual request with the timeout
      const response = await Promise.race([
        axios.post('/api/papers/upload', formData, axiosConfig),
        timeoutPromise
      ]) as any; // Cast to any to handle both response and error
      
      const documentData = response.data;

      onUploadSuccess(documentData);
      toast({ 
        title: 'Upload successful', 
        description: 'Your document has been processed successfully' 
      });
      resetForm();
      onClose();    } catch (error: any) {
      console.error("Error processing document:", error);
      
      // Extract the most useful error message
      let errorMessage = "There was an error processing your document";
      
      if (error.message === 'Request timed out after 120 seconds') {
        errorMessage = "The request timed out. The server is taking too long to process your document. Try a smaller file or fewer pages.";      } else if (error.message === 'Network Error') {
        errorMessage = "Network connection error. The connection may have been interrupted during upload.";
      } else if (error.message?.includes('message channel closed')) {
        errorMessage = "The connection to the server was closed unexpectedly. This can happen with large files or slow connections.";
      } else if (error.message?.includes('canvas') || error.message?.includes('DOM') || error.message?.includes('render')) {
        errorMessage = "PDF rendering error: The document contains elements that cannot be processed.";
        
        // Show an additional toast with more detailed information
        toast({
          title: "PDF compatibility issue",
          description: "This PDF contains elements that are difficult to process. Try saving it as a simplified PDF.",
          variant: "destructive"
        });
      } else if (error.message?.includes('canvas') || error.message?.includes('DOM') || error.message?.includes('render')) {
        errorMessage = "PDF rendering error: The document contains elements that cannot be processed. Try converting it to a different format or flatten complex elements.";
        toast({
          title: "PDF compatibility issue",
          description: "This PDF contains elements that are difficult to process. For best results, try saving it as a simplified PDF without layers or 3D content.",
          variant: "destructive"
        });
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const responseError = error.response.data?.error || error.response.data?.message;
        if (responseError) {
          errorMessage = responseError;
          console.log('Server error details:', error.response.data);        } else if (error.response.status === 400) {
          // For 400 errors, try to extract more specific error details
          if (error.response.data) {
            console.log('Bad request details:', error.response.data);
            const missingFields = [];
            if (!documentTitle) missingFields.push('Document title');
            if (!localStorage.getItem('userId')) missingFields.push('User ID');
            if (!subjectId) missingFields.push('Subject ID');
            
            if (missingFields.length > 0) {
              errorMessage = `Missing required fields: ${missingFields.join(', ')}`;            } else if (file.type === 'application/pdf') {
              errorMessage = "Issue with PDF file: The file may be corrupted, password-protected, or in an unsupported format. Try a different PDF file.";
              
              // Provide more detailed instructions for common PDF issues
              toast({
                title: "PDF troubleshooting tips",
                description: "Try saving the PDF again with 'Save As' in a PDF reader, removing any password protection, or converting it to a different format first.",
                duration: 8000
              });
            } else {
              errorMessage = "Bad request: Please check your file and try again";
            }
          } else {
            errorMessage = "Bad request: Please check your file format and try again";
          }
        } else if (error.response.status === 413) {
          errorMessage = "The file is too large. Please upload a smaller file";
        } else if (error.response.status === 500) {
          errorMessage = "Server error during processing. The server might be overloaded or the file too complex.";
        } else if (error.response.status === 504) {
          errorMessage = "The server timed out while processing your request. Try again with a smaller document.";
        }
      } else if (error.message?.includes('canvas') || error.message?.includes('DOM') || error.message?.includes('render')) {
        // Handle specific DOM/Canvas-related errors for PDF processing
        errorMessage = "There was an issue processing your PDF. This might be due to unsupported elements or complex content in the file.";
        toast({
          title: "PDF rendering issue",
          description: "Try simplifying your PDF or converting it to a different format before uploading.",
          variant: "destructive"
        });
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = "No response from server. The connection may have been lost during upload.";
      } else {
        // Something happened in setting up the request
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Allow quick restart if PDF-specific errors
      if (file.type === 'application/pdf' && (error.response?.status === 400 || errorMessage.includes('PDF'))) {
        setFileError("Please try a different PDF file or convert to DOCX format");
        // Don't reset the form completely, just mark it as not uploading
        setIsUploading(false);
      } else {
        setIsUploading(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Upload Question Paper</DialogTitle>
          <DialogDescription>
            Upload a PDF or DOCX file of a past exam paper to process with OCR.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {!file ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop your file here, or click to browse
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supports: PDF, DOCX (Max 10MB)
              </p>              <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
              />
              {fileError && <p className="mt-2 text-sm text-red-500">{fileError}</p>}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 relative">
              <div className="flex items-center">
                <div className="bg-exam-lightPurple p-2 rounded-md">
                  <svg
                    className="h-6 w-6 text-exam-purple"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="ml-2 text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="documentTitle">Document Title</Label>
              <Input
                id="documentTitle"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Enter a title for this document"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="subject">Subject</Label>
                {subjects.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingNewSubject(!isAddingNewSubject)}
                    className="text-exam-purple text-xs"
                  >
                    {isAddingNewSubject ? "Select Existing" : "Add New Subject"}
                  </Button>
                )}
              </div>
              
              {isAddingNewSubject ? (
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Enter new subject name"
                />
              ) : (
                <select
                  id="subject"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {subjects.length === 0 ? (
                    <option value="">No subjects available</option>
                  ) : (
                    subjects.map((subject, index) => (
                      <option key={index} value={subject}>
                        {subject}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="bg-exam-purple hover:bg-exam-darkPurple"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Upload & Process"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploader;
