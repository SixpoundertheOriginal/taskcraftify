
import { useProjectStore } from '@/store';
import { cn } from '@/lib/utils';

interface ProjectSelectorProps {
  className?: string;
}

export function ProjectSelector({ className }: ProjectSelectorProps) {
  // Get the globally selected project from the store
  const { selectedProjectId, projects } = useProjectStore();

  // Find the currently selected project
  const project = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  // Determine the name to display
  let displayName = 'All Projects';
  if (selectedProjectId === 'none') {
    displayName = 'No Project';
  } else if (project) {
    displayName = project.name || 'Unnamed Project';
  }

  return (
    <div
      className={cn(
        'px-3 py-2 text-sm font-medium rounded bg-muted flex items-center gap-2',
        className
      )}
    >
      <span>
        {/* This is now the only source of project filtering */}
        Project:&nbsp;
        <span className="font-semibold">{displayName}</span>
      </span>
      {project?.color && (
        <span
          className="ml-2 w-3 h-3 rounded-full inline-block"
          style={{ backgroundColor: project.color }}
        />
      )}
    </div>
  );
}
