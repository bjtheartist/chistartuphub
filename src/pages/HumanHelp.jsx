import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { motion } from "framer-motion";

export default function HumanHelp() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
      <SEO
        title="Human Help"
        description="Connect with Chicago's founder community and get in touch."
      />

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Human Help
            </h1>
            <p className="text-xl text-white/60">
              Sometimes you need to talk to real people. Here's how to connect.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Peer Community */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-8"
            >
              <Users className="w-12 h-12 text-blue-400 mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-3">
                Peer Community
              </h2>
              <p className="text-white/70 mb-6 leading-relaxed">
                Connect with other Chicago founders who've been where you are.
                Join communities, attend meetups, and build relationships.
              </p>
              <Button
                onClick={() => navigate('/Community')}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
              >
                Browse Communities
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-green-500/10 border border-green-500/20 rounded-xl p-8"
            >
              <Mail className="w-12 h-12 text-green-400 mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-3">
                Get in Touch
              </h2>
              <p className="text-white/70 mb-6 leading-relaxed">
                Have questions, feedback, or want to contribute?
                Reach out and let's talk.
              </p>
              <Button
                onClick={() => navigate('/Contact')}
                className="bg-green-600 hover:bg-green-700 text-white w-full"
              >
                Contact Us
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>

          {/* Footer note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center mt-8"
          >
            <p className="text-white/70 text-sm">
              <strong className="text-white">Honest talk:</strong> Most of what you need to learn will come from doing, failing, and talking to customers—not from frameworks or office hours.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
