import { useState, useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  CheckCircle, 
  Circle,
  Clock, 
  ChevronDown,
  ChevronUp,
  Loader2, 
  MoreHorizontal, 
  Tag,
  CalendarIcon,
  Edit,
  Trash,
  Save,
  X
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { 
  formatDate, 
  getPriorityColor, 
  getPriorityLabel, 
  getStatusColor, 
  getStatusLabel, 
  isOverdue 
} from '@/lib/utils';
import { useTaskStore } from '@/store';
import { cn } from '@/lib/utils';
import { ProjectBadge } from '@/components/projects';
import { useProjectStore } from '@/store';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { useTaskEditForm } from '@/hooks/use-task-edit-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { ProjectSelector } from '@/components/projects';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  isCompact?: boolean; // For optionally showing a more compact view
}

function TaskCardComponent({ task, isDragging = false, isCompact = false }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { updateTask, deleteTask } = useTaskStore();
  const { projects } = useProjectStore();
  
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
  
  const {
    form,
    onSubmit,
    isDirty,
    resetForm
  } = useTaskEditForm(task);
  
  const handleStatusChange = useCallback(async (status: TaskStatus) => {
    try {
      setIsUpdating(true);
      await updateTask({ id: task.id, status });
      toast({
        title: "Task updated",
        description: `Task status changed to ${getStatusLabel(status)}`
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Failed to update task",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  }, [task.id, updateTask]);

  const handleDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      await deleteTask(task.id);
      toast({
        title: "Task deleted",
        description: "Task has been successfully deleted"
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Failed to delete task",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      setIsDeleting(false);
    }
  }, [task.id, deleteTask]);

  const handleCheckboxClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    let newStatus = TaskStatus.DONE;
    if (task.status === TaskStatus.DONE) {
      newStatus = TaskStatus.TODO;
    }
    await handleStatusChange(newStatus);
  }, [task.status, handleStatusChange]);

  const toggleExpanded = useCallback(() => {
    if (!isEditing) {
      setIsExpanded(prev => !prev);
    }
  }, [isEditing]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if (
      !isEditing && 
      e.target instanceof Element && 
      !e.target.closest('button') && 
      !e.target.closest('select') && 
      !e.target.closest('input') && 
      !e.target.closest('textarea') &&
      !e.target.closest('[role="combobox"]') && 
      !e.target.closest('[data-radix-popper-content-wrapper]')
    ) {
      toggleExpanded();
    }
  }, [toggleExpanded, isEditing]);

  const toggleEditMode = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (isEditing) {
      resetForm();
    }
    setIsEditing(prev => !prev);
  }, [isEditing, resetForm]);

  const handleSaveChanges = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsUpdating(true);
      await onSubmit();
      setIsEditing(false);
      toast({
        title: "Task updated",
        description: "Task has been successfully updated"
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Failed to update task",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  }, [onSubmit]);

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    if (isEditing) {
      e.stopPropagation();
    }
  }, [isEditing]);

  return (
    <Card 
      className={cn(
        "group w-full transition-all duration-200 border border-border/40 shadow-sm hover:shadow-md hover:border-border/80 cursor-pointer",
        project ? `border-l-4` : '',
        isUpdating || isDeleting ? 'opacity-70' : '',
        isDragging ? 'opacity-80 rotate-1 scale-105 shadow-md z-50' : '',
        isExpanded ? 'shadow-md' : ''
      )}
      style={project ? { borderLeftColor: project.color } : {}}
      onClick={handleCardClick}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button
              onClick={handleCheckboxClick}
              className="mt-0.5 flex-shrink-0 transition-all duration-150"
              disabled={isUpdating || isDeleting || isEditing}
              aria-label={task.status === TaskStatus.DONE ? "Mark as not done" : "Mark as done"}
            >
              {task.status === TaskStatus.DONE ? (
                <CheckCircle className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
              )}
            </button>
            
            <div className="flex-1">
              {!isEditing ? (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className={cn(
                      "font-medium text-base text-balance mr-2",
                      task.status === TaskStatus.DONE && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 rounded-full"
                        aria-label={isExpanded ? "Collapse task" : "Expand task"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    
                    {(isUpdating || isDeleting) ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-1" />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Task actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(TaskStatus.TODO); }}>
                            Mark as To Do
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(TaskStatus.IN_PROGRESS); }}>
                            Mark as In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(TaskStatus.DONE); }}>
                            Mark as Done
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(TaskStatus.ARCHIVED); }}>
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="text-destructive">
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ) : (
                <Form {...form}>
                  <form className="space-y-2" onClick={stopPropagation}>
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              placeholder="Task title" 
                              className="font-medium"
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              )}
              
              <div className="flex flex-wrap gap-2 my-2">
                {!isEditing ? (
                  <>
                    <Badge variant="outline" className={getStatusColor(task.status)}>
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {getStatusLabel(task.status)}
                    </Badge>
                    
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {getPriorityLabel(task.priority)}
                    </Badge>
                    
                    {task.projectId && (
                      <ProjectBadge projectId={task.projectId} />
                    )}
                  </>
                ) : (
                  <Form {...form}>
                    <form className="w-full flex flex-wrap gap-2" onClick={stopPropagation}>
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem className="w-fit">
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger className="w-32 h-7 text-xs">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                                <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                                <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                                <SelectItem value={TaskStatus.BACKLOG}>Backlog</SelectItem>
                                <SelectItem value={TaskStatus.ARCHIVED}>Archived</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem className="w-fit">
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger className="w-28 h-7 text-xs">
                                <SelectValue placeholder="Priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                                <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                                <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                                <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem className="w-fit">
                            <FormControl>
                              <ProjectSelector 
                                selectedProjectId={field.value || ""}
                                onProjectSelect={field.onChange}
                                buttonClassName="h-7 text-xs"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                )}
              </div>
              
              <CollapsibleContent className="animate-accordion-down overflow-hidden">
                {!isEditing ? (
                  <>
                    {task.description && (
                      <div className={cn(
                        "text-sm text-muted-foreground mb-3 pb-3 border-b border-border/40",
                        task.status === TaskStatus.DONE && "line-through"
                      )}>
                        {task.description}
                      </div>
                    )}
                    
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mb-3">
                        <Tag className="h-3 w-3 mr-1 text-muted-foreground" />
                        {task.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Form {...form}>
                    <form className="space-y-3 pb-3 border-b border-border/40 mb-3" onClick={stopPropagation}>
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                placeholder="Description" 
                                className="min-h-24 text-sm"
                                {...field} 
                                value={field.value || ""}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs mb-1">Due Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal h-8 text-xs",
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
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs mb-1">Tags (comma separated)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g. important, feature, backend" 
                                className="text-xs"
                                value={field.value?.join(", ") || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(
                                    value ? value.split(",").map(tag => tag.trim()) : []
                                  );
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                )}
                
                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7"
                        onClick={(e) => { e.stopPropagation(); toggleEditMode(e); }}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="h-7"
                          onClick={handleSaveChanges}
                          disabled={!isDirty || isUpdating}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : (
                            <Save className="h-3.5 w-3.5 mr-1" />
                          )}
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7"
                          onClick={(e) => { e.stopPropagation(); toggleEditMode(e); }}
                          disabled={isUpdating}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                      </>
                    )}
                    
                    {!isEditing && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                      >
                        <Trash className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                  
                  {task.dueDate && !isEditing && (
                    <div className={cn(
                      "flex items-center text-sm",
                      isOverdue(task.dueDate) ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                      {formatDate(task.dueDate)}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
              
              {!isExpanded && !isEditing && (
                <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                  {task.dueDate && (
                    <div className={cn(
                      "flex items-center",
                      isOverdue(task.dueDate) ? 'text-destructive' : ''
                    )}>
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(task.dueDate)}
                    </div>
                  )}
                  
                  {task.tags && task.tags.length > 0 && !isCompact && (
                    <div className="flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      {task.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="ml-1">#{tag}</span>
                      ))}
                      {task.tags.length > 2 && <span>+{task.tags.length - 2}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Collapsible>
    </Card>
  );
}

export const TaskCard = memo(TaskCardComponent);
