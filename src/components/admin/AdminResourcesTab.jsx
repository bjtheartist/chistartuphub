import { motion } from 'framer-motion';
import {
  FileText,
  Link,
  Trash2,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';

/**
 * Admin Resources Tab - Manage resource submissions
 */
export default function AdminResourcesTab({
  resourceSubmissions,
  resourceFilter,
  setResourceFilter,
  processingIds,
  onResourceStatus,
  onDeleteResource,
}) {
  const filteredResources = resourceFilter === 'all'
    ? resourceSubmissions
    : resourceSubmissions.filter(r => r.status === resourceFilter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg text-white font-medium">Resource Submissions</h2>
          <p className="text-sm text-white/40 mt-1">
            Review and approve community-submitted resources
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'pending', label: 'Pending', count: resourceSubmissions.filter(r => r.status === 'pending').length },
          { id: 'approved', label: 'Approved', count: resourceSubmissions.filter(r => r.status === 'approved').length },
          { id: 'rejected', label: 'Rejected', count: resourceSubmissions.filter(r => r.status === 'rejected').length },
          { id: 'all', label: 'All', count: resourceSubmissions.length },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setResourceFilter(f.id)}
            className={`font-mono text-[10px] uppercase tracking-[0.1em] px-4 py-2 border transition-colors ${
              resourceFilter === f.id
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-white/50 border-white/10 hover:border-white/30'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Resources List */}
      {filteredResources.length === 0 ? (
        <div className="border border-white/10 p-12 bg-black/40 text-center">
          <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
          <p className="text-white/40">
            {resourceFilter === 'pending'
              ? 'No pending submissions'
              : `No ${resourceFilter} resources`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResources.map((resource) => {
            const isProcessing = processingIds.has(resource.id);

            return (
              <div
                key={resource.id}
                className={`border p-6 ${
                  resource.status === 'approved'
                    ? 'border-green-500/20 bg-green-500/5'
                    : resource.status === 'rejected'
                    ? 'border-red-500/20 bg-red-500/5'
                    : 'border-amber-500/20 bg-amber-500/5'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 border flex items-center justify-center ${
                      resource.status === 'approved'
                        ? 'border-green-500/30 bg-green-500/10'
                        : resource.status === 'rejected'
                        ? 'border-red-500/30 bg-red-500/10'
                        : 'border-amber-500/30 bg-amber-500/10'
                    }`}>
                      <FileText className={`w-5 h-5 ${
                        resource.status === 'approved'
                          ? 'text-green-400'
                          : resource.status === 'rejected'
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }`} strokeWidth={1.5} />
                    </div>
                    <div>
                      <span className="text-white font-medium block">
                        {resource.resource_name}
                      </span>
                      <span className="text-xs text-white/40">
                        {resource.category}
                      </span>
                    </div>
                    {/* Status Badge */}
                    <span className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider border ${
                      resource.status === 'approved'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : resource.status === 'rejected'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {resource.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {resource.resource_url && (
                      <a
                        href={resource.resource_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-white/30 hover:text-blue-400 transition-colors"
                        title="Visit URL"
                      >
                        <Link className="w-4 h-4" strokeWidth={1.5} />
                      </a>
                    )}
                    <button
                      onClick={() => onDeleteResource(resource.id)}
                      className="p-2 text-white/30 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* URL */}
                <div className="mb-3 p-2 bg-white/5 border border-white/5 font-mono text-[10px] text-white/50 break-all">
                  {resource.resource_url}
                </div>

                {/* Description */}
                <p className="text-white/70 text-sm leading-relaxed mb-4">
                  {resource.description}
                </p>

                {/* Submitter Info */}
                {(resource.submitter_name || resource.submitter_email) && (
                  <div className="flex items-center gap-4 text-xs text-white/30 mb-4">
                    <span>Submitted by: {resource.submitter_name || 'Anonymous'}</span>
                    {resource.submitter_email && (
                      <a
                        href={`mailto:${resource.submitter_email}`}
                        className="text-white/50 hover:text-white underline"
                      >
                        {resource.submitter_email}
                      </a>
                    )}
                  </div>
                )}

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-4 text-xs text-white/30">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" strokeWidth={1.5} />
                      {new Date(resource.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {resource.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onResourceStatus(resource.id, 'rejected')}
                          disabled={isProcessing}
                          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
                          ) : (
                            <XCircle className="w-3 h-3" strokeWidth={1.5} />
                          )}
                          Reject
                        </button>
                        <button
                          onClick={() => onResourceStatus(resource.id, 'approved')}
                          disabled={isProcessing}
                          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-2 bg-green-500 text-black hover:bg-green-400 transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
                          ) : (
                            <CheckCircle className="w-3 h-3" strokeWidth={1.5} />
                          )}
                          Approve
                        </button>
                      </>
                    )}
                    {resource.status !== 'pending' && (
                      <button
                        onClick={() => onResourceStatus(resource.id, 'pending')}
                        disabled={isProcessing}
                        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-2 border border-white/10 text-white/50 hover:bg-white/10 transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
                        ) : (
                          <RefreshCw className="w-3 h-3" strokeWidth={1.5} />
                        )}
                        Reset to Pending
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-white/30 mt-4">
        {resourceSubmissions.length} total submissions • {resourceSubmissions.filter(r => r.status === 'pending').length} pending
      </div>
    </motion.div>
  );
}
