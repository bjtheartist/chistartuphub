import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InvestorStrip } from './InvestorStrip';
import { InvestorFilters } from './InvestorFilters';
import { InvestorCard } from './InvestorCard';
import { InvestorModal } from './InvestorModal';
import { TieredResults } from './TieredResults';
import { SearchContextBanner } from './SearchContextBanner';
import { SearchModeToggle } from '@/components/SearchModeToggle';
import { SaveSearchButton } from './SaveSearchButton';
import { SavedSearchesPanel } from './SavedSearchesPanel';
import { SaveListButton } from './SaveListButton';
import { ExportInvestorsButton } from './ExportInvestorsButton';
import { useInvestorSearch } from '@/hooks/useInvestorSearch';
import { usePipelineAnnotations } from '@/hooks/usePipelineAnnotations';
import { filterTieredResults } from '@/lib/booleanSearch';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useFilteredInvestors, useInvestorCounts, QUALITY_TIERS } from '@/hooks/useFilteredInvestors';

export function InvestorPageContent() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [searchMode, setSearchMode] = useState('boolean');
  const [searchTimer, setSearchTimer] = useState(null);
  const [qualityTier, setQualityTier] = useState('verified');

  const aiSearch = useInvestorSearch();
  const { annotations } = usePipelineAnnotations();
  const { isPro } = useSubscription();

  // Server-side counts (lightweight HEAD requests)
  const { data: counts = { total: 0, all: 0, vc: 0, angel: 0, family_office: 0, cvc: 0, midwest: 0 } } = useInvestorCounts();

  // Server-side filtered + paginated investors
  const {
    investors: filteredInvestors,
    totalCount,
    totalPages,
    isLoading: browseLoading,
  } = useFilteredInvestors({
    category: activeCategory,
    searchQuery: debouncedSearch,
    filters: activeFilters,
    page: currentPage,
    qualityTier,
  });

  // Debounced search — wait 400ms after typing stops before querying server
  const updateDebouncedSearch = (value) => {
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => setDebouncedSearch(value), 400);
    setSearchTimer(timer);
  };

  // Reset page when filters change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handleFilterChange = (category, values) => {
    setActiveFilters(prev => ({ ...prev, [category]: values }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setCurrentPage(1);
  };

  // Restore a saved search
  const handleRestoreSearch = (saved) => {
    setSearchQuery(saved.query);
    setSearchMode(saved.search_mode);
    setActiveFilters(saved.filters || {});
    setActiveCategory(saved.active_category || 'all');
    setCurrentPage(1);

    // Trigger semantic search if needed
    if (saved.search_mode === 'semantic' && saved.query.trim().length >= 3) {
      setTimeout(() => aiSearch.search(saved.query), 50);
    }
  };

  // Post-filter semantic results with Boolean operators
  const semanticFiltered = useMemo(() => {
    if (!aiSearch.searchActive) return { tiered: aiSearch.tieredResults, totalResults: aiSearch.totalResults };
    return filterTieredResults(aiSearch.tieredResults, searchQuery);
  }, [aiSearch.tieredResults, aiSearch.searchActive, aiSearch.totalResults, searchQuery]);

  // Flat list of all semantic results (for export/save list)
  const allSemanticResults = useMemo(() => {
    if (!semanticFiltered.tiered) return [];
    return [
      ...(semanticFiltered.tiered.strong || []),
      ...(semanticFiltered.tiered.exploring || []),
      ...(semanticFiltered.tiered.broader || []),
    ];
  }, [semanticFiltered.tiered]);

  // Category display config
  const categoryInfo = {
    all: { icon: '📊', label: 'All Investors' },
    vc: { icon: '🏦', label: 'Venture Capital' },
    angel: { icon: '⭐', label: 'Angel Investors' },
    family_office: { icon: '🏠', label: 'Family Offices' },
    cvc: { icon: '🏢', label: 'Corporate VC' },
    midwest: { icon: '★', label: 'Midwest Investors' }
  }[activeCategory];

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-chi-muted" />
            <input
              type="text"
              placeholder={
                searchMode === 'boolean'
                  ? 'Try: fintech AND seed, health OR biotech, -crypto, "series a"'
                  : 'Describe what you\'re looking for... press Enter, then refine with AND/OR/NOT'
              }
              value={searchQuery}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchMode === 'semantic' && searchQuery.trim().length >= 3) {
                  aiSearch.search(searchQuery);
                }
              }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (searchMode === 'boolean') {
                  updateDebouncedSearch(e.target.value);
                }
                if (!e.target.value.trim() && searchMode === 'semantic' && aiSearch.searchActive) {
                  aiSearch.clearSearch();
                }
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 bg-black/40 border border-chi-ghost text-white placeholder:text-chi-muted focus:outline-none focus:border-white transition-colors font-mono text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 border transition-colors font-mono text-sm uppercase tracking-[0.1em]",
              showFilters
                ? "border-white bg-white text-chi-navy"
                : "border-chi-ghost text-chi-muted hover:border-white hover:text-white"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          <SaveSearchButton
            query={searchQuery}
            searchMode={searchMode}
            filters={activeFilters}
            activeCategory={activeCategory}
          />
        </div>

        {/* Search Mode Toggle */}
        <SearchModeToggle
          mode={searchMode}
          onModeChange={(newMode) => {
            setSearchMode(newMode);
            if (newMode === 'boolean' && aiSearch.searchActive) {
              aiSearch.clearSearch();
            }
            setCurrentPage(1);
          }}
        />

        {/* Saved Searches */}
        <SavedSearchesPanel onRestore={handleRestoreSearch} />
      </div>

      {/* Filters Panel */}
      <InvestorFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearFilters}
      />

      {/* Pro gate for semantic search */}
      {searchMode === 'semantic' && !isPro && (
        <UpgradePrompt variant="banner" feature="AI-powered semantic search" />
      )}

      {/* AI Search Mode vs Browse Mode */}
      {searchMode === 'semantic' && isPro && aiSearch.searchActive ? (
        <>
          {/* AI Search Results */}
          {aiSearch.isSearching ? (
            <div className="flex items-center justify-center gap-3 py-20">
              <Loader2 className="w-5 h-5 text-chi-muted animate-spin" />
              <span className="text-chi-muted font-mono text-sm">Searching investors...</span>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between py-4 border-b border-chi-ghost/30">
                <h2 className="font-editorial text-2xl md:text-3xl text-white flex items-center gap-3">
                  <span>🔍</span>
                  <span className="italic">Semantic Search Results</span>
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-chi-muted font-mono text-sm">
                    {semanticFiltered.totalResults} Results
                    {semanticFiltered.totalResults < aiSearch.totalResults && (
                      <span className="ml-2 text-chi-dim">
                        (filtered from {aiSearch.totalResults})
                      </span>
                    )}
                  </span>
                  <SaveListButton investors={allSemanticResults} />
                  <ExportInvestorsButton investors={allSemanticResults} filename="semantic-results" />
                </div>
              </div>

              {/* Beta Disclaimer */}
              <div className="flex items-start gap-3 px-5 py-3 bg-white/[0.03] border border-chi-ghost/20">
                <span className="text-[9px] mt-0.5 px-1.5 py-0.5 bg-chi-signal/20 border border-chi-signal/40 rounded-sm tracking-[0.15em] text-chi-signal font-mono shrink-0">BETA</span>
                <p className="text-[11px] text-chi-muted font-mono leading-relaxed">
                  Semantic results are experimental. Refine with NOT to exclude or AND to narrow — plain words default to OR (inclusive). Always verify firm details independently.
                </p>
              </div>

              {aiSearch.contextMessage && (
                <SearchContextBanner message={aiSearch.contextMessage} />
              )}

              <TieredResults
                tiered={semanticFiltered.tiered}
                parsedFilters={aiSearch.parsedFilters}
                onInvestorClick={setSelectedInvestor}
                annotations={annotations}
              />
            </>
          )}
        </>
      ) : (
        <>
          {/* Browse Mode (original) */}
          <InvestorStrip
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            counts={counts}
          />

          {/* Quality Tier Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-chi-dim font-mono text-[10px] uppercase tracking-[0.15em] mr-2">Profile Quality</span>
            {Object.entries(QUALITY_TIERS).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => { setQualityTier(key); setCurrentPage(1); }}
                className={cn(
                  "px-3 py-1.5 border font-mono text-[10px] uppercase tracking-[0.1em] transition-colors",
                  qualityTier === key
                    ? "border-white text-white bg-white/[0.08]"
                    : "border-chi-ghost/30 text-chi-dim hover:border-chi-ghost hover:text-chi-muted"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between py-4 border-b border-chi-ghost/30">
            <h2 className="font-editorial text-2xl md:text-3xl text-white flex items-center gap-3">
              <span>{categoryInfo.icon}</span>
              <span className="italic">{categoryInfo.label}</span>
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-chi-muted font-mono text-sm">
                {totalCount.toLocaleString()} Results
              </span>
              <SaveListButton investors={filteredInvestors} />
              <ExportInvestorsButton investors={filteredInvestors} filename="investors" />
            </div>
          </div>

          {/* Results Grid */}
          {browseLoading ? (
            <div className="flex items-center justify-center gap-3 py-20">
              <Loader2 className="w-5 h-5 text-chi-muted animate-spin" />
              <span className="text-chi-muted font-mono text-sm">Loading investors...</span>
            </div>
          ) : filteredInvestors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredInvestors.map((investor, index) => (
                <InvestorCard
                  key={investor.id}
                  investor={investor}
                  index={(currentPage - 1) * 6 + index}
                  onClick={() => setSelectedInvestor(investor)}
                  annotation={annotations?.get(String(investor.id))}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-chi-ghost/30">
              <p className="text-chi-muted font-mono text-sm">
                No investors found matching your criteria.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "px-4 py-2 border font-mono text-xs uppercase tracking-[0.1em] transition-colors",
                  currentPage === 1
                    ? "border-chi-ghost/30 text-chi-dim cursor-not-allowed"
                    : "border-chi-ghost text-chi-muted hover:border-white hover:text-white"
                )}
              >
                Previous
              </button>
              <span className="text-chi-silver font-mono text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "px-4 py-2 border font-mono text-xs uppercase tracking-[0.1em] transition-colors",
                  currentPage === totalPages
                    ? "border-chi-ghost/30 text-chi-dim cursor-not-allowed"
                    : "border-chi-ghost text-chi-muted hover:border-white hover:text-white"
                )}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <InvestorModal
        investor={selectedInvestor}
        isOpen={!!selectedInvestor}
        onClose={() => setSelectedInvestor(null)}
      />
    </div>
  );
}

export default InvestorPageContent;
