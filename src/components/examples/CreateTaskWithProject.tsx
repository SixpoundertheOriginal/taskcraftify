
import { useState, useEffect } from 'react';
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
  // Ensure projects is never undefined
  const { projects = [] } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    projects.length > 0 ? projects[0]?.id : undefined
  );
  
  // Update selectedProjectId if projects change and current selection becomes invalid
  useEffect(() => {
    if (selectedProjectId && projects.length > 0) {
      const projectExists = projects.some(p => p.id === selectedProjectId);
      if (!projectExists) {
        setSelectedProjectId(projects[0]?.id);
      }
    } else if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0]?.id);
    }
  }, [projects, selectedProjectId]);
  
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
            value={selectedProjectId || ""}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger id="project-select">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.length > 0 ? projects.map((project) => (
                <SelectItem 
                  key={project.id || `project-${Math.random()}`} 
                  value={project.id || ''}
                >
                  <div className="flex items-center gap-2">
                    {project.color && (
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      />
                    )}
                    <span>{project.name || 'Unnamed Project'}</span>
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
