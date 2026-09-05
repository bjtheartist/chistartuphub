import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';

/**
 * Fetches key people (Executive Officers, Directors, Promoters)
 * associated with an investor from Form D deal_participants.
 */
export function useKeyPeople(investorId) {
  return useQuery({
    queryKey: ['key-people', investorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deal_participants')
        .select('person_name, relationship, deal_id')
        .eq('investor_id', investorId)
        .order('person_name');

      if (error) throw error;
      if (!data?.length) return [];

      // Entity name patterns to filter out (these are firms, not people)
      const isEntityName = (name) => {
        const lower = name.toLowerCase();
        return /\b(llc|llp|lp|inc|corp|ltd|fund|partners|capital|ventures|management|advisors|holdings|group)\b/.test(lower)
          || /^\W/.test(name); // starts with punctuation like ". "
      };

      // Aggregate: unique people with their roles and deal count
      const people = new Map();
      for (const row of data) {
        const name = row.person_name?.trim().replace(/^[.,\s]+/, '');
        if (!name || isEntityName(name)) continue;

        const key = name.toLowerCase();
        if (!people.has(key)) {
          people.set(key, { name, roles: new Set(), dealCount: 0 });
        }
        const person = people.get(key);
        if (row.relationship) person.roles.add(row.relationship);
        person.dealCount++;
      }

      return [...people.values()]
        .map((p) => ({ ...p, roles: [...p.roles] }))
        .sort((a, b) => b.dealCount - a.dealCount);
    },
    enabled: !!investorId,
    staleTime: 10 * 60 * 1000,
  });
}
