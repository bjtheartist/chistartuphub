import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, FileText } from 'lucide-react';

// Data for all quarters
const quarterlyData = {
  'Q3 2025': {
    quarter: 'Q3 2025',
    summary: "Chicago's venture ecosystem demonstrated resilience in Q3 2025, maintaining deal velocity with <strong className=\"text-white\">79 rounds totaling $1B</strong> despite national capital concentration headwinds. While the city's <strong className=\"text-white\">1.2% share of US capital</strong> in Q3 reflects broader market dynamics— with heavy concentration on coastal megadeal activity (Bay Area: 57%)—Chicago sustained a steady deal count alongside peer markets.",
    chicago: {
      deals: 79,
      capital: 1.0,
      avgDealSize: 12.7,
      marketShare: 1.2,
      qoqDeals: -8,
      qoqCapital: 0,
      qoqAvgDeal: 15
    },
    national: {
      capital: 80.9,
      deals: 4208,
      aiShare: 64.3,
      megadeals: 100,
      medianSeriesA: 14.0
    },
    chicagoThemes: [
      { label: "Top sectors:", value: "B2B SaaS, Fintech, Supply Chain" },
      { label: "Stage focus:", value: "Early stage (pre-seed - series A)" },
      { label: "Est. median Series A:", value: "$10-15M" }
    ],
    nationalThemes: [
      { label: "AI/ML dominance:", value: "64.3% of capital, 37.5% of deals" },
      { label: "Megadeals:", value: "100+ deals over $100M/quarter" },
      { label: "Median Series A:", value: "$14.0M" }
    ],
    dataSources: [
      {
        title: "PitchBook-NVCA Venture Monitor",
        subtitle: "Q3 2025 • October 13, 2025",
        url: "https://pitchbook.com/news/reports/q3-2025-pitchbook-nvca-venture-monitor"
      }
    ]
  },
  'Q2 2025': {
    quarter: 'Q2 2025',
    summary: "Chicago's venture funding contracted sharply in Q2 2025, with an estimated <strong className=\"text-white\">~75 deals totaling about $0.3–0.4B</strong> in capital – a steep drop from Q1's pace. The city's share of US VC dollars hovered around <strong className=\"text-white\">0.5%</strong> as investors concentrated on a few coastal AI megadeals. Despite the pullback in dollars, deal volume held relatively steady, indicating continued early-stage activity in Chicago even as check sizes shrank. Encouragingly, early signs in late Q2 hinted at a rebound heading into Q3, suggesting the dip may be short-lived.",
    chicago: {
      deals: 75,
      capital: 0.35,
      avgDealSize: 4.7,
      marketShare: 0.5,
      qoqDeals: 1,
      qoqCapital: -42,
      qoqAvgDeal: -43
    },
    national: {
      capital: 69.9,
      deals: 4001,
      aiShare: 64.1,
      megadeals: 5,
      medianSeriesA: 13.7
    },
    chicagoThemes: [
      { label: "Sector spotlight:", value: "Healthcare and B2B software" },
      { label: "Early-stage focus:", value: "Seed and Series A rounds" },
      { label: "Notable rounds:", value: "Ocient $42M, NuMat $40M" }
    ],
    nationalThemes: [
      { label: "AI/ML dominance:", value: "64.1% of H1 capital, 35.6% of deals" },
      { label: "Post-megadeal normalization:", value: "24.8% QoQ decline (absent OpenAI)" },
      { label: "High valuations:", value: "Median Series A ~$13.7M, decade highs" }
    ],
    dataSources: [
      {
        title: "PitchBook-NVCA Venture Monitor",
        subtitle: "Q2 2025 • July 15, 2025",
        url: "https://pitchbook.com/news/reports/q2-2025-pitchbook-nvca-venture-monitor"
      },
      {
        title: "Start Midwest - Fundraising Q2 2025: Illinois",
        subtitle: "Illinois startups raised $317M in Q2 2025",
        url: "https://start-midwest.com"
      },
      {
        title: "Florida Funders - PitchBook Q2 2025 Takeaways",
        subtitle: "VC firms deployed $69.9B across 4,001 deals",
        url: "https://floridafunders.com"
      }
    ]
  },
  'Q1 2025': {
    quarter: 'Q1 2025',
    summary: "Chicago's venture ecosystem held steady in Q1 2025, with <strong className=\"text-white\">74 deals totaling $0.6B</strong> in funding. This represented <strong className=\"text-white\">under 1% of US VC capital</strong> for the quarter, as a single Bay Area AI megadeal (OpenAI's $40B round) skewed the national totals. Dealmaking in Chicago remained active – roughly on par with Q1 2024 by volume – even though the city, like other secondary markets, saw relatively fewer large rounds. Overall, Chicago's startups demonstrated resilience and focus on early-stage growth, weathering a quarter marked by extreme capital concentration at the very top.",
    chicago: {
      deals: 74,
      capital: 0.6,
      avgDealSize: 8.1,
      marketShare: 0.7,
      qoqDeals: 0,
      qoqCapital: null,
      qoqAvgDeal: null
    },
    national: {
      capital: 91.5,
      deals: 3990,
      aiShare: 71,
      megadeals: 1,
      medianSeriesA: 13.0
    },
    chicagoThemes: [
      { label: "Stable deal flow:", value: "Matched Q1 2024 deal count" },
      { label: "Diverse sectors:", value: "B2B SaaS, fintech, healthcare" },
      { label: "Average deal size:", value: "Smaller than coastal markets" }
    ],
    nationalThemes: [
      { label: "Boom in funding:", value: "$91.5B - highest since early 2022" },
      { label: "Megadeal concentration:", value: "OpenAI $40B = ~44% of quarterly value" },
      { label: "Selective optimism:", value: "Bay Area took ~64% of all VC dollars" }
    ],
    dataSources: [
      {
        title: "PitchBook-NVCA Venture Monitor",
        subtitle: "Q1 2025 • April 14, 2025",
        url: "https://pitchbook.com/news/reports/q1-2025-pitchbook-nvca-venture-monitor"
      }
    ]
  }
};

