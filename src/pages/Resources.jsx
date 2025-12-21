import React, { useState } from "react";
import { Send, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import PageHero from "@/components/ui/page-hero";
import MaturityMatrix from "@/components/resources/MaturityMatrix";
import AIToolsSection from "@/components/resources/AIToolsSection";
import OperationalToolsSection from "@/components/resources/OperationalToolsSection";
import LearningResourcesSection from "@/components/resources/LearningResourcesSection";
import GlossarySection from "@/components/resources/GlossarySection";
import DownloadToolkitModal from "@/components/DownloadToolkitModal";

export default function Resources() {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  return (
    <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
      <SEO
        title="Startup Toolkit"
        description="Tools, frameworks, and Chicago-specific resources organized by what you need to build. AI tools, operational guides, legal compliance, and startup glossary."
        keywords="startup toolkit, founder resources, AI tools, Illinois business formation, Chicago legal compliance, startup glossary"
      />
      <div className="max-w-7xl mx-auto">
        <PageHero
          label="For Founders"
          title="Startup Toolkit"
          description="Tools, frameworks, and Chicago-specific resources—organized by what you need to build."
          backgroundImage="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1600&q=80"
        >
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={() => setShowDownloadModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white border-none"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Toolkit PDF
            </Button>
            <Link to={createPageUrl("SubmitResource")}>
              <Button className="accent-button">
                <Send className="w-4 h-4 mr-2" />
                Submit a Resource
              </Button>
            </Link>
          </div>
        </PageHero>

          {/* Maturity Matrix */}
          <MaturityMatrix />

          {/* AI Tools Section */}
          <AIToolsSection />

          {/* Operational Tools Section */}
          <OperationalToolsSection />

          {/* Learning Resources Section */}
          <LearningResourcesSection />

        {/* Glossary Section */}
        <GlossarySection />
      </div>

      {/* Download Modal */}
      <DownloadToolkitModal 
        isOpen={showDownloadModal} 
        onClose={() => setShowDownloadModal(false)} 
      />
    </div>
  );
}