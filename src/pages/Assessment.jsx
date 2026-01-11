import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Box, Megaphone, Settings, Brain, CheckCircle2, RotateCcw, Bookmark } from "lucide-react";
import SEO from "@/components/SEO";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";
import { useAuth } from "@/contexts/AuthContext";
import { useBookmarks } from "@/hooks/useBookmarks";
import { supabase } from "@/api/supabaseClient";
import { toast } from "sonner";

// Assessment dimensions and questions
const DIMENSIONS = [
  {
    id: "problem",
    icon: Box,
    label: "Problem",
    description: "Understanding the pain you're solving",
    questions: [
      {
        id: "p1",
        text: "Have you validated your problem with at least 10 customer interviews?",
        options: [
          { value: 1, label: "Not yet", description: "Still researching or haven't started" },
          { value: 2, label: "Some conversations", description: "Informal chats, not structured" },
          { value: 3, label: "Yes, documented", description: "Structured interviews with insights" },
          { value: 4, label: "Continuous process", description: "Ongoing discovery with systems" },
        ],
      },
      {
        id: "p2",
        text: "Can users clearly articulate the problem you're solving?",
        options: [
          { value: 1, label: "Not tested", description: "Haven't asked users to describe it" },
          { value: 2, label: "Vague descriptions", description: "Users struggle to articulate" },
          { value: 3, label: "Clear understanding", description: "Users describe it accurately" },
          { value: 4, label: "Users advocate", description: "Users explain it to others" },
        ],
      },
      {
        id: "p3",
        text: "Do you have a system for collecting and acting on user feedback?",
        options: [
          { value: 1, label: "No process", description: "Feedback is ad-hoc if at all" },
          { value: 2, label: "Founder-driven", description: "You personally collect feedback" },
          { value: 3, label: "Documented system", description: "Clear process exists" },
          { value: 4, label: "Automated cadence", description: "Regular reviews, automated collection" },
        ],
      },
    ],
  },
  {
    id: "growth",
    icon: Megaphone,
    label: "Growth",
    description: "How you acquire and retain users",
    questions: [
      {
        id: "g1",
        text: "How are you currently acquiring users?",
        options: [
          { value: 1, label: "Not yet", description: "No users or just friends/family" },
          { value: 2, label: "Manual outreach", description: "Personal networking, cold outreach" },
          { value: 3, label: "1-2 channels working", description: "Predictable acquisition from tested channels" },
          { value: 4, label: "Multi-channel engine", description: "4+ channels with documented playbooks" },
        ],
      },
      {
        id: "g2",
        text: "Do you know your cost per acquisition (CPA) for each channel?",
        options: [
          { value: 1, label: "No idea", description: "Not tracking acquisition costs" },
          { value: 2, label: "Rough estimates", description: "General sense but not precise" },
          { value: 3, label: "Tracked per channel", description: "Know CPA for each active channel" },
          { value: 4, label: "Optimized", description: "Regular optimization based on CPA data" },
        ],
      },
      {
        id: "g3",
        text: "Can you predict how many users you'll acquire next month?",
        options: [
          { value: 1, label: "No visibility", description: "Growth is unpredictable" },
          { value: 2, label: "Directional", description: "Know if trending up or down" },
          { value: 3, label: "Reasonably accurate", description: "Within 20% accuracy" },
          { value: 4, label: "Highly predictable", description: "Reliable forecasting model" },
        ],
      },
    ],
  },
  {
    id: "operations",
    icon: Settings,
    label: "Operations",
    description: "Delivering value consistently",
    questions: [
      {
        id: "o1",
        text: "Can you deliver value to users without you (founder) being directly involved?",
        options: [
          { value: 1, label: "I do everything", description: "Founder handles all delivery" },
          { value: 2, label: "Some delegation", description: "Help with pieces but founder-dependent" },
          { value: 3, label: "Team-operated", description: "Team delivers, founder oversees" },
          { value: 4, label: "Autonomous", description: "Runs without founder involvement" },
        ],
      },
      {
        id: "o2",
        text: "Are your key processes documented?",
        options: [
          { value: 1, label: "In my head", description: "No documentation exists" },
          { value: 2, label: "Some notes", description: "Partial documentation" },
          { value: 3, label: "SOPs exist", description: "Core processes documented" },
          { value: 4, label: "Living playbook", description: "Regularly updated, team-maintained" },
        ],
      },
      {
        id: "o3",
        text: "Could your systems handle 10x current volume?",
        options: [
          { value: 1, label: "Would break", description: "No capacity for scale" },
          { value: 2, label: "Strain significantly", description: "Would work but painfully" },
          { value: 3, label: "Handle with effort", description: "Scaling plan exists" },
          { value: 4, label: "Ready to scale", description: "Infrastructure proven at higher load" },
        ],
      },
    ],
  },
  {
    id: "brand",
    icon: Brain,
    label: "Brand",
    description: "How you're perceived in the market",
    questions: [
      {
        id: "b1",
        text: "Can users describe what makes you different in one sentence?",
        options: [
          { value: 1, label: "No clarity", description: "Users don't know or can't articulate" },
          { value: 2, label: "Vague sense", description: "General positive feelings but unclear" },
          { value: 3, label: "Clear positioning", description: "Users can articulate your difference" },
          { value: 4, label: "Category defining", description: "You're the reference point for others" },
        ],
      },
      {
        id: "b2",
        text: "Do you have documented brand guidelines?",
        options: [
          { value: 1, label: "None", description: "No consistent brand assets" },
          { value: 2, label: "Logo + colors", description: "Basic visual identity only" },
          { value: 3, label: "Full guidelines", description: "Voice, visuals, positioning documented" },
          { value: 4, label: "Brand system", description: "Comprehensive, actively enforced" },
        ],
      },
      {
        id: "b3",
        text: "Do users recommend you to others?",
        options: [
          { value: 1, label: "Not yet", description: "No organic referrals happening" },
          { value: 2, label: "Occasionally", description: "Some word-of-mouth" },
          { value: 3, label: "Regular referrals", description: "Consistent organic growth" },
          { value: 4, label: "Advocacy engine", description: "Users actively champion you" },
        ],
      },
    ],
  },
];

