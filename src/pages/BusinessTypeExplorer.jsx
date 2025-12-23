import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb, Handshake, Store, Code, HelpCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { motion } from "framer-motion";

export default function BusinessTypeExplorer() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);

  const businessTypes = [
    {
      id: "idea",
      emoji: "💡",
      icon: Lightbulb,
      title: "I have an idea",
      description: "Early stage, exploring a concept",
      color: "yellow"
    },
    {
      id: "service",
      emoji: "🤝",
      icon: Handshake,
      title: "I run a service business",
      description: "Consulting, agency, professional services",
      color: "blue"
    },
    {
      id: "small-biz",
      emoji: "🏪",
      icon: Store,
      title: "I own a small business",
      subtext: "(restaurant, retail, local services)",
      description: "Physical location or local market",
      color: "green"
    },
    {
      id: "tech",
      emoji: "💻",
      icon: Code,
      title: "I'm building a tech product",
      description: "Software, app, or digital platform",
      color: "purple"
    },
    {
      id: "unsure",
      emoji: "🤔",
      icon: HelpCircle,
      title: "I don't know what I'm building yet",
      description: "Need help figuring it out",
      color: "gray"
    }
  ];

  const colorClasses = {
    yellow: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      hover: "hover:border-yellow-500/40",
      text: "text-yellow-400"
    },
    blue: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      hover: "hover:border-blue-500/40",
      text: "text-blue-400"
    },
    green: {
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      hover: "hover:border-green-500/40",
      text: "text-green-400"
    },
    purple: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      hover: "hover:border-purple-500/40",
      text: "text-purple-400"
    },
    gray: {
      bg: "bg-white/5",
      border: "border-white/10",
      hover: "hover:border-white/20",
      text: "text-white/60"
    }
  };

  const handleSelection = (type) => {
    setSelectedType(type);
    // Navigate based on selection
    if (type === 'idea') {
      navigate('/Resources#maturity-matrix');
    } else if (type === 'service') {
      navigate('/Resources');
    } else if (type === 'small-biz') {
      navigate('/Funding');
    } else if (type === 'tech') {
      navigate('/Resources');
    } else if (type === 'unsure') {
      navigate('/Community');
    }
  };

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
      <SEO
        title="What Are You Building?"
        description="Figure out what type of business you're building and get the right resources for your situation."
        keywords="business type, startup vs small business, service business, Chicago founders"
      />
      
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              What Are You Building?
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              First question: What type of business are you building?
            </p>
          </div>

          {/* Business Type Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {businessTypes.map((type, index) => {
              const colors = colorClasses[type.color];
              const Icon = type.icon;
              
              return (
                <motion.button
                  key={type.id}
                  onClick={() => handleSelection(type.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`${colors.bg} border ${colors.border} ${colors.hover} rounded-xl p-6 transition-all text-left group relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10 flex items-start gap-4">
                    {/* Icon */}
                    <div className={`${colors.text} flex-shrink-0`}>
                      <Icon className="w-8 h-8" strokeWidth={1.5} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {type.title}
                      </h3>
                      {type.subtext && (
                        <p className="text-sm text-white/40 mb-1">
                          {type.subtext}
                        </p>
                      )}
                      <p className="text-sm text-white/60">
                        {type.description}
                      </p>
                    </div>
                    
                    {/* Arrow */}
                    <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Helper Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center"
          >
            <p className="text-white/70 text-sm leading-relaxed">
              This will help us show you the right resources for <strong className="text-white">YOUR</strong> situation.
              <br />
              Different business models require different approaches—not better or worse, just different.
            </p>
          </motion.div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Button
              onClick={() => navigate('/navigate-toolkit')}
              variant="ghost"
              className="text-white/60 hover:text-white/90"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Navigation
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
