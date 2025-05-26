import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useDocumentProcessing } from "@/hooks/useDocumentProcessing";
import { useSubjects } from "@/hooks/useSubjects";
import { AlertCircle, BookOpen, CheckCircle, FileText, LogOut, Upload } from "lucide-react";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";

const UploadPage = () => {
  const { user, signOut } = useAuth();
  const { subjects } = useSubjects();
  const { toast } = useToast();
  const { processDocument, processingStatus, processingError } = useDocumentProcessing();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topic, setTopic] = useState("");

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentName || !selectedSubject) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and select a file.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Process the document without needing to pass the API key
      await processDocument({
        file: selectedFile,
        subjectId: selectedSubject,
        name: documentName,
        topic,
        userId: user.id
      });
    } catch (error: any) {
      console.error("Error processing document:", error);
    }
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
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload Document</h1>
          <p className="text-xl text-gray-600">Add new study materials with AI-powered question generation</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Form */}
          <Card className="border-purple-100">
            <CardHeader>
              <CardTitle className="text-purple-900">Document Details</CardTitle>
              <CardDescription>Provide information about your document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="document-name">Document Name</Label>
                <Input
                  id="document-name"
                  placeholder="e.g., Chapter 5 - Derivatives"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="border-purple-200 focus:border-purple-400 focus:ring-purple-400">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic (Optional)</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Differentiation Rules"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
              </div>

              {/* File Upload Area */}
              <div className="space-y-2">
                <Label>Document File</Label>
                <div className="border-2 border-dashed border-purple-200 rounded-lg p-8 text-center hover:border-purple-300 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF, DOCX, DOC, TXT files up to 10MB
                    </p>
                  </label>
                </div>
                {selectedFile && (
                  <div className="flex items-center space-x-2 text-sm text-purple-600 bg-purple-50 p-3 rounded-lg">
                    <FileText className="w-4 h-4" />
                    <span>{selectedFile.name}</span>
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={processingStatus === "processing"}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {processingStatus === "processing" ? "Processing..." : "Upload & Generate Questions"}
                </Button>

                {processingStatus === "success" && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="font-medium text-green-800">Processing Complete!</p>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Your document has been processed successfully. Questions have been generated.
                    </p>
                    <div className="mt-4 flex space-x-2">
                      <Link to="/subjects">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          View in Subject
                        </Button>
                      </Link>
                      <Link to="/subjects">
                        <Button size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                          Take Quiz
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {processingStatus === "error" && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="font-medium text-red-800">Processing Failed</p>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      {processingError?.message || "There was an error processing your document. Please try again."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
