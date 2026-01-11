import { motion } from 'framer-motion';

/**
 * Admin Connections Tab - View connection requests
 */
export default function AdminConnectionsTab({ connections }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="space-y-4">
        {connections.map((conn) => (
          <div key={conn.id} className="border border-white/10 p-6 bg-black/40">
            <div className="flex justify-between items-start mb-3">
              <span className={`px-2 py-1 text-xs rounded-full border ${
                conn.status === 'pending'
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  : conn.status === 'accepted'
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {conn.status}
              </span>
              <span className="text-xs text-white/30">
                {new Date(conn.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/40 text-xs block mb-1">Requester</span>
                <span className="text-white">{conn.requester_name || 'Unknown'}</span>
                <span className="text-white/30 text-xs block">{conn.requester_email || `ID: ${conn.requester_id?.slice(0, 8)}...`}</span>
              </div>
              <div>
                <span className="text-white/40 text-xs block mb-1">Ask</span>
                <span className="text-white/60 line-clamp-1">
                  {conn.founder_asks?.description || 'Ask not available'}
                </span>
              </div>
            </div>

            <div className="mt-3 p-3 bg-white/5 border border-white/5">
              <span className="text-white/30 text-xs block mb-1">Message</span>
              <p className="text-white/50 text-sm">{conn.requester_context}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-white/30 mt-4">
        Showing {connections.length} connection requests
      </div>
    </motion.div>
  );
}
