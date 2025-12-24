import React, { useState, useMemo } from "react";
import { Send, Download, HelpCircle, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import PageHero from "@/components/ui/page-hero";
import MaturityMatrix from "@/components/resources/MaturityMatrix";
import FounderGuidesSection from "@/components/resources/FounderGuidesSection";
import AIToolsSection from "@/components/resources/AIToolsSection";
import OperationalToolsSection from "@/components/resources/OperationalToolsSection";
import LearningResourcesSection from "@/components/resources/LearningResourcesSection";
import GlossarySection from "@/components/resources/GlossarySection";
import DownloadToolkitModal from "@/components/DownloadToolkitModal";

const TOOLKIT_SECTION_GROUPS = [
  {
    group: "Overview",
    sections: [
      { id: "all", label: "All Resources" },
      { id: "maturity", label: "Maturity Matrix" },
    ]
  },
  {
    group: "Build & Learn",
    sections: [
      { id: "guides", label: "Founder Guides" },
      { id: "ai", label: "AI Tools" },
      { id: "operational", label: "Operational Tools" },
      { id: "learning", label: "Learning Resources" },
    ]
  },
  {
    group: "Reference",
    sections: [
      { id: "glossary", label: "Glossary" },
    ]
  }
];

export default function Resources() {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");

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
              Download Free Toolkit
              <span className="ml-2 bg-green-500/30 text-green-300 text-[10px] font-bold px-1.5 py-0.5 rounded">FREE</span>
            </Button>
            <Link to={createPageUrl("SubmitResource")}>
              <Button className="accent-button">
                <Send className="w-4 h-4 mr-2" />
                Submit a Resource
              </Button>
            </Link>
            <Link to="/before-you-start">
              <Button className="bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.15] hover:border-white/[0.25]">
                <HelpCircle className="w-4 h-4 mr-2" />
                Don't know where to start?
              </Button>
            </Link>
          </div>
        </PageHero>

        {/* Search and Filter Bar */}
        <div className="mb-12">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search guides, tools, and resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg pl-12 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.08] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Section Filter Tabs - Grouped by Theme */}
          <div className="space-y-3">
            {TOOLKIT_SECTION_GROUPS.map((group, groupIndex) => (
              <div key={group.group}>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 px-1">
                  {group.group}
                </p>
                <div className="overflow-x-auto">
                  <div className="flex gap-2 pb-2">
                    {group.sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setSelectedSection(section.id)}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                          selectedSection === section.id
                            ? "bg-blue-600 text-white"
                            : "bg-white/[0.05] text-white/60 hover:bg-white/[0.1] hover:text-white/80"
                        }`}
                      >
                        {section.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

          {/* Maturity Matrix */}
          {(selectedSection === "all" || selectedSection === "maturity") && (
            <MaturityMatrix />
          )}

          {/* Founder Guides Section */}
          {(selectedSection === "all" || selectedSection === "guides") && (
            <FounderGuidesSection searchQuery={searchQuery} />
          )}

          {/* AI Tools Section */}
          {(selectedSection === "all" || selectedSection === "ai") && (
            <AIToolsSection searchQuery={searchQuery} />
          )}

          {/* Operational Tools Section */}
          {(selectedSection === "all" || selectedSection === "operational") && (
            <OperationalToolsSection searchQuery={searchQuery} />
          )}

          {/* Learning Resources Section */}
          {(selectedSection === "all" || selectedSection === "learning") && (
            <LearningResourcesSection searchQuery={searchQuery} />
          )}

          {/* Glossary Section */}
          {(selectedSection === "all" || selectedSection === "glossary") && (
            <GlossarySection searchQuery={searchQuery} />
          )}
      </div>

      {/* Download Modal */}
      <DownloadToolkitModal 
        isOpen={showDownloadModal} 
        onClose={() => setShowDownloadModal(false)} 
      />
    </div>
  );
}