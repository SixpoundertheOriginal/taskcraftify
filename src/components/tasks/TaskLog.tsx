
import React, { useState, useEffect } from 'react';
import { useTaskStore } from '@/store';
import { Task, ActivityItem } from '@/types/task';
import { Attachment } from '@/types/attachment';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  File, 
  FileImage, 
  FileText, 
  MessageSquare, 
  Paperclip,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilePreview } from '@/components/ui/file-preview';
import { FileUpload } from '@/components/ui/file-upload';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AttachmentService } from '@/services/attachmentService';

interface TaskLogProps {
  task: Task;
  maxHeight?: number;
}

export function TaskLog({ task, maxHeight = 500 }: TaskLogProps) {
  const { 
    fetchTaskAttachments,
    taskAttachments,
    uploadAttachment,
    fetchActivities,
    createComment
  } = useTaskStore();
  
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch activities and attachments when task changes
  useEffect(() => {
    if (task.id) {
      loadTaskData(task.id);
    }
  }, [task.id]);
  
  const loadTaskData = async (taskId: string) => {
    setIsLoading(true);
    try {
      // Fetch activities
      const activityResult = await fetchActivities(taskId);
      if (activityResult) {
        setActivities(activityResult);
      }
      
      // Fetch attachments if they're not already loaded
      if (!taskAttachments[taskId] || taskAttachments[taskId].length === 0) {
        await fetchTaskAttachments(taskId);
      }
    } catch (error) {
      console.error("Error loading task data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddComment = async () => {
    if (!comment.trim() || !task.id) return;
    
    try {
      await createComment({
        taskId: task.id,
        content: comment.trim()
      });
      
      setComment('');
      
      // Refresh activities
      await loadTaskData(task.id);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };
  
  const handleFileUpload = async (files: File[]) => {
    if (!task.id || files.length === 0) return;
    
    try {
      for (const file of files) {
        await uploadAttachment({
          taskId: task.id,
          file,
          onProgress: (progress) => console.log(`Uploading ${file.name}: ${progress}%`)
        });
      }
      
      // Refresh data after upload
      await loadTaskData(task.id);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };
  
  // Combine activities and attachments into a single timeline
  const getLogTimeline = () => {
    const attachments = taskAttachments[task.id] || [];
    
    // Convert attachments to activity-like objects for the timeline
    const attachmentActivities = attachments.map(attachment => ({
      id: attachment.id,
      type: 'attachment' as const,
      createdAt: attachment.createdAt,
      attachment
    }));
    
    // Combine and sort all items by date (newest first)
    const timelineItems = [
      ...activities,
      ...attachmentActivities
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return timelineItems;
  };
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'attachment':
        return <Paperclip className="h-4 w-4" />;
      case 'comment_added':
      case 'comment_edited':
      case 'comment_deleted':
        return <MessageSquare className="h-4 w-4" />;
      case 'status_changed':
      case 'status_change':
        return <ArrowUpRight className="h-4 w-4" />;
      case 'subtask_added':
      case 'subtask_completed':
      case 'subtask_edited':
      case 'subtask_deleted':
        return <CheckCircle className="h-4 w-4" />;
      case 'due_date_changed':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <FileImage className="h-4 w-4" />;
    } else if (fileType.includes('pdf') || fileType.includes('document')) {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };
  
  const renderAttachmentPreview = (attachment: Attachment) => {
    // Get the file URL from the attachment
    const fileUrl = AttachmentService.getAttachmentUrl(attachment.storagePath);
    
    return (
      <Collapsible className="w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getFileIcon(attachment.fileType)}
            <span className="text-sm font-medium">{attachment.originalName}</span>
            <span className="text-xs text-muted-foreground">
              ({(attachment.fileSize / 1024).toFixed(1)} KB)
            </span>
          </div>
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              Preview
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent className="mt-2">
          <div className="border rounded-md overflow-hidden">
            <FilePreview 
              file={fileUrl} 
              className="max-h-[300px] w-full"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };
  
  const timeline = getLogTimeline();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Task Log</h3>
        <Badge variant="outline" className="px-2 py-1">
          {timeline.length} {timeline.length === 1 ? 'entry' : 'entries'}
        </Badge>
      </div>
      
      <Separator />
      
      {/* Comment input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add a comment or update..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[80px] resize-none"
        />
        <div className="flex justify-between items-center">
          <FileUpload
            onUpload={handleFileUpload}
            maxSize={5 * 1024 * 1024} // 5MB
            accept={{
              'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
              'application/pdf': ['.pdf'],
              'text/plain': ['.txt'],
              'text/csv': ['.csv'],
              'application/vnd.ms-excel': ['.xls'],
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'application/zip': ['.zip'],
              'application/json': ['.json']
            }}
          >
            <Button type="button" variant="outline" size="sm">
              <Paperclip className="h-4 w-4 mr-2" />
              Attach
            </Button>
          </FileUpload>
          
          <Button
            onClick={handleAddComment}
            disabled={!comment.trim()}
            size="sm"
          >
            Add Comment
          </Button>
        </div>
      </div>
      
      <Separator />
      
      {/* Timeline */}
      <ScrollArea className={cn("pr-4", maxHeight ? `max-h-[${maxHeight}px]` : "")}>
        {timeline.length > 0 ? (
          <div className="space-y-4">
            {timeline.map((item, index) => (
              <div key={item.id} className="relative pl-6 pb-4 border-l border-dashed">
                <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full bg-background flex items-center justify-center border">
                  {'type' in item && item.type === 'attachment' ? (
                    getFileIcon(item.attachment.fileType)
                  ) : (
                    getActivityIcon('type' in item ? item.type : '')
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {format(item.createdAt, 'MMM dd, yyyy HH:mm')}
                    </p>
                    
                    {'createdBy' in item && (
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground mx-1">•</span>
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px]">
                            {item.createdBy.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-card/30 rounded-md p-3">
                    {'type' in item && item.type === 'attachment' ? (
                      renderAttachmentPreview(item.attachment)
                    ) : 'description' in item ? (
                      <p className="text-sm">{item.description}</p>
                    ) : (
                      <p className="text-sm">Activity recorded</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No activity recorded yet</p>
            <p className="text-sm">Add a comment or attach a file to get started</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
