import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const SubscriptionContext = createContext({});

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSubscription = useCallback(async (userId) => {
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      setSubscription(data);
    } catch (err) {
      console.warn('Subscription load failed:', err.message);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadSubscription(user.id);
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user?.id, loadSubscription]);

  const isPro = subscription?.status === 'active'
    && subscription?.plan === 'pro'
    && new Date(subscription?.current_period_end) > new Date();

  const refreshSubscription = useCallback(async () => {
    if (user?.id) {
      await loadSubscription(user.id);
    }
  }, [user?.id, loadSubscription]);

  // Start Stripe Checkout
  const startCheckout = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const res = await supabase.functions.invoke('create-checkout-session', {
        body: { origin: window.location.origin },
      });

      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
  }, [session?.access_token]);

  // Open Stripe Customer Portal
  const openPortal = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const res = await supabase.functions.invoke('create-portal-session', {
        body: { origin: window.location.origin },
      });

      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Portal error:', err);
    }
  }, [session?.access_token]);

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      isPro,
      loading,
      refreshSubscription,
      startCheckout,
      openPortal,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
