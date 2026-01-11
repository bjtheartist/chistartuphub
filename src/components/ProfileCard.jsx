import { useState } from 'react';
import {
  MapPin,
  Globe,
  Copy,
  Check,
  Layers,
  Award,
  ExternalLink,
  Linkedin,
  Sparkles,
  Rocket
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import OptimizedImage from "@/components/OptimizedImage";

// Tech stack icon mapping (could be expanded with actual logos)
const TECH_ICONS = {
  'React': '⚛️',
  'Tailwind': '🎨',
  'Supabase': '⚡',
  'Node.js': '🟢',
  'Vercel': '▲',
  'Python': '🐍',
  'TypeScript': '📘',
  'Next.js': '▲',
  'PostgreSQL': '🐘',
  'AWS': '☁️',
  'Firebase': '🔥',
  'GraphQL': '◈',
  'Docker': '🐳',
  'Figma': '🎨',
};

const ProfileCard = ({
  user = null, // Can pass user data as prop
  // variant = 'full' // 'full' | 'compact' - TODO: implement variants
}) => {
  const [copied, setCopied] = useState(false);

  // Mock data - can be overridden by props
  const profileData = user || {
    name: "Billy Jenkins",
    avatar_url: null,
    role: "Founder @ ChiStartup Hub",
    company_name: "ChiStartup Hub",
    location: "Chicago, IL",
    pitch: "Building the operating system for Chicago's founder ecosystem.",
    website_url: "https://chistartuphub.com",
    email: "hello@chistartuphub.com",
    linkedin_url: "https://linkedin.com/in/billyjenkins",
    currentFocus: "Raising Pre-Seed Round",
    focusDescription: "Looking for strategic angels with deep networks in GovTech and Community building.",
    sectors: ["GovTech / CivicTech", "SaaS (B2B)"],
    badges: ["Technical Founder", "YC Alum", "Veteran Founder"],
    techStack: ["React", "Tailwind", "Supabase", "Node.js", "Vercel"],
    stage: "pre-revenue"
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(profileData.email);
    setCopied(true);
    toast.success('Email copied!', {
      description: profileData.email,
    });

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Stage badge colors
  const getStageBadge = (stage) => {
    const stages = {
      'idea': { label: 'Idea Stage', color: 'from-purple-500 to-violet-600' },
      'pre-revenue': { label: 'Pre-Revenue', color: 'from-blue-500 to-cyan-600' },
      'early-revenue': { label: 'Early Revenue', color: 'from-green-500 to-emerald-600' },
      'growth': { label: 'Growth', color: 'from-orange-500 to-amber-600' },
      'scaling': { label: 'Scaling', color: 'from-red-500 to-rose-600' },
    };
    return stages[stage] || null;
  };

  const stageBadge = getStageBadge(profileData.stage);

  return (
    <div className="w-full max-w-4xl mx-auto">

      {/* Main Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* LEFT COLUMN: Identity Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="md:col-span-1 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 flex flex-col items-center text-center backdrop-blur-sm"
        >
          {/* Avatar */}
          <div className="relative mb-4">
            {profileData.avatar_url ? (
              <OptimizedImage
                src={profileData.avatar_url}
                alt={profileData.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-white/10 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-xl border-2 border-white/10">
                {getInitials(profileData.name)}
              </div>
            )}
            {/* Online indicator */}
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
          </div>

          {/* Name & Role */}
          <h1 className="text-xl font-bold text-white mb-1">{profileData.name}</h1>
          <p className="text-sm text-white/60 font-medium mb-3">{profileData.role}</p>

          {/* Stage Badge */}
          {stageBadge && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${stageBadge.color} text-white mb-3`}>
              <Sparkles size={10} />
              {stageBadge.label}
            </span>
          )}

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-white/40 mb-6">
            <MapPin size={12} />
            <span>{profileData.location}</span>
          </div>

          {/* The Pitch */}
          <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-xl w-full">
            <p className="text-sm text-white/70 leading-relaxed italic">
              "{profileData.pitch}"
            </p>
          </div>

          {/* Social Links */}
          {profileData.linkedin_url && (
            <a
              href={profileData.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-2 text-xs text-white/40 hover:text-blue-400 transition-colors"
            >
              <Linkedin size={14} />
              <span>LinkedIn Profile</span>
            </a>
          )}
        </motion.div>

        {/* RIGHT COLUMN: Stack + Ask */}
        <div className="md:col-span-2 flex flex-col gap-4">

          {/* MIDDLE SECTION: The Stack */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm"
          >

            {/* Sectors */}
            {profileData.sectors?.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Rocket size={14} className="text-purple-500" />
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Sectors</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileData.sectors.map((sector, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-xs font-medium rounded-full text-purple-300 transition-all cursor-default"
                    >
                      {sector}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {profileData.sectors?.length > 0 && profileData.badges?.length > 0 && (
              <div className="w-full h-px bg-white/[0.06] mb-6" />
            )}

            {/* Identity & Badges */}
            {profileData.badges?.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Award size={14} className="text-yellow-500" />
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Identity & Badges</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileData.badges.map((badge, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-medium rounded-full text-white/70 transition-all cursor-default"
                    >
                      {badge}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {(profileData.sectors?.length > 0 || profileData.badges?.length > 0) && profileData.techStack?.length > 0 && (
              <div className="w-full h-px bg-white/[0.06] mb-6" />
            )}

            {/* Tech Stack */}
            {profileData.techStack?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={14} className="text-blue-500" />
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Tool Stack</span>
                </div>
                {/* Horizontal Scroll */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {profileData.techStack.map((tool, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-white/20 hover:bg-white/[0.04] transition-all group cursor-default"
                    >
                      <span className="text-lg mb-1">{TECH_ICONS[tool] || '🔧'}</span>
                      <span className="text-[10px] text-white/40 group-hover:text-white/60 font-medium">{tool}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!profileData.sectors?.length && !profileData.badges?.length && !profileData.techStack?.length && (
              <div className="text-center py-8">
                <p className="text-white/40 text-sm">No profile details added yet</p>
              </div>
            )}
          </motion.div>

          {/* BOTTOM SECTION: The Ask */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="relative bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-2xl p-6 overflow-hidden"
          >
            {/* Decorative gradient blob */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

              {/* Focus Content */}
              <div className="max-w-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Current Focus</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{profileData.currentFocus}</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {profileData.focusDescription}
                </p>
              </div>

              {/* Action Buttons - One-Way Signal */}
              <div className="flex flex-col gap-3 w-full sm:w-auto">

                {/* Primary: Copy Email */}
                <button
                  onClick={handleCopyEmail}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 w-full sm:w-auto"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied!" : "Copy Email"}
                </button>

                {/* Secondary: Visit Website */}
                {profileData.website_url && (
                  <a
                    href={profileData.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.1] text-white/80 hover:text-white text-sm font-medium rounded-xl transition-all w-full sm:w-auto"
                  >
                    <Globe size={16} />
                    Visit Website
                    <ExternalLink size={12} className="opacity-50" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
