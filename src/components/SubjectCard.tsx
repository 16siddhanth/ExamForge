import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export interface Subject {
  id: string;
  name: string;
  mainTopics: string | string[];
}

interface SubjectCardProps {
  subject: Subject;
}

export default function SubjectCard({ subject }: SubjectCardProps) {
  const navigate = useNavigate();
  // Handle both cases: if mainTopics is already an array or if it's a string that needs parsing
  const mainTopics = Array.isArray(subject.mainTopics) 
    ? subject.mainTopics 
    : (typeof subject.mainTopics === 'string' && subject.mainTopics 
        ? JSON.parse(subject.mainTopics)
        : []);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{subject.name}</CardTitle>
        <CardDescription>
          {mainTopics.slice(0, 3).join(", ")}
          {mainTopics.length > 3 ? "..." : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/quiz/${subject.id}`)}
          >
            Take Quiz
          </Button>
          <Button onClick={() => navigate(`/subject/${subject.id}`)}>
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
