import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { motion } from "framer-motion";

export default function BeforeYouStart() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
      <SEO
        title="Before You Start"
        description="Understanding ChiStartupHub's approach to founder resources - honest, contextual, and built for Chicago."
        keywords="startup resources, founder toolkit, Chicago startups, honest guidance"
      />
      
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Before You Start
            </h1>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Intro */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 md:p-8">
              <p className="text-lg text-white/80 leading-relaxed mb-4">
                ChiStartupHub exists because <strong className="text-white">information asymmetry is a capital access barrier</strong>.
              </p>
              <p className="text-white/70 leading-relaxed">
                I've aggregated resources, frameworks, and patterns to help you navigate Chicago's startup ecosystem.
              </p>
            </div>

            {/* Limitations */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 md:p-8">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    But I need to be honest about limitations:
                  </h2>
                </div>
              </div>
              
              <ul className="space-y-4 text-white/70">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0 mt-2" />
                  <span>
                    <strong className="text-white">I'm one person.</strong> I can't make introductions for everyone or provide personalized guidance at scale.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0 mt-2" />
                  <span>
                    <strong className="text-white">No framework captures your full situation.</strong> You might match a "pattern" but your context is unique.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0 mt-2" />
                  <span>
                    <strong className="text-white">Having more resources doesn't automatically make you better equipped.</strong> It can overwhelm as much as it helps.
                  </span>
                </li>
              </ul>
            </div>

            {/* Promises */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 md:p-8">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    What I CAN promise:
                  </h2>
                </div>
              </div>
              
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Honest context about what works and what doesn't</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>No gatekeeping—you decide what's relevant</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Chicago-specific insights where they exist</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Continuous updates as I learn more</span>
                </li>
              </ul>
            </div>

            {/* How to Use This Toolkit */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-6">
                How to Use This Toolkit
              </h2>
              <p className="text-white/70 mb-6">
                Three simple paths depending on where you are:
              </p>

              <div className="space-y-4">
                {/* Path 1 */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-lg font-semibold text-blue-400 flex-shrink-0">1</div>
                    <div>
                      <p className="text-white font-medium">"I know what I need"</p>
                      <p className="text-white/60 text-sm mt-1">
                        Go straight to <strong>Resources</strong> and explore by category.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Path 2 */}
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-lg font-semibold text-purple-400 flex-shrink-0">2</div>
                    <div>
                      <p className="text-white font-medium">"Help me find where to start"</p>
                      <p className="text-white/60 text-sm mt-1">
                        Go to <strong>Business Type Explorer</strong> → answer 3 quick questions → get routed to the right path.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Path 3 */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-lg font-semibold text-green-400 flex-shrink-0">3</div>
                    <div>
                      <p className="text-white font-medium">"I want community"</p>
                      <p className="text-white/60 text-sm mt-1">
                        Join the <strong>Peer Community</strong> to connect with other builders in Chicago.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Closing */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 md:p-8 text-center">
              <p className="text-white/70 leading-relaxed mb-4">
                Use what helps. Ignore what doesn't. And if something's missing or wrong,{" "}
                <a href="/Contact" className="text-blue-400 hover:text-blue-300 underline">
                  tell me
                </a>.
              </p>
              <p className="text-white/50 text-sm mb-8">
                — Billy, ChiStartupHub
              </p>
              
              <Button
                onClick={() => navigate('/navigate-toolkit')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
              >
                Let's Go
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
