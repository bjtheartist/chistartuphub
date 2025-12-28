import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bookmark, User, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { Link, useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, profile, updateProfile, loading: authLoading } = useAuth();
  const { bookmarks, isLoading: bookmarksLoading } = useBookmarks();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    company_name: profile?.company_name || '',
    bio: profile?.bio || '',
    linkedin_url: profile?.linkedin_url || '',
    website_url: profile?.website_url || '',
  });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await updateProfile(formData);

    if (error) {
      toast.error('Error', {
        description: 'Failed to update profile',
      });
    } else {
      toast.success('Success', {
        description: 'Profile updated successfully',
      });
      setEditing(false);
    }

    setSaving(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen py-20 px-6 flex items-center justify-center bg-[#0A0A0A]">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen py-20 px-6 flex flex-col items-center justify-center bg-[#0A0A0A]">
        <p className="text-white/70 mb-4">Please log in to view your profile</p>
        <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
          Go Home
        </Button>
      </div>
    );
  }

  // Group bookmarks by type
  const bookmarksByType = bookmarks.reduce((acc, bookmark) => {
    if (!acc[bookmark.resource_type]) {
      acc[bookmark.resource_type] = [];
    }
    acc[bookmark.resource_type].push(bookmark);
    return acc;
  }, {});

  return (
    <div className="min-h-screen py-20 px-6 bg-[#0A0A0A]">
      <SEO title="My Profile" description="Manage your ChiStartupHub profile and bookmarks" />

      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-white/60">Manage your account and saved resources</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Bookmark className="w-4 h-4 mr-2" />
              Saved Items ({bookmarks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="bg-white/5 border-white/10 p-6">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="full_name" className="text-white/80">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                      disabled={!editing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="company_name" className="text-white/80">Company/Startup Name</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                      disabled={!editing}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio" className="text-white/80">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    rows={4}
                    disabled={!editing}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="linkedin_url" className="text-white/80">LinkedIn URL</Label>
                    <Input
                      id="linkedin_url"
                      value={formData.linkedin_url}
                      onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                      disabled={!editing}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website_url" className="text-white/80">Website URL</Label>
                    <Input
                      id="website_url"
                      value={formData.website_url}
                      onChange={(e) => handleInputChange('website_url', e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                      disabled={!editing}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  {!editing ? (
                    <Button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditing(false);
                          setFormData({
                            full_name: profile?.full_name || '',
                            company_name: profile?.company_name || '',
                            bio: profile?.bio || '',
                            linkedin_url: profile?.linkedin_url || '',
                            website_url: profile?.website_url || '',
                          });
                        }}
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="bookmarks">
            {bookmarksLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            ) : bookmarks.length === 0 ? (
              <Card className="bg-white/5 border-white/10 p-12 text-center">
                <Bookmark className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/60 mb-4">No saved items yet</p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link to="/Resources">Explore Resources</Link>
                </Button>
              </Card>
            ) : (
              <div className="space-y-8">
                {Object.entries(bookmarksByType).map(([type, items]) => (
                  <div key={type}>
                    <h3 className="text-xl font-semibold text-white mb-4 capitalize">
                      {type.replace('_', ' ')}s ({items.length})
                    </h3>
                    <div className="grid gap-4">
                      {items.map((bookmark) => (
                        <Card key={bookmark.id} className="bg-white/5 border-white/10 p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-white/50">Saved {new Date(bookmark.created_at).toLocaleDateString()}</p>
                              {bookmark.notes && (
                                <p className="text-white/70 mt-2">{bookmark.notes}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white/60 hover:text-white"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
