import { useState, useEffect } from 'react';
import { useTaskGroupStore } from '@/store/taskGroupStore/taskGroupStore';
import { useTaskStore, useProjectStore } from '@/store';
import { TaskGroup as TaskGroupType } from '@/types/taskGroup';
import { Task, TaskStatus } from '@/types/task';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent, 
  DragStartEvent, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskGroupColumn } from './TaskGroupColumn';
import { Plus, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { CreateTaskGroupDTO } from '@/types/taskGroup';
import { useNavigate, useParams } from 'react-router-dom';

export function TaskGroups() {
  const { selectedProjectId, projects } = useProjectStore();
  const { tasks, updateTask } = useTaskStore();
  const { 
    taskGroups, 
    fetchTaskGroups, 
    createTaskGroup, 
    updateTaskGroup,
    deleteTaskGroup,
    updateTaskPositions,
    setupTaskGroupSubscription 
  } = useTaskGroupStore();
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  const navigate = useNavigate();
  
  useEffect(() => {
    if (selectedProjectId) {
      fetchTaskGroups(selectedProjectId);
    }
    
    const unsubscribe = setupTaskGroupSubscription();
    
    return () => {
      unsubscribe();
    };
  }, [selectedProjectId, fetchTaskGroups, setupTaskGroupSubscription]);
  
  const projectTasks = tasks.filter(task => 
    task.projectId === selectedProjectId
  );
  
  const tasksByGroup: Record<string, Task[]> = {};
  
  taskGroups.forEach(group => {
    tasksByGroup[group.id] = [];
  });
  
  tasksByGroup['ungrouped'] = [];
  
  projectTasks.forEach(task => {
    if (task.taskGroupId && tasksByGroup[task.taskGroupId]) {
      tasksByGroup[task.taskGroupId].push(task);
    } else {
      tasksByGroup['ungrouped'].push(task);
    }
  });
  
  Object.keys(tasksByGroup).forEach(groupId => {
    tasksByGroup[groupId].sort((a, b) => a.position - b.position);
  });
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    if (active.data?.current?.type === 'task') {
      setActiveTaskId(active.id as string);
    }
  };
  
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    if (active.data?.current?.type !== 'task') return;
    
    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;
    
    if (over.data?.current?.type === 'group') {
      const targetGroupId = over.id as string;
      
      if (activeTask.taskGroupId === targetGroupId) return;
      
      const tasksInTargetGroup = tasksByGroup[targetGroupId] || [];
      const highestPosition = tasksInTargetGroup.length > 0 
        ? Math.max(...tasksInTargetGroup.map(t => t.position)) + 1 
        : 0;
      
      updateTask({
        id: activeTask.id,
        taskGroupId: targetGroupId,
        position: highestPosition
      });
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveTaskId(null);
    
    if (!over) return;
    
    if (active.data?.current?.type === 'task' && over.data?.current?.type === 'task') {
      const activeTask = tasks.find(t => t.id === active.id);
      const overTask = tasks.find(t => t.id === over.id);
      
      if (!activeTask || !overTask) return;
      
      if (activeTask.taskGroupId === overTask.taskGroupId) {
        const groupId = activeTask.taskGroupId || 'ungrouped';
        const tasksInGroup = [...tasksByGroup[groupId]];
        
        const oldIndex = tasksInGroup.findIndex(t => t.id === active.id);
        const newIndex = tasksInGroup.findIndex(t => t.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedTasks = arrayMove(tasksInGroup, oldIndex, newIndex);
          
          const positionUpdates = reorderedTasks.map((task, index) => ({
            id: task.id,
            position: index
          }));
          
          updateTaskPositions(positionUpdates);
        }
      }
    }
  };
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  const form = useForm<CreateTaskGroupDTO>({
    defaultValues: {
      name: '',
      projectId: selectedProjectId
    }
  });
  
  const onSubmit = async (data: CreateTaskGroupDTO) => {
    try {
      await createTaskGroup({
        ...data,
        projectId: selectedProjectId
      });
      setIsAddGroupDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error creating task group:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {selectedProject ? `${selectedProject.name} - Task Groups` : 'Task Groups'}
        </h2>
        
        <div className="flex items-center gap-2">
          <Dialog open={isAddGroupDialogOpen} onOpenChange={setIsAddGroupDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>Create New Task Group</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Group Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter group name"
                      {...form.register('name', { required: true })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="Enter description"
                      {...form.register('description')}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddGroupDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Group</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {taskGroups.map(group => (
            <TaskGroupColumn 
              key={group.id} 
              group={group} 
              tasks={tasksByGroup[group.id] || []}
              onDeleteGroup={() => deleteTaskGroup(group.id)}
            />
          ))}
          
          <TaskGroupColumn 
            key="ungrouped" 
            group={{ id: 'ungrouped', name: 'Ungrouped Tasks', position: 9999 } as TaskGroupType} 
            tasks={tasksByGroup['ungrouped'] || []}
            isUngrouped
          />
        </div>
      </DndContext>
    </div>
  );
}
