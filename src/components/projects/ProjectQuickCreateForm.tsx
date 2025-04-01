
import { useState } from 'react';
import { useProjectStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X } from 'lucide-react';
import { ColorSelector } from '@/components/ui/color-selector';
import { toast } from '@/hooks/use-toast';

interface ProjectQuickCreateFormProps {
  onSuccess: (projectId: string) => void;
  onCancel: () => void;
}

export function ProjectQuickCreateForm({ onSuccess, onCancel }: ProjectQuickCreateFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6E59A5');
  const { addProject, isSubmitting } = useProjectStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a name for your project",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const projectId = await addProject({
        name: name.trim(),
        color
      });
      
      if (projectId) {
        toast({
          title: "Project created",
          description: `Project "${name}" has been created successfully.`
        });
        onSuccess(projectId);
      }
    } catch (error) {
      toast({
        title: "Failed to create project",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Create New Project</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <Input
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Color</label>
        <ColorSelector 
          value={color}
          onChange={setColor}
          colors={["#6E59A5", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#8B5CF6"]}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} size="sm">
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Project"
          )}
        </Button>
      </div>
    </form>
  );
}
