
import { useState } from 'react';
import { CreateProjectTaskButton } from '@/components/projects/CreateProjectTaskButton';
import { useProjectStore } from '@/store';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CreateTaskWithProject() {
  const { projects = [] } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    projects.length > 0 ? projects[0].id : undefined
  );
  
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Create Task for Project</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="project-select" className="text-sm font-medium">
            Select Project
          </label>
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger id="project-select">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects && projects.length > 0 ? projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: project.color }}
                    />
                    <span>{project.name}</span>
                  </div>
                </SelectItem>
              )) : (
                <SelectItem value="no-projects" disabled>
                  No projects available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        {selectedProjectId && (
          <CreateProjectTaskButton 
            projectId={selectedProjectId}
            className="w-full"
          />
        )}
      </CardContent>
    </Card>
  );
}
