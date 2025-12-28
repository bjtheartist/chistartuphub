import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			// Time before data is considered stale (5 minutes)
			// Fresh data won't trigger background refetches
			staleTime: 5 * 60 * 1000,

			// Time before inactive queries are garbage collected (30 minutes)
			// Keeps unused data in cache for faster retrieval if needed again
			gcTime: 30 * 60 * 1000,

			// Disable automatic refetch when window regains focus
			// Prevents unnecessary API calls when switching browser tabs
			refetchOnWindowFocus: false,

			// Don't refetch when component mounts if data already exists
			// Reduces redundant API calls during navigation
			refetchOnMount: false,

			// Retry failed requests once before giving up
			// Balances reliability with avoiding excessive retries
			retry: 1,
		},
	},
});