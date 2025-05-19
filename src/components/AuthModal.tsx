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
import axios from 'axios';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload: any = { email, password };
      if (type === 'signup') payload.name = name;
      const response = await axios.post(endpoint, payload);
      const { user, token } = response.data;
      // Store auth info
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', user.id);
      localStorage.setItem('token', token);
      toast({
        title: type === 'login' ? 'Login successful' : 'Account created',
        description: type === 'login' ? 'Welcome back to ExamForge!' : 'Your account has been created successfully',
      });
      onClose();
      onAuthSuccess();
    } catch (err: any) {
      toast({
        title: 'Authentication failed',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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
