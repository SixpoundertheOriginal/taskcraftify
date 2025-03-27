
import { useState, useCallback } from 'react';
import { Comment } from '@/types/task';
import { useTaskStore } from '@/store';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Edit, Trash, Check, X, Loader2 } from 'lucide-react';

interface CommentItemProps {
  comment: Comment;
}

export function CommentItem({ comment }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editValue, setEditValue] = useState(comment.content);
  const { updateComment, deleteComment } = useTaskStore();

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditValue(comment.content);
  }, [comment.content]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditValue(comment.content);
  }, [comment.content]);

  const handleSaveEdit = useCallback(async () => {
    if (!editValue.trim()) {
      toast({
        title: "Invalid input",
        description: "Comment cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      await updateComment({
        id: comment.id,
        content: editValue
      });
      setIsEditing(false);
      toast({
        title: "Comment updated",
        description: "Comment has been successfully updated"
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Failed to update comment",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [comment.id, editValue, updateComment]);

  const handleDelete = useCallback(async () => {
    try {
      setIsLoading(true);
      await deleteComment(comment.id);
      toast({
        title: "Comment deleted",
        description: "Comment has been successfully deleted"
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Failed to delete comment",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [comment.id, deleteComment]);

  if (isEditing) {
    return (
      <div className="space-y-2 animate-fade-in">
        <Textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="min-h-20 text-sm"
          placeholder="Comment"
          disabled={isLoading}
          autoFocus
        />
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleCancelEdit}
            disabled={isLoading}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            variant="default"
            className="h-7 text-xs"
            onClick={handleSaveEdit}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Check className="h-3.5 w-3.5 mr-1" />
            )}
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="bg-muted/50 p-3 rounded-md">
        <div className="flex items-start justify-between mb-1">
          <div className="text-xs text-muted-foreground">
            <span>
              {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
            </span>
            {comment.edited && (
              <span className="ml-1 text-xs italic">(edited)</span>
            )}
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={handleEdit}
              disabled={isLoading}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="text-sm whitespace-pre-line">
          {comment.content}
        </div>
      </div>
    </div>
  );
}
