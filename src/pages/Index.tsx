import { BackgroundPaths } from "@/components/BackgroundPaths";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(userLoggedIn);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };
  
  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen">
      <Navbar
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        onAuthSuccess={handleAuthSuccess}
      />
      <BackgroundPaths title="ExamForge" />
    </div>
  );
};

export default Index;
