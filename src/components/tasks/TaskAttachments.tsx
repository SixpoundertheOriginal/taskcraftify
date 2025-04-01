import React, { useEffect, useState, useMemo } from 'react';
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
  Eye,
  AlertCircle,
  Search,
  Filter,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { useTaskStore } from '@/store';
import { Attachment } from '@/types/attachment';
import { FileUpload } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { FilePreview } from '@/components/ui/file-preview';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

interface TaskAttachmentsProps {
  taskId: string;
}

type FileTypeFilter = 'all' | 'image' | 'document' | 'spreadsheet' | 'archive' | 'other';

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
  
  // State for attachment management
  const [attachmentToDelete, setAttachmentToDelete] = useState<Attachment | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
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
  
  const handleUploadRejection = (rejections: any[]) => {
    const rejection = rejections[0];
    if (rejection) {
      const errorCode = rejection.errors[0].code;
      let message = "File upload failed";
      
      if (errorCode === 'file-too-large') {
        message = "File is too large. Maximum size is 5MB.";
      } else if (errorCode === 'file-invalid-type') {
        message = "Invalid file type. Please use a supported file format.";
      } else if (errorCode === 'too-many-files') {
        message = "Too many files. Please upload one file at a time.";
      }
      
      toast({
        title: "Upload Error",
        description: message,
        variant: "destructive"
      });
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
  
  // Helper for checking if a file matches the selected file type filter
  const matchesFileTypeFilter = (fileType: string): boolean => {
    if (fileTypeFilter === 'all') return true;
    
    switch (fileTypeFilter) {
      case 'image':
        return fileType.startsWith('image/');
      case 'document':
        return fileType.includes('pdf') || fileType.includes('text') || fileType.includes('document');
      case 'spreadsheet':
        return fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv');
      case 'archive':
        return fileType.includes('zip') || fileType.includes('compressed');
      case 'other':
        return !(
          fileType.startsWith('image/') ||
          fileType.includes('pdf') ||
          fileType.includes('text') ||
          fileType.includes('document') ||
          fileType.includes('spreadsheet') ||
          fileType.includes('excel') ||
          fileType.includes('csv') ||
          fileType.includes('zip') ||
          fileType.includes('compressed')
        );
      default:
        return true;
    }
  };
  
  // Filter and sort the attachments
  const filteredAndSortedAttachments = useMemo(() => {
    return attachmentsForTask
      .filter(attachment => {
        // Apply search query filter
        const matchesSearch = searchQuery === '' || 
          attachment.originalName.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Apply file type filter
        const matchesType = matchesFileTypeFilter(attachment.fileType);
        
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        // Apply sorting
        if (sortBy === 'date') {
          return sortOrder === 'asc' 
            ? a.createdAt.getTime() - b.createdAt.getTime()
            : b.createdAt.getTime() - a.createdAt.getTime();
        } else if (sortBy === 'name') {
          return sortOrder === 'asc'
            ? a.originalName.localeCompare(b.originalName)
            : b.originalName.localeCompare(a.originalName);
        } else if (sortBy === 'size') {
          return sortOrder === 'asc'
            ? a.fileSize - b.fileSize
            : b.fileSize - a.fileSize;
        }
        return 0;
      });
  }, [attachmentsForTask, searchQuery, fileTypeFilter, sortBy, sortOrder]);
  
  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setFileTypeFilter('all');
    setSortBy('date');
    setSortOrder('desc');
  };
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
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
    
    if (filteredAndSortedAttachments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p>No matching attachments</p>
          <Button 
            variant="link" 
            className="text-sm" 
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-2 mt-4">
        {filteredAndSortedAttachments.map((attachment) => (
          <div 
            key={attachment.id} 
            className="flex items-center gap-3 p-2 rounded-md border group hover:bg-muted/40 transition-colors"
          >
            {getFileIcon(attachment.fileType)}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.originalName}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(attachment.fileSize)} · {new Date(attachment.createdAt).toLocaleDateString()}
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
    if (data && typeof data === 'object' && 'progress' in data) {
      uploadProgressForFileUpload[fileName] = data.progress;
    }
  });
  
  // Count active filters
  const activeFilterCount = (
    (searchQuery ? 1 : 0) + 
    (fileTypeFilter !== 'all' ? 1 : 0)
  );
  
  return (
    <div className={cn(
      "space-y-4 transition-all duration-300", 
      isDraggingOver && "scale-[1.02] ring-2 ring-primary/40 rounded-lg p-4 bg-muted/10"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Paperclip className={cn(
            "h-5 w-5 transition-transform",
            isDraggingOver && "text-primary animate-bounce"
          )} />
          <h3 className="text-lg font-medium">Attachments</h3>
        </div>
        
        {attachmentsForTask.length > 0 && (
          <Badge variant="outline">
            {attachmentsForTask.length} {attachmentsForTask.length === 1 ? 'file' : 'files'}
          </Badge>
        )}
      </div>
      
      {/* Search and filters */}
      {attachmentsForTask.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7 opacity-70 hover:opacity-100"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {/* File type filter */}
            <Select value={fileTypeFilter} onValueChange={(value) => setFileTypeFilter(value as FileTypeFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="File Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
                <SelectItem value="archive">Archives</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Sort control */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Sort by</h4>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date Added</SelectItem>
                      <SelectItem value="name">File Name</SelectItem>
                      <SelectItem value="size">File Size</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      className="w-full text-xs justify-between"
                      onClick={toggleSortOrder}
                    >
                      {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                      <span className="text-muted-foreground">
                        {sortOrder === 'asc' ? '(A → Z)' : '(Z → A)'}
                      </span>
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Clear filters button (only shown when filters are active) */}
            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearFilters}
                className="relative h-10 w-10"
              >
                <Filter className="h-4 w-4" />
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {activeFilterCount}
                </span>
                <span className="sr-only">Clear filters</span>
              </Button>
            )}
          </div>
        </div>
      )}
      
      <FileUpload
        onUpload={handleUpload}
        onReject={handleUploadRejection}
        uploadProgress={uploadProgressForFileUpload}
        maxSize={5 * 1024 * 1024} // 5MB
        label="Drag and drop files here, or click to browse"
        className={cn(isAttachmentLoading && "opacity-70 pointer-events-none")}
        disabled={isAttachmentLoading}
        showPreviews={true}
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
