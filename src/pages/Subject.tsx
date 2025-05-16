import FileUploader from "@/components/FileUploader";
import Navbar from "@/components/Navbar";
import QuestionCard from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { generateSamplePaper } from "@/utils/aiGeneration";
import { Question } from "@/utils/ocr";
import axios from "axios";
import { ArrowLeft, File, FileText, Loader2, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface Document {
  id: string;
  title: string;
  subject: string;
  uploadDate: string;
  pageCount: number;
  questions: Question[];
}

interface SamplePaper {
  id: string;
  title: string;
  description: string;
  subject: string;
  createdAt: string;
  totalMarks: number;
  estimatedTime: number;
  questions: Question[];
}

const Subject = () => {
  const { subjectId = "" } = useParams<{ subjectId: string }>();
  const [subject, setSubject] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [samplePapers, setSamplePapers] = useState<SamplePaper[]>([]);
  const [activeTab, setActiveTab] = useState("documents");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedSamplePaper, setSelectedSamplePaper] = useState<SamplePaper | null>(null);
  const [isFileUploaderOpen, setIsFileUploaderOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch subject, documents, and sample papers from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        if (!isLoggedIn) {
          navigate("/");
          return;
        }
        // Fetch subject
        const subjectRes = await axios.get(`/api/subjects/${subjectId}`);
        setSubject(subjectRes.data);
        // Fetch documents for this subject
        const docsRes = await axios.get(`/api/papers?subjectId=${subjectId}`);
        setDocuments(docsRes.data);
        // Fetch sample papers for this subject
        const samplePapersRes = await axios.get(`/api/sample-papers?subjectId=${subjectId}`);
        setSamplePapers(samplePapersRes.data.map((sp: any) => ({
          ...sp,
          questions: JSON.parse(sp.questions)
        })));
      } catch (err: any) {
        navigate("/dashboard");
        toast({
          title: "Subject not found",
          description: "The subject you are looking for does not exist",
          variant: "destructive",
        });
      }
    };
    fetchData();
  }, [subjectId, navigate, toast]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/");
  };

  // Handle document upload success
  const handleUploadSuccess = async (documentData: any) => {
    try {
      // Refetch documents from backend
      const docsRes = await axios.get(`/api/papers?subjectId=${subjectId}`);
      setDocuments(docsRes.data);
      toast({
        title: "Document uploaded",
        description: "Your document has been processed and added to your library",
      });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: "Could not refresh document list.",
        variant: "destructive",
      });
    }
  };

  // Generate sample paper using backend (AI) and persist to backend
  const handleGenerateSamplePaper = async () => {
    if (documents.length === 0) {
      toast({
        title: "No documents available",
        description: "Please upload at least one document before generating a sample paper",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    try {
      const allQuestions: Question[] = documents.flatMap(doc => doc.questions);
      const samplePaper = await generateSamplePaper(
        allQuestions,
        subject.name,
        `${subject.name} Predicted Exam ${new Date().getFullYear()}`
      );
      // Persist sample paper to backend
      const userId = subject.userId || (subject.user && subject.user.id); // Adjust as needed
      const res = await axios.post('/api/sample-papers', {
        userId,
        subjectId,
        title: samplePaper.title,
        description: samplePaper.description,
        totalMarks: samplePaper.totalMarks,
        estimatedTime: samplePaper.estimatedTime,
        questions: samplePaper.questions
      });
      const savedSamplePaper = {
        ...res.data,
        questions: JSON.parse(res.data.questions)
      };
      setSamplePapers([savedSamplePaper, ...samplePapers]);
      toast({
        title: "Sample paper generated",
        description: "Your sample paper has been created successfully",
      });
      setActiveTab("samples");
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "There was an error generating your sample paper",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete a document (paper)
  const handleDeleteDocument = async (docId: string) => {
    try {
      await axios.delete(`/api/papers/${docId}`);
      setDocuments(docs => docs.filter(d => d.id !== docId));
      toast({ title: "Document deleted" });
    } catch (err) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  // Delete a sample paper
  const handleDeleteSamplePaper = async (samplePaperId: string) => {
    try {
      await axios.delete(`/api/sample-papers/${samplePaperId}`);
      setSamplePapers(papers => papers.filter(p => p.id !== samplePaperId));
      toast({ title: "Sample paper deleted" });
    } catch (err) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  // Delete the subject
  const handleDeleteSubject = async () => {
    try {
      await axios.delete(`/api/subjects/${subjectId}`);
      toast({ title: "Subject deleted" });
      navigate("/dashboard");
    } catch (err) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredSamplePapers = samplePapers.filter(paper =>
    paper.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isLoggedIn={true} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-24">
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center text-gray-600 hover:text-exam-purple mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">{subject?.name || "Subject"}</h1>
              <p className="text-gray-600">
                {documents.length} {documents.length === 1 ? "document" : "documents"} • Last updated {subject?.lastUpdated ? new Date(subject.lastUpdated).toLocaleDateString() : "-"}
              </p>
            </div>
            
            <div className="flex mt-4 md:mt-0 space-x-3">
              <Button
                onClick={() => setIsFileUploaderOpen(true)}
                className="bg-exam-purple hover:bg-exam-darkPurple"
              >
                <Plus className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
              
              <Button
                variant="outline"
                onClick={handleGenerateSamplePaper}
                disabled={documents.length === 0 || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <File className="mr-2 h-4 w-4" />
                    Generate Sample Paper
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSubject}
              >
                Delete Subject
              </Button>
            </div>
          </div>
          
          {subject?.mainTopics && subject.mainTopics.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {subject.mainTopics.map((topic, i) => (
                <span key={i} className="px-3 py-1 bg-exam-lightPurple text-exam-darkPurple text-sm rounded-full">
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* If document or sample paper is selected, show it */}
        {(selectedDocument || selectedSamplePaper) ? (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selectedDocument?.title || selectedSamplePaper?.title}</h2>
                {selectedSamplePaper && (
                  <p className="text-gray-600">{selectedSamplePaper.description}</p>
                )}
                {selectedDocument && (
                  <p className="text-gray-600">Uploaded on {new Date(selectedDocument.uploadDate).toLocaleDateString()}</p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedDocument(null);
                  setSelectedSamplePaper(null);
                }}
              >
                Back to List
              </Button>
            </div>
            
            <div className="mb-4">
              {selectedSamplePaper && (
                <div className="flex gap-4 mb-6">
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="text-sm text-gray-500">Total Marks</div>
                    <div className="text-xl font-bold">{selectedSamplePaper.totalMarks}</div>
                  </div>
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="text-sm text-gray-500">Estimated Time</div>
                    <div className="text-xl font-bold">{selectedSamplePaper.estimatedTime} min</div>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {(selectedDocument?.questions || selectedSamplePaper?.questions || []).map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    id={question.id}
                    questionText={question.text}
                    options={question.options}
                    type={question.type}
                    difficulty={question.difficulty}
                    answer={question.answer}
                    explanation={question.explanation}
                    source={selectedDocument ? selectedDocument.title : "AI Generated"}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                  <TabsTrigger value="documents">Past Papers ({documents.length})</TabsTrigger>
                  <TabsTrigger value="samples">Sample Papers ({samplePapers.length})</TabsTrigger>
                </TabsList>
              
                <div className="mt-4 md:mt-0 md:ml-4 w-full md:w-auto">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search papers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <TabsContent value="documents" className="mt-0">
                  {filteredDocuments.length === 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>No documents found</CardTitle>
                        <CardDescription>
                          {searchQuery
                            ? "Try a different search term or clear the search."
                            : "Upload your first document for this subject."}
                        </CardDescription>
                      </CardHeader>
                      {!searchQuery && (
                        <CardContent>
                          <Button
                            onClick={() => setIsFileUploaderOpen(true)}
                            className="bg-exam-purple hover:bg-exam-darkPurple"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Upload Document
                          </Button>
                        </CardContent>
                      )}
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredDocuments.map((document) => (
                        <Card
                          key={document.id}
                          className="cursor-pointer hover:shadow-md transition-shadow group"
                        >
                          <CardHeader className="pb-2" onClick={() => setSelectedDocument(document)}>
                            <div className="flex justify-between items-start">
                              <div className="bg-exam-lightPurple p-2 rounded-md">
                                <FileText className="h-5 w-5 text-exam-purple" />
                              </div>
                              <span className="text-xs text-gray-500">
                                {document.pageCount} {document.pageCount === 1 ? "page" : "pages"}
                              </span>
                            </div>
                            <CardTitle className="mt-3 text-xl truncate">{document.title}</CardTitle>
                            <CardDescription>
                              Uploaded on {new Date(document.uploadDate).toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-gray-500">
                                {document.questions.length} {document.questions.length === 1 ? "question" : "questions"}
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="text-exam-purple" onClick={() => setSelectedDocument(document)}>
                                  View
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteDocument(document.id)}>
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="samples" className="mt-0">
                  {filteredSamplePapers.length === 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>No sample papers found</CardTitle>
                        <CardDescription>
                          {searchQuery
                            ? "Try a different search term or clear the search."
                            : "Generate a sample paper to see AI predictions of future exam questions."}
                        </CardDescription>
                      </CardHeader>
                      {!searchQuery && documents.length > 0 && (
                        <CardContent>
                          <Button
                            onClick={handleGenerateSamplePaper}
                            disabled={isGenerating}
                            className="bg-exam-purple hover:bg-exam-darkPurple"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <File className="mr-2 h-4 w-4" />
                                Generate Sample Paper
                              </>
                            )}
                          </Button>
                        </CardContent>
                      )}
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredSamplePapers.map((paper) => (
                        <Card
                          key={paper.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedSamplePaper(paper)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="bg-exam-lightPurple p-2 rounded-md">
                                <File className="h-5 w-5 text-exam-purple" />
                              </div>
                              <span className="text-xs bg-exam-lightPurple text-exam-darkPurple px-2 py-1 rounded-full">
                                AI Generated
                              </span>
                            </div>
                            <CardTitle className="mt-3 text-xl truncate">{paper.title}</CardTitle>
                            <CardDescription>
                              Created on {new Date(paper.createdAt).toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-gray-500">
                                {paper.totalMarks} marks • {paper.estimatedTime} min
                              </div>
                              <Button variant="destructive" size="sm" onClick={e => { e.stopPropagation(); handleDeleteSamplePaper(paper.id); }}>
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </main>
      
      <FileUploader
        isOpen={isFileUploaderOpen}
        onClose={() => setIsFileUploaderOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        subjects={[subject?.name || ""]}
      />
    </div>
  );
};

export default Subject;
