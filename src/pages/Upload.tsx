import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSubjects } from '@/hooks/useSubjects';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, CheckCircle, Clock, FileText, LogOut, Upload as UploadIcon, XCircle, Zap } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Link, Navigate } from 'react-router-dom';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: UploadStatus;
  progress: number;
  subjectId?: string;
  error?: string;
  file?: File;
  processingMode?: 'direct' | 'storage';
}

const Upload = () => {
  const { user, signOut } = useAuth();
  const { subjects } = useSubjects();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => {
      const directProcessingLimit = 5 * 1024 * 1024; // 5MB
      const isSmallFile = file.size <= directProcessingLimit;
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        status: 'idle' as UploadStatus,
        progress: 0,
        file,
        processingMode: isSmallFile ? 'direct' : 'storage'
      };
    });
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  });

  const uploadFileDirectly = async (fileId: string, file: File, subjectId: string) => {
    console.log(`⚡ Starting direct upload for ${file.name} (${file.size} bytes)`);
    
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'uploading' as UploadStatus, subjectId }
        : f
    ));

    try {
      // Create FormData for direct upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subjectId', subjectId);
      formData.append('fileName', file.name);

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, progress: 25, status: 'processing' as UploadStatus }
          : f
      ));

      // Send directly to the process-document function (supports both direct and storage processing)
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, progress: 100, status: 'success' as UploadStatus }
          : f
      ));

      toast({
        title: "Document processed successfully",
        description: `Generated ${result.questionsGenerated} questions from your document using ${result.processingMode} mode.`
      });

      return result;

    } catch (error: any) {
      console.error('❌ Direct upload failed:', error);
      
      // Check if it's a CORS/network error (function not deployed)
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        console.log('🔄 Direct processing function not available, falling back to storage method...');
        
        toast({
          title: "Falling back to storage method",
          description: "Direct processing unavailable, using standard upload method.",
        });
        
        // Fall back to storage-based processing
        return await uploadFileViaStorage(fileId, file, subjectId);
      }
      
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'error' as UploadStatus, error: error.message }
          : f
      ));

      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const uploadFileViaStorage = async (fileId: string, file: File, subjectId: string) => {
    console.log(`📦 Starting storage upload for ${file.name} (${file.size} bytes)`);
    
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'uploading' as UploadStatus, subjectId }
        : f
    ));

    try {
      // Upload to Supabase Storage
      const filePath = `${user.id}/${fileId}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, progress: 50 }
          : f
      ));

      // Create document record
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          subject_id: subjectId,
          name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          status: 'processing'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, progress: 75, status: 'processing' as UploadStatus }
          : f
      ));

      // Process document with AI using the original function
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: { documentId: document.id }
      });

      if (error) throw new Error(error.message);

      if (data.success) {
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, progress: 100, status: 'success' as UploadStatus }
            : f
        ));

        toast({
          title: "Document processed successfully",
          description: `Generated ${data.questionsGenerated} questions from your document using storage mode.`
        });
      } else {
        throw new Error(data.error);
      }

    } catch (error: any) {
      console.error('❌ Storage upload failed:', error);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'error' as UploadStatus, error: error.message }
          : f
      ));

      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const uploadFile = async (fileId: string, file: File, subjectId: string) => {
    const fileObj = files.find(f => f.id === fileId);
    if (!fileObj) return;

    if (fileObj.processingMode === 'direct') {
      await uploadFileDirectly(fileId, file, subjectId);
    } else {
      await uploadFileViaStorage(fileId, file, subjectId);
    }
  };

  const handleUploadAll = async () => {
    if (!selectedSubject) {
      toast({
        title: "Please select a subject",
        description: "You need to select a subject before uploading files.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    const filesToUpload = files.filter(f => f.status === 'idle' && f.file);
    
    // Process files in parallel for better performance
    const uploadPromises = filesToUpload.map(file => {
      if (file.file) {
        return uploadFile(file.id, file.file, selectedSubject);
      }
    });

    try {
      await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Batch upload error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: UploadStatus) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing with AI...';
      case 'success':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return 'Ready to upload';
    }
  };

  const getProcessingModeIcon = (mode?: 'direct' | 'storage') => {
    if (mode === 'direct') {
      return (
        <div title="Fast direct processing">
          <Zap className="w-4 h-4 text-yellow-500" />
        </div>
      );
    }
    return (
      <div title="Storage processing">
        <FileText className="w-4 h-4 text-gray-500" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ExamForge
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                  Dashboard
                </Button>
              </Link>
              <Link to="/subjects">
                <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                  Subjects
                </Button>
              </Link>
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload Documents</h1>
          <p className="text-xl text-gray-600">Upload your study materials to generate AI-powered quizzes</p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Files under 5MB: Direct processing (faster)</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="w-4 h-4 text-gray-500" />
              <span>Larger files: Storage processing</span>
            </div>
          </div>
        </div>

        {/* Subject Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Subject</CardTitle>
            <CardDescription>Choose which subject these documents belong to</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {subjects.length === 0 && (
              <Alert className="mt-4">
                <AlertDescription>
                  You need to create a subject first. 
                  <Link to="/subjects" className="text-purple-600 hover:underline ml-1">
                    Go to Subjects
                  </Link>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* File Upload Area */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>
              Drag and drop files or click to browse. Small files (under 5MB) will be processed instantly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400'
              }`}
            >
              <input {...getInputProps()} />
              <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-purple-600">Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    Drag and drop files here, or click to select files
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF, TXT, DOC, and DOCX files. Files under 5MB will be processed instantly.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        {files.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Files to Upload</CardTitle>
                <CardDescription>{files.length} files selected</CardDescription>
              </div>
              <Button
                onClick={handleUploadAll}
                disabled={!selectedSubject || files.every(f => f.status !== 'idle') || isProcessing}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isProcessing ? 'Processing...' : 'Upload All'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    {getStatusIcon(file.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{file.name}</span>
                          {getProcessingModeIcon(file.processingMode)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">{getStatusText(file.status)}</span>
                        {(file.status === 'uploading' || file.status === 'processing') && (
                          <Progress value={file.progress} className="flex-1" />
                        )}
                      </div>
                      {file.error && (
                        <p className="text-sm text-red-600 mt-1">{file.error}</p>
                      )}
                      {file.processingMode === 'direct' && file.status === 'idle' && (
                        <p className="text-sm text-yellow-600 mt-1">
                          ⚡ Will use fast direct processing
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Upload;
