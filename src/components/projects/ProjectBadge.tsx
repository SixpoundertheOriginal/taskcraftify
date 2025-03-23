
import { useProjectStore } from '@/store';
import { Project } from '@/types/project';
import { Badge } from '@/components/ui/badge';
import { Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectBadgeProps {
  projectId?: string;
  className?: string;
}

export function ProjectBadge({ projectId, className }: ProjectBadgeProps) {
  const { projects } = useProjectStore();
  
  if (!projectId) return null;
  
  const project = projects.find(p => p.id === projectId);
  
  if (!project) return null;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "inline-flex items-center gap-1 py-0.5 px-2",
        "border border-transparent",
        className
      )}
      style={{ 
        backgroundColor: `${project.color}20`,
        borderColor: `${project.color}40`, 
        color: project.color 
      }}
    >
      <Folder className="h-3 w-3" />
      <span className="truncate max-w-[120px]">{project.name}</span>
    </Badge>
  );
}
