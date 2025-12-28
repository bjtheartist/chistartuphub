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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Bookmark, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  { value: 'founder', label: 'Founder / Entrepreneur' },
  { value: 'investor', label: 'Investor' },
  { value: 'service-provider', label: 'Service Provider' },
  { value: 'student', label: 'Student' },
  { value: 'other', label: 'Other' },
];

const STAGES = [
  { value: 'idea', label: 'Idea Stage' },
  { value: 'pre-revenue', label: 'Pre-Revenue' },
  { value: 'early-revenue', label: 'Early Revenue' },
  { value: 'growth', label: 'Growth Stage' },
  { value: 'scaling', label: 'Scaling' },
];

const INTERESTS = [
  'Capital/Funding',
  'Co-Working Spaces',
  'Networking Events',
  'Accelerators/Incubators',
  'Legal/Compliance',
  'Product Development',
  'Marketing/Growth',
  'Talent/Hiring',
];

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, signInWithOAuth, updateProfile } = useAuth();

  // Step 1: Email & Password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Step 2: Company/Startup Details
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [stage, setStage] = useState('');

  // Step 3: Interests
  const [selectedInterests, setSelectedInterests] = useState([]);

  const resetForm = () => {
    setStep(1);
    setEmail('');
    setPassword('');
    setFullName('');
    setCompanyName('');
    setRole('');
    setStage('');
    setSelectedInterests([]);
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting signup process...');

      // Sign up
      const { data, error: signUpError } = await signUp(email, password, {
        full_name: fullName,
      });

      console.log('Signup response:', { data, error: signUpError });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        toast.error('Signup failed', {
          description: signUpError.message,
        });
        setLoading(false);
        return;
      }

      // Create profile
      if (data?.user) {
        console.log('Creating profile for user:', data.user.id);
        const { error: profileError } = await updateProfile({
          email,
          full_name: fullName,
          company_name: companyName,
          role,
          stage,
          interests: selectedInterests,
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          toast.error('Profile creation failed', {
            description: profileError.message,
          });
        } else {
          console.log('Profile created successfully');
        }
      }

      toast.success('Welcome to ChiStartupHub!', {
        description: 'Your account has been created successfully!',
      });

      setLoading(false);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Unexpected error during signup:', error);
      toast.error('Signup failed', {
        description: 'An unexpected error occurred. Please try again.',
      });
      setLoading(false);
    }
  };

  const toggleInterest = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleOAuthSignup = async (provider) => {
    const { error } = await signInWithOAuth(provider);
    if (error) {
      toast.error('Signup failed', {
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
      }
      onClose();
    }}>
      <DialogContent className="sm:max-w-md bg-[#0F0F0F] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            {step === 1 && 'Create Account'}
            {step === 2 && 'Tell Us About You'}
            {step === 3 && 'Your Interests'}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {step === 1 && 'Join ChiStartupHub to bookmark resources and connect with the ecosystem'}
            {step === 2 && 'Help us personalize your experience'}
            {step === 3 && 'What are you looking for? (Optional)'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-4">
          <div className={`flex-1 h-1 rounded ${step >= 1 ? 'bg-blue-600' : 'bg-white/10'}`} />
          <div className={`flex-1 h-1 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-white/10'}`} />
          <div className={`flex-1 h-1 rounded ${step >= 3 ? 'bg-blue-600' : 'bg-white/10'}`} />
        </div>

        {step === 1 && (
          <>
            {/* Privacy & Benefits Info */}
            <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Bookmark className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-white/90 font-medium">Save & Bookmark Resources</p>
                    <p className="text-xs text-white/60">Easily save events, funding opportunities, and workspaces for later</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-white/90 font-medium">Your Privacy Matters</p>
                    <p className="text-xs text-white/60">We take your privacy seriously and never share your data without permission</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="fullName" className="text-white/80">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="signup-email" className="text-white/80">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="signup-password" className="text-white/80">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white pr-10"
                    required
                    minLength={6}
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
                <p className="text-xs text-white/40 mt-1">At least 6 characters</p>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Continue
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0F0F0F] px-2 text-white/40">Or sign up with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthSignup('google')}
                className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
              >
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthSignup('github')}
                className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
              >
                GitHub
              </Button>
            </div>

            <p className="text-center text-sm text-white/60 mt-4">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Sign in
              </button>
            </p>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="companyName" className="text-white/80">
                Company/Startup Name (Optional)
              </Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label htmlFor="role" className="text-white/80">Role *</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="bg-[#0F0F0F] border-white/10">
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-white focus:bg-white/10">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {role === 'founder' && (
              <div>
                <Label htmlFor="stage" className="text-white/80">Startup Stage</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F0F0F] border-white/10">
                    {STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-white focus:bg-white/10">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white"
              >
                Back
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={!role}>
                Continue
              </Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 mt-4">
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {INTERESTS.map((interest) => (
                <div key={interest} className="flex items-center space-x-2">
                  <Checkbox
                    id={interest}
                    checked={selectedInterests.includes(interest)}
                    onCheckedChange={() => toggleInterest(interest)}
                    className="border-white/20"
                  />
                  <label
                    htmlFor={interest}
                    className="text-sm text-white/80 cursor-pointer flex-1"
                  >
                    {interest}
                  </label>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white"
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Complete Signup'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
