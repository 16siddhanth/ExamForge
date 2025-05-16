import { motion } from "framer-motion";
import { Check } from "lucide-react";

const features = [
  {
    title: "OCR Document Scanning",
    description: "Upload PDF/DOCX files and extract question papers automatically with advanced OCR technology.",
    icon: "📝"
  },
  {
    title: "AI Question Generation",
    description: "Generate new practice questions and sample papers based on your past exam patterns.",
    icon: "🧠"
  },
  {
    title: "Subject Organization",
    description: "Organize your study materials by subjects and access them whenever you need.",
    icon: "📚"
  },
  {
    title: "Interactive Quizzes",
    description: "Test your knowledge with auto-generated quizzes based on your uploaded materials.",
    icon: "✅"
  },
  {
    title: "Performance Analytics",
    description: "Track your progress and identify areas that need more attention.",
    icon: "📊"
  },
  {
    title: "Answer Explanations",
    description: "Get detailed explanations for each answer to deepen your understanding.",
    icon: "💡"
  }
];

const Features = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Features that empower your study</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ExamForge combines cutting-edge OCR and AI technology to transform your exam preparation experience.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-20 bg-exam-lightPurple/30 rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">How ExamForge helps students</h3>
              <p className="text-gray-700 mb-6">
                ExamForge is designed to make your exam preparation more efficient, targeted, and effective.
              </p>
              
              <ul className="space-y-3">
                {[
                  "Save time with automated question extraction from past papers",
                  "Practice with AI-generated questions that mimic your exam pattern",
                  "Identify your weak areas and focus your study time efficiently",
                  "Get instant feedback on your understanding through quizzes",
                  "Access your study materials anywhere, anytime"
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-exam-purple shrink-0 mt-0.5 mr-2" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-exam-purple/20 to-exam-purple/5 rounded-xl -z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                alt="Student studying" 
                className="rounded-xl shadow-md w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
