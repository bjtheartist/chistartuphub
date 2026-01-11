import { motion } from 'framer-motion';
import {
  Eye,
  Trash2,
  DollarSign,
  HandHelping,
} from 'lucide-react';

/**
 * Admin Asks Tab - Manage founder asks
 */
export default function AdminAsksTab({
  stats,
  asks,
  askFilter,
  setAskFilter,
  onDeactivateAsk,
  onDeleteAsk,
}) {
  // Filter asks based on selected filter
  const filteredAsks = asks.filter(a => {
    if (askFilter === 'active' && !a.is_active) return false;
    if (askFilter === 'inactive' && a.is_active) return false;
    if (askFilter === 'fundraising' && a.category !== 'fundraising') return false;
    if (askFilter === 'cofounder' && a.category !== 'cofounder') return false;
    if (askFilter === 'advice' && a.category !== 'general_advice') return false;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="border border-white/10 p-4 bg-black/40 text-center">
          <div className="text-2xl font-bold text-white">{stats.totalAsks}</div>
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mt-1">Total Asks</div>
        </div>
        <div className="border border-green-500/20 p-4 bg-green-500/5 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.activeAsks}</div>
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mt-1">Active</div>
        </div>
        <div className="border border-white/10 p-4 bg-black/40 text-center">
          <div className="text-2xl font-bold text-white/50">{stats.totalAsks - stats.activeAsks}</div>
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mt-1">Inactive</div>
        </div>
        <div className="border border-amber-500/20 p-4 bg-amber-500/5 text-center">
          <div className="text-2xl font-bold text-amber-400">{stats.amplifyAsks}</div>
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mt-1">Amplify Ready</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'all', label: 'All' },
          { id: 'active', label: 'Active' },
          { id: 'inactive', label: 'Inactive' },
          { id: 'fundraising', label: 'Fundraising' },
          { id: 'cofounder', label: 'Co-founder' },
          { id: 'advice', label: 'Advice' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setAskFilter(f.id)}
            className={`font-mono text-[10px] uppercase tracking-[0.1em] px-4 py-2 border transition-colors ${
              askFilter === f.id
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-white/50 border-white/10 hover:border-white/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Asks List */}
      <div className="space-y-4">
        {filteredAsks.map((ask) => (
          <div key={ask.id} className="border border-white/10 p-6 bg-black/40">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs rounded-full border ${
                  ask.is_active
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}>
                  {ask.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-white/40 uppercase">
                  {ask.category === 'fundraising' ? 'Fundraising' :
                   ask.category === 'cofounder' ? 'Co-founder' : 'Advice'}
                </span>
                <span className="text-xs text-white/30">• {ask.sector}</span>
              </div>
              <div className="flex items-center gap-2">
                {ask.is_active && (
                  <button
                    onClick={() => onDeactivateAsk(ask.id)}
                    className="p-2 text-white/30 hover:text-yellow-400 transition-colors"
                    title="Deactivate"
                  >
                    <Eye className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                )}
                <button
                  onClick={() => onDeleteAsk(ask.id)}
                  className="p-2 text-white/30 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <p className="text-white/70 text-sm mb-3">{ask.description}</p>

            <div className="flex items-center justify-between text-xs text-white/40">
              <div>
                By: {ask.user_profiles?.full_name || 'Anonymous'}
                {ask.user_profiles?.company_name && ` (${ask.user_profiles.company_name})`}
              </div>
              <div className="flex items-center gap-4">
                {ask.amount && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" strokeWidth={1.5} />
                    {ask.amount}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <HandHelping className="w-3 h-3" strokeWidth={1.5} />
                  {ask.connection_requests?.[0]?.count || 0} offers
                </span>
                <span>{new Date(ask.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-white/30 mt-4">
        Showing {filteredAsks.length} of {asks.length} asks
      </div>
    </motion.div>
  );
}