// Phase definitions
const PHASES = [
  { id: 1, name: "Validate", subtitle: "Discover & Refine", range: [1, 2] },
  { id: 2, name: "Systematize", subtitle: "Build the Engine", range: [2.01, 3] },
  { id: 3, name: "Scale", subtitle: "Expand & Impact", range: [3.01, 4] },
];

// Calculate phase from score
const getPhaseFromScore = (score) => {
  if (score <= 2) return 1;
  if (score <= 3) return 2;
  return 3;
};

// Resource recommendations by dimension and phase
// Format: 2 Founder Guides + 1 Chicago Ecosystem Link per dimension/phase
const RECOMMENDATIONS = {
  problem: {
    1: [
      { title: "Customer Discovery Guide", link: "/Resources#guides", type: "guide", description: "The Mom Test workshop & YC's How to Talk to Users" },
      { title: "Product Development", link: "/Resources#guides", type: "guide", description: "Superhuman's Product/Market Fit Engine" },
      { title: "Chicago Communities", link: "/Community", type: "chicago", description: "Find founders to interview and get early feedback" },
    ],
    2: [
      { title: "Metrics & Analytics", link: "/Resources#guides", type: "guide", description: "a16z's 16 Metrics for Growth" },
      { title: "Product Development", link: "/Resources#guides", type: "guide", description: "Shape Up by Basecamp" },
      { title: "Innovation Hubs", link: "/Directory", type: "chicago", description: "Explore Chicago's startup hubs and resources" },
    ],
    3: [
      { title: "Growth & Acquisition", link: "/Resources#guides", type: "guide", description: "Emerging Startup Playbook" },
      { title: "Metrics & Analytics", link: "/Resources#guides", type: "guide", description: "Guide to Growth Metrics" },
      { title: "Ecosystem Directory", link: "/Directory", type: "chicago", description: "Connect with Chicago's tech ecosystem" },
    ],
  },
  growth: {
    1: [
      { title: "Go-to-Market Guide", link: "/Resources#guides", type: "guide", description: "First Round's GTM Fit Framework" },
      { title: "Storytelling & Design", link: "/Resources#guides", type: "guide", description: "YC's How to Build a Pitch Deck" },
      { title: "Accelerators", link: "/AcceleratorsIncubators", type: "chicago", description: "Chicago accelerators for early traction and mentorship" },
    ],
    2: [
      { title: "Growth & Acquisition", link: "/Resources#guides", type: "guide", description: "Growth tactics from FB, Twitter, Wealthfront" },
      { title: "Monetization & Pricing", link: "/Resources#guides", type: "guide", description: "SaaS Pricing Strategy Guide" },
      { title: "Chicago Communities", link: "/Community", type: "chicago", description: "Network with founders who've scaled acquisition" },
    ],
    3: [
      { title: "Metrics & Analytics", link: "/Resources#guides", type: "guide", description: "16 Metrics for Growth at scale" },
      { title: "Team & Talent", link: "/Resources#guides", type: "guide", description: "How to Scale a Growth Strategy and Team" },
      { title: "Funding Resources", link: "/Funding", type: "chicago", description: "Chicago investors and growth-stage funding" },
    ],
  },
  operations: {
    1: [
      { title: "Product Development", link: "/Resources#guides", type: "guide", description: "Ship your MVP with Shape Up" },
      { title: "Customer Discovery", link: "/Resources#guides", type: "guide", description: "Validate before you build" },
      { title: "Workspaces", link: "/Workspaces", type: "chicago", description: "Find your first office or coworking space" },
    ],
    2: [
      { title: "Team & Talent", link: "/Resources#guides", type: "guide", description: "Equity Compensation guide" },
      { title: "Culture & Values", link: "/Resources#guides", type: "guide", description: "Netflix Culture Deck" },
      { title: "Innovation Hubs", link: "/Directory", type: "chicago", description: "Chicago hubs with talent and ops resources" },
    ],
    3: [
      { title: "Culture & Values", link: "/Resources#guides", type: "guide", description: "Give Away Your Legos" },
      { title: "Team & Talent", link: "/Resources#guides", type: "guide", description: "Scale your team structure" },
      { title: "Chicago Communities", link: "/Community", type: "chicago", description: "Connect with ops leaders at scaled companies" },
    ],
  },
  brand: {
    1: [
      { title: "Storytelling & Design", link: "/Resources#guides", type: "guide", description: "Sequoia's Business Plan format" },
      { title: "The Art of the Pitch", link: "/Resources#guides", type: "guide", description: "How to Pitch Your Startup" },
      { title: "Founder Asks", link: "/Opportunities", type: "chicago", description: "Get feedback on your pitch from Chicago founders" },
    ],
    2: [
      { title: "The Art of the Pitch", link: "/Resources#guides", type: "guide", description: "Master the Art of Influence" },
      { title: "Go-to-Market Guide", link: "/Resources#guides", type: "guide", description: "Positioning and market entry" },
      { title: "Chicago Communities", link: "/Community", type: "chicago", description: "Build relationships and brand awareness" },
    ],
    3: [
      { title: "Fundraising Strategy", link: "/Resources#guides", type: "guide", description: "Non-Obvious Guide to Fundraising" },
      { title: "Monetization & Pricing", link: "/Resources#guides", type: "guide", description: "Pricing for category leaders" },
      { title: "Startup Events", link: "/Events", type: "chicago", description: "Connect with investors and industry leaders" },
    ],
  },
};

