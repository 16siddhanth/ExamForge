import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "login" | "signup";
  onSwitchType: () => void;
  onAuthSuccess: () => void;
}

const AuthModal = ({ isOpen, onClose, type, onSwitchType, onAuthSuccess }: AuthModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication
    setTimeout(() => {
      setIsLoading(false);
      if (type === "login") {
        toast({
          title: "Login successful",
          description: "Welcome back to ExamForge!",
        });
      } else {
        toast({
          title: "Account created",
          description: "Your account has been created successfully",
        });
      }
      // Mock successful login/signup
      localStorage.setItem("isLoggedIn", "true");
      onClose();
      onAuthSuccess();
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {type === "login" ? "Welcome back" : "Create an account"}
          </DialogTitle>
          <DialogDescription>
            {type === "login"
              ? "Enter your details to sign in to your account"
              : "Fill in your information to create a new account"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {type === "signup" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onSwitchType}
              className="w-full sm:w-auto"
            >
              {type === "login" ? "Don't have an account?" : "Already have an account?"}
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-exam-purple hover:bg-exam-darkPurple"
              disabled={isLoading}
            >
              {isLoading
                ? "Loading..."
                : type === "login"
                ? "Sign in"
                : "Create account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
