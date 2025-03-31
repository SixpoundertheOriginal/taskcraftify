
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTaskStore } from '@/store';
import { CommentItem } from './CommentItem';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Plus, Send, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CommentListProps {
  taskId: string;
}

export function CommentList({ taskId }: CommentListProps) {
  const [commentText, setCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { tasks, fetchComments, createComment } = useTaskStore();
  
  // Use useMemo to prevent recalculation when tasks array reference changes
  // but the specific task we care about hasn't changed
  const task = useMemo(() => {
    return tasks.find(t => t.id === taskId);
  }, [tasks, taskId]);
  
  const comments = task?.comments || [];
  
  // Fetch comments on initial render
  useEffect(() => {
    const loadComments = async () => {
      setIsLoading(true);
      try {
        await fetchComments(taskId);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (taskId) {
      loadComments();
    }
  }, [taskId, fetchComments]);
  
  const handleAddComment = useCallback(async () => {
    if (!commentText.trim()) {
      toast({
        title: "Invalid input",
        description: "Comment cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await createComment({
        taskId,
        content: commentText
      });
      
      setCommentText('');
      setIsAddingComment(false);
      toast({
        title: "Comment added",
        description: "Comment has been successfully added"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Failed to add comment",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [taskId, commentText, createComment]);
  
  const handleCancelAdd = useCallback(() => {
    setIsAddingComment(false);
    setCommentText('');
  }, []);
  
  const handleStartAddComment = useCallback(() => {
    setIsAddingComment(true);
  }, []);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium flex items-center">
          Comments
          {comments.length > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </h3>
        
        {!isAddingComment && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs"
            onClick={handleStartAddComment}
            disabled={isLoading}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        )}
      </div>
      
      {isAddingComment && (
        <div className="animate-fade-in space-y-2">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-24 text-sm"
            disabled={isLoading}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={handleCancelAdd}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs"
              onClick={handleAddComment}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Send className="h-3.5 w-3.5 mr-1" />
              )}
              Add Comment
            </Button>
          </div>
        </div>
      )}
      
      {isLoading && !comments.length ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No comments yet</p>
          <p className="text-xs text-muted-foreground">
            Add a comment to discuss this task
          </p>
        </div>
      ) : (
        <div className={cn(
          "space-y-3 transition-all",
          isLoading ? "opacity-60" : ""
        )}>
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
