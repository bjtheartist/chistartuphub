import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useNotifications } from "@/hooks/useNotifications";
import {
  ChevronDown,
  Plus,
  User,
  Bookmark,
  Settings,
  LogOut,
  Shield,
  Bell
} from "lucide-react";
import { ADMIN_EMAILS } from '@/constants/adminEmails';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/**
 * Header - The Bureau Navigation
 * Version 2.0 - Premium refinements
 * Systematic Modernism | Precision over Decoration
 */
export default function Header({
  user,
  onSignInClick,
  onSignUpClick,
  onGetStartedClick,
  onSignOut,
  mobileMenuOpen,
  setMobileMenuOpen
}) {
  const location = useLocation();
  const isLoggedIn = Boolean(user);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const userMenuRef = useRef(null);

  // Notification count for badge
  const { total: notificationCount } = useNotifications();

  // Scroll listener for header background (RAF throttled for performance)
  useEffect(() => {
    let rafId = null;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 20);
        rafId = null;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Click outside listener to close user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Get user display info
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'user@example.com';
  const userInitial = userName.charAt(0).toUpperCase();

  const navDropdowns = [
    {
      name: "Resources",
      items: [
        { name: "Funding", path: createPageUrl("Funding") },
        { name: "Investors", path: createPageUrl("Investors") },
        { name: "Co-Working", path: createPageUrl("Workspaces") },
        { name: "Startup Toolkit", path: createPageUrl("Resources") },
        { name: "Pricing", path: createPageUrl("Pricing") }
      ]
    },
    {
      name: "Ecosystem",
      items: [
        { name: "Hubs & Events", path: createPageUrl("Events") },
        { name: "Community", path: createPageUrl("Community") },
        { name: "Why Chicago", path: createPageUrl("WhyChicago") }
      ]
    }
  ];

  return (
    <header 
      role="banner"
      aria-label="Main navigation"
      className={`
        fixed top-0 left-0 right-0 z-50
        transition-all duration-300
        ${isScrolled 
          ? 'bg-[#050A14]/95 backdrop-blur-md border-b border-white/[0.08]' 
          : 'bg-transparent border-b border-transparent'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between">
          {/* Logo - Left */}
          <Link to={createPageUrl("Home")} className="flex items-center gap-4 group flex-shrink-0" aria-label="CS ChiStartup Hub homepage">
            <div className="w-11 h-11 border border-white/20 bg-transparent flex items-center justify-center group-hover:bg-white group-hover:border-white transition-none cursor-crosshair">
              <span className="text-white font-bold text-base uppercase group-hover:text-black font-mono">CS</span>
            </div>
            <span className="text-sm font-mono font-medium text-white/80 uppercase tracking-[0.15em] hidden sm:block group-hover:text-white transition-colors">
              ChiStartup Hub
            </span>
          </Link>

          {/* Navigation - Center */}
          <nav className="hidden md:flex items-center gap-10" aria-label="Primary navigation">
            {navDropdowns.map((dropdown) => (
              <DropdownMenu key={dropdown.name}>
                <DropdownMenuTrigger className="flex items-center gap-2 text-white/50 hover:text-white transition-none text-[11px] font-mono font-medium uppercase tracking-[0.15em] outline-none cursor-crosshair">
                  <span>{dropdown.name}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-[#0A1220] border border-white/[0.12] min-w-[200px] p-2"
                  sideOffset={12}
                  align="start"
                >
                  {dropdown.items.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={`
                          cursor-crosshair px-4 py-3 text-[11px] font-mono uppercase tracking-[0.1em] transition-none
                          ${location.pathname === item.path
                            ? 'text-white bg-white/[0.08]'
                            : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                          }
                        `}
                      >
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {dropdown.name === "Resources" && (
                    <>
                      <DropdownMenuSeparator className="bg-white/[0.08] my-2" />
                      <DropdownMenuItem asChild>
                        <Link
                          to={createPageUrl("SubmitResource")}
                          className="cursor-crosshair px-4 py-3 text-[10px] font-mono uppercase tracking-[0.1em] text-white/30 hover:text-white hover:bg-white/[0.05] flex items-center gap-2 transition-none"
                        >
                          <Plus className="w-3 h-3" />
                          Submit Resource
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}

            <Link
              to={createPageUrl("Stories")}
              className={`
                text-[11px] font-mono font-medium uppercase tracking-[0.15em] transition-none cursor-crosshair
                ${location.pathname === createPageUrl("Stories")
                  ? 'text-white'
                  : 'text-white/50 hover:text-white'
                }
              `}
            >
              Blueprints
            </Link>

            <Link
              to={createPageUrl("About")}
              className={`
                text-[11px] font-mono font-medium uppercase tracking-[0.15em] transition-none cursor-crosshair
                ${location.pathname === createPageUrl("About")
                  ? 'text-white'
                  : 'text-white/50 hover:text-white'
                }
              `}
            >
              About
            </Link>
          </nav>

          {/* Action Area - Right */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                {/* Logged In: Show Create Ask + Avatar */}
                <Link to={createPageUrl("Opportunities")}>
                  <button className="bureau-btn bureau-btn-primary text-[10px] px-5 py-2.5 flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5" />
                    <span>CREATE ASK</span>
                  </button>
                </Link>

                {/* User Avatar with Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="relative w-11 h-11 border border-white/20 bg-transparent flex items-center justify-center cursor-crosshair hover:bg-white hover:border-white transition-none group"
                    aria-label={notificationCount > 0 ? `User menu - ${notificationCount} notifications` : "User menu"}
                  >
                    <span className="text-white text-xs font-mono font-medium uppercase group-hover:text-black">
                      {userInitial}
                    </span>
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center px-1">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-3 w-64 bg-[#0A1220] border border-white/[0.12] shadow-xl z-50 overflow-hidden">
                      {/* Section 1: User Info */}
                      <div className="px-5 py-4 border-b border-white/[0.08]">
                        <p className="text-white font-mono text-sm truncate">{userName}</p>
                        <p className="text-[10px] font-mono text-white/40 truncate mt-1 uppercase tracking-wider">{userEmail}</p>
                      </div>

                      {/* Section 2: Navigation */}
                      <div className="py-2">
                        <Link
                          to={createPageUrl("Profile")}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 text-white/50 hover:bg-white hover:text-black transition-none cursor-crosshair"
                        >
                          <User className="w-4 h-4" />
                          <span className="font-mono text-[11px] uppercase tracking-wider">Your Profile</span>
                        </Link>
                        <Link
                          to="/profile?tab=requests"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center justify-between px-5 py-3 text-white/50 hover:bg-white hover:text-black transition-none cursor-crosshair"
                        >
                          <div className="flex items-center gap-3">
                            <Bell className="w-4 h-4" />
                            <span className="font-mono text-[11px] uppercase tracking-wider">Requests</span>
                          </div>
                          {notificationCount > 0 && (
                            <span className="min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center px-1.5">
                              {notificationCount > 9 ? '9+' : notificationCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          to="/saved"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 text-white/50 hover:bg-white hover:text-black transition-none cursor-crosshair"
                        >
                          <Bookmark className="w-4 h-4" />
                          <span className="font-mono text-[11px] uppercase tracking-wider">Saved Resources</span>
                        </Link>
                        <Link
                          to={createPageUrl("Settings")}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 text-white/50 hover:bg-white hover:text-black transition-none cursor-crosshair"
                        >
                          <Settings className="w-4 h-4" />
                          <span className="font-mono text-[11px] uppercase tracking-wider">Settings</span>
                        </Link>
                        {ADMIN_EMAILS.includes(user?.email) && (
                          <Link
                            to="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-amber-400/70 hover:bg-amber-500/10 hover:text-amber-400 transition-none cursor-crosshair"
                          >
                            <Shield className="w-4 h-4" />
                            <span className="font-mono text-[11px] uppercase tracking-wider">Admin Dashboard</span>
                          </Link>
                        )}
                      </div>

                      {/* Section 3: Sign Out */}
                      <div className="border-t border-white/[0.08] py-2">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onSignOut?.();
                          }}
                          className="flex items-center gap-3 w-full px-5 py-3 text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-none cursor-crosshair"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="font-mono text-[11px] uppercase tracking-wider">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Logged Out: Show Sign In + Get Started */}
                <button
                  onClick={onSignUpClick}
                  className="text-white/50 hover:text-white text-[11px] font-mono font-medium uppercase tracking-[0.15em] transition-none cursor-crosshair px-3 py-2 hidden sm:block"
                >
                  Sign Up
                </button>
                <button
                  onClick={onGetStartedClick}
                  className="bureau-btn bureau-btn-primary text-[10px] px-5 py-2.5"
                >
                  GET STARTED
                </button>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden relative w-11 h-11 flex items-center justify-center border border-white/20 hover:bg-white hover:border-white transition-none cursor-crosshair group"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="w-4 h-3 flex flex-col justify-between">
                <span
                  className={`w-full h-px bg-white group-hover:bg-black transition-all duration-300 ${
                    mobileMenuOpen ? 'rotate-45 translate-y-[5px]' : ''
                  }`}
                />
                <span
                  className={`w-full h-px bg-white group-hover:bg-black transition-all duration-300 ${
                    mobileMenuOpen ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`w-full h-px bg-white group-hover:bg-black transition-all duration-300 ${
                    mobileMenuOpen ? '-rotate-45 -translate-y-[5px]' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Full Screen Overlay */}
        {mobileMenuOpen && (
          <>
            {/* Dimmed backdrop */}
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Mobile menu content */}
            <div className="fixed inset-x-0 top-[73px] bottom-0 bg-[#050A14] z-50 md:hidden overflow-y-auto">
              <div className="px-6 py-6 space-y-4">
              {navDropdowns.map((dropdown) => (
                <div key={dropdown.name}>
                  <div className="px-3 py-2 text-white/30 text-[11px] font-mono font-semibold uppercase tracking-[0.2em]">
                    [{dropdown.name}]
                  </div>
                  {dropdown.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        block px-3 py-4 font-mono text-base uppercase tracking-wider transition-none border-b border-white/5
                        ${location.pathname === item.path
                          ? 'text-white bg-white/5'
                          : 'text-white/60 hover:text-white active:bg-white/10'
                        }
                      `}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              ))}

              <div className="px-3 py-2 text-white/30 text-[11px] font-mono font-semibold uppercase tracking-[0.2em]">
                [More]
              </div>
              <Link
                to={createPageUrl("Stories")}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  block px-3 py-4 font-mono text-base uppercase tracking-wider transition-none border-b border-white/5
                  ${location.pathname === createPageUrl("Stories")
                    ? 'text-white bg-white/5'
                    : 'text-white/60 hover:text-white active:bg-white/10'
                  }
                `}
              >
                Blueprints
              </Link>
              <Link
                to={createPageUrl("About")}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  block px-3 py-4 font-mono text-base uppercase tracking-wider transition-none border-b border-white/5
                  ${location.pathname === createPageUrl("About")
                    ? 'text-white bg-white/5'
                    : 'text-white/60 hover:text-white active:bg-white/10'
                  }
                `}
              >
                About
              </Link>

              {/* Mobile Action Buttons */}
              <div className="pt-6 border-t border-white/[0.08] space-y-4">
                {isLoggedIn ? (
                  <>
                    {/* Mobile User Info */}
                    <div className="px-2 py-4 bg-white/[0.03] border border-white/[0.08]">
                      <div className="flex items-center gap-4">
                        <div className="relative w-11 h-11 border border-white/20 flex items-center justify-center">
                          <span className="text-white font-mono font-medium uppercase">{userInitial}</span>
                          {notificationCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center px-1">
                              {notificationCount > 9 ? '9+' : notificationCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-mono text-sm truncate">{userName}</p>
                          <p className="text-[10px] font-mono text-white/40 truncate uppercase tracking-wider">{userEmail}</p>
                        </div>
                      </div>
                    </div>

                    {/* Mobile User Navigation */}
                    <Link
                      to={createPageUrl("Profile")}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-4 px-3 py-4 text-white/60 hover:text-white active:bg-white/10 transition-none border-b border-white/5"
                    >
                      <User className="w-5 h-5" />
                      <span className="font-mono text-base uppercase tracking-wider">Your Profile</span>
                    </Link>
                    <Link
                      to="/profile?tab=requests"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-4 text-white/60 hover:text-white active:bg-white/10 transition-none border-b border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <Bell className="w-5 h-5" />
                        <span className="font-mono text-base uppercase tracking-wider">Requests</span>
                      </div>
                      {notificationCount > 0 && (
                        <span className="min-w-[22px] h-[22px] bg-red-500 text-white text-[11px] font-mono font-bold rounded-full flex items-center justify-center px-1.5">
                          {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/saved"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-4 px-3 py-4 text-white/60 hover:text-white active:bg-white/10 transition-none border-b border-white/5"
                    >
                      <Bookmark className="w-5 h-5" />
                      <span className="font-mono text-base uppercase tracking-wider">Saved Resources</span>
                    </Link>
                    <Link
                      to={createPageUrl("Settings")}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-4 px-3 py-4 text-white/60 hover:text-white active:bg-white/10 transition-none border-b border-white/5"
                    >
                      <Settings className="w-5 h-5" />
                      <span className="font-mono text-base uppercase tracking-wider">Settings</span>
                    </Link>
                    {ADMIN_EMAILS.includes(user?.email) && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-4 px-3 py-4 text-amber-400/70 hover:text-amber-400 active:bg-amber-400/10 transition-none border-b border-white/5"
                      >
                        <Shield className="w-5 h-5" />
                        <span className="font-mono text-base uppercase tracking-wider">Admin Dashboard</span>
                      </Link>
                    )}

                    <div className="pt-4 border-t border-white/[0.08] space-y-4">
                      <Link to={createPageUrl("Opportunities")} onClick={() => setMobileMenuOpen(false)} className="block">
                        <button className="bureau-btn bureau-btn-primary w-full flex items-center justify-center gap-2">
                          <Plus className="w-4 h-4" />
                          CREATE ASK
                        </button>
                      </Link>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onSignOut?.();
                        }}
                        className="flex items-center justify-center gap-2 w-full text-center text-white/30 hover:text-red-400 font-mono text-[11px] uppercase tracking-wider py-3 transition-none"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onGetStartedClick?.();
                      }}
                      className="bureau-btn bureau-btn-primary w-full"
                    >
                      GET STARTED
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onSignInClick?.();
                      }}
                      className="w-full text-center text-white/50 hover:text-white font-mono text-[11px] uppercase tracking-wider py-3 transition-none"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </header>
  );
}
