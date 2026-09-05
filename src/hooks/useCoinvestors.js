import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';

/**
 * Fetches co-investors for a given investor via the get_coinvestors RPC.
 * Returns investors who appeared alongside this investor in Form D filings.
 */
export function useCoinvestors(investorId) {
  return useQuery({
    queryKey: ['coinvestors', investorId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_coinvestors', {
        target_investor_id: investorId,
        min_shared_deals: 1,
      });
      if (error) throw error;

      if (!data?.length) return [];

      // Fetch names for the co-investor IDs
      const ids = data.map((d) => d.investor_id);
      const { data: investors } = await supabase
        .from('public_investors')
        .select('id, canonical_name, investor_type, hq_city, hq_state, stage_focus')
        .in('id', ids);

      const investorMap = new Map((investors || []).map((inv) => [inv.id, inv]));

      return data.map((d) => ({
        ...d,
        investor: investorMap.get(d.investor_id) || null,
      }));
    },
    enabled: !!investorId,
    staleTime: 10 * 60 * 1000,
  });
}
