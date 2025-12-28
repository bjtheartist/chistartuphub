import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useBookmarks = (resourceType) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's bookmarks
  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['bookmarks', user?.id, resourceType],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id);
      
      if (resourceType) {
        query = query.eq('resource_type', resourceType);
      }
      
      const { data, error} = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Add bookmark
  const addBookmark = useMutation({
    mutationFn: async ({ resourceType, resourceId, notes }) => {
      if (!user) throw new Error('Must be logged in to bookmark');

      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          resource_type: resourceType,
          resource_id: resourceId,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmarked', {
        description: 'Added to your saved items',
      });
    },
    onError: (error) => {
      console.error('Bookmark error:', error);
      toast.error('Error', {
        description: error.message || 'Failed to bookmark',
      });
    },
  });

  // Remove bookmark
  const removeBookmark = useMutation({
    mutationFn: async (bookmarkId) => {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Removed', {
        description: 'Removed from your saved items',
      });
    },
    onError: (error) => {
      console.error('Remove bookmark error:', error);
      toast.error('Error', {
        description: error.message || 'Failed to remove bookmark',
      });
    },
  });

  // Check if resource is bookmarked
  const isBookmarked = (resourceType, resourceId) => {
    return bookmarks.some(
      (b) => b.resource_type === resourceType && b.resource_id === resourceId
    );
  };

  // Get bookmark for resource
  const getBookmark = (resourceType, resourceId) => {
    return bookmarks.find(
      (b) => b.resource_type === resourceType && b.resource_id === resourceId
    );
  };

  return {
    bookmarks,
    isLoading,
    addBookmark: addBookmark.mutate,
    removeBookmark: removeBookmark.mutate,
    isBookmarked,
    getBookmark,
  };
};
