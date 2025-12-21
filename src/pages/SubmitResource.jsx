import React, { useState } from "react";
import { entities } from "@/api/supabaseClient";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Send, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { ShaderBackground } from "@/components/ui/digital-aurora";

export default function SubmitResource() {
  const [formData, setFormData] = useState({
    resource_name: "",
    resource_url: "",
    description: "",
    category: "",
    submitter_name: "",
    submitter_email: ""
  });

  const submitMutation = useMutation({
    mutationFn: (data) => entities.ResourceSubmission.create(data),
    onSuccess: () => {
      toast.success("Thank you! Your resource has been submitted for review.");
      setFormData({
        resource_name: "",
        resource_url: "",
        description: "",
        category: "",
        submitter_name: "",
        submitter_email: ""
      });
    },
    onError: (error) => {
      toast.error("Failed to submit resource. Please try again.");
      console.error("Submission error:", error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.resource_name || !formData.resource_url || !formData.description || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }
    submitMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
      <SEO 
        title="Submit a Resource" 
        description="Help improve Chicago's startup ecosystem by submitting valuable resources, tools, or opportunities for founders."
        keywords="submit resource, contribute, Chicago startups, founder tools"
      />

      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-[500px] -z-10 overflow-hidden mask-gradient-b">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&q=80')] bg-cover bg-center opacity-60" />
          <ShaderBackground className="absolute inset-0 w-full h-full mix-blend-screen" />
        </div>

        <div className="max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 pt-10"
          >
            <Badge className="accent-badge mb-6">
              <Sparkles className="w-3 h-3 mr-1" />
              Contribute
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
              Submit a Resource
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              Know a valuable resource, tool, or opportunity that should be on ChiStartup Hub? Help us improve the ecosystem map.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card p-8 md:p-12 rounded-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="resource_name" className="text-white mb-2 block">
                  Resource Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="resource_name"
                  value={formData.resource_name}
                  onChange={(e) => handleChange("resource_name", e.target.value)}
                  placeholder="e.g., Chicago Startup Slack, Hyde Park Angels"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  required
                />
              </div>

              <div>
                <Label htmlFor="resource_url" className="text-white mb-2 block">
                  Resource URL <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="resource_url"
                  type="url"
                  value={formData.resource_url}
                  onChange={(e) => handleChange("resource_url", e.target.value)}
                  placeholder="https://..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-white mb-2 block">
                  Category <span className="text-red-400">*</span>
                </Label>
                <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Funding">Funding</SelectItem>
                    <SelectItem value="Co-Working">Co-Working</SelectItem>
                    <SelectItem value="Events">Events</SelectItem>
                    <SelectItem value="Community">Community</SelectItem>
                    <SelectItem value="Learning Resource">Learning Resource</SelectItem>
                    <SelectItem value="Tool">Tool</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description" className="text-white mb-2 block">
                  Description <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Tell us why this resource is valuable and what founders should know about it..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[120px]"
                  required
                />
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-white/70 text-sm mb-4">Optional: Help us give you credit</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="submitter_name" className="text-white mb-2 block">
                      Your Name
                    </Label>
                    <Input
                      id="submitter_name"
                      value={formData.submitter_name}
                      onChange={(e) => handleChange("submitter_name", e.target.value)}
                      placeholder="Jane Doe"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>

                  <div>
                    <Label htmlFor="submitter_email" className="text-white mb-2 block">
                      Your Email
                    </Label>
                    <Input
                      id="submitter_email"
                      type="email"
                      value={formData.submitter_email}
                      onChange={(e) => handleChange("submitter_email", e.target.value)}
                      placeholder="jane@example.com"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="accent-button w-full text-lg h-12"
              >
                {submitMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Resource
                  </>
                )}
              </Button>
            </form>

            {submitMutation.isSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <p className="text-green-300">
                  Thank you for contributing! We'll review your submission and add it to the hub.
                </p>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 text-center"
          >
            <p className="text-white/60 text-sm">
              All submissions are reviewed to ensure quality and relevance to Chicago's startup ecosystem.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}