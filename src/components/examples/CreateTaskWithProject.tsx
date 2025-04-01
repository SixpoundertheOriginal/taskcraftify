
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
  // Ensure projects is never undefined by providing an empty array as fallback
  const { projects = [] } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    projects && projects.length > 0 ? projects[0]?.id : undefined
  );
  
  // Ensure projects is an array
  const safeProjects = Array.isArray(projects) ? projects : [];
  const hasProjects = safeProjects.length > 0;
  
  // Update selectedProjectId if projects change and current selection becomes invalid
  useEffect(() => {
    if (selectedProjectId && hasProjects) {
      const projectExists = safeProjects.some(p => p.id === selectedProjectId);
      if (!projectExists) {
        setSelectedProjectId(safeProjects[0]?.id);
      }
    } else if (hasProjects && !selectedProjectId) {
      setSelectedProjectId(safeProjects[0]?.id);
    }
  }, [safeProjects, selectedProjectId, hasProjects]);
  
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
              {hasProjects ? safeProjects.map((project) => (
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
