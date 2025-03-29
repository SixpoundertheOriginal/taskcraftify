
import React, { useEffect, useState } from 'react';
import { 
  Paperclip, 
  File, 
  FileImage, 
  FileText, 
  FileBox, 
  FileSpreadsheet, 
  Archive, 
  Download, 
  Trash2, 
  Loader2,
  Eye 
} from 'lucide-react';
import { useTaskStore } from '@/store';
import { Attachment } from '@/types/attachment';
import { FileUpload } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { FilePreview } from '@/components/ui/file-preview';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

interface TaskAttachmentsProps {
  taskId: string;
}

export function TaskAttachments({ taskId }: TaskAttachmentsProps) {
  const { 
    taskAttachments, 
    attachmentUploads, 
    isAttachmentLoading, 
    fetchTaskAttachments, 
    uploadAttachment, 
    deleteAttachment, 
    getAttachmentUrl 
  } = useTaskStore();
  const [attachmentToDelete, setAttachmentToDelete] = useState<Attachment | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // Get attachments for this task
  const attachmentsForTask = taskAttachments[taskId] || [];
  
  useEffect(() => {
    // Fetch attachments when the component mounts
    fetchTaskAttachments(taskId);
  }, [taskId, fetchTaskAttachments]);

  // Add global drag handler to provide visual cue when dragging over the component
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      // Only set dragging state if files are being dragged
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDraggingOver(true);
      }
    };

    const handleDragLeave = () => {
      setIsDraggingOver(false);
    };

    const handleDrop = () => {
      setIsDraggingOver(false);
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);
  
  const handleUpload = async (files: File[]) => {
    if (files.length > 0) {
      await uploadAttachment({ taskId, file: files[0] });
    }
  };
  
  const confirmDeleteAttachment = (attachment: Attachment) => {
    setAttachmentToDelete(attachment);
  };
  
  const handleDeleteAttachment = async () => {
    if (attachmentToDelete) {
      setIsDeleting(true);
      await deleteAttachment(attachmentToDelete.id);
      setIsDeleting(false);
      setAttachmentToDelete(null);
    }
  };
  
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    } else if (fileType.includes("pdf")) {
      return <FileBox className="h-5 w-5 text-red-500" />;
    } else if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv")) {
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    } else if (fileType.includes("zip") || fileType.includes("compressed")) {
      return <Archive className="h-5 w-5 text-orange-500" />;
    } else if (fileType.includes("text")) {
      return <FileText className="h-5 w-5 text-gray-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const downloadFile = (attachment: Attachment) => {
    const url = getAttachmentUrl(attachment.storagePath);
    window.open(url, '_blank');
  };
  
  const openPreview = (attachment: Attachment) => {
    setPreviewAttachment(attachment);
  };
  
  const renderAttachmentList = () => {
    if (isAttachmentLoading && attachmentsForTask.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Loading attachments...</p>
        </div>
      );
    }
    
    if (attachmentsForTask.length === 0 && Object.keys(attachmentUploads).length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Paperclip className="h-8 w-8 mb-2" />
          <p>No attachments yet</p>
          <p className="text-sm">Upload files to attach them to this task</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-2 mt-4">
        {attachmentsForTask.map((attachment) => (
          <div 
            key={attachment.id} 
            className="flex items-center gap-3 p-2 rounded-md border group hover:bg-muted/40 transition-colors"
          >
            {getFileIcon(attachment.fileType)}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.originalName}</p>
              <p className="text-xs text-muted-foreground">
                {(attachment.fileSize / 1024).toFixed(1)} KB · {new Date(attachment.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => openPreview(attachment)}
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">Preview</span>
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => downloadFile(attachment)}
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Download</span>
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-destructive hover:text-destructive/80"
                onClick={() => confirmDeleteAttachment(attachment)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Convert attachmentUploads object to format expected by FileUpload component
  const uploadProgressForFileUpload: Record<string, number> = {};
  Object.entries(attachmentUploads).forEach(([fileName, data]) => {
    uploadProgressForFileUpload[fileName] = data.progress;
  });
  
  return (
    <div className={cn(
      "space-y-4 transition-all duration-300", 
      isDraggingOver && "scale-[1.02] ring-2 ring-primary/40 rounded-lg p-4 bg-muted/10"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <Paperclip className={cn(
          "h-5 w-5 transition-transform",
          isDraggingOver && "text-primary animate-bounce"
        )} />
        <h3 className="text-lg font-medium">Attachments</h3>
      </div>
      
      <FileUpload
        onUpload={handleUpload}
        uploadProgress={uploadProgressForFileUpload}
        maxSize={5 * 1024 * 1024} // 5MB
        label="Drag and drop files here, or click to browse"
        className={cn(isAttachmentLoading && "opacity-70 pointer-events-none")}
        disabled={isAttachmentLoading}
        showPreviews={true}
      />
      
      {renderAttachmentList()}
      
      <AlertDialog open={!!attachmentToDelete} onOpenChange={(open) => !open && setAttachmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the file "{attachmentToDelete?.originalName}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAttachment}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Full-screen preview dialog */}
      <Dialog open={!!previewAttachment} onOpenChange={(open) => !open && setPreviewAttachment(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewAttachment?.originalName}</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 max-h-[70vh] overflow-auto">
            {previewAttachment && (
              <FilePreview 
                file={getAttachmentUrl(previewAttachment.storagePath)} 
                maxHeight={600} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
