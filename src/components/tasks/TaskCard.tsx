import { Task } from '@/types/task';

export interface TaskCardProps {
  task: Task;
  compact?: boolean;
}

export const priorityConfig = {
  [TaskPriority.LOW]: { label: 'Low', color: 'bg-muted text-muted-foreground' },
  [TaskPriority.MEDIUM]: { label: 'Medium', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  [TaskPriority.HIGH]: { label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  [TaskPriority.URGENT]: { label: 'Urgent', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
};

export const statusConfig = {
  [TaskStatus.BACKLOG]: { label: 'Backlog', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  [TaskStatus.TODO]: { label: 'To Do', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  [TaskStatus.IN_PROGRESS]: { label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-300' },
  [TaskStatus.DONE]: { label: 'Done', color: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-300' },
  [TaskStatus.ARCHIVED]: { label: 'Archived', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' }
};

export function TaskCard({ task, className, compact = false }: TaskCardProps) {
  const { updateTask, setCurrentTask } = useTaskStore();
  const { projects, selectedProjectId } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  
  const project = task.projectId 
    ? projects.find(p => p.id === task.projectId) 
    : undefined;
    
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task
    }
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
    
  // Count completed subtasks
  const { completed, total } = task.subtasks 
    ? countCompletedSubtasks(task) 
    : { completed: 0, total: 0 };
    
  const toggleCompletion = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newStatus = task.status === TaskStatus.DONE 
      ? TaskStatus.TODO 
      : TaskStatus.DONE;
      
    updateTask({
      id: task.id,
      status: newStatus
    });
  };
  
  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  // Function to handle status change from dropdown menu
  const handleStatusChange = (status: TaskStatus) => {
    updateTask({
      id: task.id,
      status
    });
  };
  
  return (
    <div
      ref={setNodeRef} 
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "border rounded-md shadow-sm bg-card hover:shadow-md transition-shadow cursor-grab",
        task.status === TaskStatus.DONE && "opacity-80",
        isOpen ? "pb-2" : "pb-0",
        className
      )}
    >
      <div className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 shrink-0 rounded-full -mt-0.5" 
            onClick={toggleCompletion}
          >
            <CheckCircle2 className={cn(
              "h-4 w-4",
              task.status === TaskStatus.DONE 
                ? "text-green-500 fill-green-500" 
                : "text-muted-foreground"
            )} />
            <span className="sr-only">
              {task.status === TaskStatus.DONE ? "Mark as incomplete" : "Mark as complete"}
            </span>
          </Button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              {!compact && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 shrink-0 -ml-1 mt-0.5" 
                  onClick={toggleExpand}
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              )}
              
              <h3 className={cn(
                "text-sm font-medium truncate",
                task.status === TaskStatus.DONE && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h3>
              
              {!compact && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <span className="sr-only">Task menu</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStatusChange(TaskStatus.BACKLOG)}>
                      Move to Backlog
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(TaskStatus.TODO)}>
                      Move to Todo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}>
                      Move to In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(TaskStatus.DONE)}>
                      Move to Done
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setCurrentTask(task)}>
                      Open Task Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {(task.dueDate || project || task.tags?.length) && !compact && isOpen && (
              <div className="mt-2 space-y-2">
                {/* Task due date */}
                {task.dueDate && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {format(task.dueDate, 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                
                {/* Project */}
                {project && !selectedProjectId && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Badge 
                      variant="outline" 
                      className="px-1 py-0 text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                    >
                      {project.name}
                    </Badge>
                  </div>
                )}
                
                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {task.tags.map(tag => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="px-1 py-0 text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      >
                        <Tag className="h-2.5 w-2.5 mr-0.5" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Subtasks */}
                {total > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all" 
                        style={{ width: `${(completed / total) * 100}%` }} 
                      />
                    </div>
                    <span className="whitespace-nowrap">
                      {completed}/{total}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {!compact && (
            <Badge className={cn(
              "shrink-0 text-[10px] px-1 py-0 h-4",
              priorityConfig[task.priority].color
            )}>
              {priorityConfig[task.priority].label}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
