import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Download, Eye, FileText, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Document {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  status: string;
  extracted_text: string | null;
  created_at: string;
  file_path: string;
}

interface DocumentViewerModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (document: Document) => void;
}

export const DocumentViewerModal = ({ document, isOpen, onClose, onDelete }: DocumentViewerModalProps) => {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);

  useEffect(() => {
    if (document && isOpen && document.file_path) {
      loadDocumentUrl();
    }
    return () => {
      if (documentUrl) {
        URL.revokeObjectURL(documentUrl);
      }
    };
  }, [document, isOpen]);

  const loadDocumentUrl = async () => {
    if (!document || !document.file_path) return;
    
    setIsLoadingDocument(true);
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) {
        console.error('Error loading document:', error);
        toast({
          title: "Failed to load document",
          description: "Could not load the document for viewing.",
          variant: "destructive",
        });
        return;
      }

      const blob = new Blob([data], { type: document.file_type });
      const url = URL.createObjectURL(blob);
      setDocumentUrl(url);
    } catch (error) {
      console.error('Error loading document:', error);
      toast({
        title: "Failed to load document",
        description: "An error occurred while loading the document.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDocument(false);
    }
  };

  if (!document) return null;

  const handleDownload = async () => {
    try {
      if (document.file_path) {
        // Get the download URL from Supabase storage
        const { data, error } = await supabase.storage
          .from('documents')
          .download(document.file_path);

        if (error) {
          toast({
            title: "Download failed",
            description: "Could not download the document. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // Create blob URL and trigger download
        const blob = new Blob([data], { type: document.file_type });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = document.name;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Download started",
          description: "Your document is being downloaded.",
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "An error occurred while downloading the document.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    if (onDelete && document) {
      onDelete(document);
      onClose(); // Close modal after deletion
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">{document.name}</DialogTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <span>{(document.file_size / 1024 / 1024).toFixed(2)} MB</span>
                  <span>•</span>
                  <span>{document.file_type}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(document.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={document.status === 'completed' ? 'default' : document.status === 'processing' ? 'secondary' : 'destructive'}
                className={
                  document.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : document.status === 'processing' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
                }
              >
                {document.status === 'completed' ? 'Processed' : document.status === 'processing' ? 'Processing' : 'Failed'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!document.file_path}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6">
          <Tabs defaultValue="document" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="document" className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>View Document</span>
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Extracted Text</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="document" className="mt-4">
              {isLoadingDocument ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Loading Document</h3>
                  <p className="text-gray-500">Please wait while we load your document...</p>
                </div>
              ) : documentUrl ? (
                <div className="border rounded-lg overflow-hidden">
                  {document.file_type === 'application/pdf' ? (
                    <iframe
                      src={documentUrl}
                      className="w-full h-[500px]"
                      title={document.name}
                    />
                  ) : document.file_type.startsWith('image/') ? (
                    <div className="p-4 text-center">
                      <img
                        src={documentUrl}
                        alt={document.name}
                        className="max-w-full max-h-[500px] mx-auto rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">Preview Not Available</h3>
                      <p className="text-gray-500 mb-4">
                        This file type cannot be previewed in the browser.
                      </p>
                      <Button onClick={handleDownload} className="bg-gradient-to-r from-purple-600 to-blue-600">
                        <Download className="w-4 h-4 mr-2" />
                        Download to View
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Document Not Available</h3>
                  <p className="text-gray-500">Unable to load the document for viewing.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="text" className="mt-4">
              {document.status === 'completed' && document.extracted_text ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Content</h3>
                  <ScrollArea className="h-96 w-full rounded-md border p-4">
                    <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                      {document.extracted_text}
                    </div>
                  </ScrollArea>
                </div>
              ) : document.status === 'processing' ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Processing Document</h3>
                  <p className="text-gray-500">
                    We're extracting text and generating questions from your document. This may take a few minutes.
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Text Not Available</h3>
                  <p className="text-gray-500">
                    Text extraction is in progress or failed. The document can still be viewed in the "View Document" tab.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
