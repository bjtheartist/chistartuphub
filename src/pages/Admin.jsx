import { useState, useEffect } from 'react';
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
  BarChart3,
  Shield,
  RefreshCw,
  Loader2,
  Megaphone,
  FileText,
  Inbox,
} from 'lucide-react';
import { ADMIN_EMAILS } from '@/constants/adminEmails';
import {
  AdminOverviewTab,
  AdminUsersTab,
  AdminAsksTab,
  AdminConnectionsTab,
  AdminAmplificationTab,
  AdminResourcesTab,
  AdminContactTab,
} from '@/components/admin';

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
            <AdminOverviewTab
              stats={stats}
              asks={asks}
              setActiveTab={setActiveTab}
            />
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <AdminUsersTab
              users={users}
              userFilter={userFilter}
              setUserFilter={setUserFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}

          {/* ASKS TAB */}
          {activeTab === 'asks' && (
            <AdminAsksTab
              stats={stats}
              asks={asks}
              askFilter={askFilter}
              setAskFilter={setAskFilter}
              onDeactivateAsk={handleDeactivateAsk}
              onDeleteAsk={handleDeleteAsk}
            />
          )}

          {/* CONNECTIONS TAB */}
          {activeTab === 'connections' && (
            <AdminConnectionsTab connections={connections} />
          )}

          {/* AMPLIFICATION TAB */}
          {activeTab === 'amplification' && (
            <AdminAmplificationTab
              amplificationAsks={amplificationAsks}
              amplifyFilter={amplifyFilter}
              setAmplifyFilter={setAmplifyFilter}
              processingIds={processingIds}
              bulkProcessing={bulkProcessing}
              onMarkAmplified={handleMarkAmplified}
              onUndoAmplification={handleUndoAmplification}
              onBulkProcess={handleBulkProcess}
            />
          )}

          {/* RESOURCES TAB */}
          {activeTab === 'resources' && (
            <AdminResourcesTab
              resourceSubmissions={resourceSubmissions}
              resourceFilter={resourceFilter}
              setResourceFilter={setResourceFilter}
              processingIds={processingIds}
              onResourceStatus={handleResourceStatus}
              onDeleteResource={handleDeleteResource}
            />
          )}

          {/* CONTACT TAB */}
          {activeTab === 'contact' && (
            <AdminContactTab
              contactSubmissions={contactSubmissions}
              contactFilter={contactFilter}
              setContactFilter={setContactFilter}
              processingIds={processingIds}
              onContactStatus={handleContactStatus}
              onDeleteContact={handleDeleteContact}
            />
          )}
        </div>
      </div>

      <BureauFooter />
    </div>
  );
}
