import { Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { cn } from '@/lib/utils';
import { PRICING_ENABLED } from '@/lib/featureFlags';

/**
 * Reusable upgrade prompt for Pro-gated features.
 * Variants: 'inline' (compact for modals), 'banner' (full-width)
 */
export function UpgradePrompt({ variant = 'inline', feature = 'this feature' }) {
  const { user, openSignup } = useAuth();
  const { startCheckout } = useSubscription();

  // Pricing is not public yet: show nothing rather than a dead upgrade path.
  if (!PRICING_ENABLED) return null;

  const handleClick = () => {
    if (!user) {
      openSignup();
    } else {
      startCheckout();
    }
  };

  if (variant === 'banner') {
    return (
      <div className="flex items-center gap-4 px-5 py-4 border border-chi-ghost/40 bg-white/[0.03]">
        <Lock className="w-4 h-4 text-chi-muted flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-chi-silver">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-chi-signal mr-2">PRO</span>
            {feature} is available with a Pro subscription.
          </p>
        </div>
        <button
          onClick={handleClick}
          className="flex items-center gap-2 px-4 py-2 bg-white text-chi-navy font-mono text-[10px] uppercase tracking-[0.1em] hover:bg-chi-silver transition-colors flex-shrink-0"
        >
          Upgrade
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // Inline variant (for modals, cards)
  return (
    <div className="border border-chi-ghost/40 bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-4 h-4 text-chi-muted" />
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-chi-signal">
          Pro Feature
        </span>
      </div>
      <p className="text-sm text-chi-muted mb-4 leading-relaxed">
        Upgrade to access verified business websites, phone numbers, and addresses for this investor.
      </p>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-5 py-2.5 bg-white text-chi-navy font-mono text-[10px] uppercase tracking-[0.1em] hover:bg-chi-silver transition-colors"
      >
        {user ? 'Upgrade to Pro' : 'Sign Up for Pro'}
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}

export default UpgradePrompt;
