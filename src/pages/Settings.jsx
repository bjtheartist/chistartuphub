import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, Trash2, LogOut, Check, MessageSquare, HandHelping } from "lucide-react";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";
import SEO from "@/components/SEO";
import { supabase } from "@/api/supabaseClient";

const ROLES = [
  { value: 'founder', label: 'Founder', description: 'Building a startup' },
  { value: 'helper', label: 'Helper', description: 'Investor, mentor, service provider, or supporter' },
];

export default function Settings() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedRole, setSelectedRole] = useState("");
  
  // Settings state
  const [settings, setSettings] = useState({
    // Founder notifications - when someone offers to help
    help_offer_email: true,
    help_offer_inapp: true,
    // Helper notifications - when founder responds to your offer
    help_response_email: true,
    help_response_inapp: true,
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    // Load settings from profile
    if (profile) {
      setSettings({
        help_offer_email: profile.help_offer_email ?? true,
        help_offer_inapp: profile.help_offer_inapp ?? true,
        help_response_email: profile.help_response_email ?? true,
        help_response_inapp: profile.help_response_inapp ?? true,
      });
      setSelectedRole(profile.role || "");
    }
  }, [user, profile, navigate]);

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from("user_profiles")
        .update({
          role: selectedRole,
          help_offer_email: settings.help_offer_email,
          help_offer_inapp: settings.help_offer_inapp,
          help_response_email: settings.help_response_email,
          help_response_inapp: settings.help_response_inapp,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select();

      if (error) throw error;

      setMessage({ type: "success", text: `Settings saved! Role set to: ${selectedRole}` });
      if (refreshProfile) {
        await refreshProfile();
      }

      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    } catch (error) {
      setMessage({ type: "error", text: `Failed to save: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    if (!confirmed) return;

    // Note: Full account deletion requires backend support
    // For now, we'll just sign out and show a message
    setMessage({
      type: "info",
      text: "Please contact hello@chistartuphub.com to complete account deletion."
    });
  };

  if (!user) return null;

  const isFounder = selectedRole === 'founder';

  const settingsSections = [
    // Founder-specific: when someone offers to help
    ...(isFounder ? [{
      title: "When Someone Offers to Help",
      subtitle: "Get notified when community members want to help with your asks",
      icon: HandHelping,
      settings: [
        {
          key: "help_offer_email",
          label: "Email Notification",
          description: "Receive an email when someone offers to help",
        },
        {
          key: "help_offer_inapp",
          label: "In-App Notification",
          description: "See a notification in your Requests tab",
        },
      ],
    }] : []),
    // Helper notifications: when founder responds
    {
      title: "When Founders Respond",
      subtitle: "Get notified when a founder accepts or declines your help offer",
      icon: MessageSquare,
      settings: [
        {
          key: "help_response_email",
          label: "Email Notification",
          description: "Receive an email when a founder responds to your offer",
        },
        {
          key: "help_response_inapp",
          label: "In-App Notification",
          description: "See a notification when your offer is accepted or declined",
        },
      ],
    },
    ];

  return (
    <div className="min-h-screen relative" data-page="settings">
      <SEO
        title="Settings | ChiStartup Hub"
        description="Manage your ChiStartupHub account settings, notifications, and privacy preferences."
      />

      <BureauAtmosphere />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <span className="bureau-label block mb-6">[SYSTEM: SETTINGS]</span>
            </div>

            <h1
              className={`font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-6 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '200ms' }}
            >
              Account Settings
            </h1>

            <p
              className={`text-white/50 text-lg max-w-xl ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '300ms' }}
            >
              Manage your notifications, privacy, and account preferences.
            </p>
          </div>
        </section>

        {/* Settings Content */}
        <section className="px-6 pb-24">
          <div className="max-w-4xl mx-auto">
            {/* Message */}
            {message.text && (
              <div
                className={`mb-8 p-4 border ${
                  message.type === "success"
                    ? "border-green-500/30 bg-green-500/10 text-green-400"
                    : message.type === "error"
                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                    : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                } font-mono text-sm`}
              >
                {message.text}
              </div>
            )}

            {/* Account Info */}
            <div className="border border-white/10 mb-8 bg-black/40 backdrop-blur-sm">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <User className="w-5 h-5 text-white/50" strokeWidth={1.5} />
                  <h2 className="font-mono text-sm uppercase tracking-[0.15em] text-white">
                    Account
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 block mb-1">
                      Email
                    </span>
                    <span className="text-white">{user.email}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 block mb-1">
                      Name
                    </span>
                    <span className="text-white">{profile?.full_name || "Not set"}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 block mb-2">
                      Role
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ROLES.map((role) => (
                        <button
                          key={role.value}
                          onClick={() => setSelectedRole(role.value)}
                          className={`font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-2 border transition-colors cursor-crosshair ${
                            selectedRole === role.value
                              ? 'bg-white text-black border-white'
                              : 'bg-transparent text-white/50 border-white/20 hover:border-white/40'
                          }`}
                        >
                          {role.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-white/30 text-xs mt-2">
                      {ROLES.find(r => r.value === selectedRole)?.description || 'Select your role'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <button
                  onClick={() => navigate("/profile")}
                  className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors cursor-crosshair"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Settings Sections */}
            {settingsSections.map((section) => (
              <div key={section.title} className="border border-white/10 mb-8 bg-black/40 backdrop-blur-sm">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center gap-3 mb-1">
                    <section.icon className="w-5 h-5 text-white/50" strokeWidth={1.5} />
                    <h2 className="font-mono text-sm uppercase tracking-[0.15em] text-white">
                      {section.title}
                    </h2>
                  </div>
                  {section.subtitle && (
                    <p className="text-white/40 text-sm ml-8">{section.subtitle}</p>
                  )}
                </div>
                <div className="divide-y divide-white/10">
                  {section.settings.map((setting) => (
                    <div
                      key={setting.key}
                      className="p-6 flex items-center justify-between"
                    >
                      <div>
                        <h3 className="text-white mb-1">{setting.label}</h3>
                        <p className="text-white/40 text-sm">{setting.description}</p>
                      </div>
                      <button
                        onClick={() => handleToggle(setting.key)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          settings[setting.key]
                            ? "bg-white"
                            : "bg-white/20"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                            settings[setting.key]
                              ? "left-7 bg-black"
                              : "left-1 bg-white/60"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Save Button */}
            <div className="flex justify-end mb-8">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Check className="w-3 h-3" strokeWidth={1.5} />
                    Save Settings
                  </>
                )}
              </button>
            </div>

            {/* Danger Zone */}
            <div className="border border-red-500/20 bg-red-500/5">
              <div className="p-6 border-b border-red-500/20">
                <h2 className="font-mono text-sm uppercase tracking-[0.15em] text-red-400">
                  Danger Zone
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white mb-1">Sign Out</h3>
                    <p className="text-white/40 text-sm">Sign out of your account on this device</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors cursor-crosshair flex items-center gap-2"
                  >
                    <LogOut className="w-3 h-3" strokeWidth={1.5} />
                    Sign Out
                  </button>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-red-500/20">
                  <div>
                    <h3 className="text-white mb-1">Delete Account</h3>
                    <p className="text-white/40 text-sm">Permanently delete your account and all data</p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors cursor-crosshair flex items-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <BureauFooter />
      </div>
    </div>
  );
}
