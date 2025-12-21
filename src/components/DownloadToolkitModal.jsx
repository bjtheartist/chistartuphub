import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { entities } from "@/api/supabaseClient";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function DownloadToolkitModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      await entities.EmailSignup.create(data);
    },
    onSuccess: () => {
      toast.success("Thank you! Your download will start shortly.");
      // Trigger download
      const link = document.createElement('a');
      link.href = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fad57ce6a6914f0fbc124a/3ec6c8ceb_StartupMatrixToolkit.pdf";
      link.download = "ChiStartupHub-Toolkit.pdf";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Reset and close
      setEmail("");
      setName("");
      setTimeout(() => onClose(), 1000);
    },
    onError: (error) => {
      toast.error("Failed to process request. Please try again.");
      console.error(error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    submitMutation.mutate({ email, name: name || undefined });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-[#0A0A0A] border border-white/[0.15] rounded-xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white/[0.04] border-b border-white/[0.1] p-6 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Download Startup Toolkit</h2>
              </div>
              <p className="text-sm text-white/60">
                Enter your email to receive the complete PDF guide
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 hover:bg-white/[0.1] transition-colors rounded-lg"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Name (Optional)
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none h-11"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Toolkit PDF
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-white/40 text-center">
              We'll only use your email to send you helpful startup resources
            </p>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}