
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X, Loader2 } from "lucide-react";
import { processDocumentWithOCR } from "@/utils/ocr";

interface FileUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (documentData: any) => void;
  subjects: string[];
}

const FileUploader = ({ isOpen, onClose, onUploadSuccess, subjects }: FileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || "");
  const [newSubject, setNewSubject] = useState("");
  const [isAddingNewSubject, setIsAddingNewSubject] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
    }
    
    // Check file type
    const fileType = selectedFile.type;
    if (fileType !== "application/pdf" && 
        fileType !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      setFileError("Please upload a PDF or DOCX file");
      return;
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
    
    let subject = selectedSubject;
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
    
    setIsUploading(true);
    
    try {
      // Process document with OCR
      const documentData = await processDocumentWithOCR(file);
      
      // Add metadata
      const documentWithMetadata = {
        ...documentData,
        title: documentTitle,
        subject: subject,
        uploadDate: new Date().toISOString(),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      };
      
      // Simulate processing delay
      setTimeout(() => {
        onUploadSuccess(documentWithMetadata);
        
        toast({
          title: "Upload successful",
          description: "Your document has been processed successfully",
        });
        
        resetForm();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error processing document:", error);
      toast({
        title: "Upload failed",
        description: "There was an error processing your document",
        variant: "destructive",
      });
      setIsUploading(false);
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
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx"
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
