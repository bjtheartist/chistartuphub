import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			// Default stale time for user-scoped data (pipeline, bookmarks, etc.)
			staleTime: 2 * 60 * 1000,

			// Time before inactive queries are garbage collected
			gcTime: 30 * 60 * 1000,

			refetchOnWindowFocus: false,
			refetchOnMount: false,
			retry: 1,
		},
	},
});

/**
 * Per-entity stale times. Static datasets (investors, funding) use long TTLs
 * since they only change when enrichment scripts run. User-scoped data stays short.
 */
export const STALE_TIMES = {
	// Static datasets — only change on enrichment runs
	investors: 30 * 60 * 1000,            // 30 min
	fundingOpportunities: 30 * 60 * 1000,  // 30 min
	upcomingOpportunities: 15 * 60 * 1000, // 15 min

	// User-scoped — mutated frequently, short TTL + optimistic updates
	pipeline: 0,        // always stale, rely on optimistic updates
	savedSearches: 0,
	savedLists: 0,
	bookmarks: 60_000,  // 1 min
	founderAsks: 60_000,
	notifications: 0,
};