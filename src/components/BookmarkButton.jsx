import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { toast } from 'sonner';

export default function BookmarkButton({
  resourceType,
  resourceId,
  variant = 'outline',
  size = 'default',
  showText = true,
  className = ''
}) {
  const { user } = useAuth();
  const { isBookmarked, getBookmark, addBookmark, removeBookmark } = useBookmarks(resourceType);

  const bookmarked = isBookmarked(resourceType, resourceId);
  const bookmark = getBookmark(resourceType, resourceId);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info('Sign in to bookmark', {
        description: 'Create an account to save resources for later',
      });
      return;
    }

    if (bookmarked && bookmark) {
      removeBookmark(bookmark.id);
    } else {
      addBookmark({ resourceType, resourceId });
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`${bookmarked ? 'text-blue-400 border-blue-400/50' : ''} ${className}`}
    >
      <Bookmark
        className={`w-4 h-4 ${showText ? 'mr-2' : ''} ${bookmarked ? 'fill-current' : ''}`}
      />
      {showText && (bookmarked ? 'Saved' : 'Save')}
    </Button>
  );
}
