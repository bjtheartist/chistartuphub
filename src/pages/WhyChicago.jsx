import React from "react";
import { Building2, Users, DollarSign, Heart, TrendingUp, Award, Globe, Zap, ArrowDown } from "lucide-react";
import ParallaxScrollFeature from "../components/ui/parallax-scroll-feature";
import SEO from "@/components/SEO";
import { ShaderBackground } from "@/components/ui/digital-aurora";

export default function WhyChicago() {
  const parallaxSections = [
    {
      id: 1,
      icon: Building2,
      title: "World-Class Infrastructure",
      description: "Chicago boasts advanced coworking spaces, innovation hubs, and technology centers. Entrepreneurs have access to premier facilities like 1871, mHUB, and MATTER, with more than 270 coworking spaces available citywide—ranking among the top U.S. cities for shared work environments.",
      stats: "270+ coworking spaces",
      source: "CoworkingCafe, 2025",
      imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
      reverse: false
    },
    {
      id: 2,
      icon: Users,
      title: "Thriving Innovation Ecosystem",
      description: "Chicago's collaborative and supportive startup culture connects thousands of founders, mentors, and experts. With over 1,600+ active tech startups and a rapidly growing pool of founders, the city leads in cross-industry innovation and knowledge sharing.",
      stats: "1,600+ tech startups",
      source: "StartupBlink, 2025",
      imageUrl: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80",
      reverse: true
    },
    {
      id: 3,
      icon: DollarSign,
      title: "High-Value Ecosystem",
      description: "Chicago's ecosystem is a proven high-value generator. Between mid-2022 and 2024, the ecosystem's value was estimated at $54.9 billion. This value is fueled by strong recent investment, with startups raising $4.73 billion in growth capital in 2023 alone.",
      stats: "$54.9B ecosystem value",
      source: "Startup Genome, 2024",
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
      reverse: false
    },
    {
      id: 4,
      icon: Heart,
      title: "Diverse & Inclusive Community",
      description: "Programs dedicated to supporting women, minorities, and underrepresented founders continue to expand. Recent data shows about 24% of startups have at least one founder of color, and over 36% have at least one woman founder—well above national averages.",
      stats: "36% with woman founder",
      source: "Chicago:Blend, 2024",
      imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
      reverse: true
    },
    {
      id: 5,
      icon: TrendingUp,
      title: "Growing Tech Hub",
      description: "Global tech leaders like Google, Salesforce, and Microsoft continually expand their Chicago footprint. The city's tech sector saw an 18% growth rate in recent years, creating strong new job and partnership opportunities.",
      stats: "18% tech growth rate",
      source: "Chicagoland Chamber, 2024",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
      reverse: false
    },
    {
      id: 6,
      icon: Award,
      title: "Top Talent Pool",
      description: "Chicago is home to elite research universities including Northwestern and UChicago, with 40+ colleges and universities in the metropolitan area. The local workforce is distinguished by a blend of Midwest work ethic and innovative thinking.",
      stats: "40+ universities nearby",
      source: "Cause IQ, 2025",
      imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80",
      reverse: true
    },
    {
      id: 7,
      icon: Globe,
      title: "Strategic Location",
      description: "As America's most connected airport hub, Chicago offers unparalleled domestic and international access. O'Hare International is ranked the #1 most connected U.S. airport in 2025, facilitating national and global market reach for startups.",
      stats: "#1 most connected airport",
      source: "City of Chicago, 2025",
      imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
      reverse: false
    },
    {
      id: 8,
      icon: Zap,
      title: "Lower Cost of Living",
      description: "Chicago's cost of living is 30–40% lower than Silicon Valley or New York City, allowing founders to stretch resources further while enjoying urban amenities and a high quality of life.",
      stats: "30-40% less than SF/NYC",
      source: "Salary.com, 2025",
      imageUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      reverse: true
    }
  ];

  return (
    <div className="min-h-screen py-20 px-6">
      <SEO 
        title="Why Build in Chicago?" 
        description="Discover the advantages of the Chicago ecosystem: top talent, affordability, market access, and a supportive community."
        keywords="Chicago tech ecosystem, business advantages, cost of living, tech talent, startup hub"
      />
      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-screen -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=1600&q=80')] bg-cover bg-center opacity-60" />
          <ShaderBackground className="absolute inset-0 w-full h-full mix-blend-screen" />
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="min-h-screen flex flex-col items-center justify-center text-center mb-20">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 max-w-4xl drop-shadow-lg">
              Why Start in Chicago?
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-12 drop-shadow-md">
              Chicago offers the perfect combination of resources, talent, and opportunity for startups to thrive. Here's what makes the Windy City special.
            </p>
            <p className="flex items-center gap-2 text-white/60">
              SCROLL <ArrowDown className="w-5 h-5 animate-bounce" />
            </p>
          </div>

        {/* Parallax Scroll Sections */}
        <ParallaxScrollFeature sections={parallaxSections} />

        {/* Closing CTA */}
        <div className="min-h-screen flex flex-col items-center justify-center">
          <div className="glass-card p-12 rounded-3xl border border-white/10 text-center max-w-4xl">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Ready to Join Chicago's Startup Community?
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
              Discover the resources, connections, and support you need to build your dream company in the heart of the Midwest.
            </p>
            <div className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-white/10 to-white/5 border border-white/10">
              <p className="text-white font-semibold text-xl">Chicago: Where Innovation Meets Opportunity</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}