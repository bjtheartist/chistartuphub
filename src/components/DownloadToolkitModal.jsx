import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, Mail, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { entities } from "@/api/supabaseClient";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const PDF_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fad57ce6a6914f0fbc124a/3ec6c8ceb_StartupMatrixToolkit.pdf";

export default function DownloadToolkitModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      await entities.EmailSignup.create(data);
    },
    onSuccess: () => {
      // Show success screen
      setShowSuccess(true);

      // Trigger download - open in new tab for better mobile compatibility
      window.open(PDF_URL, '_blank');
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

  const handleClose = () => {
    setEmail("");
    setName("");
    setShowSuccess(false);
    onClose();
  };

  const handleDownloadAgain = () => {
    window.open(PDF_URL, '_blank');
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="bg-[#0A0A0A] border border-white/[0.15] rounded-t-2xl md:rounded-xl w-full md:max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {showSuccess ? (
          // Success Screen
          <>
            <div className="bg-green-500/10 border-b border-green-500/20 p-4 md:p-6 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg md:text-xl font-semibold text-white">Download Started!</h2>
                </div>
                <p className="text-xs md:text-sm text-white/60">
                  Your toolkit should be downloading now
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/[0.1] transition-colors rounded-lg flex-shrink-0"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-white mb-2">
                  Thank you, {name || 'founder'}!
                </h3>
                <p className="text-xs md:text-sm text-white/60 mb-4">
                  The Startup Maturity Atlas PDF should have opened in a new tab.
                  If it didn't, click the button below.
                </p>
                <Button
                  onClick={handleDownloadAgain}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none h-10 md:h-11 text-sm"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open PDF Again
                </Button>
              </div>

              <div className="text-center">
                <p className="text-xs text-white/40 mb-3">
                  We've added you to our founder newsletter. You'll receive occasional updates on resources, events, and opportunities.
                </p>
                <Button
                  onClick={handleClose}
                  variant="ghost"
                  className="text-white/60 hover:text-white text-sm"
                >
                  Close this window
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Form Screen
          <>
            <div className="bg-white/[0.04] border-b border-white/[0.1] p-4 md:p-6 flex items-start justify-between">
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Download className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                  <h2 className="text-base md:text-xl font-semibold text-white">Startup Maturity Atlas</h2>
                  <span className="bg-green-500/20 text-green-400 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full border border-green-500/30">FREE</span>
                </div>
                <p className="text-xs md:text-sm text-white/60">
                  Enter your email to receive the complete founder toolkit PDF
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/[0.1] transition-colors rounded-lg flex-shrink-0"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="text-white text-xs md:text-sm font-medium mb-2 block">
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
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 h-10 md:h-11 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-white text-xs md:text-sm font-medium mb-2 block">
                  Name (Optional)
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-10 md:h-11 text-sm"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none h-10 md:h-11 text-sm"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Free PDF
                    </>
                  )}
                </Button>
              </div>

              <p className="text-[10px] md:text-xs text-white/40 text-center">
                We'll only use your email to send you helpful startup resources
              </p>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
