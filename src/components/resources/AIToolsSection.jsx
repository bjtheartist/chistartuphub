import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const aiToolsByWorkflow = [
  {
    workflow: "Research & Knowledge",
    color: "bg-blue-400",
    icon: "🔍",
    tools: [
      {
        name: "Perplexity",
        desc: "AI-powered research and answer engine with citations",
        link: "https://www.perplexity.ai",
      },
      {
        name: "NotebookLM",
        desc: "Google's AI research assistant that sources from your documents",
        link: "https://notebooklm.google.com",
      },
      {
        name: "Deep Research",
        desc: "Advanced AI research tool for comprehensive analysis",
        link: "https://deepresearch.ai",
      },
      {
        name: "ChatGPT Search",
        desc: "Real-time web search integrated with ChatGPT",
        link: "https://chat.openai.com",
      },
      {
        name: "Elicit",
        desc: "AI research assistant for finding and analyzing papers",
        link: "https://elicit.org",
      },
      {
        name: "Consensus",
        desc: "Search engine that uses AI to find answers in research papers",
        link: "https://consensus.app",
      },
    ],
  },
  {
    workflow: "Writing & Content",
    color: "bg-purple-400",
    icon: "✍️",
    tools: [
      {
        name: "ChatGPT",
        desc: "AI assistant for writing, coding, analysis, and brainstorming",
        link: "https://chat.openai.com",
      },
      {
        name: "Claude",
        desc: "AI assistant by Anthropic with long context window",
        link: "https://claude.ai",
      },
      {
        name: "Gemini",
        desc: "Google's multimodal AI for text, images, and code",
        link: "https://gemini.google.com",
      },
      {
        name: "Grok",
        desc: "AI assistant by xAI with real-time X integration",
        link: "https://grok.x.ai",
      },
      {
        name: "Rytr",
        desc: "AI writing assistant for content creation",
        link: "https://rytr.me",
      },
      {
        name: "Sudowrite",
        desc: "AI writing partner for creative writers",
        link: "https://www.sudowrite.com",
      },
      {
        name: "Copy.ai",
        desc: "AI copywriting for marketing content and ads",
        link: "https://www.copy.ai",
      },
      {
        name: "Jasper",
        desc: "AI content platform for marketing teams",
        link: "https://www.jasper.ai",
      },
      {
        name: "Writesonic",
        desc: "AI writer for articles, blog posts, and ads",
        link: "https://writesonic.com",
      },
      {
        name: "HubSpot Email Writer",
        desc: "AI-powered email content generator",
        link: "https://www.hubspot.com",
      },
    ],
  },
  {
    workflow: "Design & Visual",
    color: "bg-pink-400",
    icon: "🎨",
    tools: [
      {
        name: "Midjourney",
        desc: "AI image generation for creative visuals",
        link: "https://www.midjourney.com",
      },
      {
        name: "DALL-E 3",
        desc: "OpenAI's latest image generation from text descriptions",
        link: "https://openai.com/dall-e",
      },
      {
        name: "Flux",
        desc: "Advanced AI image generation with high quality output",
        link: "https://flux.ai",
      },
      {
        name: "Stability AI",
        desc: "Open-source AI image generation (Stable Diffusion)",
        link: "https://stability.ai",
      },
      {
        name: "ImageFX",
        desc: "Google's experimental AI image generator",
        link: "https://aitestkitchen.withgoogle.com/tools/image-fx",
      },
      {
        name: "V0 by Vercel",
        desc: "AI-powered UI generation and web development",
        link: "https://v0.dev",
      },
      {
        name: "Canva Magic Studio",
        desc: "AI-powered design tools within Canva",
        link: "https://www.canva.com",
      },
      {
        name: "Looka",
        desc: "AI logo and brand identity designer",
        link: "https://looka.com",
      },
      {
        name: "Flair AI",
        desc: "AI tool for product photography and branding",
        link: "https://flair.ai",
      },
      {
        name: "Clipdrop",
        desc: "AI-powered image editing and background removal",
        link: "https://clipdrop.co",
      },
    ],
  },
  {
    workflow: "Video & Audio",
    color: "bg-green-400",
    icon: "🎬",
    tools: [
      {
        name: "Runway",
        desc: "AI video editing and generation tools",
        link: "https://runwayml.com",
      },
      {
        name: "Synthesia",
        desc: "AI video creation with avatars and voices",
        link: "https://www.synthesia.io",
      },
      {
        name: "Google Veo",
        desc: "Google's advanced AI video generation model",
        link: "https://deepmind.google/technologies/veo",
      },
      {
        name: "OpusClip",
        desc: "AI-powered video clip creation for social media",
        link: "https://www.opus.pro",
      },
      {
        name: "VideoFX",
        desc: "Google's experimental AI video generator",
        link: "https://aitestkitchen.withgoogle.com/tools/video-fx",
      },
      {
        name: "ElevenLabs",
        desc: "AI voice cloning and text-to-speech",
        link: "https://elevenlabs.io",
      },
      {
        name: "Descript",
        desc: "AI-powered video and podcast editing",
        link: "https://www.descript.com",
      },
      {
        name: "MusicFX",
        desc: "Google's experimental AI music generator",
        link: "https://aitestkitchen.withgoogle.com/tools/music-fx",
      },
    ],
  },
  {
    workflow: "Code & Development",
    color: "bg-yellow-400",
    icon: "💻",
    tools: [
      {
        name: "Cursor",
        desc: "AI-first code editor built on VSCode",
        link: "https://cursor.sh",
      },
      {
        name: "Lovable",
        desc: "AI that builds full-stack web apps from descriptions",
        link: "https://lovable.dev",
      },
      {
        name: "GitHub Copilot",
        desc: "AI pair programmer from GitHub and OpenAI",
        link: "https://github.com/features/copilot",
      },
      {
        name: "Replit AI",
        desc: "AI coding assistant in browser-based IDE",
        link: "https://replit.com",
      },
      {
        name: "Warp",
        desc: "AI-powered terminal with intelligent command search",
        link: "https://www.warp.dev",
      },
      {
        name: "Google AI Studio",
        desc: "Build with Google's Gemini API and experiment with prompts",
        link: "https://aistudio.google.com",
      },
      {
        name: "Gemini Code Assist",
        desc: "Google's AI code completion and generation",
        link: "https://cloud.google.com/products/gemini/code-assist",
      },
      {
        name: "Bolt.new",
        desc: "AI that builds and deploys full-stack apps",
        link: "https://bolt.new",
      },
      {
        name: "Blitzy",
        desc: "AI-powered app builder and deployment",
        link: "https://blitzy.com",
      },
      {
        name: "DeepAgent",
        desc: "AI coding agent for complex development tasks",
        link: "https://deepagent.ai",
      },
    ],
  },
  {
    workflow: "Productivity & Automation",
    color: "bg-orange-400",
    icon: "⚡",
    tools: [
      {
        name: "Zapier AI",
        desc: "Automate workflows with AI-powered integrations",
        link: "https://zapier.com",
      },
      {
        name: "n8n",
        desc: "Open-source workflow automation with AI capabilities",
        link: "https://n8n.io",
      },
      {
        name: "Make",
        desc: "Visual workflow automation platform (formerly Integromat)",
        link: "https://www.make.com",
      },
      {
        name: "Notion AI",
        desc: "AI assistant built into Notion workspace",
        link: "https://www.notion.so/product/ai",
      },
      {
        name: "Notion Q&A",
        desc: "AI-powered knowledge base search within Notion",
        link: "https://www.notion.so",
      },
      {
        name: "Otter.ai",
        desc: "AI meeting transcription and notes",
        link: "https://otter.ai",
      },
      {
        name: "Fathom",
        desc: "AI meeting assistant that records and summarizes",
        link: "https://fathom.video",
      },
      {
        name: "TLDV",
        desc: "AI meeting recorder for Google Meet and Zoom",
        link: "https://tldv.io",
      },
      {
        name: "Superhuman AI",
        desc: "AI-powered email with smart summaries",
        link: "https://superhuman.com",
      },
      {
        name: "Shortwave",
        desc: "AI email assistant for Gmail",
        link: "https://www.shortwave.com",
      },
      {
        name: "Reclaim.ai",
        desc: "AI calendar assistant and time management",
        link: "https://reclaim.ai",
      },
      {
        name: "Clockwise",
        desc: "AI-powered calendar optimization",
        link: "https://www.getclockwise.com",
      },
      {
        name: "Gamma",
        desc: "AI-powered presentation creation",
        link: "https://gamma.app",
      },
      {
        name: "Guru",
        desc: "AI knowledge management for teams",
        link: "https://www.getguru.com",
      },
    ],
  },
  {
    workflow: "Data & Analytics",
    color: "bg-teal-400",
    icon: "📊",
    tools: [
      {
        name: "Julius AI",
        desc: "AI data analyst that interprets your data",
        link: "https://julius.ai",
      },
      {
        name: "Hex AI",
        desc: "AI-powered data analysis and visualization",
        link: "https://hex.tech",
      },
      {
        name: "Tableau AI",
        desc: "AI-driven insights from your business data",
        link: "https://www.tableau.com",
      },
      {
        name: "Microsoft Copilot Analytics",
        desc: "AI analytics within Microsoft Power BI",
        link: "https://www.microsoft.com/en-us/power-platform/products/power-bi",
      },
      {
        name: "DataRobot",
        desc: "Enterprise AI platform for predictive analytics",
        link: "https://www.datarobot.com",
      },
      {
        name: "Domo AI",
        desc: "Business intelligence with AI-powered insights",
        link: "https://www.domo.com",
      },
      {
        name: "Adverity",
        desc: "Unified marketing data analysis with AI",
        link: "https://www.adverity.com",
      },
    ],
  },
  {
    workflow: "Customer Support",
    color: "bg-indigo-400",
    icon: "💬",
    tools: [
      {
        name: "Intercom AI",
        desc: "AI chatbot for customer support automation",
        link: "https://www.intercom.com",
      },
      {
        name: "Zendesk AI",
        desc: "AI-powered customer service platform",
        link: "https://www.zendesk.com",
      },
      {
        name: "Ada",
        desc: "AI chatbot platform for customer service",
        link: "https://ada.cx",
      },
      {
        name: "Drift",
        desc: "Conversational AI for sales and support",
        link: "https://www.drift.com",
      },
      {
        name: "Tidio",
        desc: "AI chatbot for customer service and live chat",
        link: "https://www.tidio.com",
      },
      {
        name: "Chargeflow",
        desc: "AI-powered chargeback management and prevention",
        link: "https://www.chargeflow.io",
      },
    ],
  },
  {
    workflow: "Marketing & Sales",
    color: "bg-red-400",
    icon: "📈",
    tools: [
      {
        name: "HubSpot AI",
        desc: "AI-driven marketing analytics and CRM automation",
        link: "https://www.hubspot.com",
      },
      {
        name: "AdCreative.ai",
        desc: "AI-powered ad creative generation",
        link: "https://www.adcreative.ai",
      },
      {
        name: "Hootsuite AI",
        desc: "Social media management with AI content optimization",
        link: "https://www.hootsuite.com",
      },
      {
        name: "ActiveCampaign",
        desc: "Customer experience automation with AI",
        link: "https://www.activecampaign.com",
      },
      {
        name: "Persado",
        desc: "Motivation AI for high-performing marketing language",
        link: "https://www.persado.com",
      },
      {
        name: "CRM Creatio",
        desc: "AI-powered CRM with audience segmentation",
        link: "https://www.creatio.com",
      },
      {
        name: "Wrike",
        desc: "Project management with AI automation",
        link: "https://www.wrike.com",
      },
    ],
  },
];

