import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";
import SEO from "@/components/SEO";
import {
  BarChart, Bar, PieChart, Pie, Cell, Treemap,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#FFFFFF", "#4ADE80", "#FF6B6B", "#60A5FA", "#FBBF24",
  "#A78BFA", "#F472B6", "#34D399", "#FB923C", "#818CF8",
];

const MUTED = "rgba(255,255,255,0.5)";

function StatCard({ label, value, sub }) {
  return (
    <div className="border border-white/10 p-6 bg-black/30">
      <div className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] mb-2">{label}</div>
      <div className="font-mono text-3xl text-white tracking-tight">{value}</div>
      {sub && <div className="font-mono text-[11px] text-white/30 mt-1">{sub}</div>}
    </div>
  );
}

function ChartCard({ title, children, className = "" }) {
  return (
    <div className={`border border-white/10 bg-black/30 p-6 ${className}`}>
      <div className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] mb-4">{title}</div>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0f1a] border border-white/20 px-3 py-2 font-mono text-xs">
      <p className="text-white">{label || payload[0]?.name}</p>
      <p className="text-white/60">{payload[0]?.value?.toLocaleString()}</p>
    </div>
  );
};

export default function InvestorInsights() {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setIsLoaded(true), 100); }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["investor-insights"],
    queryFn: async () => {
      // Parallel queries for all stats
      const [
        totalRes, vcRes, angelRes, midwestRes,
        withCity, withDesc, withStage, withSectors,
        score70, score60, score50, score30,
      ] = await Promise.all([
        supabase.from("public_investors").select("*", { count: "exact", head: true }),
        supabase.from("public_investors").select("*", { count: "exact", head: true }).eq("investor_type", "vc"),
        supabase.from("public_investors").select("*", { count: "exact", head: true }).eq("investor_type", "angel"),
        supabase.from("public_investors").select("*", { count: "exact", head: true }).eq("is_midwest", true),
        supabase.from("public_investors").select("*", { count: "exact", head: true }).not("hq_city", "is", null),
        supabase.from("public_investors").select("*", { count: "exact", head: true }).not("description", "is", null),
        supabase.from("public_investors").select("*", { count: "exact", head: true }).not("stage_focus", "is", null),
        supabase.from("public_investors").select("*", { count: "exact", head: true }).not("sectors", "is", null),
        supabase.from("public_investors").select("*", { count: "exact", head: true }).gte("completeness_score", 70),
        supabase.from("public_investors").select("*", { count: "exact", head: true }).gte("completeness_score", 60),
        supabase.from("public_investors").select("*", { count: "exact", head: true }).gte("completeness_score", 50),
        supabase.from("public_investors").select("*", { count: "exact", head: true }).gte("completeness_score", 30),
      ]);

      // Non-VC type counts
      const nonVcTypes = ["hedge_fund", "real_estate", "credit", "infrastructure", "commodity", "insurance", "passive", "agriculture"];
      const nonVcCounts = await Promise.all(
        nonVcTypes.map(t => supabase.from("public_investors").select("*", { count: "exact", head: true }).eq("investor_type", t))
      );

      // Top states
      const { data: topStates } = await supabase
        .from("public_investors")
        .select("hq_state")
        .not("hq_state", "is", null)
        .eq("investor_type", "vc")
        .limit(5000);

      // Top cities
      const { data: topCities } = await supabase
        .from("public_investors")
        .select("hq_city")
        .not("hq_city", "is", null)
        .eq("investor_type", "vc")
        .limit(5000);

      // Stage distribution
      const { data: stages } = await supabase
        .from("public_investors")
        .select("stage_focus")
        .not("stage_focus", "is", null)
        .eq("investor_type", "vc")
        .limit(5000);

      // Co-investment stats
      const dealCount = await supabase.from("form_d_deals").select("*", { count: "exact", head: true });
      const participantCount = await supabase.from("deal_participants").select("*", { count: "exact", head: true });

      return {
        total: totalRes.count || 0,
        vc: vcRes.count || 0,
        angel: angelRes.count || 0,
        midwest: midwestRes.count || 0,
        fields: {
          city: withCity.count || 0,
          description: withDesc.count || 0,
          stage: withStage.count || 0,
          sectors: withSectors.count || 0,
        },
        tiers: {
          gold: score70.count || 0,
          silver: (score60.count || 0) - (score70.count || 0),
          bronze: (score50.count || 0) - (score60.count || 0),
          basic: (score30.count || 0) - (score50.count || 0),
          minimal: (totalRes.count || 0) - (score30.count || 0),
        },
        nonVc: nonVcTypes.reduce((acc, type, i) => {
          acc[type] = nonVcCounts[i].count || 0;
          return acc;
        }, {}),
        topStates: aggregateField(topStates, "hq_state", 15),
        topCities: aggregateField(topCities, "hq_city", 15),
        stages: aggregateField(stages, "stage_focus", 10),
        deals: dealCount.count || 0,
        participants: participantCount.count || 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-screen relative" data-page="investor-insights">
        <BureauAtmosphere />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <span className="font-mono text-sm text-white/40 animate-pulse">Loading insights...</span>
        </div>
      </div>
    );
  }

  const fieldCoverage = [
    { name: "Description", value: data.fields.description, pct: Math.round(data.fields.description / data.total * 100) },
    { name: "Location", value: data.fields.city, pct: Math.round(data.fields.city / data.total * 100) },
    { name: "Stage", value: data.fields.stage, pct: Math.round(data.fields.stage / data.total * 100) },
    { name: "Sectors", value: data.fields.sectors, pct: Math.round(data.fields.sectors / data.total * 100) },
  ];

  const tierData = [
    { name: "Gold (70+)", value: data.tiers.gold, fill: "#4ADE80" },
    { name: "Silver (60+)", value: data.tiers.silver, fill: "#60A5FA" },
    { name: "Bronze (50+)", value: data.tiers.bronze, fill: "#FBBF24" },
    { name: "Basic (30+)", value: data.tiers.basic, fill: "#FB923C" },
    { name: "Minimal (<30)", value: data.tiers.minimal, fill: "#FF6B6B" },
  ];

  const typeBreakdown = [
    { name: "VC", value: data.vc },
    { name: "Angel", value: data.angel },
    ...Object.entries(data.nonVc)
      .filter(([_, v]) => v > 0)
      .map(([k, v]) => ({ name: k.replace("_", " "), value: v })),
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="min-h-screen relative" data-page="investor-insights">
      <SEO
        title="Investor Database Insights | ChiStartup Hub"
        description="Data quality dashboard for our investor database."
      />
      <BureauAtmosphere />

      <div className="relative z-10">
        <section className="pt-32 pb-8 px-6">
          <div className="max-w-7xl mx-auto">
            <div className={`${isLoaded ? "animate-fade-in" : "opacity-0"}`}>
              <span className="font-mono text-[11px] text-white/40 uppercase tracking-[0.2em] block mb-8">
                [CHISTARTUPHUB: DATABASE INSIGHTS]
              </span>
            </div>

            <h1
              className={`font-editorial text-5xl md:text-6xl text-white tracking-tight leading-[0.95] mb-4 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: "200ms" }}
            >
              <span className="italic">Investor Intelligence</span>
            </h1>
            <p
              className={`font-mono text-sm text-white/40 mb-12 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: "300ms" }}
            >
              Live dashboard — {data.total.toLocaleString()} records from SEC Form D, Form ADV, and curated sources
            </p>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Records" value={data.total.toLocaleString()} />
              <StatCard label="VC Firms" value={data.vc.toLocaleString()} sub={`${Math.round(data.vc / data.total * 100)}% of total`} />
              <StatCard label="Verified Profiles" value={(data.tiers.gold + data.tiers.silver).toLocaleString()} sub="Score 60+" />
              <StatCard label="Midwest Investors" value={data.midwest.toLocaleString()} />
            </div>

            {/* Second row stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Form D Deals Tracked" value={data.deals.toLocaleString()} />
              <StatCard label="Deal-Investor Links" value={data.participants.toLocaleString()} />
              <StatCard label="With Description" value={data.fields.description.toLocaleString()} sub={`${Math.round(data.fields.description / data.total * 100)}%`} />
              <StatCard label="With Location" value={data.fields.city.toLocaleString()} sub={`${Math.round(data.fields.city / data.total * 100)}%`} />
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Quality Tiers */}
              <ChartCard title="Data Quality Tiers">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={tierData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {tierData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2">
                  {tierData.map((t, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-2 h-2" style={{ background: t.fill }} />
                      <span className="font-mono text-[10px] text-white/50">{t.name}: {t.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>

              {/* Field Coverage */}
              <ChartCard title="Field Coverage">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={fieldCoverage} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: MUTED, fontSize: 10, fontFamily: "monospace" }} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: MUTED, fontSize: 10, fontFamily: "monospace" }} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="pct" fill="#4ADE80" radius={0}>
                      {fieldCoverage.map((_, i) => (
                        <Cell key={i} fill={fieldCoverage[i].pct > 50 ? "#4ADE80" : fieldCoverage[i].pct > 20 ? "#FBBF24" : "#FF6B6B"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 font-mono text-[10px] text-white/30">
                  {fieldCoverage.map(f => `${f.name}: ${f.value.toLocaleString()}`).join(" · ")}
                </div>
              </ChartCard>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Top States */}
              <ChartCard title="Top States (VC Firms)">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.topStates.slice(0, 12)} margin={{ left: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 9, fontFamily: "monospace" }} angle={-45} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: MUTED, fontSize: 10, fontFamily: "monospace" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#FFFFFF" radius={0}>
                      {data.topStates.slice(0, 12).map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "#FFFFFF" : i < 3 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Top Cities */}
              <ChartCard title="Top Cities (VC Firms)">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.topCities.slice(0, 12)} margin={{ left: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 9, fontFamily: "monospace" }} angle={-45} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: MUTED, fontSize: 10, fontFamily: "monospace" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#60A5FA" radius={0}>
                      {data.topCities.slice(0, 12).map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "#60A5FA" : i < 3 ? "rgba(96,165,250,0.7)" : "rgba(96,165,250,0.35)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Charts row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Entity Type Breakdown */}
              <ChartCard title="Entity Type Breakdown">
                <div className="space-y-2">
                  {typeBreakdown.map((t, i) => {
                    const pct = Math.round(t.value / data.total * 100);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-white/50 w-24 text-right capitalize">{t.name}</span>
                        <div className="flex-1 h-5 bg-white/5 relative">
                          <div
                            className="h-full"
                            style={{
                              width: `${Math.max(pct, 1)}%`,
                              background: COLORS[i % COLORS.length],
                              opacity: 0.7,
                            }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-white/40 w-16">{t.value.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>

              {/* Stage Distribution */}
              <ChartCard title="Stage Distribution (VC Firms)">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={data.stages}
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {data.stages.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2">
                  {data.stages.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-2 h-2" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="font-mono text-[10px] text-white/50">{s.name}: {s.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>

            {/* Data Sources */}
            <ChartCard title="Data Pipeline">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "SEC Form D", desc: "3 years of quarterly filings (2023-2025). Fund names, locations, offering amounts, related persons.", count: "164K filings" },
                  { label: "SEC Form ADV", desc: "Registered investment advisers. AUM, website, VC fund indicator, SEC registration status.", count: "16.7K advisers" },
                  { label: "SEC EDGAR", desc: "Company search API. CIK numbers, state of incorporation, SIC codes.", count: "200 lookups" },
                  { label: "Curated Sources", desc: "OpenVC, Wikidata, Google CSE, state associations, angel networks, GitHub datasets.", count: "5K+ records" },
                ].map((src, i) => (
                  <div key={i} className="space-y-2">
                    <div className="font-mono text-xs text-white/80">{src.label}</div>
                    <div className="font-mono text-[10px] text-white/30 leading-relaxed">{src.desc}</div>
                    <div className="font-mono text-[10px] text-white/50 border-t border-white/10 pt-1 mt-2">{src.count}</div>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Processing Pipeline */}
            <ChartCard title="Processing Pipeline">
              <div className="flex flex-wrap gap-3">
                {[
                  "Harvest Form D (12 quarters)",
                  "Parse TSV → firm records",
                  "Filter non-VC entities",
                  "Dedup fund → firm (Pass 1)",
                  "Dedup fund → firm (Pass 2)",
                  "Form ADV enrichment",
                  "EDGAR enrichment",
                  "Domain backfill",
                  "Co-investment graph",
                  "HNSW vector index",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-white/60 border border-white/10 px-3 py-1.5">
                      {i + 1}. {step}
                    </span>
                    {i < 9 && <span className="text-white/20 font-mono text-xs">&rarr;</span>}
                  </div>
                ))}
              </div>
            </ChartCard>

          </div>
        </section>

        <BureauFooter />
      </div>
    </div>
  );
}

// Helper: aggregate an array of objects by a field, returning sorted [{name, value}]
function aggregateField(rows, field, limit = 10) {
  if (!rows) return [];
  const counts = {};
  for (const row of rows) {
    const val = row[field];
    if (val) counts[val] = (counts[val] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}
