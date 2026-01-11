import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, DollarSign, MapPin, ExternalLink, Bookmark, BookmarkCheck, Flame, Building2, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';

export default function FundingDetailModal({ opportunity, isOpen, onClose, position = { x: 0, y: 0 } }) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const modalRef = useRef(null);

  // Calculate modal position with boundary detection
  const getModalStyle = () => {
    // Default center positioning
    if (!position.x && !position.y) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    // Modal dimensions (approximate)
    const modalWidth = 672; // max-w-2xl = 42rem = 672px
    const modalHeight = Math.min(typeof window !== 'undefined' ? window.innerHeight * 0.9 : 700, 700);
    const padding = 20; // Edge padding
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 900;

    // clientX and clientY are viewport-relative coordinates
    let xPos = position.x;
    let yPos = position.y;

    // Check right boundary - ensure modal doesn't overflow right edge
    if (xPos + modalWidth > viewportWidth - padding) {
      xPos = Math.max(padding, viewportWidth - modalWidth - padding);
    }

    // Check left boundary
    if (xPos < padding) {
      xPos = padding;
    }

    // Check bottom boundary - ensure modal doesn't overflow bottom edge
    if (yPos + modalHeight > viewportHeight - padding) {
      yPos = Math.max(padding, viewportHeight - modalHeight - padding);
    }

    // Check top boundary
    if (yPos < padding) {
      yPos = padding;
    }

    return {
      top: `${yPos}px`,
      left: `${xPos}px`,
      transform: 'none'
    };
  };

  const modalStyle = getModalStyle();

  if (!isOpen || !opportunity) return null;

  const getOpportunityUrl = (opp) => opp?.website || opp?.link || '';
  const getOpportunityDescription = (opp) => opp?.description || opp?.note || opp?.subtitle || '';
  const getOpportunitySectors = (opp) => opp?.sectors || opp?.focus_areas || [];

  const getOpportunityType = (opp) => {
    if (!opp) return 'VC';
    const type = (opp.opportunity_type || '').toLowerCase();
    if (type === 'grant') return 'Grant';
    if (type === 'accelerator' || type === 'accelerator_application') return 'Accelerator';
    if (type === 'competition' || type === 'pitch_competition') return 'Competition';
    if (type === 'fellowship') return 'Fellowship';
    return 'VC';
  };

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    return Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
  };

  const formatCheckSize = (opp) => {
    if (opp.check_size) return opp.check_size;
    if (opp.check_size_min && opp.check_size_max) {
      if (opp.check_size_min === opp.check_size_max) {
        return `$${opp.check_size_min.toLocaleString()}`;
      }
      return `$${opp.check_size_min.toLocaleString()} - $${opp.check_size_max.toLocaleString()}`;
    }
    if (opp.check_size_max) return `Up to $${opp.check_size_max.toLocaleString()}`;
    return 'Varies';
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save opportunities');
      return;
    }

    setSaving(true);
    try {
      if (isSaved) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('resource_id', opportunity.id)
          .eq('resource_type', 'funding_opportunity');

        if (error) throw error;
        setIsSaved(false);
        toast.success('Removed from saved');
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            resource_id: opportunity.id,
            resource_type: 'funding_opportunity'
          });

        if (error) throw error;
        setIsSaved(true);
        toast.success('Saved to your bookmarks');
      }
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const days = getDaysUntilDeadline(opportunity.deadline);
  const isHot = days !== null && days >= 0 && days <= 30;
  const type = getOpportunityType(opportunity);
  const url = getOpportunityUrl(opportunity);
  const description = getOpportunityDescription(opportunity);
  const sectors = getOpportunitySectors(opportunity);
  const stages = Array.isArray(opportunity.stage) ? opportunity.stage : [opportunity.stage].filter(Boolean);

  // Use portal to render modal directly to body, avoiding transform issues
  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed z-[51] w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/20"
        style={modalStyle}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/20 p-6 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isHot && (
                <span className="font-mono text-[10px] text-orange-400 uppercase tracking-[0.15em] px-2 py-1 border border-orange-400/30 flex items-center gap-1">
                  <Flame className="w-3 h-3" strokeWidth={1.5} />
                  {days === 0 ? "TODAY" : `${days} DAYS LEFT`}
                </span>
              )}
              <span className="font-mono text-[10px] text-white/50 uppercase tracking-[0.15em] px-2 py-1 border border-white/20">
                {type}
              </span>
            </div>
            <h2 className="font-mono text-lg uppercase tracking-[0.1em] text-white">
              {opportunity.name}
            </h2>
            {opportunity.organization && (
              <p className="font-mono text-sm text-white/50 mt-1 flex items-center gap-2">
                <Building2 className="w-3 h-3" strokeWidth={1.5} />
                {opportunity.organization}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-crosshair"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div className="p-4 border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">Amount</span>
              </div>
              <p className="font-mono text-lg text-white">{formatCheckSize(opportunity)}</p>
            </div>

            {/* Deadline */}
            <div className="p-4 border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">Deadline</span>
              </div>
              <p className="font-mono text-lg text-white">
                {opportunity.deadline
                  ? new Date(opportunity.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : 'Rolling / Open'
                }
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] block mb-3">Description</span>
            <p className="text-white/70 leading-relaxed">
              {description || 'No description available.'}
            </p>
          </div>

          {/* Stages */}
          {stages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">Eligible Stages</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {stages.map((stage, idx) => (
                  <span key={idx} className="font-mono text-[11px] text-white/70 uppercase tracking-[0.1em] px-3 py-1.5 border border-white/20 bg-white/[0.02]">
                    {stage}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sectors */}
          {sectors.length > 0 && (
            <div>
              <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] block mb-3">Focus Areas</span>
              <div className="flex flex-wrap gap-2">
                {sectors.map((sector, idx) => (
                  <span key={idx} className="font-mono text-[11px] text-white/50 uppercase tracking-[0.1em] px-3 py-1.5 border border-white/10">
                    {sector}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          {opportunity.location && (
            <div className="flex items-center gap-2 text-white/50">
              <MapPin className="w-4 h-4" strokeWidth={1.5} />
              <span className="font-mono text-sm">{opportunity.location}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-[#0a0a0a] border-t border-white/20 p-6 flex items-center justify-between gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 border transition-colors cursor-crosshair flex items-center gap-2 disabled:opacity-50 ${
              isSaved
                ? 'border-white/40 text-white bg-white/10'
                : 'border-white/20 text-white/60 hover:bg-white/[0.02]'
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4" strokeWidth={1.5} />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" strokeWidth={1.5} />
                Save
              </>
            )}
          </button>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 bg-white text-black hover:bg-transparent hover:text-white border border-white transition-colors cursor-crosshair flex items-center gap-2"
          >
            Apply Now
            <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
