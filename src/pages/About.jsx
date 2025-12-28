import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Target,
  Users,
  Heart,
  Shield,
  CheckCircle2,
  Mail,
  ArrowRight
} from "lucide-react";
import SEO from "@/components/SEO";
import PageHero from "@/components/ui/page-hero";

export default function About() {
  const features = [
    {
      title: "Capital",
      description: "Find active investors, funding programs, and non-dilutive resources—organized so you can build a realistic outreach plan, not just a wishlist."
    },
    {
      title: "Workspaces",
      description: "Explore coworking spaces, innovation hubs, and places built for founders—so you can stop bouncing between tabs and start booking tours."
    },
    {
      title: "Hubs & Events",
      description: "Track the places and gatherings that move the ecosystem forward: demo days, community events, pitch nights, workshops, and labs."
    },
    {
      title: "Community",
      description: "Because building is hard alone. Find communities by stage, identity, industry, and focus, so support isn't accidental."
    },
    {
      title: "Founder Playbooks",
      description: "Tactical guidance for the messy middle: fundraising, GTM, product, hiring, operations, and \"what do I do next?\""
    },
    {
      title: "The Blueprints ✨",
      description: "A walk through of how other entrepreneurs have succeeded in Chicago."
    }
  ];

  const forWhom = [
    "First-time founders trying to find a starting point",
    "Repeat founders looking for signal over noise",
    "Operators building momentum inside early-stage teams",
    "Builders relocating to Chicago and learning the terrain",
    "Community leaders and partners who want resources to be easier to access"
  ];

  const curationCriteria = [
    {
      title: "Recency",
      description: "Active within a recent window (not dead lists)"
    },
    {
      title: "Specificity",
      description: "Clear criteria, clear focus, clear path to engage"
    },
    {
      title: "Accessibility",
      description: "Founders can actually take action from the information"
    },
    {
      title: "Credibility",
      description: "Reputable sources, transparent organizations, real proof of work"
    },
    {
      title: "Clarity",
      description: "No vague \"reach out for details\" when details should be public"
    }
  ];

  const values = [
    {
      icon: Target,
      title: "Access builds equity",
      description: "Founders shouldn't need insider knowledge to find basic resources."
    },
    {
      icon: Shield,
      title: "Clarity beats complexity",
      description: "The best ecosystems reduce friction. We design for action."
    },
    {
      icon: Heart,
      title: "Chicago deserves a better map",
      description: "The ecosystem is strong but information is scattered. We're fixing that."
    },
    {
      icon: Users,
      title: "Build with the community",
      description: "This hub improves with participation, feedback, and shared ownership."
    }
  ];

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
      <SEO
        title="About ChiStartup Hub"
        description="ChiStartup Hub is a living map of Chicago's startup ecosystem, built to help founders move faster with less guesswork."
        keywords="about ChiStartup Hub, Chicago startup ecosystem, founder resources, Billy Ndizeye"
      />

      <div className="max-w-4xl mx-auto">
        <PageHero
          label="About Us"
          title="About ChiStartup Hub"
          description="Chicago is full of opportunity. The hard part is finding it."
          backgroundImage="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&q=80"
        />

          {/* Mission Statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card p-8 md:p-12 rounded-2xl mb-16"
          >
            <p className="text-white/90 text-lg leading-relaxed mb-6">
              ChiStartupHub is a living map of Chicago's startup ecosystem, built to help founders move faster with less guesswork.
            </p>
            <p className="text-white/90 text-lg leading-relaxed">
              If you're building in Chicago, you shouldn't need perfect connections to discover investors, workspaces, community hubs, and playbooks that actually help. We organize what's already here, make it searchable, and keep it practical.
            </p>
          </motion.div>

          {/* What ChiStartupHub Gives You */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              What ChiStartupHub gives you
            </h2>
            <p className="text-white/70 text-lg mb-8">
              We've structured the site around the real questions founders ask when they're trying to get momentum:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all"
                >
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-white/70 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Who This Is For */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="glass-card p-8 md:p-12 rounded-2xl mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Who this is for
            </h2>
            <p className="text-white/90 text-lg mb-6">
              ChiStartupHub is built for people doing the work:
            </p>
            <ul className="space-y-4">
              {forWhom.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                  <span className="text-white/80 text-lg">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-white/90 text-lg mt-6 font-medium">
              If you're serious about building, this is for you.
            </p>
          </motion.div>

          {/* Curation Standards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How we curate (and what "active" means)
            </h2>
            <p className="text-white/90 text-lg mb-8">
              We care about usefulness over hype. Resources are prioritized based on:
            </p>
            <div className="space-y-4">
              {curationCriteria.map((criteria, index) => (
                <div
                  key={index}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.05] transition-all"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">{criteria.title}</h3>
                  <p className="text-white/70">{criteria.description}</p>
                </div>
              ))}
            </div>
            <p className="text-white/80 mt-6 text-lg">
              When we can, we verify through direct links, public references, and consistent updates. <span className="font-semibold text-white">It is updated on a weekly basis!</span>
            </p>
          </motion.div>

          {/* Our Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Our values
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div
                    key={index}
                    className="glass-card p-8 rounded-2xl"
                  >
                    <Icon className="w-10 h-10 text-blue-400 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                    <p className="text-white/80 leading-relaxed">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Data Sources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="glass-card p-8 md:p-12 rounded-2xl mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Where the data comes from
            </h2>
            <p className="text-white/90 text-lg mb-6">
              ChiStartupHub pulls from a mix of:
            </p>
            <ul className="space-y-3 mb-6">
              {[
                "Public websites and directories",
                "Partner organizations and programs",
                "Ecosystem event pages",
                "Founder/community submissions",
                "Firsthand curation and review"
              ].map((source, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-2" />
                  <span className="text-white/80 text-lg">{source}</span>
                </li>
              ))}
            </ul>
            <p className="text-white/90 text-lg">
              We aim for transparency, and we update as the ecosystem changes.
            </p>
          </motion.div>

          {/* Who's Behind This */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="glass-card p-8 md:p-12 rounded-2xl mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Who's behind ChiStartup Hub
            </h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              ChiStartupHub was built by <span className="font-semibold text-white">Billy Ndizeye</span>, an ecosystem builder and writer for the Capital Access Project focused on making startup infrastructure more usable and more equitable.
            </p>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              I've spent years working inside Chicago's startup and innovation ecosystem, supporting founders, building programs, hosting events, and learning where people get stuck. ChiStartupHub is the resource I wish existed when I was trying to navigate everything with limited time and too many tabs open.
            </p>
            <p className="text-white text-xl font-semibold leading-relaxed mb-4">
              This project is simple: make it easier for others to build here in Chicago.
            </p>
            <p className="text-white/70 text-base italic">
              If you're a partner org and want your resources accurately represented, I'd love to connect.
            </p>
          </motion.div>

          {/* Help Improve */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="glass-card p-8 md:p-12 rounded-2xl mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Help improve the map
            </h2>
            <p className="text-white/90 text-lg mb-8">
              ChiStartupHub is a living project. If something is missing, outdated, or wrong—we want to fix it.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to={createPageUrl("Resources") + "#submit"}>
                <Button className="accent-button">
                  Submit a Resource
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="mailto:billy@chistartuphub.com?subject=Report%20an%20Issue">
                <Button className="glass-button">
                  Report an Issue
                </Button>
              </a>
              <a href="mailto:billy@chistartuphub.com?subject=Partnership%20Inquiry">
                <Button className="glass-button">
                  Partner with Us
                </Button>
              </a>
            </div>
            <p className="text-white/80 text-base mt-6">
              If you're building something valuable for founders, we want it included.
            </p>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="glass-card p-8 md:p-12 rounded-2xl mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Contact
            </h2>
            <p className="text-white/90 text-lg mb-4">
              Questions, corrections, partnerships, or press:
            </p>
            <div className="space-y-3">
              <a 
                href="mailto:billy@chistartuphub.com" 
                className="flex items-center gap-3 text-blue-400 hover:text-blue-300 transition-colors text-lg group"
              >
                <Mail className="w-5 h-5" />
                <span className="group-hover:underline">billy@chistartuphub.com</span>
              </a>
              <p className="text-white/60 text-base">
                Social: <span className="italic">coming soon</span>
              </p>
            </div>
          </motion.div>

          {/* Independence Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-3">
              A quick note on independence
            </h3>
            <p className="text-white/80 leading-relaxed">
              ChiStartupHub is built to be useful first. If we ever use affiliate links, sponsorships, or partnerships, we'll disclose them clearly.
            </p>
          </motion.div>
      </div>
    </div>
  );
}