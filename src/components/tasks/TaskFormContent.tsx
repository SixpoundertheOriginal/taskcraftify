
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Button,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Badge,
  Calendar,
} from '@/components/ui';
import { CreateTaskDTO, TaskPriority, TaskStatus } from '@/types/task';
import { getPriorityLabel, getStatusLabel } from '@/lib/utils';
import { CalendarIcon, Loader2, Plus, Tag, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useTaskStore } from '@/store/taskStore/taskStore';

interface TaskFormContentProps {
  onSuccess?: () => void;
}

export function TaskFormContent({ onSuccess }: TaskFormContentProps) {
  const { addTask, isSubmitting, error } = useTaskStore();
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateTaskDTO>();
  
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  const onSubmit = async (data: Omit<CreateTaskDTO, 'tags' | 'dueDate'>) => {
    try {
      const taskData: CreateTaskDTO = {
        ...data,
        dueDate,
        tags,
      };
      
      await addTask(taskData);
      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      });
      
      // Reset form
      reset();
      setTags([]);
      setDueDate(undefined);
      onSuccess?.();
    } catch (err) {
      toast({
        title: "Failed to create task",
        description: error?.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title <span className="text-destructive">*</span>
        </label>
        <Input
          id="title"
          placeholder="Task title"
          {...register('title', { required: 'Title is required' })}
          className="w-full"
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">Description</label>
        <Textarea
          id="description"
          placeholder="Add details about this task..."
          {...register('description')}
          className="min-h-[100px]"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status <span className="text-destructive">*</span>
          </label>
          <Select defaultValue={TaskStatus.TODO}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TaskStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {getStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" {...register('status', { required: true })} />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="priority" className="text-sm font-medium">
            Priority <span className="text-destructive">*</span>
          </label>
          <Select defaultValue={TaskPriority.MEDIUM}>
            <SelectTrigger id="priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TaskPriority).map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {getPriorityLabel(priority)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" {...register('priority', { required: true })} />
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="dueDate" className="text-sm font-medium">Due Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              id="dueDate"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, 'PPP') : <span className="text-muted-foreground">Select due date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
              className="rounded-md border"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="tags" className="text-sm font-medium">Tags</label>
        <div className="flex space-x-2">
          <Input
            id="tags"
            placeholder="Add tag and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            className="w-full"
          />
          <Button type="button" size="icon" onClick={handleAddTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {tag}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveTag(tag)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove tag</span>
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Task'
          )}
        </Button>
      </div>
    </form>
  );
}
