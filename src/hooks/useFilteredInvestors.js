import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { STALE_TIMES } from '@/lib/query-client';

const ITEMS_PER_PAGE = 6;

// Quality tier thresholds
export const QUALITY_TIERS = {
  all: { label: 'All Profiles', minScore: 0 },
  verified: { label: 'Verified', minScore: 60 },
  detailed: { label: 'Detailed', minScore: 70 },
};

/**
 * Server-side filtered investor query.
 * Replaces loading all 66K records client-side.
 */
export function useFilteredInvestors({
  category = 'all',
  searchQuery = '',
  filters = {},
  page = 1,
  qualityTier = 'all',
}) {
  // Build a stable key from all filter params
  const queryKey = ['investors-filtered', category, searchQuery, filters, page, qualityTier];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('public_investors')
        .select('*', { count: 'exact' });

      // Category filter
      if (category === 'midwest') {
        query = query.eq('is_midwest', true);
      } else if (category === 'vc') {
        query = query.eq('investor_type', 'vc');
      } else if (category === 'angel') {
        query = query.eq('investor_type', 'angel');
      } else if (category === 'family_office') {
        query = query.or('investor_type.eq.family_office,investor_type.eq.family office');
      } else if (category === 'cvc') {
        query = query.or('investor_type.eq.cvc,investor_type.eq.corporate');
      }

      // Text search — use ilike on name, description, city
      const trimmed = searchQuery.trim();
      if (trimmed) {
        // Simple search: split terms, AND them together via ilike on canonical_name + description
        // For complex boolean queries, fall back to broader search
        const simpleTerms = trimmed
          .replace(/\b(AND|OR|NOT)\b/g, '')
          .replace(/["()-]/g, '')
          .trim();

        if (simpleTerms) {
          // Search across name, description, and city with OR
          const pattern = `%${simpleTerms}%`;
          query = query.or(
            `canonical_name.ilike.${pattern},description.ilike.${pattern},hq_city.ilike.${pattern}`
          );
        }
      }

      // Stage filter
      if (filters.stage?.length > 0) {
        query = query.in('stage_focus', filters.stage);
      }

      // Check size filter
      if (filters.checkSize?.length > 0) {
        // Build OR conditions for check size ranges
        const conditions = filters.checkSize.map(cs => {
          if (cs === 'under_500k') return 'check_size_max.lt.500000';
          if (cs === '500k_2m') return 'check_size_max.gte.500000,check_size_max.lt.2000000';
          if (cs === '2m_10m') return 'check_size_max.gte.2000000,check_size_max.lt.10000000';
          if (cs === 'over_10m') return 'check_size_max.gte.10000000';
          return null;
        }).filter(Boolean);

        // For single condition, apply directly
        if (conditions.length === 1) {
          const parts = conditions[0].split(',');
          for (const part of parts) {
            const [field, op, val] = part.split('.');
            if (op === 'lt') query = query.lt(field, Number(val));
            else if (op === 'gte') query = query.gte(field, Number(val));
          }
        }
      }

      // Location filter
      if (filters.location?.length > 0) {
        const locConditions = [];
        for (const loc of filters.location) {
          if (loc === 'midwest') locConditions.push('is_midwest.eq.true');
          else if (loc === 'chicago') locConditions.push('hq_city.ilike.%chicago%');
          else if (loc === 'coastal') {
            locConditions.push(
              'hq_city.ilike.%san francisco%',
              'hq_city.ilike.%new york%',
              'hq_city.ilike.%los angeles%',
              'hq_city.ilike.%boston%',
              'hq_city.ilike.%seattle%'
            );
          }
          // 'national' = no filter (show all)
        }
        if (locConditions.length > 0 && !filters.location.includes('national')) {
          query = query.or(locConditions.join(','));
        }
      }

      // Quality tier filter
      const minScore = QUALITY_TIERS[qualityTier]?.minScore || 0;
      if (minScore > 0) {
        query = query.gte('completeness_score', minScore);
      }

      // Order + paginate
      const from = (page - 1) * ITEMS_PER_PAGE;
      query = query
        .order('completeness_score', { ascending: false })
        .order('mvip_score', { ascending: false })
        .range(from, from + ITEMS_PER_PAGE - 1);

      const { data: rows, error, count } = await query;
      if (error) throw error;

      return { investors: rows || [], totalCount: count || 0 };
    },
    staleTime: STALE_TIMES.investors,
    keepPreviousData: true,
  });

  return {
    investors: data?.investors || [],
    totalCount: data?.totalCount || 0,
    totalPages: Math.ceil((data?.totalCount || 0) / ITEMS_PER_PAGE),
    isLoading,
    error,
  };
}

/**
 * Lightweight count query for category tabs.
 * Single query with count per type — much cheaper than loading all records.
 */
export function useInvestorCounts() {
  return useQuery({
    queryKey: ['investor-counts'],
    queryFn: async () => {
      // Run parallel count queries
      const [allRes, vcRes, angelRes, familyRes, cvcRes, midwestRes] = await Promise.all([
        supabase.from('public_investors').select('*', { count: 'exact', head: true }),
        supabase.from('public_investors').select('*', { count: 'exact', head: true }).eq('investor_type', 'vc'),
        supabase.from('public_investors').select('*', { count: 'exact', head: true }).eq('investor_type', 'angel'),
        supabase.from('public_investors').select('*', { count: 'exact', head: true }).or('investor_type.eq.family_office,investor_type.eq.family office'),
        supabase.from('public_investors').select('*', { count: 'exact', head: true }).or('investor_type.eq.cvc,investor_type.eq.corporate'),
        supabase.from('public_investors').select('*', { count: 'exact', head: true }).eq('is_midwest', true),
      ]);

      return {
        total: allRes.count || 0,
        all: allRes.count || 0,
        vc: vcRes.count || 0,
        angel: angelRes.count || 0,
        family_office: familyRes.count || 0,
        cvc: cvcRes.count || 0,
        midwest: midwestRes.count || 0,
      };
    },
    staleTime: STALE_TIMES.investors,
  });
}