// Main Dashboard Component
export default function QuarterlyDashboard() {
  const [selectedQuarter, setSelectedQuarter] = useState('Q3 2025');
  const data = quarterlyData[selectedQuarter];

  return (
    <div className="space-y-8 mb-16">
      
      {/* Header */}
      <div className="glass-card rounded-2xl border border-white/10 p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Quarterly Ecosystem Report</h2>
            <p className="text-lg text-white/60">Chicago's venture capital performance and market position</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/60 mb-1">Quarter</div>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="text-lg font-semibold glass-card text-white rounded-lg px-4 py-2 border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
            >
              <option>Q3 2025</option>
              <option>Q2 2025</option>
              <option>Q1 2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="glass-card rounded-2xl border border-white/10 p-8">
        <h3 className="text-xl font-bold text-white mb-4">📊 {selectedQuarter} Executive Summary</h3>
        <p 
          className="text-lg text-white/70 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: data.summary }}
        />
      </div>

      {/* Chicago vs National Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* National Context */}
        <div className="glass-card rounded-2xl border border-white/10 p-6">
          <h3 className="text-xl font-bold mb-4 text-white">🇺🇸 National Market Context</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="text-2xl font-bold text-white">${data.national.capital}B</div>
              <div className="text-sm text-white/60">Total US VC Capital ({selectedQuarter})</div>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="text-2xl font-bold text-white">{data.national.deals.toLocaleString()}</div>
              <div className="text-sm text-white/60">Total US Deals</div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <div className="text-sm font-semibold text-white/80 mb-3">Key National Themes:</div>
              <ul className="space-y-2 text-sm text-white/60">
                {data.nationalThemes.map((theme, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-yellow-400 mr-2 mt-0.5">●</span>
                    <span>
                      <strong className="text-white/80">{theme.label}</strong> {theme.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Chicago Market */}
        <div className="glass-card rounded-2xl border border-white/10 p-6">
          <h3 className="text-xl font-bold mb-4 text-white">🏙️ Chicago Market</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <div className="text-2xl font-bold text-white">${data.chicago.capital}B</div>
              <div className="text-sm text-white/60">Chicago VC Capital ({selectedQuarter})</div>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <div className="text-2xl font-bold text-white">{data.chicago.deals}</div>
              <div className="text-sm text-white/60">Chicago Deals</div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <div className="text-sm font-semibold text-white/80 mb-3">Key Chicago Themes:</div>
              <ul className="space-y-2 text-sm text-white/60">
                {data.chicagoThemes.map((theme, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-green-400 mr-2 mt-0.5">●</span>
                    <span>
                      <strong className="text-white/80">{theme.label}</strong> {theme.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Data Sources Citation */}
      <div className="glass-card rounded-2xl border border-white/10 p-6 bg-white/5">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white mb-3">Data Sources</h4>
            <div className="space-y-3">
              {data.dataSources.map((source, index) => (
                <div key={index} className="pb-3 border-b border-white/10 last:border-0 last:pb-0">
                  <p className="text-sm text-white/70 mb-1">{source.title}</p>
                  <p className="text-xs text-white/50 mb-2">{source.subtitle}</p>
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
                  >
                    View Source →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}