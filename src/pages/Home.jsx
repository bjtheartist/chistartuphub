import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Building2, Users, DollarSign, Heart, Briefcase, Calendar, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Glow } from "@/components/ui/glow";
import { Mockup, MockupFrame } from "@/components/ui/mockup";
import AuroraHero from "@/components/ui/digital-aurora";
import { ExpandingCards } from "@/components/ui/expanding-cards";
import { BentoGrid } from "@/components/ui/bento-grid";
import SuccessStoriesSection from "@/components/home/SuccessStoriesSection";
import ParallaxChicagoBackground from "@/components/home/ParallaxChicagoBackground";
import HotOpportunities from "@/components/home/HotOpportunities";
import { entities } from "@/api/supabaseClient";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import OptimizedImage from "@/components/OptimizedImage";
import SEO from "@/components/SEO";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Home() {
  const [titleNumber, setTitleNumber] = useState(0);
  const heroPinRef = useRef(null);

  // Email signup state (No longer needed, but keeping for now as per "keep existing code" until explicitly removed)
  // const [emailForm, setEmailForm] = useState({
  //   email: "",
  //   name: ""
  // });

  // // Submit email mutation (No longer needed)
  // const submitEmailMutation = useMutation({
  //   mutationFn: (data) => base44.entities.EmailSignup.create(data),
  //   onSuccess: () => {
  //     toast.success("Thank you for signing up! We'll keep you updated on Chicago's startup ecosystem.");
  //     setEmailForm({
  //       email: "",
  //       name: ""
  //     });
  //   },
  //   onError: (error) => {
  //     toast.error("Failed to sign up. Please try again.");
  //     console.error(error);
  //   }
  // });

  // const handleEmailChange = (field, value) => {
  //   setEmailForm(prev => ({ ...prev, [field]: value }));
  // };

  // const handleSubmitEmail = (e) => {
  //   e.preventDefault();
  //   submitEmailMutation.mutate(emailForm);
  // };

  const titles = useMemo(
    () => ["Startup", "Future", "Company", "Vision", "Dreams"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  // Setup ScrollTrigger for Hero Pinning
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    let ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: heroPinRef.current,
        start: "top top",
        end: "bottom top", // Pin for the duration of the hero height
        pin: true,
        pinSpacing: false, // Allows content to scroll OVER the hero
        anticipatePin: 1,
        invalidateOnRefresh: true,
      });
    });

    return () => ctx.revert();
  }, []);

  const benefits = [
  {
    icon: Building2,
    title: "World-Class Infrastructure",
    description: "Access to premier co-working spaces and innovation hubs across Chicago",
    gradient: "from-blue-400 to-blue-600",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab"
  },
  {
    icon: Users,
    title: "Innovation Ecosystem",
    description: "Connect with Chicago's leading entrepreneurs, mentors, and industry experts",
    gradient: "from-purple-400 to-purple-600",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c"
  },
  {
    icon: DollarSign,
    title: "Funding Opportunities",
    description: "Explore grants, venture capital, and angel investment networks",
    gradient: "from-green-400 to-green-600",
    image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d"
  },
  {
    icon: Heart,
    title: "Diverse Community",
    description: "Join a vibrant community of founders, innovators, and industry leaders",
    gradient: "from-orange-400 to-orange-600",
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18"
  }];


  const resources = [
  {
    icon: DollarSign,
    name: "Capital",
    description: "Explore funding opportunities from angels to VCs",
    count: "90+ investors",
    gradient: "from-blue-500 to-blue-600",
    path: "Funding",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e"
  },
  {
    icon: Briefcase,
    name: "Co-Working",
    description: "Find the perfect space to build your startup",
    count: "18+ spaces",
    gradient: "from-purple-500 to-purple-600",
    path: "Workspaces",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c"
  },
  {
    icon: Calendar,
    name: "Hubs & Events",
    description: "Connect with the ecosystem through events",
    count: "6+ hubs",
    gradient: "from-green-500 to-green-600",
    path: "Events",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30"
  },
  {
    icon: Users,
    name: "Community",
    description: "Join Chicago's vibrant founder communities",
    count: "22+ communities",
    gradient: "from-orange-500 to-orange-600",
    path: "Community",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac"
  },
  {
    icon: GraduationCap,
    name: "Founder Playbooks",
    description: "Operational guides and local compliance resources",
    count: "13+ resources",
    gradient: "from-yellow-500 to-yellow-600",
    path: "Resources",
    image: "https://images.unsplash.com/photo-1507842217121-9e93c864c32d"
  },
  {
    icon: Building2,
    name: "Ecosystem Map",
    description: "Browse Chicago's tech startup ecosystem on TechChicago by P33",
    count: "250+ startups",
    gradient: "from-indigo-500 to-indigo-600",
    path: null,
    external: "https://airtable.com/appfgBVkCSJj3MA6Y/shrnrUGzMVQLvpd1S/tblc2AYt94oP5CwVr?viewControls=on",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df"
  }];




  // Animated title component for the hero
  const animatedTitle =
  <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl max-w-4xl tracking-tighter text-left font-bold leading-tight">
      <span className="text-white">Build Your</span>
      <span className="relative flex w-full justify-start overflow-hidden text-left md:pb-4 md:pt-1">
        &nbsp;
        {titles.map((title, index) =>
      <motion.span
        key={index}
        className="absolute font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: "-100" }}
        transition={{ type: "spring", stiffness: 50 }}
        animate={
        titleNumber === index ?
        {
          y: 0,
          opacity: 1
        } :
        {
          y: titleNumber > index ? -150 : 150,
          opacity: 0
        }
        }>

            {title}
          </motion.span>
      )}
      </span>
      <span className="text-white">in Chicago</span>
    </h1>;


  const scrollToResources = (e) => {
    e.preventDefault();
    const resourcesSection = document.getElementById('resources-section');
    if (resourcesSection) {
      resourcesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen relative">
      <SEO 
        title="The Operating System for Chicago Founders"
        description="Build faster with ChiStartup Hub. Access 90+ investors, 18+ workspaces, and curated founder playbooks. Your unified toolkit for Chicago's startup ecosystem—zero gatekeeping."
        keywords="Chicago startups, venture capital, founder resources, startup funding, build faster, Chicago entrepreneurs, ecosystem"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "ChiStartup Hub",
          "url": window.location.origin,
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${window.location.origin}/stories?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          },
          "description": "The Operating System for Chicago Founders. Build faster with unified access to capital, community, and clarity."
        }}
      />
      
      {/* 
        NOTE: Duplicate fixed backgrounds have been removed to allow Layout.jsx to handle global background.
        The Hero overlay has been moved inside the Hero wrapper below.
      */}

      {/* Hero Section Wrapper - This acts as a placeholder in the document flow */}
      <div className="relative z-0 h-[100svh] overflow-hidden">
        {/* The pinned element */}
        <div ref={heroPinRef} className="h-full w-full absolute inset-0">
          {/* Hero Background Image - Local to Hero to allow lighter styling */}
          <div className="absolute inset-0 z-[-2]">
            <OptimizedImage
              src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df"
              alt="Chicago skyline"
              width={1600}
              priority={true}
              className="w-full h-full object-cover object-center brightness-110 contrast-105"
            />
          </div>

          {/* Darker Gradient Overlay for better text visibility */}
          <div className="absolute inset-0 z-[-1] bg-gradient-to-br from-black/70 via-black/50 to-black/70 pointer-events-none"></div>
          
          <AuroraHero
            title={animatedTitle}
            description="Stop searching, start building. Learn from real Chicago exits, meet communities actually shipping, and dive into the startup ecosystem."
            badgeText="Learn from Chicago's Exits"
            badgeLabel="Success Stories"
            badgeHref={createPageUrl("Stories")}
            ctaButtons={[
            { text: "Why Chicago?", href: createPageUrl("WhyChicago"), primary: true },
            { text: "Start Here", href: createPageUrl("before-you-start") }]
            }
            microDetails={[
            "90+ investors",
            "18+ workspaces",
            "6+ innovation hubs",
            "22+ communities"]
            } />
        </div>
      </div>

      {/* Main Content - Must have opaque background to cover the pinned hero */}
      <div className="relative z-10 bg-black -mt-24">
        {/* Success Stories Marquee */}
        <SuccessStoriesSection />

        {/* Hot Opportunities - Time-sensitive funding */}
        <HotOpportunities />

        {/* Why Chicago Section - Expanding Cards */}
        <section className="py-16 md:py-32 px-4 md:px-6 bg-gradient-to-b from-black via-gray-900 to-black relative">
          <ParallaxChicagoBackground />
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 px-4">
                Why Chicago
              </h2>
              <p className="text-base md:text-xl text-white/60 max-w-3xl mx-auto font-light leading-relaxed px-4">
                World-class infrastructure, deep talent, and proven exits—at a fraction of coastal costs.
              </p>
            </motion.div>

            <ExpandingCards items={benefits} />
          </div>
        </section>

      {/* Resources Section - Bento Grid */}
      <section id="resources-section" className="py-16 md:py-32 px-4 md:px-6 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 px-4">Everything You Need to Succeed</h2>
            <p className="text-white/60 text-base md:text-lg font-light px-4 max-w-2xl mx-auto">
              Stop opening 15 tabs. Access capital, spaces, and community in one place.
            </p>
          </motion.div>

          <BentoGrid items={[
            {
              title: "Capital",
              description: "Access 90+ active investors. Filter by stage, check size, and focus area.",
              icon: <DollarSign className="w-6 h-6" />,
              image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e",
              to: createPageUrl("Funding"),
              colSpan: 1,
              cta: "Find Funding",
              meta: "90+ Investors"
            },
            {
              title: "Workspaces",
              description: "18+ co-working spaces and innovation hubs across the city.",
              icon: <Briefcase className="w-6 h-6" />,
              image: "https://images.unsplash.com/photo-1497366216548-37526070297c",
              to: createPageUrl("Workspaces"),
              colSpan: 1,
              cta: "View Spaces",
              meta: "18+ Spaces"
            },
            {
              title: "Community",
              description: "Connect with 22+ founder communities, meetups, and builder groups.",
              icon: <Users className="w-6 h-6" />,
              image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac",
              to: createPageUrl("Community"),
              colSpan: 1,
              cta: "Join Now",
              meta: "22+ Groups"
            },
            {
              title: "Hubs & Events",
              description: "Demo days, pitch nights, workshops, and networking events.",
              icon: <Calendar className="w-6 h-6" />,
              image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
              to: createPageUrl("Events"),
              colSpan: 1,
              cta: "See Events",
              meta: "6+ Hubs"
            },
            {
              title: "Startup Toolkit",
              description: "Operational guides, legal compliance, and Chicago-specific resources.",
              icon: <GraduationCap className="w-6 h-6" />,
              image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fad57ce6a6914f0fbc124a/1f4c1c747_image.png",
              to: createPageUrl("Resources"),
              colSpan: 1,
              cta: "Learn More",
              meta: "Curated"
            },
            {
              title: "Startup Directory",
              description: "Browse 250+ Chicago startups on TechChicago by P33.",
              icon: <Building2 className="w-6 h-6" />,
              image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df",
              href: "https://airtable.com/appfgBVkCSJj3MA6Y/shrnrUGzMVQLvpd1S/tblc2AYt94oP5CwVr?viewControls=on",
              colSpan: 1,
              cta: "Explore",
              meta: "250+ Startups"
            }
          ]} />
        </div>
      </section>

        {/* Newsletter Section */}
        <section className="py-12 md:py-24 px-4 md:px-6 bg-black">
        <div className="max-w-6xl mx-auto relative">
          {/* Background Glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur-2xl opacity-20" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl md:rounded-[2.5rem] border border-white/10 bg-[#0A0A0A]"
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
              <OptimizedImage 
                src="https://images.unsplash.com/photo-1505245208761-ba872912fac0" 
                alt="Chicago Bean" 
                className="w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/40" />
            </div>

            <div className="relative z-10 p-6 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="flex-1 text-center md:text-left space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium uppercase tracking-wider mb-2">
                  <Sparkles className="w-3 h-3" />
                  Weekly Intelligence
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1]">
                  Get weekly <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                    insights
                  </span>
                </h2>
                <p className="text-lg text-white/60 max-w-xl leading-relaxed">
                  Join founders and investors getting funding rounds, new investors, upcoming deadlines, and curated resources delivered every week.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                  <a href="https://tally.so/r/ob6dJP" target="_blank" rel="noopener noreferrer">
                    <Button className="h-14 px-8 text-lg bg-white text-black hover:bg-gray-100 hover:scale-105 transition-all rounded-full font-semibold shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                      Subscribe Now
                    </Button>
                  </a>
                </div>
              </div>

              {/* Abstract Visual / Card Representation */}
              <div className="hidden md:block relative w-72 h-72 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl" />
                
                {/* Floating Cards Effect */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-10 right-0 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl w-64 shadow-2xl transform rotate-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="h-2 w-24 bg-white/20 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-white/10 rounded-full" />
                    <div className="h-2 w-2/3 bg-white/10 rounded-full" />
                  </div>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-10 left-4 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl w-64 shadow-2xl transform -rotate-3 z-10"
                >
                   <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500" />
                      <div>
                        <div className="h-2.5 w-20 bg-white rounded-full mb-1.5" />
                        <div className="h-2 w-12 bg-white/50 rounded-full" />
                      </div>
                   </div>
                   <div className="h-20 w-full bg-white/5 rounded-xl border border-white/5" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      </div>
    </div>
  );
}