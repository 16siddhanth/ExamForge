import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import axios from "axios";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";

const Hero = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authType, setAuthType] = useState<"login" | "signup">("signup");
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  useEffect(() => {
    // Fetch popular subjects/topics from backend if user is logged in    const fetchSuggestedTopics = async () => {
      if (isLoggedIn) {
        try {
          const response = await axios.get("/api/subjects/popular");
          const topics = response.data.topics.slice(0, 3); // Get top 3 topics
          setSuggestedTopics(topics);
        } catch (error) {
          console.error("Error fetching suggested topics:", error);
          // Fallback to empty list
          setSuggestedTopics([]);
        }
      }
    };
    fetchSuggestedTopics();
  }, [isLoggedIn]);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      setAuthType("signup");
      setIsAuthModalOpen(true);
    }
  };

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-exam-lightPurple/30 via-white to-white -z-10" />
      
      {/* Background circles */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-exam-purple/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 bg-exam-purple/10 rounded-full blur-3xl -z-10" />

      <div className="container px-4 mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-bold mb-4"
            >
              <span className="gradient-text">ExamForge</span>
              <br />
              <span className="text-gray-900">AI-Powered Exam Preparation</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl mx-auto md:mx-0"
            >
              Upload your past exam papers, generate AI-powered practice questions, and ace your exams with personalized preparation materials.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
            >
              <Button 
                onClick={handleGetStarted}
                className="hero-button hero-button-primary"
                size="lg"
              >
                {isLoggedIn ? "Go to Dashboard" : "Get Started Free"}
              </Button>
              
              {!isLoggedIn && (
                <Button 
                  onClick={() => {
                    setAuthType("login");
                    setIsAuthModalOpen(true);
                  }}
                  variant="outline"
                  className="hero-button hero-button-secondary"
                  size="lg"
                >
                  Sign In
                </Button>
              )}
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative"
          >
            <div className="bg-white rounded-xl shadow-xl p-4 md:p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="text-xs text-gray-500 ml-2">ExamForge AI Preview</div>
              </div>
              <div className="bg-white rounded-md p-3 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="h-8 w-24 bg-exam-purple rounded-full"></div>
                  <div className="h-8 w-8 bg-exam-lightGray rounded-full"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-exam-purple/20 flex items-center justify-center text-exam-purple">U</div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-2">
                      <p className="text-sm">What topics are likely to appear on my Computer Science exam?</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-exam-purple flex items-center justify-center text-white">AI</div>
                  <div className="flex-1">
                    <div className="bg-exam-lightPurple rounded-2xl rounded-tl-none px-4 py-2">
                      <p className="text-sm">Based on your past papers, these topics are highly likely:</p>
                      <ul className="text-sm list-disc list-inside mt-2">
                        {suggestedTopics.length > 0 ? (
                          suggestedTopics.map((topic, index) => (
                            <li key={index}>{topic}</li>
                          ))
                        ) : (
                          <>
                            <li>Upload your first paper to get personalized insights</li>
                            <li>AI will analyze your materials</li>
                            <li>Get topic predictions and study recommendations</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-exam-purple/10 rounded-full blur-md"></div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-exam-purple/10 rounded-full blur-lg"></div>
          </motion.div>
        </div>
      </div>
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        type={authType}
        onSwitchType={() => setAuthType(authType === "login" ? "signup" : "login")}
        onAuthSuccess={() => {
          navigate("/dashboard");
        }}
      />
    </section>
  );
};

export default Hero;
