
import { useState, useEffect } from 'react';
import { useTemplateStore } from '@/store/templateStore/templateStore';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Pencil, Trash2, FilePlus, BrainCircuit, LayoutTemplate } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function TemplatesSettings() {
  const { 
    templates, 
    isLoading, 
    error, 
    fetchTemplates, 
    deleteTemplate, 
    updateTemplate,
    suggestions,
    suggestionsMessage, 
    triggerAnalysis,
    isSuggestionsLoading
  } = useTemplateStore();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);
  
  const handleEditTemplate = (template) => {
    setCurrentTemplate(template);
    setEditName(template.name);
    setEditDescription(template.description || '');
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteTemplate = (template) => {
    setCurrentTemplate(template);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmEdit = async () => {
    try {
      await updateTemplate({
        id: currentTemplate.id,
        name: editName,
        description: editDescription
      });
      toast({
        title: "Template updated",
        description: "Your template has been updated successfully."
      });
      setIsEditDialogOpen(false);
    } catch (err) {
      toast({
        title: "Failed to update template",
        description: error ? error.toString() : "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };
  
  const confirmDelete = async () => {
    try {
      await deleteTemplate(currentTemplate.id);
      toast({
        title: "Template deleted",
        description: "Your template has been deleted successfully."
      });
      setIsDeleteDialogOpen(false);
    } catch (err) {
      toast({
        title: "Failed to delete template",
        description: error ? error.toString() : "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };
  
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await triggerAnalysis();
      toast({
        title: "Analysis complete",
        description: "Your templates have been analyzed for patterns."
      });
    } catch (err) {
      toast({
        title: "Analysis failed",
        description: "There was a problem analyzing your templates.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Templates</h2>
          <p className="text-muted-foreground">Manage your task templates</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRunAnalysis} 
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            <BrainCircuit className="h-4 w-4" />
            Analyze Usage Patterns
          </Button>
          <Button className="flex items-center gap-2">
            <FilePlus className="h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all" className="flex items-center gap-1">
            <LayoutTemplate className="h-4 w-4" />
            All Templates
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-1">
            <BrainCircuit className="h-4 w-4" />
            Smart Suggestions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="bg-card rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Usage Count</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {isLoading ? 'Loading templates...' : 'No templates found. Create your first template!'}
                    </TableCell>
                  </TableRow>
                )}
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{template.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {template.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {template.tags && template.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{template.usageCount}</TableCell>
                    <TableCell>
                      {template.lastUsed ? format(new Date(template.lastUsed), 'MMM d, yyyy') : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(template)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="suggestions">
          <div className="bg-card rounded-md border p-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-medium">Smart Template Suggestions</h3>
              <div className="text-sm text-muted-foreground ml-2">{suggestionsMessage}</div>
            </div>
            
            {isSuggestionsLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading suggestions...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No template suggestions available yet. Create and use more templates to get suggestions.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {suggestions.map((template) => (
                  <div key={template.id} className="border rounded-md p-4 flex flex-col h-full">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant="secondary">{template.usageCount} uses</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 flex-grow">
                      {template.description || 'No description'}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-auto pt-2">
                      {template.tags?.slice(0, 5).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update your template details. This will not affect tasks already created with this template.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Template Name</label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter template name"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Textarea
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter template description"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Template Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
