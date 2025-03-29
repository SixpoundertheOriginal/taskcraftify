
import * as React from "react";
import { useRef, useState } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Image, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilePreview } from "@/components/ui/file-preview";

interface RichTextInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onFilesChange?: (files: File[]) => void;
  files?: File[];
  previewMode?: boolean;
}

export function RichTextInput({
  className,
  onFilesChange,
  files = [],
  previewMode = false,
  ...props
}: RichTextInputProps) {
  const [internalFiles, setInternalFiles] = useState<File[]>(files);
  const [showDropzone, setShowDropzone] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Handle file uploads
  const handleFileUpload = (acceptedFiles: File[]) => {
    const newFiles = [...internalFiles, ...acceptedFiles];
    setInternalFiles(newFiles);
    
    if (onFilesChange) {
      onFilesChange(newFiles);
    }
  };
  
  // Remove a file
  const removeFile = (fileToRemove: File) => {
    const newFiles = internalFiles.filter(file => file !== fileToRemove);
    setInternalFiles(newFiles);
    
    if (onFilesChange) {
      onFilesChange(newFiles);
    }
  };
  
  // Toggle the dropzone visibility
  const toggleDropzone = () => {
    setShowDropzone(!showDropzone);
  };
  
  // Filter files by type for display organization
  const imageFiles = internalFiles.filter(file => file.type.startsWith('image/'));
  const documentFiles = internalFiles.filter(file => !file.type.startsWith('image/'));
  
  return (
    <div className={cn("space-y-2", className)}>
      {/* Main textarea for text input */}
      <Textarea
        ref={textareaRef}
        className={cn(
          "min-h-[120px] resize-y",
          internalFiles.length > 0 && "rounded-b-none border-b-0"
        )}
        {...props}
      />
      
      {/* Preview area for inserted files */}
      {internalFiles.length > 0 && (
        <div className="border border-t-0 rounded-b-md p-2 bg-background">
          {/* Image previews in a grid */}
          {imageFiles.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-medium text-muted-foreground mb-1">Images</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {imageFiles.map((file, index) => (
                  <Card key={index} className="relative group overflow-hidden h-24">
                    <FilePreview file={file} className="w-full h-full object-cover" />
                    {!previewMode && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(file)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Document files list */}
          {documentFiles.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Documents</div>
              <div className="space-y-1">
                {documentFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-1 hover:bg-muted/50 rounded-sm group">
                    <File className="h-4 w-4 text-blue-500" />
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    {!previewMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(file)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* File upload controls - only show in edit mode */}
      {!previewMode && (
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={toggleDropzone}
            className="text-xs"
          >
            {showDropzone ? "Hide Upload" : "Add Files"}
          </Button>
          
          {!showDropzone && (
            <span className="text-xs text-muted-foreground">
              or drag files into the description box
            </span>
          )}
        </div>
      )}
      
      {/* Dropzone for file uploads */}
      {showDropzone && !previewMode && (
        <FileUpload
          onUpload={handleFileUpload}
          value={internalFiles}
          onChange={setInternalFiles}
          maxSize={5 * 1024 * 1024} // 5MB
          showPreviews={false}
          maxFiles={10}
          accept={{
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
            'application/pdf': ['.pdf'],
            'text/plain': ['.txt'],
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/zip': ['.zip'],
            'application/json': ['.json'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
          }}
        />
      )}
    </div>
  );
}
