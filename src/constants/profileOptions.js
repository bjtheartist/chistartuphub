/**
 * Standardized Options for Profile Matching (No-Algorithm Search)
 * These constants ensure consistent categorization across the platform.
 */

export const SECTOR_OPTIONS = [
  // Core Sectors (The Bedrock) - 6 items
  "FinTech",
  "HealthTech",
  "Life Sciences",
  "Logistics & Supply Chain",
  "Food & AgTech",
  "Manufacturing 4.0",
  // Emerging Tech - 5 items
  "Web3 & Blockchain",
  "AI & Machine Learning",
  "CleanTech & Energy",
  "EdTech",
  "PropTech",
  // Consumer & Services - 5 items
  "DTC / CPG",
  "Marketplaces",
  "SaaS (B2B)",
  "GovTech / CivicTech",
  "HardTech / Hardware"
];
// Total: 16 sectors

export const BADGE_OPTIONS = [
  // Professional Identity - 4 items
  "Technical Founder",
  "Non-Technical Founder",
  "Solo Founder",
  "Student Founder",
  // Achievements - 5 items
  "YC Alum",
  "Techstars Alum",
  "Bootstrapped",
  "Venture Backed",
  "Ex-FAANG",
  // Community & Diversity (CRITICAL - Opt-In) - 7 items
  "Woman Founder",
  "Black Founder",
  "Latino/a/x Founder",
  "Asian Founder",
  "LGBTQ+ Founder",
  "Veteran Founder",
  "Immigrant Founder"
];
// Total: 16 badges

export const TECH_STACK_OPTIONS = [
  // Languages & Core
  "Python", "TypeScript", "JavaScript", "Golang", "Rust", "Swift", "Ruby", "Java", "C++",
  // Frontend & Mobile
  "React", "React Native", "Next.js", "Vue.js", "Tailwind CSS", "Flutter", "SwiftUI",
  // Backend & DB
  "Node.js", "Supabase", "Firebase", "PostgreSQL", "MongoDB", "GraphQL", "Django", "Rails",
  // Cloud & DevOps
  "AWS", "Vercel", "Docker", "Kubernetes", "Google Cloud", "Azure",
  // Design & Product
  "Figma", "Linear", "Notion", "Webflow", "Framer"
];

export const OPPORTUNITY_TYPES = [
  "Talent (Hiring)",
  "Capital (Raising)",
  "Work (Looking for Role)",
  "Connect (Networking)"
];

// Badges that unlock Tech Stack field
export const TECH_BADGES = ["Technical Founder", "Full Stack Dev"];

// Tech stack icons
export const TECH_ICONS = {
  'React': '\u269B\uFE0F',
  'Tailwind': '\uD83C\uDFA8',
  'Supabase': '\u26A1',
  'Node.js': '\uD83D\uDFE2',
  'Vercel': '\u25B2',
  'Python': '\uD83D\uDC0D',
  'TypeScript': '\uD83D\uDCD8',
  'Next.js': '\u25B2',
  'PostgreSQL': '\uD83D\uDC18',
  'AWS': '\u2601\uFE0F',
  'Firebase': '\uD83D\uDD25',
  'GraphQL': '\u25C8',
  'Docker': '\uD83D\uDC33',
  'Figma': '\uD83C\uDFA8',
  'JavaScript': '\uD83D\uDC9B',
  'Vue': '\uD83D\uDC9A',
  'Angular': '\uD83D\uDD34',
  'Go': '\uD83D\uDD35',
  'Rust': '\uD83E\uDD80',
};

// Stage badge config
export const STAGE_CONFIG = {
  'idea': { label: 'Idea Stage', color: 'from-purple-500 to-violet-600' },
  'pre-revenue': { label: 'Pre-Revenue', color: 'from-blue-500 to-cyan-600' },
  'early-revenue': { label: 'Early Revenue', color: 'from-green-500 to-emerald-600' },
  'growth': { label: 'Growth Stage', color: 'from-orange-500 to-amber-600' },
  'scaling': { label: 'Scaling', color: 'from-red-500 to-rose-600' },
};

// Resource recommendations based on interests
export const INTEREST_RESOURCES = {
  'Capital/Funding': { icon: 'DollarSign', title: 'Funding', link: '/Funding', color: 'from-green-500 to-emerald-600' },
  'Co-Working Spaces': { icon: 'Building2', title: 'Workspaces', link: '/Workspaces', color: 'from-purple-500 to-violet-600' },
  'Networking Events': { icon: 'Calendar', title: 'Events', link: '/Events', color: 'from-orange-500 to-amber-600' },
  'Accelerators/Incubators': { icon: 'Rocket', title: 'Accelerators', link: '/AcceleratorsIncubators', color: 'from-pink-500 to-rose-600' },
  'Legal/Compliance': { icon: 'Building2', title: 'Resources', link: '/Resources', color: 'from-slate-500 to-gray-600' },
  'Product Development': { icon: 'Rocket', title: 'Resources', link: '/Resources', color: 'from-indigo-500 to-blue-600' },
  'Marketing/Growth': { icon: 'Sparkles', title: 'Stories', link: '/Stories', color: 'from-yellow-500 to-orange-600' },
  'Talent/Hiring': { icon: 'Users', title: 'Community', link: '/Community', color: 'from-blue-500 to-cyan-600' }
};