export default function AIToolsSection() {
  const [expandedWorkflows, setExpandedWorkflows] = useState(new Set());

  const toggleWorkflow = (workflow) => {
    const newExpanded = new Set(expandedWorkflows);
    if (newExpanded.has(workflow)) {
      newExpanded.delete(workflow);
    } else {
      newExpanded.add(workflow);
    }
    setExpandedWorkflows(newExpanded);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mb-28"
    >
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-white/50 to-transparent" />
          <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">AI Tools</h2>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2 tracking-tight">AI Tools by Workflow</h2>
        <p className="text-white/40 font-light text-sm md:text-base leading-relaxed max-w-3xl">
          Production and experimental AI tools organized by workflow and use case
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {aiToolsByWorkflow.map((workflow) => (
          <div
            key={workflow.workflow}
            className="bg-white/[0.04] border border-white/[0.1] rounded-lg overflow-hidden hover:border-white/[0.2] transition-colors"
          >
            <button
              onClick={() => toggleWorkflow(workflow.workflow)}
              className="w-full p-4 border-b border-white/[0.08] flex items-center gap-3 hover:bg-white/[0.04] transition-colors"
            >
              <div
                className={`w-12 h-12 ${workflow.color} rounded-lg flex items-center justify-center text-2xl flex-shrink-0`}
              >
                {workflow.icon}
              </div>
              <h3 className="text-sm font-semibold text-white text-left flex-1 uppercase tracking-wider">
                {workflow.workflow}
              </h3>
              <span className="text-xl font-mono text-white/60">
                {expandedWorkflows.has(workflow.workflow) ? "−" : "+"}
              </span>
            </button>

            <AnimatePresence>
              {expandedWorkflows.has(workflow.workflow) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    {workflow.tools.map((tool) => (
                      <a
                        key={tool.name}
                        href={tool.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border-l-2 border-white/[0.15] pl-3 hover:bg-white/[0.04] py-2 -ml-2 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors">
                              {tool.name}
                            </h4>
                            <p className="text-xs text-white/50 leading-relaxed">{tool.desc}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 flex-shrink-0 mt-1 text-white/30 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Google AI Experimental Spotlight */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-start gap-4">
          <div className="w-16 h-16 bg-yellow-400 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
            🧪
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-2 uppercase tracking-wider">
              Google AI Test Kitchen
            </h3>
            <p className="text-sm text-white/60 mb-4 leading-relaxed">
              Google's experimental AI tools including ImageFX, MusicFX, VideoFX, and other features in active development.
            </p>
            <a
              href="https://aitestkitchen.withgoogle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Explore Test Kitchen
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </motion.section>
  );
}