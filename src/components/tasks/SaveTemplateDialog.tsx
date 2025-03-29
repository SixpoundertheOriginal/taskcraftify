
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useTemplateStore } from '@/store/templateStore/templateStore';
import { CreateTaskDTO } from '@/types/task';
import { toast } from '@/hooks/use-toast';

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskData: Partial<CreateTaskDTO>;
}

export function SaveTemplateDialog({ 
  open, 
  onOpenChange,
  taskData
}: SaveTemplateDialogProps) {
  const { createTemplate, isLoading } = useTemplateStore();
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Template name required",
        description: "Please provide a name for your template.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await createTemplate({
        name: templateName.trim(),
        description: templateDescription.trim(),
        structure: taskData
      });
      
      toast({
        title: "Template saved",
        description: "Your task template has been saved successfully.",
      });
      
      onOpenChange(false);
      setTemplateName('');
      setTemplateDescription('');
    } catch (error) {
      toast({
        title: "Failed to save template",
        description: "There was an error saving your template. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Create a reusable template from the current task.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="template-name" className="text-sm font-medium">
              Template Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="template-name"
              placeholder="Weekly Report"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="template-description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="template-description"
              placeholder="Template for creating weekly reports..."
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveTemplate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Template'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
