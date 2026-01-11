import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STAGE_CONTEXT = {
  'idea': 'just starting with a business idea and needs help with validation, market research, and figuring out first steps',
  'pre-revenue': 'building their product but hasn\'t generated revenue yet, needs help with MVP, early users, and preparing for funding',
  'early-revenue': 'has some initial revenue and customers, looking to grow and scale their operations',
  'growth': 'scaling their business, hiring team, and looking for growth capital',
  'scaling': 'rapidly scaling and may be looking at Series A+ funding',
};

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: `Hey there! I'm your Chicago startup assistant. I can help you navigate the local ecosystem, find resources, and answer questions about building your startup here.

What can I help you with today?`
};

export default function AIAssistant() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Don't render if user is not logged in (must be after all hooks)
  if (!user) return null;

  // eslint-disable-next-line no-unused-vars -- Will be used when Edge Function is deployed
  const getSystemPrompt = () => {
    const stageContext = profile?.stage ? STAGE_CONTEXT[profile.stage] : 'at an early stage';
    const interests = profile?.interests?.join(', ') || 'general startup resources';
    const role = profile?.role || 'founder';

    return `You are a helpful, knowledgeable assistant for ChiStartup Hub, a platform for Chicago-based entrepreneurs and startups.

ABOUT THE USER:
- They are a ${role} who is ${stageContext}
- Their interests include: ${interests}
- They are using ChiStartup Hub to find resources, funding, workspaces, and community

YOUR ROLE:
- Help early-stage founders navigate the Chicago startup ecosystem
- Be encouraging but realistic about startup challenges
- Suggest specific Chicago resources when relevant (1871, mHUB, P33, etc.)
- Keep responses concise and actionable
- If they ask about funding, mention ChiStartup Hub's investor database with 90+ investors
- If they ask about spaces, mention the 18+ coworking spaces listed
- If they ask about events, point them to the Events section with 6+ innovation hubs

PLATFORM RESOURCES TO RECOMMEND:
- /Funding - 90+ Chicago investors filtered by stage and focus
- /Workspaces - 18+ coworking spaces and innovation hubs
- /Events - Innovation hubs with event calendars
- /Community - 22+ founder communities and Slack groups
- /AcceleratorsIncubators - Chicago accelerator programs
- /Stories - Success stories from Chicago startups like Groupon, Cameo, ShipBob
- /Resources - Founder playbooks and guides

Be friendly, supportive, and specific to Chicago's startup ecosystem.`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // For now, provide a helpful local response since we don't have the Edge Function set up yet
      // This will be replaced with actual API call when the Edge Function is deployed
      const assistantResponse = getLocalResponse(inputValue.trim());

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantResponse
      }]);
    } catch (error) {
      console.error('AI Assistant error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. In the meantime, check out the Resources section for guides and playbooks!"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced local response logic with profile-aware personalization
  const getLocalResponse = (input) => {
    const lower = input.toLowerCase();
    const stage = profile?.stage || '';
    const role = profile?.role || '';
    const interests = profile?.interests || [];

    // Helper function to get personalized greeting
    const getPersonalizedContext = () => {
      if (stage === 'idea') return 'Since you\'re at the idea stage, ';
      if (stage === 'pre-revenue') return 'Since you\'re building pre-revenue, ';
      if (stage === 'early-revenue') return 'Since you\'re generating early revenue, ';
      if (stage === 'growth') return 'Since you\'re in growth stage, ';
      if (stage === 'scaling') return 'Since you\'re scaling, ';
      return '';
    };

    // FUNDING QUESTIONS
    if (lower.includes('fund') || lower.includes('invest') || lower.includes('money') || lower.includes('capital') || lower.includes('raise')) {
      const context = getPersonalizedContext();
      let stageAdvice = '';

      if (stage === 'idea') {
        stageAdvice = '\n\n**For your stage:** Focus on grants and pitch competitions first. Build traction before approaching investors. Consider friends & family if you need initial capital.';
      } else if (stage === 'pre-revenue') {
        stageAdvice = '\n\n**For your stage:** Look for pre-seed investors and accelerators. Angels are your best bet right now. Show prototype + customer interest.';
      } else if (stage === 'early-revenue') {
        stageAdvice = '\n\n**For your stage:** You\'re seed-stage ready! Look for seed investors in our database. Your revenue traction is your biggest selling point.';
      } else if (stage === 'growth' || stage === 'scaling') {
        stageAdvice = '\n\n**For your stage:** Focus on Series A/B VCs in Chicago. Emphasize your growth metrics and unit economics.';
      } else {
        stageAdvice = '\n\n**Getting started:** Filter our investor database by check size and focus area to find the best fit.';
      }

      return `${context}ChiStartup Hub has 90+ active Chicago investors you can browse in the **Funding** section (/Funding).${stageAdvice}

**Quick tips:**
- Most Chicago investors prefer warm intros
- Check out **/Community** to connect with founders who can make introductions
- Read success stories at **/Stories** to see what worked for others

Need help with your pitch deck or cap table?`;
    }

    // WORKSPACE QUESTIONS
    if (lower.includes('workspace') || lower.includes('office') || lower.includes('cowork') || lower.includes('space')) {
      let recommendations = [];

      if (stage === 'idea' || stage === 'pre-revenue') {
        recommendations.push('Start with flexible month-to-month options - **1871** and **MATTER** have great starter plans');
      } else if (stage === 'growth' || stage === 'scaling') {
        recommendations.push('Look for spaces with private offices and room to grow');
      }

      if (interests.includes('Product Development')) {
        recommendations.push('**mHUB** is perfect if you\'re building hardware');
      }

      if (interests.includes('Networking Events')) {
        recommendations.push('**1871** has the most active community and daily events');
      }

      const personalizedRecs = recommendations.length > 0
        ? '\n\n**For you:**\n' + recommendations.map(r => `- ${r}`).join('\n')
        : '';

      return `Chicago has 18+ coworking spaces perfect for startups! Check out **/Workspaces** for the full list.

**Top picks:**
- **1871** - The legendary tech hub (4,000+ sq ft)
- **mHUB** - Hardware/manufacturing focused
- **MATTER** - Healthtech and impact startups
- **TechNexus** - Enterprise tech focus${personalizedRecs}

Most offer day passes if you want to try before committing!`;
    }

    // NETWORKING & EVENTS
    if (lower.includes('event') || lower.includes('network') || lower.includes('meetup') || lower.includes('connect')) {
      let eventAdvice = '';

      if (stage === 'idea') {
        eventAdvice = 'For ideation, attend customer discovery workshops and validation events. ';
      } else if (stage === 'pre-revenue' || stage === 'early-revenue') {
        eventAdvice = 'Focus on demo days and investor pitch events to get feedback and exposure. ';
      }

      return `${eventAdvice}Chicago's startup scene has tons of events! Check **/Events** for calendars from 6+ innovation hubs.

**Can't-miss events:**
- **1871 Demo Days** - Showcase your startup
- **P33 Mixers** - Connect with the broader tech community
- **Built In Chicago events** - Industry-specific meetups
- **Techstars Mentor Madness** - Get expert feedback

**Pro tip:** Join the communities at **/Community** to get event invites in your Slack. Most good events are announced there first!

Looking for something specific like investor events or hiring meetups?`;
    }

    // ACCELERATOR QUESTIONS
    if (lower.includes('accelerator') || lower.includes('incubator') || lower.includes('program')) {
      let programAdvice = '';

      if (stage === 'idea') {
        programAdvice = 'You\'re at the perfect stage for accelerators! Most accept idea-stage companies. ';
      } else if (stage === 'pre-revenue') {
        programAdvice = 'With a product built, you\'re competitive for top accelerators. ';
      } else if (stage === 'early-revenue') {
        programAdvice = 'Your revenue makes you very attractive to accelerators - you might even get better terms. ';
      }

      return `${programAdvice}Chicago has world-class accelerator programs! See the full list at **/AcceleratorsIncubators**.

**Top programs:**
- **Techstars Chicago** - 3 months, $120K for 6% equity
- **MATTER** - Healthtech focus, 6-month program
- **1871 WiSTEM** - Women in STEM (no equity taken)
- **mHUB Hardware Accelerator** - For physical products

**Application tips:**
- Apply to 3-5 programs to increase odds
- Most have 2-4 cohorts per year
- Deadlines are usually 2-3 months before start date
- Network with alumni for insider advice

What industry are you in? I can suggest more specific programs.`;
    }

    // COMMUNITY QUESTIONS
    if (lower.includes('community') || lower.includes('slack') || lower.includes('group') || lower.includes('founder')) {
      const context = role === 'founder' ? 'As a founder, connecting' : 'Connecting';

      return `${context} with other founders is crucial! We've listed 22+ communities at **/Community**.

**Most active Chicago communities:**
- **Chicago Founders Slack** - 1,000+ local founders
- **Built In Chicago** - Tech professionals & founders
- **1871 Member Network** - If you're a member
- **P33 Community** - Broader Chicago tech ecosystem

**Industry-specific:**
- **ChiTech** - General tech
- **Chicago Blend** - Social impact
- **TechWeek Chicago** - Annual conference community

**Pro tip:** Don't just lurk! Post questions, share wins, and help others. The community gives back what you put in.

Want me to recommend communities for your specific industry or stage?`;
    }

    // GETTING STARTED / EARLY STAGE
    if (lower.includes('start') || lower.includes('begin') || lower.includes('first') || lower.includes('new') || lower.includes('how do i')) {
      if (stage === 'idea') {
        return `Perfect timing! Here's your Chicago startup roadmap for idea stage:

**Week 1-2: Validate**
- Talk to 20+ potential customers
- Identify the real problem you're solving
- Check out **/Resources** for validation playbooks

**Week 3-4: Build MVP**
- Keep it simple - test your core assumption
- Use no-code tools if possible (Webflow, Bubble, etc.)

**Month 2: Get Feedback**
- Join **/Community** groups and share your idea
- Attend **/Events** at 1871 or MATTER
- Find a co-founder if you don't have one

**Month 3: Next Steps**
- Apply to accelerators if you have traction
- Consider coworking at **/Workspaces** to be around other founders
- Start building investor relationships (not asking for money yet!)

What's your idea? I can give more specific advice!`;
      }

      return `Welcome to the Chicago startup journey! Here's where to start:

**Immediate steps:**
1. **Join communities** - **/Community** for Slack groups & networks
2. **Find a workspace** - **/Workspaces** to be around other builders
3. **Attend events** - **/Events** to learn and network
4. **Read success stories** - **/Stories** for inspiration and tactics

**Next 30 days:**
- Talk to 10+ customers per week
- Build the simplest version of your product
- Connect with 5 other founders for advice
- Explore **/Resources** for playbooks and guides

**Based on your interests**, you might want to check out:
${interests.slice(0, 3).map(interest => `- ${interest} resources`).join('\n') || '- Our resources section for guides'}

What's your biggest challenge right now?`;
    }

    // CHICAGO-SPECIFIC QUESTIONS
    if (lower.includes('chicago') || lower.includes('why chicago') || lower.includes('ecosystem')) {
      return `Chicago's startup scene is one of the best-kept secrets in tech! Here's why:

**Advantages:**
- 30% lower costs than SF/NYC (burn less capital!)
- Deep talent pool from Northwestern, UChicago, UIUC
- Strong corporate partnerships (United, McDonald's, etc.)
- $2B+ in VC funding annually in Chicago
- Growing unicorns: Grubhub, Groupon, Cameo, ShipBob, Tempus

**The ecosystem:**
- **1871** - 4th largest startup hub in the world
- **mHUB** - Largest hardtech incubator in N. America
- **P33** - Economic development initiative
- **90+ active investors** right here in Chicago

**Community feel:** Founders actually help each other here - less cutthroat than the coasts.

Check **/Stories** to see companies that made it big in Chicago. Or **/WhyChicago** for the full breakdown!`;
    }

    // PITCH/INVESTOR PREP
    if (lower.includes('pitch') || lower.includes('deck') || lower.includes('presentation') || lower.includes('meeting')) {
      const context = getPersonalizedContext();

      return `${context}here's how to prepare for investor conversations:

**Your pitch deck should have:**
1. Problem (2 slides max - make it visceral)
2. Solution (your product in 1 slide)
3. Market size (TAM/SAM/SOM)
4. Traction (revenue, users, growth rate)
5. Team (why YOU can win)
6. Ask (how much & what for)

**Chicago investor tips:**
- They value unit economics more than SF investors
- Warm intros are critical - use **/Community** to find connections
- Know your numbers cold (CAC, LTV, burn rate, runway)
- Have a clear path to profitability

**Resources:**
- **/Resources** has pitch deck templates
- **/Stories** shows what worked for successful Chicago startups
- **/Funding** to research which investors to target

Want help with a specific part of your pitch?`;
    }

    // TEAM/HIRING
    if (lower.includes('hire') || lower.includes('team') || lower.includes('recruit') || lower.includes('talent') || lower.includes('cofounder')) {
      return `Building a team in Chicago? You're in the right city - deep talent pool and lower costs!

**Finding co-founders:**
- Attend **/Events** at 1871 and innovation hubs
- Join **/Community** Slacks and post in #looking-for-cofounder
- Check out Techstars Startup Weekend for potential partners

**Hiring employees:**
- **Built In Chicago** - Best tech job board
- **1871 Talent Network** - If you're a member
- **Northwestern/UChicago career fairs** - Great intern pipeline
- **Coding bootcamps** - Flatiron School, General Assembly

**Chicago advantage:** Senior engineers cost 40-50% less than SF while being just as talented!

**Pro tip:** Offer equity to early employees - everyone should have skin in the game.

What role are you looking to fill?`;
    }

    // LEGAL/COMPLIANCE
    if (lower.includes('legal') || lower.includes('lawyer') || lower.includes('incorporate') || lower.includes('llc') || lower.includes('compliance')) {
      return `Legal stuff is boring but crucial! Here's what you need to know:

**Entity formation:**
- Most VCs prefer Delaware C-Corps (even if you're in Illinois)
- Use Stripe Atlas ($500) or Clerky ($999) to incorporate
- Don't use LegalZoom - not founder-friendly

**Key legal docs:**
- Founders Agreement (vesting, equity splits)
- Employee contracts (with IP assignment)
- Customer contracts/Terms of Service
- Privacy Policy (required if you collect data)

**Chicago startup lawyers:**
- Neal Gerber Eisenberg
- Taft Stettinius & Hollister
- Foley & Lardner
- Many offer startup packages ($3-5K)

**Free resources:**
- **/Resources** has contract templates
- 1871 sometimes offers free legal clinics
- Check **/Events** for legal workshops

**Pro tip:** Don't skimp on legal for co-founder agreements. 50% of startups fail due to co-founder conflicts!

What specific legal question do you have?`;
    }

    // PRODUCT DEVELOPMENT
    if (lower.includes('product') || lower.includes('develop') || lower.includes('build') || lower.includes('mvp') || lower.includes('tech')) {
      return `Building product in Chicago? Great resources here!

**Where to build:**
- **1871** - Tech startups, great dev community
- **mHUB** - Hardware/physical products (prototyping equipment!)
- **MATTER** - Healthtech with regulatory expertise

**Finding tech talent:**
- Northwestern CS grads
- Coding bootcamps (Flatiron, General Assembly)
- Freelancers on Built In Chicago

**Development approach:**
- Start with no-code if possible (Webflow, Bubble, Airtable)
- Build the simplest thing that tests your assumption
- Get it in front of users in 2 weeks max
- Iterate based on feedback, not your gut

**Resources:**
- **/Resources** for product playbooks
- **/Community** to find technical co-founders or contractors
- **/Events** for product-focused workshops

Are you technical or looking to hire developers?`;
    }

    // MARKETING/GROWTH
    if (lower.includes('market') || lower.includes('customer') || lower.includes('growth') || lower.includes('user') || lower.includes('acquisition')) {
      const context = getPersonalizedContext();

      return `${context}here's how to think about growth:

**Early traction (0-100 users):**
- Do things that don't scale - personal outreach!
- Find where your customers hang out online
- Leverage Chicago communities for early adopters
- Ask for intros and referrals

**Finding customers:**
- **/Community** groups are full of potential early adopters
- **/Events** at innovation hubs to demo and get feedback
- LinkedIn outreach to Chicago market
- Partner with other Chicago startups for co-marketing

**Growth channels to test:**
- Content marketing (blog, LinkedIn posts)
- Paid ads (start with $500-1000 test budget)
- SEO (takes 6+ months but compounds)
- Partnerships & integrations

**Chicago advantage:** Tight-knit community means word-of-mouth spreads fast!

Check **/Stories** to see growth tactics that worked for Chicago startups.

What's your current user count and biggest growth challenge?`;
    }

    // FALLBACK - Still personalized based on interests
    let fallbackMessage = `I can help you navigate Chicago's startup ecosystem!`;

    if (interests.length > 0) {
      fallbackMessage += `\n\n**Based on your interests in ${interests.slice(0, 2).join(' and ')}, you might want to explore:**\n`;

      if (interests.includes('Capital/Funding')) {
        fallbackMessage += '- **/Funding** - 90+ Chicago investors\n';
      }
      if (interests.includes('Co-Working Spaces')) {
        fallbackMessage += '- **/Workspaces** - 18+ coworking spaces\n';
      }
      if (interests.includes('Networking Events')) {
        fallbackMessage += '- **/Events** - Innovation hub calendars\n';
      }
      if (interests.includes('Accelerators/Incubators')) {
        fallbackMessage += '- **/AcceleratorsIncubators** - Top Chicago programs\n';
      }
    } else {
      fallbackMessage += `\n\n**Popular resources:**
- **/Funding** - 90+ investors
- **/Workspaces** - 18+ coworking spaces
- **/Events** - Innovation hub calendars
- **/Community** - 22+ founder groups
- **/Stories** - Success stories from Chicago startups\n`;
    }

    fallbackMessage += `\nI can help with questions about:\n- Funding & investors\n- Workspaces & office space\n- Events & networking\n- Accelerators & programs\n- Building your team\n- Legal & incorporation\n- Product development\n- Marketing & growth\n\nWhat would you like to know?`;

    return fallbackMessage;
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full shadow-lg shadow-blue-500/25 flex items-center justify-center text-white hover:shadow-blue-500/40 transition-shadow"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ height: 'min(500px, calc(100vh - 100px))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Chi Startup Assistant</h3>
                  <p className="text-xs text-white/50">Here to help you navigate</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white/5 text-white/90 rounded-bl-sm border border-white/5'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 rounded-2xl rounded-bl-sm px-4 py-3 border border-white/5">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span className="text-sm text-white/50">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about funding, spaces, events..."
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-10 text-sm"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
