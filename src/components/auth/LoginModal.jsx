import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginModal({ isOpen, onClose, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signInWithOAuth } = useAuth();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      console.error('Login error details:', error);

      // Provide better error messages
      let errorMessage = error.message;
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email before signing in. Check your inbox for a confirmation link.';
      }

      toast.error('Login failed', {
        description: errorMessage,
      });
    } else {
      toast.success('Welcome back!', {
        description: 'Successfully logged in',
      });
      setEmail('');
      setPassword('');
      onClose();
    }

    setLoading(false);
  };

  const handleOAuthLogin = async (provider) => {
    const { error } = await signInWithOAuth(provider);
    if (error) {
      toast.error('Login failed', {
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#0F0F0F] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Welcome Back
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Sign in to access your bookmarks and personalized experience
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleEmailLogin} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="email" className="text-white/80">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-white/80">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0F0F0F] px-2 text-white/40">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthLogin('google')}
            className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
          >
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthLogin('github')}
            className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
          >
            GitHub
          </Button>
        </div>

        <p className="text-center text-sm text-white/60 mt-4">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToSignup}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Sign up
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}
