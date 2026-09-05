import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ExternalLink } from "lucide-react";
import { LazyMotion, AnimatePresence } from "framer-motion";

const loadFeatures = () => import("framer-motion").then((mod) => mod.domAnimation);
import LoadingScreen from "@/components/LoadingScreen";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import LoginModal from "@/components/auth/LoginModal";
import SignupModal from "@/components/auth/SignupModal";
import WelcomeModal from "@/components/auth/WelcomeModal";
import VerificationBanner from "@/components/VerificationBanner";

export default function Layout({ children }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  const hideLayoutFooter = isHomePage || location.pathname === '/funding' || location.pathname === '/about' || location.pathname === '/community' || location.pathname === '/workspaces' || location.pathname === '/events' || location.pathname === '/resources' || location.pathname === '/before-you-start' || location.pathname === '/service-resources' || location.pathname === '/small-business-resources' || location.pathname === '/business-type-explorer' || location.pathname === '/stories' || location.pathname.startsWith('/stories/') || location.pathname === '/WhyChicago' || location.pathname === '/SubmitResource' || location.pathname === '/assessment' || location.pathname === '/profile' || location.pathname === '/saved-resources' || location.pathname === '/settings' || location.pathname === '/accelerators-incubators' || location.pathname === '/contact' || location.pathname === '/admin' || location.pathname === '/Investors' || location.pathname === '/Pricing';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Skip loading screen if page was pre-rendered (SSG) or already shown
  const isPrerendered = typeof document !== 'undefined' && document.getElementById('root')?.hasAttribute('data-prerendered');
  const [isLoading, setIsLoading] = useState(!window.hasShownLoader && !isPrerendered);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUserData, setWelcomeUserData] = useState({ name: '', role: '' });
  const {
    user,
    signOut,
    showSignupModal: showSignup,
    setShowSignupModal: setShowSignup,
    showLoginModal: showLogin,
    setShowLoginModal: setShowLogin,
  } = useAuth();

  const handleLoadComplete = () => {
    setIsLoading(false);
    window.hasShownLoader = true;
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const footerSections = [
    {
      title: "Startup Resources",
      links: [
        { name: "Funding", url: createPageUrl("Funding") },
        { name: "Startup Toolkit", url: createPageUrl("Resources") },
        { name: "Community", url: createPageUrl("Community") },
        { name: "Co-Working", url: createPageUrl("Workspaces") },
        { name: "Hubs & Events", url: createPageUrl("Events") }
      ]
    },
    {
      title: "Connect",
      links: [
        { name: "World Business Chicago", url: "https://worldbusinesschicago.com", external: true },
        { name: "Illinois Business Portal", url: "https://www.illinois.gov/business.html", external: true },
        { name: "Chicago BACP", url: "https://www.chicago.gov/city/en/depts/bacp.html", external: true },
        { name: "SBA Chicago", url: "https://www.sba.gov/district/illinois", external: true },
        { name: "About Me", url: "https://www.linkedin.com/in/billyndizeye/", external: true }
      ]
    }
  ];

  return (
    <LazyMotion features={loadFeatures}>
    <div className="min-h-screen relative">
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen onComplete={handleLoadComplete} />}
      </AnimatePresence>

      {/* Simplified Background - uses local chicago-skyline.jpg to avoid third-party DNS lookup */}
      <div className="layout-bg fixed inset-0 z-[-2]" />

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header
          user={user}
          onSignInClick={() => setShowLogin(true)}
          onSignUpClick={() => setShowSignup(true)}
          onGetStartedClick={() => window.location.href = '/before-you-start'}
          onSignOut={signOut}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
        {/* Verification Banner for founders under review */}
        <VerificationBanner />
      </div>

      {/* Main Content with ScrollSmoother */}
      <SmoothScrollProvider>
        <main id="main-content" role="main" aria-label="Main content">
          {children}
        </main>

        {/* Global Footer - Hidden on pages with BureauFooter */}
      {!hideLayoutFooter && (
      <footer className="bg-[#111111] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 mb-16">
            <div className="sm:col-span-2 md:col-span-2">
              <Link to={createPageUrl("Home")} className="flex items-center gap-3 mb-6 group">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg">
                  <span className="text-white font-bold text-xl">CS</span>
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">ChiStartup Hub</span>
              </Link>
              <p className="text-white/60 text-base leading-relaxed mb-4 max-w-md">
                The Operating System for Chicago Founders. Build faster with unified access to capital, community, and clarity.
              </p>
            </div>

            {footerSections.map((section, index) => (
              <div key={index}>
                <h4 className="text-white font-semibold text-base mb-5">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      {link.external ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/60 hover:text-white transition-colors flex items-center gap-2 group text-sm"
                        >
                          {link.name}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <Link
                          to={link.url}
                          className="text-white/60 hover:text-white transition-colors flex items-center gap-2 group text-sm"
                        >
                          {link.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm">© 2025 ChiStartup Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
      )}

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
      />
      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSwitchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
        onSignupComplete={(userData) => {
          setShowSignup(false);  // Close signup modal first
          setWelcomeUserData(userData);
          setShowWelcome(true);
        }}
      />
      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        userName={welcomeUserData.name}
        userRole={welcomeUserData.role}
      />

      {/* AI Assistant - disabled for now, roadmap feature */}
      {/* <AIAssistant /> */}
      </SmoothScrollProvider>
    </div>
    </LazyMotion>
  );
}