export default function Assessment() {
  const navigate = useNavigate();
  const { user, openSignup } = useAuth();
  const { addBookmark } = useBookmarks();
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState("intro"); // intro, questions, results
  const [currentDimension, setCurrentDimension] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  // Email gate for results
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [gateEmail, setGateEmail] = useState('');
  const [gateName, setGateName] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate results when all answers are in
  const calculateResults = () => {
    const dimensionResults = {};
    let totalScore = 0;

    DIMENSIONS.forEach((dim) => {
      const dimAnswers = dim.questions.map((q) => answers[q.id] || 1);
      const avgScore = dimAnswers.reduce((a, b) => a + b, 0) / dimAnswers.length;
      const phase = getPhaseFromScore(avgScore);

      dimensionResults[dim.id] = {
        score: avgScore,
        phase,
        phaseName: PHASES[phase - 1].name,
      };

      totalScore += avgScore;
    });

    const overallScore = totalScore / 4;
    const overallPhase = getPhaseFromScore(overallScore);

    return {
      dimensions: dimensionResults,
      overall: {
        score: overallScore,
        phase: overallPhase,
        phaseName: PHASES[overallPhase - 1].name,
      },
      profile: Object.values(dimensionResults)
        .map((d) => d.phase)
        .join("-"),
    };
  };

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentDimension < DIMENSIONS.length - 1) {
      setCurrentDimension(currentDimension + 1);
    } else {
      // Calculate results but show email gate first (unless logged in)
      const calculatedResults = calculateResults();
      setResults(calculatedResults);

      if (user) {
        // Logged in users skip the gate
        setCurrentStep("results");
      } else {
        // Show email gate before results
        setShowEmailGate(true);
      }
    }
  };

  // Handle email submission for gated results
  const handleEmailGateSubmit = async (e) => {
    e.preventDefault();
    if (!gateEmail) {
      toast.error("Please enter your email");
      return;
    }

    setEmailSubmitting(true);
    try {
      // Save email to email_signups
      const { error } = await supabase
        .from('email_signups')
        .insert({
          email: gateEmail.trim(),
          name: gateName.trim() || null,
          source: 'assessment_results'
        });

      if (error && !error.message.includes('duplicate')) {
        console.error('Email signup error:', error);
      }

      // Show results regardless of save success
      setShowEmailGate(false);
      setCurrentStep("results");
      toast.success("Results unlocked!");
    } catch (err) {
      console.error('Email signup exception:', err);
      // Still show results
      setShowEmailGate(false);
      setCurrentStep("results");
    } finally {
      setEmailSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentDimension > 0) {
      setCurrentDimension(currentDimension - 1);
    } else {
      setCurrentStep("intro");
    }
  };

  const handleReset = () => {
    setAnswers({});
    setResults(null);
    setCurrentDimension(0);
    setCurrentStep("intro");
    setFeedbackGiven(false);
  };

  const handleSaveResults = async () => {
    if (!user) {
      toast.info("Create an account to save your results", {
        action: {
          label: "Sign Up",
          onClick: openSignup,
        },
      });
      openSignup();
      return;
    }

    setSaving(true);
    try {
      const now = new Date();

      // Save assessment results
      const { error } = await supabase.from("assessment_results").upsert({
        user_id: user.id,
        results: results,
        taken_at: now.toISOString(),
        saved_at: now.toISOString(),
      });

      if (error) throw error;

      // Save recommended resources as bookmarks
      const allRecs = [];
      DIMENSIONS.forEach((dim) => {
        const dimResult = results.dimensions[dim.id];
        const recs = RECOMMENDATIONS[dim.id]?.[dimResult.phase] || [];
        recs.forEach((rec) => {
          allRecs.push({
            resourceType: 'assessment_resource',
            resourceId: `${dim.id}-${dimResult.phase}-${rec.title.toLowerCase().replace(/\s+/g, '-')}`,
            resourceName: rec.title,
            resourceDescription: `${rec.description} (${dim.label} - ${dimResult.phaseName} phase)`,
            resourceUrl: rec.link,
          });
        });
      });

      // Save each resource as a bookmark (silently, don't fail if one fails)
      for (const rec of allRecs) {
        try {
          await addBookmark(rec);
        } catch (e) {
          console.log('Could not save bookmark:', rec.resourceName, e);
        }
      }

      setSaved(true);
      setSavedAt(now);
      toast.success(`Results & ${allRecs.length} resources saved to your profile`);
    } catch (error) {
      console.error("Error saving results:", error);
      toast.error("Failed to save results");
    } finally {
      setSaving(false);
    }
  };

  const handleFeedback = async () => {
    setFeedbackGiven(true);
    // Could save to Supabase for analytics
    toast.success("Thanks for your feedback!");
  };

  const currentDim = DIMENSIONS[currentDimension];
  const allCurrentQuestionsAnswered = currentDim?.questions.every((q) => answers[q.id]);
  const progress = ((currentDimension + 1) / DIMENSIONS.length) * 100;

  // Find gaps (dimensions in Phase 1)
  const getGaps = () => {
    if (!results) return [];
    return Object.entries(results.dimensions)
      .filter(([, data]) => data.phase === 1)
      .map(([id]) => DIMENSIONS.find((d) => d.id === id));
  };

  return (
    <div className="min-h-screen relative flex flex-col" data-page="assessment">
      <SEO
        title="Startup Maturity Assessment"
        description="Assess where your startup is across Problem, Growth, Operations, and Brand. Get personalized recommendations for your next focus areas."
        keywords="startup assessment, founder quiz, startup maturity, Chicago startups"
      />

      <BureauAtmosphere />

      <div className="relative z-10 flex-1">
        {/* Intro Screen */}
        {currentStep === "intro" && (
          <section className="pt-32 pb-24 px-6">
            <div className="max-w-2xl mx-auto text-center">
              <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
                <span className="bureau-label block mb-6">[ASSESSMENT: STARTUP_MATURITY]</span>
              </div>

              <h1
                className={`font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-6 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={{ animationDelay: '200ms' }}
              >
                Where Are You in Your Startup Journey?
              </h1>

              <p
                className={`text-white/50 text-lg mb-8 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={{ animationDelay: '300ms' }}
              >
                Answer 12 questions across 4 dimensions. Get a clear picture of your strengths, gaps, and where to focus next.
              </p>

              {/* Dimension Preview */}
              <div
                className={`grid grid-cols-2 md:grid-cols-4 gap-0 border border-white/10 mb-8 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
                style={{ animationDelay: '400ms' }}
              >
                {DIMENSIONS.map((dim, index) => {
                  const Icon = dim.icon;
                  return (
                    <div
                      key={dim.id}
                      className={`p-4 text-center ${index < 3 ? 'border-r border-white/10' : ''} ${index < 2 ? 'border-b md:border-b-0 border-white/10' : ''}`}
                    >
                      <Icon className="w-5 h-5 text-white/40 mx-auto mb-2" strokeWidth={1.5} />
                      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">{dim.label}</p>
                    </div>
                  );
                })}
              </div>

              <div
                className={`space-y-4 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
                style={{ animationDelay: '500ms' }}
              >
                <button
                  onClick={() => setCurrentStep("questions")}
                  className="font-mono text-[11px] uppercase tracking-[0.15em] px-8 py-4 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair flex items-center gap-2 mx-auto"
                >
                  Start Assessment
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>

                <p className="font-mono text-[10px] text-white/30 uppercase tracking-[0.15em]">
                  Takes about 3-5 minutes
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Questions Screen */}
        {currentStep === "questions" && currentDim && !showEmailGate && (
          <section className="pt-24 pb-24 px-6">
            <div className="max-w-3xl mx-auto">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">
                    Dimension {currentDimension + 1} of {DIMENSIONS.length}
                  </span>
                  <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">
                    {Math.round(progress)}% Complete
                  </span>
                </div>
                <div className="h-1 bg-white/10">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Dimension Header */}
              <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-3 mb-4">
                  {React.createElement(currentDim.icon, {
                    className: "w-6 h-6 text-white/60",
                    strokeWidth: 1.5,
                  })}
                  <h2 className="font-serif text-2xl md:text-3xl text-white">{currentDim.label}</h2>
                </div>
                <p className="text-white/40 text-sm">{currentDim.description}</p>
              </div>

              {/* Questions */}
              <div className="space-y-8 mb-12">
                {currentDim.questions.map((question, qIndex) => (
                  <div key={question.id} className="border border-white/10">
                    <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-[10px] text-white/30 pt-0.5">
                          Q{qIndex + 1}
                        </span>
                        <p className="text-white text-sm leading-relaxed">{question.text}</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-0">
                      {question.options.map((option, oIndex) => {
                        const isSelected = answers[question.id] === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleAnswer(question.id, option.value)}
                            className={`p-4 min-h-[44px] text-left transition-all border-b md:border-b-0 border-r border-white/10 last:border-r-0 cursor-crosshair ${
                              oIndex < 2 ? 'md:border-b border-white/10' : ''
                            } ${
                              isSelected
                                ? 'bg-white text-black'
                                : 'hover:bg-white/[0.03]'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className={`w-4 h-4 border flex items-center justify-center ${
                                  isSelected ? 'border-black bg-black' : 'border-white/30'
                                }`}
                              >
                                {isSelected && (
                                  <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={2} />
                                )}
                              </div>
                              <span
                                className={`font-mono text-[11px] uppercase tracking-[0.1em] ${
                                  isSelected ? 'text-black' : 'text-white'
                                }`}
                              >
                                {option.label}
                              </span>
                            </div>
                            <p
                              className={`text-xs ml-6 ${
                                isSelected ? 'text-black/60' : 'text-white/40'
                              }`}
                            >
                              {option.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBack}
                  className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 min-h-[44px] border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors flex items-center gap-2 cursor-crosshair"
                >
                  <ArrowLeft className="w-3 h-3" strokeWidth={1.5} />
                  Back
                </button>

                <button
                  onClick={handleNext}
                  disabled={!allCurrentQuestionsAnswered}
                  className={`font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 min-h-[44px] flex items-center gap-2 cursor-crosshair transition-all ${
                    allCurrentQuestionsAnswered
                      ? 'bg-white text-black hover:bg-white/90'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }`}
                >
                  {currentDimension === DIMENSIONS.length - 1 ? 'See Results' : 'Next'}
                  <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Email Gate Screen */}
        {showEmailGate && results && (
          <section className="pt-24 pb-24 px-6">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <span className="bureau-label block mb-4">[ASSESSMENT: COMPLETE]</span>
                <h1 className="font-serif text-3xl md:text-4xl text-white mb-4">
                  Your Results Are Ready
                </h1>
                <p className="text-white/50">
                  Enter your email to see your personalized startup maturity assessment.
                </p>
              </div>

              <form onSubmit={handleEmailGateSubmit} className="border border-white/10 p-6 space-y-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={gateEmail}
                    onChange={(e) => setGateEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-transparent border border-white/10 py-3 px-4 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={gateName}
                    onChange={(e) => setGateName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-transparent border border-white/10 py-3 px-4 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={emailSubmitting}
                  className="w-full font-mono text-[11px] uppercase tracking-[0.15em] px-6 py-4 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair disabled:opacity-50"
                >
                  {emailSubmitting ? 'Unlocking...' : 'See My Results'}
                </button>

                <p className="font-mono text-[10px] text-white/30 text-center">
                  We'll send you helpful startup resources. No spam.
                </p>
              </form>

              {/* Preview teaser */}
              <div className="mt-8 border border-white/10 p-4 bg-white/[0.02]">
                <p className="font-mono text-[10px] text-white/40 uppercase tracking-[0.1em] mb-2">
                  Your results include:
                </p>
                <ul className="space-y-2 text-white/50 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    Your overall startup maturity phase
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    Breakdown across 4 dimensions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    Personalized resource recommendations
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Results Screen */}
        {currentStep === "results" && results && (
          <section className="pt-24 pb-24 px-6">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="text-center mb-12">
                <span className="bureau-label block mb-4">[RESULTS: YOUR_STARTUP_MATURITY]</span>
                <h1 className="font-serif text-3xl md:text-4xl text-white mb-4">
                  Your Assessment Results
                </h1>
                <p className="text-white/50">
                  Overall, you're in the{' '}
                  <span className="text-white font-medium">{results.overall.phaseName}</span> phase
                </p>
              </div>

              {/* Matrix Visualization */}
              <div className="border border-white/10 mb-8">
                <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
                    [YOUR_POSITION_ON_THE_MATRIX]
                  </span>
                </div>

                {/* Desktop Matrix */}
                <div className="hidden md:block">
                  <div className="grid grid-cols-[140px_1fr_1fr_1fr]">
                    {/* Header row */}
                    <div className="p-3 border-b border-r border-white/10 bg-white/[0.02]" />
                    {PHASES.map((phase) => (
                      <div
                        key={phase.id}
                        className="p-3 text-center border-b border-r border-white/10 last:border-r-0 bg-white/[0.02]"
                      >
                        <div className="font-mono text-[10px] text-white/40 mb-1">PHASE {phase.id}</div>
                        <div className="font-mono text-[11px] uppercase tracking-[0.05em] text-white">
                          {phase.name}
                        </div>
                      </div>
                    ))}

                    {/* Dimension rows */}
                    {DIMENSIONS.map((dim) => {
                      const dimResult = results.dimensions[dim.id];
                      const Icon = dim.icon;
                      return (
                        <React.Fragment key={dim.id}>
                          <div className="p-3 border-b border-r border-white/10 last:border-b-0 bg-white/[0.02] flex items-center gap-2">
                            <Icon className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                            <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-white">
                              {dim.label}
                            </span>
                          </div>
                          {PHASES.map((phase) => {
                            const isActive = dimResult.phase === phase.id;
                            return (
                              <div
                                key={phase.id}
                                className={`p-4 border-b border-r border-white/10 last:border-r-0 last:border-b-0 flex items-center justify-center ${
                                  isActive ? 'bg-white' : ''
                                }`}
                              >
                                {isActive && (
                                  <div className="w-3 h-3 rounded-full bg-black" />
                                )}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Matrix */}
                <div className="md:hidden p-4 space-y-3">
                  {DIMENSIONS.map((dim) => {
                    const dimResult = results.dimensions[dim.id];
                    const Icon = dim.icon;
                    return (
                      <div key={dim.id} className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-white/40 flex-shrink-0" strokeWidth={1.5} />
                        <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-white w-20">
                          {dim.label}
                        </span>
                        <div className="flex-1 flex gap-1">
                          {PHASES.map((phase) => {
                            const isActive = dimResult.phase === phase.id;
                            return (
                              <div
                                key={phase.id}
                                className={`flex-1 h-6 border border-white/10 flex items-center justify-center ${
                                  isActive ? 'bg-white' : ''
                                }`}
                              >
                                {isActive && <div className="w-2 h-2 rounded-full bg-black" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-1 pt-2 ml-28">
                    {PHASES.map((phase) => (
                      <div key={phase.id} className="flex-1 text-center">
                        <span className="font-mono text-[10px] text-white/30 uppercase">
                          {phase.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dimension Breakdown */}
              <div className="grid md:grid-cols-2 gap-0 border border-white/10 mb-8">
                {DIMENSIONS.map((dim, index) => {
                  const dimResult = results.dimensions[dim.id];
                  const Icon = dim.icon;
                  const recs = RECOMMENDATIONS[dim.id]?.[dimResult.phase] || [];

                  return (
                    <div
                      key={dim.id}
                      className={`p-6 ${index < 2 ? 'border-b md:border-b' : ''} ${
                        index % 2 === 0 ? 'border-r' : ''
                      } border-white/10`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="w-5 h-5 text-white/50" strokeWidth={1.5} />
                        <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-white">
                          {dim.label}
                        </h3>
                        <span
                          className={`ml-auto font-mono text-[10px] uppercase tracking-[0.1em] px-2 py-1 ${
                            dimResult.phase === 1
                              ? 'bg-amber-500/20 text-amber-400'
                              : dimResult.phase === 2
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {dimResult.phaseName}
                        </span>
                      </div>

                      <p className="text-white/40 text-xs mb-4">{dim.description}</p>

                      {recs.length > 0 && (
                        <div className="space-y-3">
                          <p className="font-mono text-[10px] text-white/30 uppercase tracking-[0.15em]">
                            Your Next Steps:
                          </p>
                          {recs.map((rec, i) => (
                            <button
                              key={i}
                              onClick={() => navigate(rec.link)}
                              className="block w-full text-left group"
                            >
                              <div className="flex items-start gap-2">
                                <span className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 flex-shrink-0 ${
                                  rec.type === 'guide'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                  {rec.type}
                                </span>
                                <div>
                                  <p className="font-mono text-[10px] text-white/70 group-hover:text-white transition-colors">
                                    {rec.title}
                                  </p>
                                  <p className="text-[10px] text-white/40 group-hover:text-white/60 transition-colors">
                                    {rec.description}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Focus Areas */}
              {getGaps().length > 0 && (
                <div className="border border-amber-500/30 bg-amber-500/5 p-6 mb-8">
                  <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-amber-400 mb-2">
                    Focus Areas
                  </h3>
                  <p className="text-white/60 text-sm mb-4">
                    Based on your responses, these dimensions need the most attention:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getGaps().map((dim) => {
                      const Icon = dim.icon;
                      return (
                        <div
                          key={dim.id}
                          className="flex items-center gap-2 px-3 py-2 border border-amber-500/30 bg-amber-500/10"
                        >
                          <Icon className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
                          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-amber-400">
                            {dim.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-4 justify-center mb-12">
                <button
                  onClick={handleReset}
                  className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 min-h-[44px] border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors flex items-center gap-2 cursor-crosshair"
                >
                  <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
                  Retake
                </button>

                {user && (
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={handleSaveResults}
                      disabled={saving || saved}
                      className={`font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 min-h-[44px] border transition-all duration-300 flex items-center gap-2 ${
                        saving ? 'opacity-50 cursor-wait' : ''
                      } ${
                        saved
                          ? 'border-green-500 text-green-400 bg-green-500/10 cursor-default'
                          : 'border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white cursor-crosshair'
                      }`}
                    >
                      <Bookmark className={`w-3 h-3 ${saved ? 'fill-current' : ''}`} strokeWidth={1.5} />
                      {saving ? 'SAVING...' : saved ? 'SAVED' : 'SAVE ALL'}
                    </button>
                    {saved && savedAt ? (
                      <span className="font-mono text-[9px] text-green-400/70">
                        {savedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {savedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                    ) : !saved && (
                      <span className="font-mono text-[9px] text-white/40">
                        Results + Resources
                      </span>
                    )}
                  </div>
                )}

                <button
                  onClick={() => navigate('/resources')}
                  className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 min-h-[44px] bg-white text-black hover:bg-white/90 transition-colors flex items-center gap-2 cursor-crosshair"
                >
                  Explore Resources
                  <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                </button>
              </div>

              {/* Soft Touch Note */}
              <div className="border border-white/10 p-4 mb-8 bg-white/[0.02]">
                <p className="text-white/50 text-xs leading-relaxed text-center">
                  <span className="text-white font-medium">Remember:</span> This is a compass, not a prescription.
                  The startup journey isn't linear — founders loop back between stages constantly.
                  Use this to orient, not to judge.
                </p>
              </div>

              {/* Feedback */}
              {!feedbackGiven && (
                <div className="text-center">
                  <p className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] mb-4">
                    Was this assessment helpful?
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleFeedback(true)}
                      className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-3 min-h-[44px] border border-white/20 text-white/60 hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/50 transition-colors cursor-crosshair"
                    >
                      Very helpful
                    </button>
                    <button
                      onClick={() => handleFeedback(true)}
                      className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-3 min-h-[44px] border border-white/20 text-white/60 hover:bg-white/10 hover:text-white transition-colors cursor-crosshair"
                    >
                      Somewhat
                    </button>
                    <button
                      onClick={() => handleFeedback(false)}
                      className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-3 min-h-[44px] border border-white/20 text-white/60 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/50 transition-colors cursor-crosshair"
                    >
                      Not really
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

      </div>

      <BureauFooter />
    </div>
  );
}
