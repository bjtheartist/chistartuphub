import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb, Handshake, Store, Code, HelpCircle, ArrowRight, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { motion } from "framer-motion";

export default function BusinessTypeExplorer() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [showCompass, setShowCompass] = useState(false);
  const [showAcknowledgment, setShowAcknowledgment] = useState(null); // 'service' or 'small-business'
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [compassAnswers, setCompassAnswers] = useState({});

  const businessTypes = [
    {
      id: "idea",
      emoji: "💡",
      icon: Lightbulb,
      title: "I have an idea",
      description: "Early stage, exploring a concept",
      color: "yellow"
    },
    {
      id: "service",
      emoji: "🤝",
      icon: Handshake,
      title: "I run a service business",
      description: "Consulting, agency, professional services",
      color: "blue"
    },
    {
      id: "small-biz",
      emoji: "🏪",
      icon: Store,
      title: "I own a small business",
      subtext: "(restaurant, retail, local services)",
      description: "Physical location or local market",
      color: "green"
    },
    {
      id: "tech",
      emoji: "💻",
      icon: Code,
      title: "I'm building a tech product",
      description: "Software, app, or digital platform",
      color: "purple"
    },
    {
      id: "unsure",
      emoji: "🤔",
      icon: HelpCircle,
      title: "I don't know what I'm building yet",
      description: "Need help figuring it out",
      color: "gray"
    }
  ];

  const colorClasses = {
    yellow: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      hover: "hover:border-yellow-500/40",
      text: "text-yellow-400"
    },
    blue: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      hover: "hover:border-blue-500/40",
      text: "text-blue-400"
    },
    green: {
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      hover: "hover:border-green-500/40",
      text: "text-green-400"
    },
    purple: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      hover: "hover:border-purple-500/40",
      text: "text-purple-400"
    },
    gray: {
      bg: "bg-white/5",
      border: "border-white/10",
      hover: "hover:border-white/20",
      text: "text-white/60"
    }
  };

  // 3-Question Compass
  const compassQuestions = [
    {
      id: 'revenue',
      question: 'What creates the money?',
      description: 'When you get paid, it\'s usually because...',
      answers: [
        { id: 'a', label: 'We delivered work for a specific client/customer (time-for-money)', value: 'time' },
        { id: 'b', label: 'People buy a product that\'s mostly the same each time (product-for-money)', value: 'product' },
        { id: 'c', label: 'Not sure yet', value: 'unsure' }
      ]
    },
    {
      id: 'location',
      question: 'Does your business model depend on physical locations?',
      description: 'Does the business depend on a physical location to deliver the core value?',
      answers: [
        { id: 'a', label: 'Yes (customers come to us / we operate in a local service area)', value: 'yes' },
        { id: 'b', label: 'No (we can sell/deliver beyond one place)', value: 'no' },
        { id: 'c', label: 'I honestly don\'t know yet', value: 'unsure' }
      ]
    },
    {
      id: 'growth',
      question: 'To serve 10x more customers tomorrow, you would need to:',
      description: 'If you had 10× more customers next month, what must increase first?',
      answers: [
        { id: 'a', label: 'Hire significantly more people to do the work', value: 'people' },
        { id: 'b', label: 'Open more physical locations', value: 'physical' },
        { id: 'c', label: 'Scale production/distribution of your product', value: 'scalable' },
        { id: 'd', label: 'I honestly don\'t know yet', value: 'unsure' }
      ]
    }
  ];

  const getCompassResult = () => {
    const { revenue, location, growth } = compassAnswers;

    // Small Business: location-bound OR requires physical capacity
    if (location === 'yes' || growth === 'physical') {
      return {
        type: 'small-business',
        title: 'Small Business',
        description: 'Success is tied to a local market and/or physical operations.',
        resources: [
          { name: 'City of Chicago BACP Small Business Center', url: 'https://www.chicago.gov/city/en/sites/chicago-business-licensing/home.html' },
          { name: 'Chicago Business Centers (CBC) Program', url: 'https://www.chicago.gov/city/en/depts/bacp/supp_info/chicagobusinesscenters.html' },
          { name: 'Illinois SBDC Network', url: 'https://dceo.illinois.gov/smallbizassistance/beginhere/sbdc.html' },
          { name: 'Women\'s Business Development Center', url: 'https://www.wbdc.org/en/' }
        ]
      };
    }

    // Service Business: time-for-money OR requires people-hours
    if (revenue === 'time' || growth === 'people') {
      return {
        type: 'service-business',
        title: 'Service Business',
        description: 'Revenue is tied to your time or your team\'s time.',
        resources: [
          { name: 'SCORE Chicago (Free Mentoring)', url: 'https://www.score.org/chicago' },
          { name: 'Illinois SBDC at Polsky Exchange (UChicago)', url: 'https://polsky.uchicago.edu/polsky-exchange/small-business-development-center/' },
          { name: 'Women\'s Business Development Center', url: 'https://www.wbdc.org/en/' },
          { name: 'Illinois SBDC at Chicagoland Chamber', url: 'https://www.chicagolandchamber.org/sbdc/' }
        ]
      };
    }

    // Startup: product-for-money OR requires scalable throughput
    if (revenue === 'product' || growth === 'scalable') {
      return {
        type: 'startup',
        title: 'Startup (Scalable Product)',
        description: 'Growth isn\'t tied 1:1 to hours worked. You\'re building a scalable system.',
        resources: [
          { name: 'Startup Resources', url: '/Resources' },
          { name: 'Founder Guides', url: '/Resources#guides' }
        ]
      };
    }

    // Default: still unsure
    return {
      type: 'unsure',
      title: 'Need More Context?',
      description: 'Read these quick primers to clarify your path:',
      resources: [
        { name: 'Kauffman Foundation: Tale of Two Entrepreneurs', url: 'https://www.kauffman.org/reports/a-tale-of-two-entrepreneurs-understanding-differences-in-the-types-of-entrepreneurship-in-the-economy/' },
        { name: 'Michigan SBDC: Are You Ready to Start?', url: 'https://michigansbdc.org/starting-a-business/are-you-ready-to-start-a-small-business/' }
      ]
    };
  };

  const handleSelection = (type) => {
    setSelectedType(type);

    // If "unsure" or "idea", show compass instead of navigating
    if (type === 'unsure' || type === 'idea') {
      setShowCompass(true);
      setCurrentQuestion(0);
      setCompassAnswers({});
    } else if (type === 'service') {
      // Show acknowledgment page instead of direct navigation
      setShowAcknowledgment('service');
    } else if (type === 'small-biz') {
      // Show acknowledgment page instead of direct navigation
      setShowAcknowledgment('small-business');
    } else if (type === 'tech') {
      // Direct navigation for tech/startup
      navigate('/Resources');
    }
  };

  const handleBackToSelection = () => {
    setShowAcknowledgment(null);
    setSelectedType(null);
  };

  const handleCompassAnswer = (questionId, answerValue) => {
    setCompassAnswers(prev => ({
      ...prev,
      [questionId]: answerValue
    }));

    // Move to next question if not last
    if (currentQuestion < compassQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleCompassComplete = () => {
    // Show results (we'll display them instead of navigate)
    setShowCompass('results');
  };

  const handleCompassBackToTypes = () => {
    setShowCompass(false);
    setSelectedType(null);
    setCurrentQuestion(0);
    setCompassAnswers({});
  };

  // Show compass questions
  if (showCompass === true) {
    const question = compassQuestions[currentQuestion];
    const isLastQuestion = currentQuestion === compassQuestions.length - 1;

    return (
      <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
        <SEO title="3-Question Compass" description="Answer 3 quick questions to find your path" />
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Progress */}
            <div className="mb-8">
              <div className="flex gap-2 mb-2">
                {compassQuestions.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      idx <= currentQuestion ? 'bg-blue-500' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
              <p className="text-white/60 text-sm">
                Question {currentQuestion + 1} of {compassQuestions.length}
              </p>
            </div>

            {/* Question */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">{question.question}</h2>
              <p className="text-white/60">{question.description}</p>
            </div>

            {/* Answer Options */}
            <div className="space-y-3 mb-8">
              {question.answers.map((answer) => (
                <motion.button
                  key={answer.id}
                  onClick={() => {
                    handleCompassAnswer(question.id, answer.value);
                    if (isLastQuestion) {
                      setTimeout(() => handleCompassComplete(), 300);
                    }
                  }}
                  whileHover={{ x: 4 }}
                  className="w-full text-left bg-white/[0.05] border border-white/[0.08] hover:border-blue-500/40 rounded-lg p-4 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 group-hover:border-blue-400 flex-shrink-0 mt-0.5 flex items-center justify-center">
                      {compassAnswers[question.id] === answer.value && (
                        <div className="w-2.5 h-2.5 bg-blue-400 rounded-full" />
                      )}
                    </div>
                    <p className="text-white group-hover:text-white/90 transition-colors">
                      {answer.label}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
              <Button
                onClick={handleCompassBackToTypes}
                variant="ghost"
                className="text-white/60 hover:text-white/90"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              {isLastQuestion && compassAnswers[question.id] && (
                <Button
                  onClick={() => handleCompassComplete()}
                  className="ml-auto bg-blue-600 hover:bg-blue-700"
                >
                  See Your Path
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show compass results
  if (showCompass === 'results') {
    const result = getCompassResult();

    return (
      <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
        <SEO title="Your Path" description="Here's where you should focus" />
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Result Header */}
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {result.title}
              </h2>
              <p className="text-xl text-white/70 mb-6">
                {result.description}
              </p>
            </div>

            {/* Resources */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-8 mb-8">
              <h3 className="text-xl font-semibold text-white mb-6">
                Next Steps & Resources
              </h3>
              <div className="space-y-3">
                {result.resources.map((resource, idx) => (
                  <motion.a
                    key={idx}
                    href={resource.url}
                    target={resource.url.startsWith('/') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="block bg-white/[0.02] border border-white/[0.08] hover:border-blue-500/40 rounded-lg p-4 group transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium group-hover:text-blue-300 transition-colors">
                        {resource.name}
                      </span>
                      {resource.url.startsWith('http') && (
                        <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-blue-400 flex-shrink-0" />
                      )}
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleCompassBackToTypes}
                variant="ghost"
                className="text-white/60 hover:text-white/90"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Start Over
              </Button>
              <Button
                onClick={() => navigate('/Resources')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Go to Resources
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show Service Business Acknowledgment
  if (showAcknowledgment === 'service') {
    return (
      <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
        <SEO title="Service Business Resources" description="Resources for service-based businesses" />
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Result Header */}
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Service businesses operate differently from product startups.
              </h2>
              <p className="text-xl text-white/70 mb-6">
                Most resources here focus on:
              </p>
            </div>

            {/* Key Points */}
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 text-white/70">
                <span className="text-blue-400 font-semibold">•</span>
                <p>Building products that scale without your time</p>
              </div>
              <div className="flex items-start gap-3 text-white/70">
                <span className="text-blue-400 font-semibold">•</span>
                <p>Growth models that aren't tied to headcount</p>
              </div>
              <div className="flex items-start gap-3 text-white/70">
                <span className="text-blue-400 font-semibold">•</span>
                <p>Funding structures designed for product businesses</p>
              </div>
            </div>

            <p className="text-white/60 text-center mb-8">
              These may not apply to your business model.
            </p>

            {/* CTA Buttons */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 text-center">
                What do you want to do?
              </h3>
              <div className="space-y-3">
                <Button onClick={() => navigate('/Resources')} className="w-full bg-blue-600 hover:bg-blue-700">
                  Explore resources anyway (they might still spark ideas)
                </Button>
                <Button onClick={handleBackToSelection} variant="outline" className="w-full text-white border-white/20 hover:border-white/40">
                  I actually might be building a product
                </Button>
              </div>
            </div>

            {/* External Resources */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                For service-specific resources, check out:
              </h3>
              <div className="space-y-2">
                <a href="https://dceo.illinois.gov/smallbizassistance/beginhere/sbdc.html" target="_blank" rel="noopener noreferrer" className="block text-blue-300 hover:text-blue-200 transition-colors">
                  → SBDC Chicago (free consulting + workshops)
                </a>
                <a href="https://www.score.org/chicago" target="_blank" rel="noopener noreferrer" className="block text-blue-300 hover:text-blue-200 transition-colors">
                  → SCORE Chicago (mentorship for small businesses)
                </a>
                <a href="https://www.chicago.gov/city/en/depts/bacp/supp_info/chicagobusinesscenters.html" target="_blank" rel="noopener noreferrer" className="block text-blue-300 hover:text-blue-200 transition-colors">
                  → Chicago Small Business Centers
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show Small Business Acknowledgment
  if (showAcknowledgment === 'small-business') {
    return (
      <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
        <SEO title="Small Business Resources" description="Resources for small businesses" />
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Result Header */}
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Small businesses and product startups have different growth models.
              </h2>
              <p className="text-xl text-white/70 mb-6">
                ChiStartupHub focuses on businesses designed to scale nationally/globally without being tied to physical locations.
              </p>
            </div>

            {/* Key Points */}
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 text-white/70">
                <span className="text-green-400 font-semibold">•</span>
                <p>Building products that scale without your time</p>
              </div>
              <div className="flex items-start gap-3 text-white/70">
                <span className="text-green-400 font-semibold">•</span>
                <p>Growth models that aren't tied to headcount</p>
              </div>
              <div className="flex items-start gap-3 text-white/70">
                <span className="text-green-400 font-semibold">•</span>
                <p>Funding structures designed for product businesses</p>
              </div>
            </div>

            <p className="text-white/60 text-center mb-8">
              These may not apply to your business model.
            </p>

            {/* CTA Buttons */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 text-center">
                What do you want to do?
              </h3>
              <div className="space-y-3">
                <Button onClick={() => navigate('/Resources')} className="w-full bg-blue-600 hover:bg-blue-700">
                  Explore resources anyway (they might still spark ideas)
                </Button>
                <Button onClick={handleBackToSelection} variant="outline" className="w-full text-white border-white/20 hover:border-white/40">
                  I'm actually building a scalable product
                </Button>
              </div>
            </div>

            {/* External Resources */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                For small business-specific resources, check out:
              </h3>
              <div className="space-y-2">
                <a href="https://dceo.illinois.gov/smallbizassistance/beginhere/sbdc.html" target="_blank" rel="noopener noreferrer" className="block text-blue-300 hover:text-blue-200 transition-colors">
                  → SBDC Chicago (free consulting + workshops)
                </a>
                <a href="https://www.chicago.gov/city/en/depts/bacp/supp_info/chicagobusinesscenters.html" target="_blank" rel="noopener noreferrer" className="block text-blue-300 hover:text-blue-200 transition-colors">
                  → Chicago Small Business Centers
                </a>
                <a href="https://www.sba.gov/funding-programs/loans" target="_blank" rel="noopener noreferrer" className="block text-blue-300 hover:text-blue-200 transition-colors">
                  → SBA Loan Programs
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Default view: Business Type Selection
  return (
    <div className="min-h-screen py-12 md:py-20 px-4 md:px-6">
      <SEO
        title="What Are You Building?"
        description="Figure out what type of business you're building and get the right resources for your situation."
        keywords="business type, startup vs small business, service business, Chicago founders"
      />

      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              What Are You Building?
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              First question: What type of business are you building?
            </p>
          </div>

          {/* Quick Definitions Section */}
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">
              Quick Definitions
            </h3>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {/* Startup Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
              >
                <div className="text-3xl mb-3">🚀</div>
                <h4 className="text-white font-semibold mb-2 text-sm uppercase tracking-wide">Startup</h4>
                <p className="text-white/60 text-sm leading-relaxed">
                  Product that scales without your time (software, hardware, biotech, CPG/DTC, AI)
                </p>
              </motion.div>

              {/* Service Business Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4"
              >
                <div className="text-3xl mb-3">🤝</div>
                <h4 className="text-white font-semibold mb-2 text-sm uppercase tracking-wide">Service Business</h4>
                <p className="text-white/60 text-sm leading-relaxed">
                  Revenue tied to your time (agencies, consulting)
                </p>
              </motion.div>

              {/* Small Business Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-green-500/10 border border-green-500/20 rounded-lg p-4"
              >
                <div className="text-3xl mb-3">🏪</div>
                <h4 className="text-white font-semibold mb-2 text-sm uppercase tracking-wide">Small Business</h4>
                <p className="text-white/60 text-sm leading-relaxed">
                  Physical locations or local market (restaurants, retail, gyms)
                </p>
              </motion.div>
            </div>

            {/* ChiStartupHub Focus Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-center"
            >
              <p className="text-white/60 text-sm leading-relaxed">
                ChiStartupHub focuses on scalable product businesses. Service and small businesses operate differently—these resources may not apply to your model, but you're welcome to explore.
              </p>
            </motion.div>
          </div>

          {/* Business Type Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {businessTypes.map((type, index) => {
              const colors = colorClasses[type.color];
              const Icon = type.icon;

              return (
                <motion.button
                  key={type.id}
                  onClick={() => handleSelection(type.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`${colors.bg} border ${colors.border} ${colors.hover} rounded-xl p-6 transition-all text-left group relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10 flex items-start gap-4">
                    {/* Icon */}
                    <div className={`${colors.text} flex-shrink-0`}>
                      <Icon className="w-8 h-8" strokeWidth={1.5} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {type.title}
                      </h3>
                      {type.subtext && (
                        <p className="text-sm text-white/40 mb-1">
                          {type.subtext}
                        </p>
                      )}
                      <p className="text-sm text-white/60">
                        {type.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Helper Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center"
          >
            <p className="text-white/70 text-sm leading-relaxed">
              This will help us show you the right resources for <strong className="text-white">YOUR</strong> situation.
              <br />
              Different business models require different approaches—not better or worse, just different.
            </p>
          </motion.div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Button
              onClick={() => navigate('/navigate-toolkit')}
              variant="ghost"
              className="text-white/60 hover:text-white/90"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Navigation
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
