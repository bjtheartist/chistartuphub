import React from "react";
import { Users, Globe, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const businessFormationResources = [
  {
    name: "NADC (North American Development Council)",
    icon: Globe,
    color: "bg-purple-400",
    description: "Provides technical assistance, training, and resources for small business development and entrepreneurship in the Chicago region.",
    link: "https://nadcchicago.org/",
    topics: ["Business Development", "Training", "Technical Assistance"]
  },
  {
    name: "Chicago Chamber of Commerce",
    icon: Users,
    color: "bg-amber-400",
    description: "Connect with the Chicago business community, access advocacy resources, networking events, and insights about local business trends.",
    link: "https://www.chicagochamber.org/",
    topics: ["Networking", "Business Advocacy", "Community"]
  },
];

export default function BusinessFormationSection({ searchQuery = "" }) {
  // Filter resources based on search query
  const filteredResources = searchQuery.trim() === ""
    ? businessFormationResources
    : businessFormationResources.filter((resource) => {
        const query = searchQuery.toLowerCase();
        return (
          resource.name.toLowerCase().includes(query) ||
          resource.description.toLowerCase().includes(query) ||
          resource.topics.some(topic => topic.toLowerCase().includes(query))
        );
      });

  // Don't render section if no results match search
  if (searchQuery.trim() !== "" && filteredResources.length === 0) {
    return null;
  }

  return (
    <section className="mb-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-red-500/50 to-transparent" />
          <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">Community & Support</h2>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2 tracking-tight">
          Startup Community & Support Networks
        </h2>
        <p className="text-white/40 font-light text-sm md:text-base leading-relaxed max-w-3xl">
          Connect with Chicago's startup community, mentorship networks, and support organizations to grow your business
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {filteredResources.map((resource, index) => {
          const Icon = resource.icon;
          return (
            <motion.div
              key={resource.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all overflow-hidden group flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/[0.08] flex items-start gap-4">
                <div className={`w-12 h-12 ${resource.color} border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                    {resource.name}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed mt-2">
                    {resource.description}
                  </p>
                </div>
              </div>

              {/* Topics */}
              <div className="px-6 py-4 border-b border-white/[0.08]">
                <div className="flex flex-wrap gap-2">
                  {resource.topics.map((topic) => (
                    <span
                      key={topic}
                      className="text-xs px-2.5 py-1 bg-white/[0.04] border border-white/[0.1] rounded text-white/60"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer with CTA */}
              <div className="p-6 mt-auto">
                <a href={resource.link} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Visit Organization
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Resource submission caveat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-8 bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center"
      >
        <p className="text-white/50 text-sm">
          Know a Chicago business organization that should be here? <a href="/submit-resource" className="text-blue-400 hover:text-blue-300 underline">Suggest it</a>.
        </p>
      </motion.div>
    </section>
  );
}
