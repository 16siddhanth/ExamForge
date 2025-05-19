import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateSubject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [topics, setTopics] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !topics) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const mainTopics = topics.split("\n").filter(topic => topic.trim() !== "");
      
      await axios.post("/api/subjects", {
        name,
        mainTopics,
      });
      
      toast({
        title: "Success",
        description: "Subject created successfully",
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating subject:", error);
      toast({
        title: "Error",
        description: "Failed to create subject",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Create New Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input 
                  id="name"
                  placeholder="e.g., Mathematics, Computer Science, History"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="topics">
                  Main Topics (one per line)
                </Label>
                <Textarea
                  id="topics"
                  placeholder="e.g.,
Algebra
Calculus
Statistics"
                  rows={6}
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Enter each main topic of the subject on a new line
                </p>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Subject"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
