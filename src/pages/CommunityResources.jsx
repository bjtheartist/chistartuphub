import React from "react";
import { Users, ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CommunityResources() {
  const communities = [
    {
      name: "1871",
      description: "Chicago's premier tech and entrepreneurship center",
      link: "#"
    },
    {
      name: "mHUB",
      description: "The nation's leading manufacturing and hardtech innovation center",
      link: "#"
    },
    {
      name: "MATTER",
      description: "The premier healthcare technology incubator",
      link: "#"
    },
    {
      name: "Chicago Innovation",
      description: "Celebrating, educating and connecting innovators",
      link: "#"
    },
    {
      name: "The Hatchery",
      description: "A non-profit food and beverage incubator helping local entrepreneurs build & grow successful businesses",
      link: "#"
    },
    {
      name: "2112 Chicago",
      description: "Supporting entrepreneurship in creative industries through training, mentorship, and networking",
      link: "#"
    }
  ];

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Community Resources
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Connect with Chicago's leading innovation communities and entrepreneurship hubs
          </p>
        </div>

        {/* Communities Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {communities.map((community, index) => (
            <div
              key={index}
              className="glass-card p-8 rounded-3xl border border-white/10 hover:scale-105 transition-all duration-300 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">
                {community.name}
              </h3>
              
              <p className="text-white/70 mb-6 leading-relaxed flex-grow">
                {community.description}
              </p>

              <a href={community.link} target="_blank" rel="noopener noreferrer">
                <Button className="glass-button w-full group">
                  View Events
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}