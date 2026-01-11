import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

/**
 * Admin Users Tab - User management and listing
 */
export default function AdminUsersTab({
  users,
  userFilter,
  setUserFilter,
  searchQuery,
  setSearchQuery,
}) {
  // Filter users based on role and search
  const filteredUsers = users.filter(u => {
    if (userFilter === 'founders' && u.role !== 'founder') return false;
    if (userFilter === 'helpers' && u.role === 'founder') return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        u.full_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.company_name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="bg-black/40 border border-white/10 py-2 px-4 text-sm text-white focus:outline-none"
        >
          <option value="all">All Users</option>
          <option value="founders">Founders Only</option>
          <option value="helpers">Helpers Only</option>
        </select>
      </div>

      {/* Users List */}
      <div className="border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/40 p-4">User</th>
              <th className="text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/40 p-4">Role</th>
              <th className="text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/40 p-4">Company</th>
              <th className="text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/40 p-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4">
                  <div>
                    <span className="text-white text-sm">{u.full_name || 'No name'}</span>
                    <span className="text-white/30 text-xs block">{u.email}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    u.role === 'founder'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {u.role || 'explorer'}
                  </span>
                </td>
                <td className="p-4 text-sm text-white/50">{u.company_name || '-'}</td>
                <td className="p-4 text-sm text-white/30">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-white/30 mt-2">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </motion.div>
  );
}
