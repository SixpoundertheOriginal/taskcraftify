
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useProjectStore, useTaskStore } from '@/store';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskStatus, TaskPriority } from '@/types/task';
import { Loader2 } from 'lucide-react';

const projectNames = [
  { name: 'Marketing Campaign', color: '#8B5CF6' },
  { name: 'Website Redesign', color: '#EC4899' },
  { name: 'Mobile App Development', color: '#10B981' },
  { name: 'Customer Research', color: '#F59E0B' },
  { name: 'Q3 Planning', color: '#3B82F6' }
];

const taskTemplates = [
  { title: 'Create wireframes', priority: TaskPriority.MEDIUM },
  { title: 'Write content', priority: TaskPriority.LOW },
  { title: 'Design mockups', priority: TaskPriority.HIGH },
  { title: 'Review with team', priority: TaskPriority.MEDIUM },
  { title: 'Implement feedback', priority: TaskPriority.MEDIUM },
  { title: 'Final testing', priority: TaskPriority.URGENT },
  { title: 'Launch preparation', priority: TaskPriority.HIGH },
  { title: 'Schedule social media', priority: TaskPriority.LOW },
  { title: 'Create documentation', priority: TaskPriority.MEDIUM },
  { title: 'Plan next steps', priority: TaskPriority.LOW }
];

export function DemoDataGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { addProject } = useProjectStore();
  const { createTask } = useTaskStore();
  
  const generateDemoData = async () => {
    try {
      setIsGenerating(true);
      
      // Create projects first
      const projectIds: string[] = [];
      
      for (const project of projectNames) {
        const projectId = await addProject({
          name: project.name,
          color: project.color,
          description: `Demo project: ${project.name}`
        });
        
        if (projectId) {
          projectIds.push(projectId);
        }
      }
      
      if (projectIds.length === 0) {
        throw new Error('Failed to create any projects');
      }
      
      // Create tasks for each project
      let tasksCreated = 0;
      
      for (const projectId of projectIds) {
        // Create 3-5 tasks per project
        const tasksCount = Math.floor(Math.random() * 3) + 3;
        
        for (let i = 0; i < tasksCount; i++) {
          const taskTemplate = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
          
          // Random due date between today and 14 days from now
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 14));
          
          // Random status weighted toward active statuses
          const statuses = [
            TaskStatus.TODO, TaskStatus.TODO, // More likely
            TaskStatus.IN_PROGRESS, TaskStatus.IN_PROGRESS, // More likely
            TaskStatus.BACKLOG,
            TaskStatus.DONE
          ];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          
          await createTask({
            title: taskTemplate.title,
            description: `Demo task for project testing. This is an automatically generated task for demonstration purposes.`,
            status,
            priority: taskTemplate.priority,
            dueDate,
            projectId
          });
          
          tasksCreated++;
        }
      }
      
      toast.success(`Created ${projectIds.length} projects and ${tasksCreated} tasks for demo purposes.`);
    } catch (error) {
      console.error('Error generating demo data:', error);
      toast.error('Failed to generate demo data');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Generate Demo Data</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Generate sample projects and tasks for demonstration purposes. This will create several projects with random tasks assigned to them.
        </p>
        <Button 
          onClick={generateDemoData} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Demo Data...
            </>
          ) : (
            'Generate Demo Projects & Tasks'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
