import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { sendAmplificationEmail } from '@/lib/email';
import { BureauAtmosphere, BureauFooter } from '@/components/bureau';
import SEO from '@/components/SEO';
import {
  Users,
  MessageSquare,
  HandHelping,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  BarChart3,
  Eye,
  Trash2,
  Shield,
  RefreshCw,
  Search,
  Loader2,
  Megaphone,
  Download,
  Copy,
  Check,
  Linkedin,
  Mail,
  CheckSquare,
  Send,
  Calendar,
  FileText,
  Inbox,
  Link,
  Reply,
  Archive
} from 'lucide-react';
import { ADMIN_EMAILS } from '@/constants/adminEmails';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Analytics data
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFounders: 0,
    totalHelpers: 0,
    newUsersThisWeek: 0,
    totalAsks: 0,
    activeAsks: 0,
    amplifyAsks: 0,
    totalConnections: 0,
    pendingConnections: 0,
    acceptedConnections: 0,
    declinedConnections: 0,
  });

  // Data lists
  const [users, setUsers] = useState([]);
  const [asks, setAsks] = useState([]);
  const [connections, setConnections] = useState([]);
  const [amplificationAsks, setAmplificationAsks] = useState([]);
  const [resourceSubmissions, setResourceSubmissions] = useState([]);
  const [contactSubmissions, setContactSubmissions] = useState([]);

  // Export state
  const [copiedId, setCopiedId] = useState(null);

  // Filters
  const [userFilter, setUserFilter] = useState('all');
  const [askFilter, setAskFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [amplifyFilter, setAmplifyFilter] = useState('pending'); // 'pending', 'completed', 'all'
  const [resourceFilter, setResourceFilter] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'
  const [contactFilter, setContactFilter] = useState('new'); // 'new', 'read', 'replied', 'archived', 'all'

  // Processing states
  const [processingIds, setProcessingIds] = useState(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const isAdmin = ADMIN_EMAILS.includes(user.email);
    if (!isAdmin) {
      toast.error('Access denied', { description: 'Admin privileges required' });
      navigate('/');
      return;
    }

    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchAsks(),
        fetchConnections(),
        fetchAmplificationAsks(),
        fetchResourceSubmissions(),
        fetchContactSubmissions(),
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // Get user counts
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    const { count: totalFounders } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'founder');

    // Get asks counts
    const { count: totalAsks } = await supabase
      .from('founder_asks')
      .select('*', { count: 'exact', head: true });

    const { count: activeAsks } = await supabase
      .from('founder_asks')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: amplifyAsks } = await supabase
      .from('founder_asks')
      .select('*', { count: 'exact', head: true })
      .eq('allow_amplification', true)
      .eq('is_active', true);

    // Get connection counts
    const { count: totalConnections } = await supabase
      .from('connection_requests')
      .select('*', { count: 'exact', head: true });

    const { count: pendingConnections } = await supabase
      .from('connection_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: acceptedConnections } = await supabase
      .from('connection_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted');

    const { count: declinedConnections } = await supabase
      .from('connection_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'declined');

    // New users this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: newUsersThisWeek } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    setStats({
      totalUsers: totalUsers || 0,
      totalFounders: totalFounders || 0,
      totalHelpers: (totalUsers || 0) - (totalFounders || 0),
      newUsersThisWeek: newUsersThisWeek || 0,
      totalAsks: totalAsks || 0,
      activeAsks: activeAsks || 0,
      amplifyAsks: amplifyAsks || 0,
      totalConnections: totalConnections || 0,
      pendingConnections: pendingConnections || 0,
      acceptedConnections: acceptedConnections || 0,
      declinedConnections: declinedConnections || 0,
    });
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('user_profiles_decrypted')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error) setUsers(data || []);
  };

  const fetchAsks = async () => {
    const { data, error } = await supabase
      .from('founder_asks')
      .select(`
        *,
        user_profiles (full_name, email, company_name),
        connection_requests (count)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error) setAsks(data || []);
  };

  const fetchConnections = async () => {
    const { data, error } = await supabase
      .from('connection_requests')
      .select(`
        *,
        founder_asks (description, sector, category)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error) setConnections(data || []);
  };

  const fetchAmplificationAsks = async () => {
    const { data, error } = await supabase
      .from('founder_asks')
      .select(`
        *,
        user_profiles (id, full_name, email, company_name, linkedin_url)
      `)
      .eq('allow_amplification', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error) setAmplificationAsks(data || []);
  };

  const fetchResourceSubmissions = async () => {
    const { data, error } = await supabase
      .from('resource_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error) setResourceSubmissions(data || []);
  };

  const fetchContactSubmissions = async () => {
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error) setContactSubmissions(data || []);
  };

  // Mark an ask as amplified and notify founder
  const handleMarkAmplified = async (ask, notify = true) => {
    setProcessingIds(prev => new Set([...prev, ask.id]));

    try {
      const now = new Date().toISOString();

      // Update the ask
      const updateData = {
        amplified_at: now,
      };

      if (notify) {
        updateData.amplification_notified_at = now;
      }

      const { error } = await supabase
        .from('founder_asks')
        .update(updateData)
        .eq('id', ask.id);

      if (error) throw error;

      // Send email notification if requested
      if (notify && ask.user_profiles?.email) {
        const emailResult = await sendAmplificationEmail(ask.user_profiles.email, {
          founderName: ask.user_profiles.full_name || 'Founder',
          askDescription: ask.description,
        });

        if (emailResult.success) {
          console.log(`[AMPLIFICATION] Email sent to founder (ask: ${ask.id})`);
        } else {
          console.error(`[AMPLIFICATION] Email failed:`, emailResult.error);
          // Don't throw - amplification is marked, just email failed
          toast.warning('Marked as amplified, but email failed', {
            description: emailResult.error,
          });
          return;
        }
      }

      toast.success(
        notify ? 'Marked as amplified & founder notified!' : 'Marked as amplified',
        { description: ask.user_profiles?.full_name || 'Founder' }
      );

      // Refresh data
      await fetchAmplificationAsks();
      await fetchStats();
    } catch (error) {
      console.error('Error marking as amplified:', error);
      toast.error('Failed to update', { description: error.message });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(ask.id);
        return next;
      });
    }
  };

  // Bulk process all pending amplifications
  const handleBulkProcess = async () => {
    const pendingAsks = amplificationAsks.filter(a => !a.amplified_at);

    if (pendingAsks.length === 0) {
      toast.info('No pending asks to process');
      return;
    }

    if (!confirm(`Process ${pendingAsks.length} asks and notify founders?`)) return;

    setBulkProcessing(true);

    try {
      const now = new Date().toISOString();

      // Update all pending asks
      const { error } = await supabase
        .from('founder_asks')
        .update({
          amplified_at: now,
          amplification_notified_at: now,
        })
        .in('id', pendingAsks.map(a => a.id));

      if (error) throw error;

      // Send emails to all founders
      const emailPromises = pendingAsks
        .filter(a => a.user_profiles?.email)
        .map(a => sendAmplificationEmail(a.user_profiles.email, {
          founderName: a.user_profiles.full_name || 'Founder',
          askDescription: a.description,
        }));

      const emailResults = await Promise.allSettled(emailPromises);
      const successCount = emailResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failCount = emailResults.length - successCount;

      console.log(`[AMPLIFICATION] Bulk emails: ${successCount} sent, ${failCount} failed`);

      if (failCount > 0) {
        toast.success(`Processed ${pendingAsks.length} asks!`, {
          description: `${successCount} emails sent, ${failCount} failed`,
        });
      } else {
        toast.success(`Processed ${pendingAsks.length} asks!`, {
          description: 'All founders have been notified',
        });
      }

      // Refresh data
      await fetchAmplificationAsks();
      await fetchStats();
    } catch (error) {
      console.error('Error bulk processing:', error);
      toast.error('Failed to process', { description: error.message });
    } finally {
      setBulkProcessing(false);
    }
  };

  // Undo amplification (for mistakes)
  const handleUndoAmplification = async (askId) => {
    if (!confirm('Undo this amplification? The founder was already notified.')) return;

    setProcessingIds(prev => new Set([...prev, askId]));

    try {
      const { error } = await supabase
        .from('founder_asks')
        .update({
          amplified_at: null,
          amplification_notified_at: null,
        })
        .eq('id', askId);

      if (error) throw error;

      toast.success('Amplification undone');
      await fetchAmplificationAsks();
      await fetchStats();
    } catch (error) {
      console.error('Error undoing amplification:', error);
      toast.error('Failed to undo', { description: error.message });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(askId);
        return next;
      });
    }
  };

  // Admin actions
  const handleDeactivateAsk = async (askId) => {
    if (!confirm('Deactivate this ask?')) return;

    const { error } = await supabase
      .from('founder_asks')
      .update({ is_active: false })
      .eq('id', askId);

    if (error) {
      toast.error('Failed to deactivate ask');
    } else {
      toast.success('Ask deactivated');
      fetchAsks();
      fetchStats();
    }
  };

  const handleDeleteAsk = async (askId) => {
    if (!confirm('Permanently delete this ask? This cannot be undone.')) return;

    const { error } = await supabase
      .from('founder_asks')
      .delete()
      .eq('id', askId);

    if (error) {
      console.error('[ADMIN] Delete ask error:', error);
      toast.error('Failed to delete ask', {
        description: error.message || 'Check RLS policies'
      });
    } else {
      toast.success('Ask deleted');
      fetchAsks();
      fetchStats();
    }
  };

  // Resource submission actions
  const handleResourceStatus = async (resourceId, status) => {
    setProcessingIds(prev => new Set([...prev, resourceId]));

    try {
      const { error } = await supabase
        .from('resource_submissions')
        .update({ status })
        .eq('id', resourceId);

      if (error) throw error;

      toast.success(`Resource ${status}`);
      await fetchResourceSubmissions();
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update', { description: error.message });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(resourceId);
        return next;
      });
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!confirm('Delete this resource submission?')) return;

    const { error } = await supabase
      .from('resource_submissions')
      .delete()
      .eq('id', resourceId);

    if (error) {
      toast.error('Failed to delete resource');
    } else {
      toast.success('Resource deleted');
      fetchResourceSubmissions();
    }
  };

  // Contact submission actions
  const handleContactStatus = async (contactId, status) => {
    setProcessingIds(prev => new Set([...prev, contactId]));

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ status })
        .eq('id', contactId);

      if (error) throw error;

      toast.success(`Marked as ${status}`);
      await fetchContactSubmissions();
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update', { description: error.message });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(contactId);
        return next;
      });
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!confirm('Delete this contact submission?')) return;

    const { error } = await supabase
      .from('contact_submissions')
      .delete()
      .eq('id', contactId);

    if (error) {
      toast.error('Failed to delete contact');
    } else {
      toast.success('Contact deleted');
      fetchContactSubmissions();
    }
  };

  // Filter data
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

  const filteredAsks = asks.filter(a => {
    if (askFilter === 'active' && !a.is_active) return false;
    if (askFilter === 'inactive' && a.is_active) return false;
    if (askFilter === 'fundraising' && a.category !== 'fundraising') return false;
    if (askFilter === 'cofounder' && a.category !== 'cofounder') return false;
    if (askFilter === 'advice' && a.category !== 'general_advice') return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050A14]">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  // Category breakdown for asks
  const asksByCategory = {
    fundraising: asks.filter(a => a.category === 'fundraising').length,
    cofounder: asks.filter(a => a.category === 'cofounder').length,
    general_advice: asks.filter(a => a.category === 'general_advice').length,
  };

  return (
    <div className="min-h-screen relative" data-page="admin">
      <SEO title="Admin Dashboard | ChiStartup Hub" description="Admin controls and analytics" />
      <BureauAtmosphere />

      <div className="relative z-10 pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-white/50" strokeWidth={1.5} />
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
                [ADMIN: DASHBOARD]
              </span>
            </div>
            <h1 className="font-serif text-4xl text-white">Platform Controls</h1>
            <p className="text-white/50 mt-2">Monitor, moderate, and manage the ecosystem</p>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={fetchAllData}
              className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] px-4 py-2 border border-white/20 text-white/50 hover:bg-white hover:text-black transition-colors"
            >
              <RefreshCw className="w-3 h-3" strokeWidth={1.5} />
              Refresh Data
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'asks', label: 'Asks', icon: MessageSquare },
              { id: 'connections', label: 'Connections', icon: HandHelping },
              { id: 'amplification', label: 'Amplify', icon: Megaphone, badge: amplificationAsks.filter(a => !a.amplified_at).length },
              { id: 'resources', label: 'Resources', icon: FileText, badge: resourceSubmissions.filter(r => r.status === 'pending').length },
              { id: 'contact', label: 'Contact', icon: Inbox, badge: contactSubmissions.filter(c => c.status === 'new').length },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] px-5 py-3 border transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-white/50 border-white/10 hover:border-white/30'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full ${
                      activeTab === tab.id
                        ? 'bg-black/20 text-black'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
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
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
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
          )}

          {/* ASKS TAB */}
          {activeTab === 'asks' && (
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
                            onClick={() => handleDeactivateAsk(ask.id)}
                            className="p-2 text-white/30 hover:text-yellow-400 transition-colors"
                            title="Deactivate"
                          >
                            <Eye className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAsk(ask.id)}
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
          )}

          {/* CONNECTIONS TAB */}
          {activeTab === 'connections' && (
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
          )}

          {/* AMPLIFICATION TAB */}
          {activeTab === 'amplification' && (
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
                      onClick={handleBulkProcess}
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
                    onClick={() => {
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
                    }}
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

              {(() => {
                const filteredAmplifyAsks = amplifyFilter === 'pending'
                  ? amplificationAsks.filter(a => !a.amplified_at)
                  : amplifyFilter === 'completed'
                  ? amplificationAsks.filter(a => a.amplified_at)
                  : amplificationAsks;

                if (filteredAmplifyAsks.length === 0) {
                  return (
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
                  );
                }

                return (
                  <div className="space-y-4">
                    {filteredAmplifyAsks.map((ask) => {
                      const isProcessing = processingIds.has(ask.id);
                      const isCompleted = !!ask.amplified_at;

                      // Generate shareable text for this ask
                      const shareText = `🚀 Chicago Founder Ask

${ask.user_profiles?.full_name || 'A Chicago founder'}${ask.user_profiles?.company_name ? ` from ${ask.user_profiles.company_name}` : ''} is looking for help:

"${ask.description}"

${ask.category === 'fundraising' ? `💰 Raising: $${ask.amount || ask.target_amount || 'TBD'}` : ''}
🏷️ Sector: ${ask.sector}
📍 ${ask.category === 'fundraising' ? 'Fundraising' : ask.category === 'cofounder' ? 'Seeking Co-founder' : 'Seeking Advice'}

${ask.user_profiles?.linkedin_url ? `Connect: ${ask.user_profiles.linkedin_url}` : ''}

---
via ChiStartup Hub`;

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
                              {/* Status Badge */}
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
                                  onClick={() => handleUndoAmplification(ask.id)}
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
                                    onClick={() => handleMarkAmplified(ask, false)}
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
                                    onClick={() => handleMarkAmplified(ask, true)}
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
                );
              })()}

              <div className="text-xs text-white/30 mt-4">
                {amplificationAsks.length} total asks • {amplificationAsks.filter(a => !a.amplified_at).length} pending • {amplificationAsks.filter(a => a.amplified_at).length} completed
              </div>
            </motion.div>
          )}

          {/* RESOURCES TAB */}
          {activeTab === 'resources' && (
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

              {(() => {
                const filteredResources = resourceFilter === 'all'
                  ? resourceSubmissions
                  : resourceSubmissions.filter(r => r.status === resourceFilter);

                if (filteredResources.length === 0) {
                  return (
                    <div className="border border-white/10 p-12 bg-black/40 text-center">
                      <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
                      <p className="text-white/40">
                        {resourceFilter === 'pending'
                          ? 'No pending submissions'
                          : `No ${resourceFilter} resources`}
                      </p>
                    </div>
                  );
                }

                return (
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
                                onClick={() => handleDeleteResource(resource.id)}
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
                                    onClick={() => handleResourceStatus(resource.id, 'rejected')}
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
                                    onClick={() => handleResourceStatus(resource.id, 'approved')}
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
                                  onClick={() => handleResourceStatus(resource.id, 'pending')}
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
                );
              })()}

              <div className="text-xs text-white/30 mt-4">
                {resourceSubmissions.length} total submissions • {resourceSubmissions.filter(r => r.status === 'pending').length} pending
              </div>
            </motion.div>
          )}

          {/* CONTACT TAB */}
          {activeTab === 'contact' && (
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

              {(() => {
                const filteredContacts = contactFilter === 'all'
                  ? contactSubmissions
                  : contactSubmissions.filter(c => c.status === contactFilter);

                if (filteredContacts.length === 0) {
                  return (
                    <div className="border border-white/10 p-12 bg-black/40 text-center">
                      <Inbox className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
                      <p className="text-white/40">
                        {contactFilter === 'new'
                          ? 'No new messages'
                          : `No ${contactFilter} messages`}
                      </p>
                    </div>
                  );
                }

                return (
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
                                onClick={() => handleContactStatus(contact.id, 'replied')}
                              >
                                <Reply className="w-4 h-4" strokeWidth={1.5} />
                              </a>
                              <button
                                onClick={() => handleDeleteContact(contact.id)}
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
                                  onClick={() => handleContactStatus(contact.id, 'read')}
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
                                  onClick={() => handleContactStatus(contact.id, 'replied')}
                                  className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-2 bg-blue-500 text-white hover:bg-blue-400 transition-colors"
                                >
                                  <Reply className="w-3 h-3" strokeWidth={1.5} />
                                  Reply
                                </a>
                              )}
                              {contact.status !== 'archived' && (
                                <button
                                  onClick={() => handleContactStatus(contact.id, 'archived')}
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
                );
              })()}

              <div className="text-xs text-white/30 mt-4">
                {contactSubmissions.length} total messages • {contactSubmissions.filter(c => c.status === 'new').length} new
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <BureauFooter />
    </div>
  );
}
