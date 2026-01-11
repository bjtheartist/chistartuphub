import { motion } from 'framer-motion';
import {
  Inbox,
  Mail,
  Trash2,
  Calendar,
  Eye,
  Reply,
  Archive,
  Loader2,
} from 'lucide-react';

/**
 * Admin Contact Tab - Manage contact form submissions
 */
export default function AdminContactTab({
  contactSubmissions,
  contactFilter,
  setContactFilter,
  processingIds,
  onContactStatus,
  onDeleteContact,
}) {
  const filteredContacts = contactFilter === 'all'
    ? contactSubmissions
    : contactSubmissions.filter(c => c.status === contactFilter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg text-white font-medium">Contact Submissions</h2>
          <p className="text-sm text-white/40 mt-1">
            Messages from website visitors - review and respond
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'new', label: 'New', count: contactSubmissions.filter(c => c.status === 'new').length },
          { id: 'read', label: 'Read', count: contactSubmissions.filter(c => c.status === 'read').length },
          { id: 'replied', label: 'Replied', count: contactSubmissions.filter(c => c.status === 'replied').length },
          { id: 'archived', label: 'Archived', count: contactSubmissions.filter(c => c.status === 'archived').length },
          { id: 'all', label: 'All', count: contactSubmissions.length },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setContactFilter(f.id)}
            className={`font-mono text-[10px] uppercase tracking-[0.1em] px-4 py-2 border transition-colors ${
              contactFilter === f.id
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-white/50 border-white/10 hover:border-white/30'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Contact List */}
      {filteredContacts.length === 0 ? (
        <div className="border border-white/10 p-12 bg-black/40 text-center">
          <Inbox className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
          <p className="text-white/40">
            {contactFilter === 'new'
              ? 'No new messages'
              : `No ${contactFilter} messages`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContacts.map((contact) => {
            const isProcessing = processingIds.has(contact.id);

            return (
              <div
                key={contact.id}
                className={`border p-6 ${
                  contact.status === 'new'
                    ? 'border-blue-500/20 bg-blue-500/5'
                    : contact.status === 'replied'
                    ? 'border-green-500/20 bg-green-500/5'
                    : contact.status === 'archived'
                    ? 'border-white/5 bg-white/5'
                    : 'border-white/10 bg-black/40'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 border flex items-center justify-center ${
                      contact.status === 'new'
                        ? 'border-blue-500/30 bg-blue-500/10'
                        : contact.status === 'replied'
                        ? 'border-green-500/30 bg-green-500/10'
                        : 'border-white/10 bg-white/5'
                    }`}>
                      <Mail className={`w-5 h-5 ${
                        contact.status === 'new'
                          ? 'text-blue-400'
                          : contact.status === 'replied'
                          ? 'text-green-400'
                          : 'text-white/40'
                      }`} strokeWidth={1.5} />
                    </div>
                    <div>
                      <span className="text-white font-medium block">
                        {contact.name}
                      </span>
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-xs text-white/50 hover:text-white underline"
                      >
                        {contact.email}
                      </a>
                    </div>
                    {/* Status Badge */}
                    <span className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider border ${
                      contact.status === 'new'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : contact.status === 'replied'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : contact.status === 'archived'
                        ? 'bg-white/10 text-white/40 border-white/10'
                        : 'bg-white/10 text-white/50 border-white/20'
                    }`}>
                      {contact.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:${contact.email}?subject=Re: ${encodeURIComponent(contact.subject || 'Your message to ChiStartup Hub')}`}
                      className="p-2 text-white/30 hover:text-blue-400 transition-colors"
                      title="Reply via email"
                      onClick={() => onContactStatus(contact.id, 'replied')}
                    >
                      <Reply className="w-4 h-4" strokeWidth={1.5} />
                    </a>
                    <button
                      onClick={() => onDeleteContact(contact.id)}
                      className="p-2 text-white/30 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Subject */}
                {contact.subject && (
                  <div className="mb-3 text-sm text-white/70 font-medium">
                    Subject: {contact.subject}
                  </div>
                )}

                {/* Message */}
                <div className="p-4 bg-white/5 border border-white/5 mb-4">
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                    {contact.message}
                  </p>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-4 text-xs text-white/30">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" strokeWidth={1.5} />
                      {new Date(contact.created_at).toLocaleDateString()} at {new Date(contact.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {contact.status === 'new' && (
                      <button
                        onClick={() => onContactStatus(contact.id, 'read')}
                        disabled={isProcessing}
                        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-2 border border-white/10 text-white/50 hover:bg-white/10 transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
                        ) : (
                          <Eye className="w-3 h-3" strokeWidth={1.5} />
                        )}
                        Mark Read
                      </button>
                    )}
                    {contact.status !== 'replied' && (
                      <a
                        href={`mailto:${contact.email}?subject=Re: ${encodeURIComponent(contact.subject || 'Your message to ChiStartup Hub')}`}
                        onClick={() => onContactStatus(contact.id, 'replied')}
                        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-2 bg-blue-500 text-white hover:bg-blue-400 transition-colors"
                      >
                        <Reply className="w-3 h-3" strokeWidth={1.5} />
                        Reply
                      </a>
                    )}
                    {contact.status !== 'archived' && (
                      <button
                        onClick={() => onContactStatus(contact.id, 'archived')}
                        disabled={isProcessing}
                        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-2 border border-white/10 text-white/30 hover:text-white/50 transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
                        ) : (
                          <Archive className="w-3 h-3" strokeWidth={1.5} />
                        )}
                        Archive
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
        {contactSubmissions.length} total messages • {contactSubmissions.filter(c => c.status === 'new').length} new
      </div>
    </motion.div>
  );
}
