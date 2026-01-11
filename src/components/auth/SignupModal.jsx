import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/api/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, EyeOff, Check, ArrowRight, Megaphone, Bookmark, Compass } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  { value: 'founder', label: 'Founder', description: 'Building a startup' },
  { value: 'helper', label: 'Helper', description: 'Investor, mentor, service provider, or supporter' },
];

// Animation variants for staggered form fields
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// Success checkmark animation
const checkmarkVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
      delay: 0.1,
    },
  },
};

const successContentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      delay: 0.3,
    },
  },
};

export default function SignupModal({ isOpen, onClose, onSwitchToLogin, onSignupComplete }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [successName, setSuccessName] = useState('');
  const { signUp, signInWithOAuth } = useAuth();

  // Use ref to persist signup completion across re-renders from auth state changes
  const signupCompletedRef = useRef(false);
  const pendingSuccessDataRef = useRef(null);

  // Sync ref to state after auth state settles
  useEffect(() => {
    if (signupCompletedRef.current && pendingSuccessDataRef.current && !signupSuccess) {
      setSignupSuccess(true);
      setSuccessName(pendingSuccessDataRef.current.name);
    }
  }, [signupSuccess]);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setCompanyName('');
    setEmail('');
    setPassword('');
    setRole('');
    setSignupSuccess(false);
    setSuccessName('');
    signupCompletedRef.current = false;
    pendingSuccessDataRef.current = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fullName = `${firstName} ${lastName}`.trim();

    try {
      // Sign up
      const { data, error: signUpError } = await signUp(email, password, {
        full_name: fullName,
        role: role,
      });

      if (signUpError) {
        toast.error('Signup failed', {
          description: signUpError.message,
        });
        setLoading(false);
        return;
      }

      // Update profile with extra fields - use data.user.id directly to avoid race condition
      // (The database trigger already created the profile with role, but we add extra fields here)
      if (data?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .upsert(
            {
              id: data.user.id,
              email,
              full_name: fullName,
              first_name: firstName,
              last_name: lastName,
              company_name: companyName || null,
              role,
            },
            { onConflict: 'id', ignoreDuplicates: false }
          )
          .select('id, email, role, full_name')
          .single();

        if (profileError) {
          // Profile update failed - show user-friendly message
          if (import.meta.env.DEV) {
            console.error('[SIGNUP] Profile update FAILED:', profileError);
          }
          toast.error('Account created but profile setup failed', {
            description: 'Please try updating your profile in Settings.',
          });
        } else if (profileData) {
          // Verify the role was actually written (dev only)
          if (import.meta.env.DEV && profileData.role !== role) {
            console.warn('[SIGNUP] Role mismatch! Expected:', role, 'Got:', profileData.role);
          }
        }
      }

      // Check if email confirmation is required
      const needsEmailConfirmation = data?.user && !data.session;

      setLoading(false);

      // Close this modal and trigger welcome modal for success experience
      if (!needsEmailConfirmation && onSignupComplete) {
        onSignupComplete({ name: fullName, role: role });
      } else {
        // Email confirmation required - show success state in modal
        signupCompletedRef.current = true;
        pendingSuccessDataRef.current = { name: firstName, role };
        setSuccessName(firstName);
        setSignupSuccess(true);
      }
    } catch {
      toast.error('Signup failed', {
        description: 'An unexpected error occurred. Please try again.',
      });
      setLoading(false);
    }
  };

  const handleSuccessContinue = () => {
    resetForm();
    onClose();
    navigate('/');
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
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md bg-[#0F0F0F] border border-white/10 rounded-none max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Success State */}
          {signupSuccess ? (
            <motion.div
              key="success"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-8 text-center"
            >
              {/* Animated checkmark container */}
              <motion.div
                variants={checkmarkVariants}
                className="w-16 h-16 mx-auto mb-6 border-2 border-white flex items-center justify-center"
              >
                <motion.div
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Check className="w-8 h-8 text-white" strokeWidth={1.5} />
                </motion.div>
              </motion.div>

              <motion.div variants={successContentVariants}>
                <h2 className="font-mono text-xl uppercase tracking-[0.1em] text-white mb-2">
                  Welcome to the Hub
                </h2>
                <p className="font-mono text-[11px] text-white/50 uppercase tracking-[0.05em] mb-4">
                  {successName ? `Thanks for joining, ${successName}` : 'Thanks for joining'}
                </p>
              </motion.div>

              {/* Quick Start Tutorial */}
              <motion.div variants={successContentVariants} className="mb-6">
                <p className="font-mono text-[9px] text-white/40 uppercase tracking-[0.15em] mb-3">
                  Quick Start
                </p>
                <div className="space-y-2">
                  {role === 'founder' && (
                    <motion.button
                      type="button"
                      onClick={() => {
                        resetForm();
                        onClose();
                        navigate('/opportunities');
                      }}
                      whileHover={{ scale: 1.01, x: 2 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full flex items-center gap-3 px-4 py-3 border border-white/20 hover:border-white/40 hover:bg-white/[0.02] transition-all duration-150 cursor-crosshair rounded-none text-left"
                    >
                      <Megaphone className="w-4 h-4 text-white/60" strokeWidth={1.5} />
                      <div>
                        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white block">Post an Ask</span>
                        <span className="font-mono text-[9px] text-white/40">Get help from the community</span>
                      </div>
                    </motion.button>
                  )}
                  <motion.button
                    type="button"
                    onClick={() => {
                      resetForm();
                      onClose();
                      navigate('/funding');
                    }}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center gap-3 px-4 py-3 border border-white/20 hover:border-white/40 hover:bg-white/[0.02] transition-all duration-150 cursor-crosshair rounded-none text-left"
                  >
                    <Bookmark className="w-4 h-4 text-white/60" strokeWidth={1.5} />
                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white block">Save Resources</span>
                      <span className="font-mono text-[9px] text-white/40">Bookmark funding & spaces</span>
                    </div>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => {
                      resetForm();
                      onClose();
                      navigate('/community');
                    }}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center gap-3 px-4 py-3 border border-white/20 hover:border-white/40 hover:bg-white/[0.02] transition-all duration-150 cursor-crosshair rounded-none text-left"
                  >
                    <Compass className="w-4 h-4 text-white/60" strokeWidth={1.5} />
                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white block">Explore Ecosystem</span>
                      <span className="font-mono text-[9px] text-white/40">Find communities & events</span>
                    </div>
                  </motion.button>
                </div>
              </motion.div>

              <motion.button
                variants={successContentVariants}
                onClick={handleSuccessContinue}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] px-6 py-2 text-white/50 hover:text-white transition-colors duration-150 cursor-crosshair"
              >
                Skip for now
                <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -10 }}
              variants={containerVariants}
            >
              <motion.div variants={itemVariants}>
                <DialogHeader>
                  <DialogTitle className="font-mono text-xl uppercase tracking-[0.1em] text-white">
                    Join ChiStartupHub
                  </DialogTitle>
                  <DialogDescription className="font-mono text-[11px] text-white/50 uppercase tracking-[0.05em]">
                    Takes 30 seconds
                  </DialogDescription>
                </DialogHeader>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* First Name */}
                <motion.div variants={itemVariants}>
                  <label htmlFor="firstName" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-transparent border border-white/10 py-3 px-4 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/40 focus:bg-white/[0.02] transition-all duration-150 rounded-none"
                    required
                  />
                </motion.div>

                {/* Last Name */}
                <motion.div variants={itemVariants}>
                  <label htmlFor="lastName" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-transparent border border-white/10 py-3 px-4 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/40 focus:bg-white/[0.02] transition-all duration-150 rounded-none"
                    required
                  />
                </motion.div>

                {/* Company Name (Optional) */}
                <motion.div variants={itemVariants}>
                  <label htmlFor="companyName" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
                    Company Name
                  </label>
                  <input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-transparent border border-white/10 py-3 px-4 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/40 focus:bg-white/[0.02] transition-all duration-150 rounded-none"
                  />
                </motion.div>

                {/* Email */}
                <motion.div variants={itemVariants}>
                  <label htmlFor="signup-email" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
                    Email *
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border border-white/10 py-3 px-4 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/40 focus:bg-white/[0.02] transition-all duration-150 rounded-none"
                    required
                  />
                </motion.div>

                {/* Password */}
                <motion.div variants={itemVariants}>
                  <label htmlFor="signup-password" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
                    Password *
                  </label>
                  <div className="relative group">
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent border border-white/10 py-3 px-4 pr-10 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/40 focus:bg-white/[0.02] transition-all duration-150 rounded-none"
                      required
                      minLength={6}
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      whileTap={{ scale: 0.9 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors duration-150 cursor-crosshair"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </motion.button>
                  </div>
                  <p className="font-mono text-[10px] text-white/30 mt-1">At least 6 characters</p>
                </motion.div>

                {/* Role Selection */}
                <motion.fieldset variants={itemVariants}>
                  <legend className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
                    I am a... *
                  </legend>
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-required="true">
                    {ROLES.map((r) => (
                      <motion.button
                        key={r.value}
                        type="button"
                        role="radio"
                        aria-checked={role === r.value}
                        onClick={() => setRole(r.value)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className={`text-left px-3 py-2 border transition-all duration-150 cursor-crosshair rounded-none ${
                          role === r.value
                            ? 'bg-white border-white'
                            : 'bg-transparent border-white/20 hover:border-white/40'
                        }`}
                      >
                        <span className={`font-mono text-[10px] uppercase tracking-[0.1em] block transition-colors duration-150 ${
                          role === r.value ? 'text-black' : 'text-white/70'
                        }`}>
                          {r.label}
                        </span>
                        <span className={`font-mono text-[9px] block mt-0.5 leading-tight transition-colors duration-150 ${
                          role === r.value ? 'text-black/60' : 'text-white/40'
                        }`}>
                          {r.description}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.fieldset>

                <motion.div variants={itemVariants}>
                  <motion.button
                    type="submit"
                    disabled={loading || !role}
                    whileHover={role && !loading ? { scale: 1.01 } : {}}
                    whileTap={role && !loading ? { scale: 0.99 } : {}}
                    className={`w-full font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 border border-white transition-all duration-150 cursor-crosshair rounded-none ${
                      role && !loading
                        ? 'bg-white text-black hover:bg-transparent hover:text-white'
                        : 'bg-white/20 text-white/40 border-white/20 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span
                          className="w-4 h-4 border border-current border-t-transparent rounded-none"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          style={{ borderRadius: 0 }}
                        />
                        <span className="relative">
                          Creating
                          <motion.span
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            ...
                          </motion.span>
                        </span>
                      </span>
                    ) : (
                      'Create Account'
                    )}
                  </motion.button>
                </motion.div>
              </form>

              <motion.div variants={itemVariants} className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#0F0F0F] px-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">Or sign up with</span>
                </div>
              </motion.div>

              <motion.button
                variants={itemVariants}
                type="button"
                onClick={() => handleOAuthSignup('google')}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-3 font-mono text-[12px] uppercase tracking-[0.1em] px-6 py-4 bg-white text-black hover:bg-transparent hover:text-white border border-white transition-colors duration-150 cursor-crosshair rounded-none"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </motion.button>

              <motion.p variants={itemVariants} className="text-center font-mono text-[11px] text-white/50 mt-4">
                Already have an account?{' '}
                <motion.button
                  onClick={onSwitchToLogin}
                  whileHover={{ opacity: 0.7 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-white uppercase tracking-[0.1em] transition-none cursor-crosshair"
                >
                  Sign in
                </motion.button>
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
