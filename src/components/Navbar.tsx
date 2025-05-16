
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AuthModal from "@/components/AuthModal";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  isLoggedIn: boolean;
  onLogout: () => void;
  onAuthSuccess?: () => void;
}

const Navbar = ({ isLoggedIn, onLogout, onAuthSuccess = () => {} }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalType, setAuthModalType] = useState<"login" | "signup">("login");

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const openLoginModal = () => {
    setAuthModalType("login");
    setIsAuthModalOpen(true);
    closeMenu();
  };

  const openSignupModal = () => {
    setAuthModalType("signup");
    setIsAuthModalOpen(true);
    closeMenu();
  };

  const switchAuthModalType = () => {
    setAuthModalType(authModalType === "login" ? "signup" : "login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow px-4 md:px-6">
      <div className="container mx-auto">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2" onClick={closeMenu}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-exam-purple"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            <span className="font-bold text-xl">ExamScribe</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-exam-purple">Home</Link>
            {isLoggedIn && (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-exam-purple">Dashboard</Link>
                <Link to="/quiz" className="text-gray-700 hover:text-exam-purple">Quiz</Link>
              </>
            )}

            <div className="flex items-center space-x-3">
              {isLoggedIn ? (
                <Button variant="outline" onClick={onLogout}>
                  Sign Out
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={openLoginModal}>
                    Log In
                  </Button>
                  <Button className="bg-exam-purple hover:bg-exam-darkPurple" onClick={openSignupModal}>
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={handleMenuToggle}
              className="text-gray-700 hover:text-exam-purple focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white py-4 px-4">
          <div className="flex flex-col space-y-4">
            <Link
              to="/"
              className="text-gray-700 hover:text-exam-purple py-2"
              onClick={closeMenu}
            >
              Home
            </Link>
            {isLoggedIn && (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-exam-purple py-2"
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>
                <Link
                  to="/quiz"
                  className="text-gray-700 hover:text-exam-purple py-2"
                  onClick={closeMenu}
                >
                  Quiz
                </Link>
              </>
            )}

            <div className="pt-2 border-t border-gray-100">
              {isLoggedIn ? (
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={onLogout}
                >
                  Sign Out
                </Button>
              ) : (
                <div className="flex flex-col space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    onClick={openLoginModal}
                  >
                    Log In
                  </Button>
                  <Button
                    className="w-full justify-center bg-exam-purple hover:bg-exam-darkPurple"
                    onClick={openSignupModal}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        type={authModalType}
        onSwitchType={switchAuthModalType}
        onAuthSuccess={onAuthSuccess}
      />
    </nav>
  );
};

export default Navbar;
