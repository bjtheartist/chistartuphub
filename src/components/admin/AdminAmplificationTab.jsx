import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Megaphone,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Linkedin,
  Mail,
  Copy,
  Check,
  Download,
  Send,
  Loader2,
  CheckSquare,
} from 'lucide-react';

/**
 * Admin Amplification Tab - Manage ask amplification workflow
 */
export default function AdminAmplificationTab({
  amplificationAsks,
  amplifyFilter,
  setAmplifyFilter,
  processingIds,
  bulkProcessing,
  onMarkAmplified,
  onUndoAmplification,
  onBulkProcess,
}) {
  const [copiedId, setCopiedId] = useState(null);

  // Export CSV handler
  const handleExportCSV = () => {
    const asksToExport = amplifyFilter === 'pending'
      ? amplificationAsks.filter(a => !a.amplified_at)
      : amplifyFilter === 'completed'
      ? amplificationAsks.filter(a => a.amplified_at)
      : amplificationAsks;

    const exportData = asksToExport.map(ask => ({
      founder: ask.user_profiles?.full_name || 'Anonymous',
      company: ask.user_profiles?.company_name || '',
      email: ask.user_profiles?.email || '',
      category: ask.category === 'fundraising' ? 'Raising Capital' :
               ask.category === 'cofounder' ? 'Seeking Co-founder' : 'Seeking Advice',
      sector: ask.sector,
      ask: ask.description,
      amount: ask.category === 'fundraising' ? `$${ask.amount || ask.target_amount || 'TBD'}` : '',
      linkedin: ask.user_profiles?.linkedin_url || '',
      posted: new Date(ask.created_at).toLocaleDateString(),
      amplified: ask.amplified_at ? new Date(ask.amplified_at).toLocaleDateString() : '',
    }));

    const csv = [
      ['Founder', 'Company', 'Email', 'Category', 'Sector', 'Ask', 'Amount', 'LinkedIn', 'Posted', 'Amplified'].join(','),
      ...exportData.map(row => [
        `"${row.founder}"`,
        `"${row.company}"`,
        `"${row.email}"`,
        `"${row.category}"`,
        `"${row.sector}"`,
        `"${row.ask.replace(/"/g, '""')}"`,
        row.amount,
        row.linkedin,
        row.posted,
        row.amplified
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amplification-${amplifyFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  // Generate shareable text for an ask
  const generateShareText = (ask) => `🚀 Chicago Founder Ask

${ask.user_profiles?.full_name || 'A Chicago founder'}${ask.user_profiles?.company_name ? ` from ${ask.user_profiles.company_name}` : ''} is looking for help:

"${ask.description}"

${ask.category === 'fundraising' ? `💰 Raising: $${ask.amount || ask.target_amount || 'TBD'}` : ''}
🏷️ Sector: ${ask.sector}
📍 ${ask.category === 'fundraising' ? 'Fundraising' : ask.category === 'cofounder' ? 'Seeking Co-founder' : 'Seeking Advice'}

${ask.user_profiles?.linkedin_url ? `Connect: ${ask.user_profiles.linkedin_url}` : ''}

---
via ChiStartup Hub`;

  const filteredAmplifyAsks = amplifyFilter === 'pending'
    ? amplificationAsks.filter(a => !a.amplified_at)
    : amplifyFilter === 'completed'
    ? amplificationAsks.filter(a => a.amplified_at)
    : amplificationAsks;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg text-white font-medium">Amplification Queue</h2>
          <p className="text-sm text-white/40 mt-1">
            Weekly workflow: Export → Share → Mark Complete → Notify Founders
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Process All Button */}
          {amplificationAsks.filter(a => !a.amplified_at).length > 0 && (
            <button
              onClick={onBulkProcess}
              disabled={bulkProcessing}
              className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] px-4 py-2 bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {bulkProcessing ? (
                <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
              ) : (
                <Send className="w-3 h-3" strokeWidth={1.5} />
              )}
              Process All ({amplificationAsks.filter(a => !a.amplified_at).length})
            </button>
          )}
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] px-4 py-2 bg-white text-black hover:bg-white/90 transition-colors"
          >
            <Download className="w-3 h-3" strokeWidth={1.5} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'pending', label: 'Pending', count: amplificationAsks.filter(a => !a.amplified_at).length },
          { id: 'completed', label: 'Completed', count: amplificationAsks.filter(a => a.amplified_at).length },
          { id: 'all', label: 'All', count: amplificationAsks.length },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setAmplifyFilter(f.id)}
            className={`font-mono text-[10px] uppercase tracking-[0.1em] px-4 py-2 border transition-colors ${
              amplifyFilter === f.id
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-white/50 border-white/10 hover:border-white/30'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-white/10 p-4 bg-black/40 text-center">
          <div className="text-2xl font-bold text-amber-400">
            {amplificationAsks.filter(a => !a.amplified_at).length}
          </div>
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mt-1">
            Pending
          </div>
        </div>
        <div className="border border-white/10 p-4 bg-black/40 text-center">
          <div className="text-2xl font-bold text-green-400">
            {amplificationAsks.filter(a => a.amplified_at).length}
          </div>
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mt-1">
            Completed
          </div>
        </div>
        <div className="border border-white/10 p-4 bg-black/40 text-center">
          <div className="text-2xl font-bold text-white">
            {amplificationAsks.length}
          </div>
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mt-1">
            Total
          </div>
        </div>
      </div>

      {/* Asks List */}
      {filteredAmplifyAsks.length === 0 ? (
        <div className="border border-white/10 p-12 bg-black/40 text-center">
          <Megaphone className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
          <p className="text-white/40">
            {amplifyFilter === 'pending'
              ? 'No pending asks - all caught up!'
              : amplifyFilter === 'completed'
              ? 'No completed amplifications yet'
              : 'No asks requesting amplification'}
          </p>
          {amplifyFilter === 'pending' && amplificationAsks.length > 0 && (
            <button
              onClick={() => setAmplifyFilter('completed')}
              className="mt-4 text-xs text-amber-400 underline hover:no-underline"
            >
              View completed →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAmplifyAsks.map((ask) => {
            const isProcessing = processingIds.has(ask.id);
            const isCompleted = !!ask.amplified_at;
            const shareText = generateShareText(ask);

            return (
              <div
                key={ask.id}
                className={`border p-6 transition-colors ${
                  isCompleted
                    ? 'border-green-500/20 bg-green-500/5'
                    : 'border-amber-500/20 bg-amber-500/5'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 border flex items-center justify-center ${
                      isCompleted
                        ? 'border-green-500/30 bg-green-500/10'
                        : 'border-amber-500/30 bg-amber-500/10'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-400" strokeWidth={1.5} />
                      ) : (
                        <Megaphone className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
                      )}
                    </div>
                    <div>
                      <span className="text-white font-medium">
                        {ask.user_profiles?.full_name || 'Anonymous'}
                      </span>
                      {ask.user_profiles?.company_name && (
                        <span className="text-white/40 text-sm block">
                          {ask.user_profiles.company_name}
                        </span>
                      )}
                    </div>
                    {isCompleted && (
                      <span className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider bg-green-500/20 text-green-400 border border-green-500/30">
                        Amplified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {ask.user_profiles?.linkedin_url && (
                      <a
                        href={ask.user_profiles.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-white/30 hover:text-blue-400 transition-colors"
                        title="View LinkedIn"
                      >
                        <Linkedin className="w-4 h-4" strokeWidth={1.5} />
                      </a>
                    )}
                    {ask.user_profiles?.email && (
                      <a
                        href={`mailto:${ask.user_profiles.email}`}
                        className="p-2 text-white/30 hover:text-amber-400 transition-colors"
                        title={`Email ${ask.user_profiles.email}`}
                      >
                        <Mail className="w-4 h-4" strokeWidth={1.5} />
                      </a>
                    )}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareText);
                        setCopiedId(ask.id);
                        setTimeout(() => setCopiedId(null), 2000);
                        toast.success('Copied to clipboard!');
                      }}
                      className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-2 border transition-colors ${
                        copiedId === ask.id
                          ? 'bg-green-500/20 border-green-500/30 text-green-400'
                          : 'border-white/10 text-white/50 hover:bg-white hover:text-black'
                      }`}
                      title="Copy for sharing"
                    >
                      {copiedId === ask.id ? (
                        <>
                          <Check className="w-3 h-3" strokeWidth={1.5} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" strokeWidth={1.5} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Category & Sector */}
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-2 py-1 text-xs border ${
                    ask.category === 'fundraising'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : ask.category === 'cofounder'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  }`}>
                    {ask.category === 'fundraising' ? 'Fundraising' :
                     ask.category === 'cofounder' ? 'Co-founder' : 'Advice'}
                  </span>
                  <span className="text-xs text-white/40">{ask.sector}</span>
                  {ask.category === 'fundraising' && (ask.amount || ask.target_amount) && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <DollarSign className="w-3 h-3" strokeWidth={1.5} />
                      {ask.amount || ask.target_amount}
                    </span>
                  )}
                </div>

                {/* Ask Description */}
                <p className="text-white/70 text-sm leading-relaxed mb-4">
                  {ask.description}
                </p>

                {/* Preview Box */}
                <details className="group mb-4">
                  <summary className="cursor-pointer text-xs text-white/30 hover:text-white/50 font-mono uppercase tracking-wider">
                    Preview share text
                  </summary>
                  <pre className="mt-3 p-4 bg-black/60 border border-white/10 text-xs text-white/50 whitespace-pre-wrap overflow-x-auto">
                    {shareText}
                  </pre>
                </details>

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-4 text-xs text-white/30">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" strokeWidth={1.5} />
                      Posted {new Date(ask.created_at).toLocaleDateString()}
                    </span>
                    {isCompleted && ask.amplified_at && (
                      <span className="flex items-center gap-1 text-green-400/70">
                        <CheckCircle className="w-3 h-3" strokeWidth={1.5} />
                        Amplified {new Date(ask.amplified_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <button
                        onClick={() => onUndoAmplification(ask.id)}
                        disabled={isProcessing}
                        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-2 border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
                        ) : (
                          <XCircle className="w-3 h-3" strokeWidth={1.5} />
                        )}
                        Undo
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onMarkAmplified(ask, false)}
                          disabled={isProcessing}
                          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-2 border border-white/10 text-white/50 hover:bg-white/10 transition-colors disabled:opacity-50"
                          title="Mark as done without notifying"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
                          ) : (
                            <CheckSquare className="w-3 h-3" strokeWidth={1.5} />
                          )}
                          Mark Done
                        </button>
                        <button
                          onClick={() => onMarkAmplified(ask, true)}
                          disabled={isProcessing}
                          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-2 bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
                          title="Mark as done and notify founder"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
                          ) : (
                            <Send className="w-3 h-3" strokeWidth={1.5} />
                          )}
                          Done & Notify
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-white/30 mt-4">
        {amplificationAsks.length} total asks • {amplificationAsks.filter(a => !a.amplified_at).length} pending • {amplificationAsks.filter(a => a.amplified_at).length} completed
      </div>
    </motion.div>
  );
}
