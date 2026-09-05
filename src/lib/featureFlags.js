/**
 * Feature flags.
 *
 * PRICING_ENABLED gates every public surface of the paid tier: the /Pricing
 * page, its nav link, upgrade prompts, and the locked "PRO" export button.
 * The subscription context, Stripe functions, and tiered database views stay
 * in place, so flipping this to true relaunches pricing without a code change.
 *
 * Off by default. Set VITE_PRICING_ENABLED=true in the environment to enable.
 */
export const PRICING_ENABLED = import.meta.env.VITE_PRICING_ENABLED === 'true';
