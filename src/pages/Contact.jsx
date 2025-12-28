import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Mail, Send, MessageSquare, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { ShaderBackground } from "@/components/ui/digital-aurora";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Create mailto link with form data
    const mailtoLink = `mailto:billy@chistartuphub.com?subject=${encodeURIComponent(formData.subject || 'Contact from ChiStartup Hub')}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;
    
    window.location.href = mailtoLink;
    
    setIsSubmitted(true);
    setTimeout(() => {
      setFormData({ name: "", email: "", subject: "", message: "" });
      setIsSubmitted(false);
    }, 3000);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
      <SEO 
        title="Contact Us" 
        description="Get in touch with ChiStartup Hub for questions, corrections, partnerships, or press inquiries."
        keywords="contact ChiStartup Hub, get in touch, partnerships, press"
      />

      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-[500px] -z-10 overflow-hidden mask-gradient-b">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1600&q=80')] bg-cover bg-center opacity-60" />
          <ShaderBackground className="absolute inset-0 w-full h-full mix-blend-screen" />
        </div>

        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 pt-10"
          >
            <Badge className="accent-badge mb-6">
              <MessageSquare className="w-3 h-3 mr-1" />
              Get in Touch
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
              Contact Us
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              Questions, corrections, partnerships, or press inquiries—we'd love to hear from you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-card p-8 rounded-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Direct Contact</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-white/70 text-sm mb-2 uppercase tracking-wider">Email</h3>
                  <a 
                    href="mailto:billy@chistartuphub.com" 
                    className="flex items-center gap-3 text-blue-400 hover:text-blue-300 transition-colors text-lg group"
                  >
                    <Mail className="w-5 h-5" />
                    <span className="group-hover:underline">billy@chistartuphub.com</span>
                  </a>
                </div>

                <div>
                  <h3 className="text-white/70 text-sm mb-2 uppercase tracking-wider">Response Time</h3>
                  <p className="text-white/80">We typically respond within 24-48 hours</p>
                </div>

                <div>
                  <h3 className="text-white/70 text-sm mb-2 uppercase tracking-wider">Social Media</h3>
                  <p className="text-white/60 italic">Coming soon</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10">
                <h3 className="text-white font-semibold mb-3">What to reach out about:</h3>
                <ul className="space-y-2 text-white/70 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                    <span>Partnership opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                    <span>Press and media inquiries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                    <span>Corrections or updates to resources</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                    <span>General questions or feedback</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass-card p-8 rounded-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Send a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="name" className="text-white mb-2 block">
                    Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Your name"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-white mb-2 block">
                    Email <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="you@example.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="subject" className="text-white mb-2 block">
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleChange("subject", e.target.value)}
                    placeholder="What's this about?"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-white mb-2 block">
                    Message <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[140px]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="accent-button w-full text-base h-11"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>

              {isSubmitted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <p className="text-green-300 text-sm">
                    Opening your email client...
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="glass-card p-8 rounded-2xl text-center"
          >
            <h3 className="text-xl font-semibold text-white mb-3">
              Building something for founders?
            </h3>
            <p className="text-white/80 mb-6">
              If you're creating tools, resources, or programs that help Chicago's startup ecosystem, we want to feature you.
            </p>
            <a href="mailto:billy@chistartuphub.com?subject=Partnership%20Opportunity">
              <Button className="glass-button">
                Let's Partner
              </Button>
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}