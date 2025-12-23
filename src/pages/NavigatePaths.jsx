import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Map, Users, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import { motion } from "framer-motion";

export default function NavigatePaths() {
  const navigate = useNavigate();

  const paths = [
    {
      number: "1️⃣",
      title: "I Know What I Need",
      description: "Jump straight to resources. Browse by topic or search.",
      icon: Search,
      action: () => navigate('/Resources'),
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      hoverColor: "hover:border-blue-500/40",
      iconColor: "text-blue-400"
    },
    {
      number: "2️⃣",
      title: "I'm Trying to Figure Something Out",
      description: "See patterns from Chicago founders. Compare paths and tradeoffs. Self-assess where you are.",
      icon: Map,
      action: () => navigate('/business-type-explorer'),
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      hoverColor: "hover:border-purple-500/40",
      iconColor: "text-purple-400"
    },
    {
      number: "3️⃣",
      title: "I Need Human Help",
      description: "Connect with peer communities and other Chicago founders.",
      icon: Users,
      action: () => navigate('/Community'),
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      hoverColor: "hover:border-green-500/40",
      iconColor: "text-green-400"
    }
  ];

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
      <SEO
        title="Navigate the Toolkit"
        description="Three ways to explore Chicago's startup resources - find what you need, discover patterns, or connect with people."
        keywords="startup resources, founder navigation, Chicago ecosystem, startup toolkit"
      />
      
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How to Use This Toolkit
            </h1>
            <p className="text-xl text-white/60 mb-2">
              Three ways to navigate:
            </p>
          </div>

          {/* Path Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {paths.map((path, index) => (
              <motion.button
                key={index}
                onClick={path.action}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`${path.bgColor} border ${path.borderColor} ${path.hoverColor} rounded-xl p-6 md:p-8 transition-all text-left group relative overflow-hidden`}
              >
                {/* Background gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="text-3xl mb-4">{path.number}</div>
                  
                  <div className={`${path.iconColor} mb-4`}>
                    <path.icon className="w-10 h-10" strokeWidth={1.5} />
                  </div>
                  
                  <h2 className="text-xl font-semibold text-white mb-3 leading-tight">
                    {path.title}
                  </h2>
                  
                  <p className="text-white/60 text-sm leading-relaxed mb-4">
                    {path.description}
                  </p>
                  
                  <div className="flex items-center text-white/40 group-hover:text-white/70 transition-colors">
                    <span className="text-sm font-medium">Explore</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Footer note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center"
          >
            <p className="text-white/70 text-sm">
              <strong className="text-white">Start anywhere. Change direction anytime.</strong>
              <br />
              This toolkit is designed to adapt to wherever you are in your journey.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
