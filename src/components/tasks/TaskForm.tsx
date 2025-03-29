
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { useTaskStore } from '@/store';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/components/ui/file-upload';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTask?: Partial<Task>;
  initialDueDate?: Date;
}

export function TaskForm({ open, onOpenChange, initialTask, initialDueDate }: TaskFormProps) {
  const { createTask, isLoading, uploadAttachment } = useTaskStore();
  const [submitting, setSubmitting] = useState(false);
  
  // Initialize the form with default values or the initialTask if provided
  const form = useForm({
    defaultValues: {
      title: initialTask?.title || '',
      description: initialTask?.description || '',
      status: initialTask?.status || TaskStatus.TODO,
      priority: initialTask?.priority || TaskPriority.MEDIUM,
      dueDate: initialTask?.dueDate || initialDueDate || undefined,
    },
  });
  
  // For file attachments
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Reset form when dialog opens/closes or initialTask changes
  useEffect(() => {
    if (open) {
      form.reset({
        title: initialTask?.title || '',
        description: initialTask?.description || '',
        status: initialTask?.status || TaskStatus.TODO,
        priority: initialTask?.priority || TaskPriority.MEDIUM,
        dueDate: initialTask?.dueDate || initialDueDate || undefined,
      });
      setFiles([]);
    }
  }, [open, initialTask, initialDueDate, form]);
  
  // Handle form submission
  const onSubmit = async (data: any) => {
    setSubmitting(true);
    
    try {
      // Create the task first
      const newTask = await createTask({
        title: data.title,
        description: data.description,
        status: data.status as TaskStatus,
        priority: data.priority as TaskPriority,
        dueDate: data.dueDate,
      });
      
      // Then upload any attachments
      if (files.length > 0 && newTask) {
        setIsUploading(true);
        
        // Upload each file sequentially
        for (const file of files) {
          await uploadAttachment({
            taskId: newTask.id,
            file,
            onProgress: (progress) => {
              console.log(`Uploading ${file.name}: ${progress}%`);
            }
          });
        }
        
        setIsUploading(false);
      }
      
      toast({
        title: "Task created",
        description: `"${data.title}" has been created successfully${files.length > 0 ? ' with attachments' : ''}.`,
      });
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error creating task",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleFileUpload = (acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  };
  
  const removeFile = (fileToRemove: File) => {
    setFiles(files.filter(file => file !== fileToRemove));
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: "Title is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Task title" 
                      {...field} 
                      autoFocus 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Task description (optional)" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                        <SelectItem value={TaskStatus.BACKLOG}>Backlog</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                        <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                        <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* File attachments section */}
            <div className="space-y-2">
              <FormLabel>Attachments</FormLabel>
              <FileUpload
                onUpload={handleFileUpload}
                value={files}
                onChange={setFiles}
                maxSize={5 * 1024 * 1024} // 5MB
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
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || isLoading || isUploading}
              >
                {(submitting || isLoading || isUploading) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isUploading ? 'Uploading attachments...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
