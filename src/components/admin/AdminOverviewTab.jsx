import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  MessageSquare,
  HandHelping,
  Megaphone,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

/**
 * Admin Overview Tab - Dashboard statistics and metrics
 */
export default function AdminOverviewTab({
  stats,
  asks,
  setActiveTab,
}) {
  // Category breakdown for asks
  const asksByCategory = {
    fundraising: asks.filter(a => a.category === 'fundraising').length,
    cofounder: asks.filter(a => a.category === 'cofounder').length,
    general_advice: asks.filter(a => a.category === 'general_advice').length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {/* Users */}
        <div className="border border-white/10 p-6 bg-black/40">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
            <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.1em]">
              Total Users
            </span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
          <div className="text-xs text-green-400 mt-1">
            +{stats.newUsersThisWeek} this week
          </div>
        </div>

        {/* Founders */}
        <div className="border border-white/10 p-6 bg-black/40">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-purple-400" strokeWidth={1.5} />
            <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.1em]">
              Founders
            </span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalFounders}</div>
          <div className="text-xs text-white/30 mt-1">
            {stats.totalHelpers} helpers
          </div>
        </div>

        {/* Active Asks */}
        <div className="border border-white/10 p-6 bg-black/40">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
            <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.1em]">
              Active Asks
            </span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.activeAsks}</div>
          <div className="text-xs text-white/30 mt-1">
            of {stats.totalAsks} total
          </div>
        </div>

        {/* Connections */}
        <div className="border border-white/10 p-6 bg-black/40">
          <div className="flex items-center gap-2 mb-3">
            <HandHelping className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
            <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.1em]">
              Connections
            </span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalConnections}</div>
          <div className="text-xs text-yellow-400 mt-1">
            {stats.pendingConnections} pending
          </div>
        </div>

        {/* Amplification Queue */}
        <div className="border border-amber-500/20 p-6 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
            <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.1em]">
              Amplify Queue
            </span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.amplifyAsks}</div>
          <div className="text-xs text-amber-400/70 mt-1">
            ready to share
          </div>
        </div>
      </div>

      {/* Ask Categories Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-white/10 p-6 bg-black/40">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/50 mb-4">
            Asks by Category
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">Fundraising</span>
                <span className="text-emerald-400">{asksByCategory.fundraising}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${(asksByCategory.fundraising / (stats.totalAsks || 1)) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">Co-founder</span>
                <span className="text-blue-400">{asksByCategory.cofounder}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400"
                  style={{ width: `${(asksByCategory.cofounder / (stats.totalAsks || 1)) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">General Advice</span>
                <span className="text-purple-400">{asksByCategory.general_advice}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-400"
                  style={{ width: `${(asksByCategory.general_advice / (stats.totalAsks || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Connection Status Breakdown */}
        <div className="border border-white/10 p-6 bg-black/40">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/50 mb-4">
            Connection Requests Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" strokeWidth={1.5} />
                <span className="text-white/60">Pending</span>
              </div>
              <span className="text-yellow-400 font-mono">{stats.pendingConnections}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" strokeWidth={1.5} />
                <span className="text-white/60">Accepted</span>
              </div>
              <span className="text-green-400 font-mono">{stats.acceptedConnections}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" strokeWidth={1.5} />
                <span className="text-white/60">Declined</span>
              </div>
              <span className="text-red-400 font-mono">{stats.declinedConnections}</span>
            </div>
          </div>

          {/* Conversion rate */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-white/40 text-sm">Acceptance Rate</span>
              <span className="text-lg font-bold text-white">
                {stats.totalConnections > 0
                  ? Math.round((stats.acceptedConnections / stats.totalConnections) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Attention Needed */}
      <div className="mt-6 border border-amber-500/20 bg-amber-500/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
          <h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-amber-400">
            Needs Attention
          </h3>
        </div>
        <ul className="space-y-2 text-sm">
          {stats.amplifyAsks > 0 && (
            <li className="flex items-center gap-2 text-amber-400">
              <Megaphone className="w-4 h-4" strokeWidth={1.5} />
              <span>
                {stats.amplifyAsks} ask{stats.amplifyAsks !== 1 ? 's' : ''} ready for amplification
              </span>
              <button
                onClick={() => setActiveTab('amplification')}
                className="ml-2 text-[10px] font-mono uppercase tracking-wider underline hover:no-underline"
              >
                View →
              </button>
            </li>
          )}
          {stats.pendingConnections > 5 && (
            <li className="flex items-center gap-2 text-white/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {stats.pendingConnections} connection requests pending response
            </li>
          )}
          {stats.activeAsks === 0 && (
            <li className="flex items-center gap-2 text-white/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              No active asks - encourage founders to post
            </li>
          )}
          {stats.newUsersThisWeek === 0 && (
            <li className="flex items-center gap-2 text-white/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              No new signups this week - review acquisition
            </li>
          )}
          {stats.amplifyAsks === 0 && stats.pendingConnections <= 5 && stats.activeAsks > 0 && stats.newUsersThisWeek > 0 && (
            <li className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" strokeWidth={1.5} />
              All metrics healthy - no immediate action needed
            </li>
          )}
        </ul>
      </div>
    </motion.div>
  );
}
