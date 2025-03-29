
import * as React from "react";
import { useDropzone, FileRejection, DropzoneOptions } from "react-dropzone";
import { Upload, X, File, FileImage, FileText, FileSpreadsheet, Archive, FileBox, FileAudio, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { FilePreview } from "@/components/ui/file-preview";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface FileUploadProps extends Omit<DropzoneOptions, "onDrop"> {
  className?: string;
  uploadProgress?: Record<string, number>;
  onUpload: (acceptedFiles: File[]) => void;
  onReject?: (fileRejections: FileRejection[]) => void;
  value?: File[];
  onChange?: (files: File[]) => void;
  maxFiles?: number;
  label?: string;
  disabled?: boolean;
  showPreviews?: boolean;
}

export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({ 
    className, 
    maxFiles = 1, 
    maxSize = 10 * 1024 * 1024, // 10MB default
    accept,
    uploadProgress,
    onUpload,
    onReject,
    value = [],
    onChange,
    label = "Drag & drop files here, or click to browse",
    disabled = false,
    showPreviews = true,
    ...props
  }, ref) => {
    const [files, setFiles] = React.useState<File[]>(value);
    const [previewFile, setPreviewFile] = React.useState<File | null>(null);
    
    React.useEffect(() => {
      if (value !== files) {
        setFiles(value);
      }
    }, [value, files]);
    
    const onDrop = React.useCallback(
      (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (acceptedFiles?.length) {
          const newFiles = 
            maxFiles === 1 
              ? acceptedFiles.slice(0, 1) 
              : [...files, ...acceptedFiles].slice(0, maxFiles);
          
          setFiles(newFiles);
          onUpload(acceptedFiles);
          
          if (onChange) {
            onChange(newFiles);
          }
        }
        
        if (fileRejections.length > 0 && onReject) {
          onReject(fileRejections);
        }
      },
      [files, maxFiles, onChange, onReject, onUpload]
    );
    
    const removeFile = (fileToRemove: File) => {
      const newFiles = files.filter(file => file !== fileToRemove);
      setFiles(newFiles);
      
      if (onChange) {
        onChange(newFiles);
      }
    };
    
    const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
      onDrop,
      maxFiles,
      maxSize,
      accept,
      disabled,
      ...props,
    });
    
    // Determine file icon based on file type
    const getFileIcon = (file: File) => {
      const type = file.type;
      
      if (type.startsWith("image/")) {
        return <FileImage className="h-6 w-6 text-blue-500" />;
      } else if (type.includes("pdf")) {
        return <FileBox className="h-6 w-6 text-red-500" />;
      } else if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) {
        return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
      } else if (type.includes("zip") || type.includes("compressed")) {
        return <Archive className="h-6 w-6 text-orange-500" />;
      } else if (type.includes("audio")) {
        return <FileAudio className="h-6 w-6 text-purple-500" />;
      } else if (type.includes("text")) {
        return <FileText className="h-6 w-6 text-gray-500" />;
      } else {
        return <File className="h-6 w-6 text-gray-500" />;
      }
    };
    
    return (
      <div ref={ref} className={cn("w-full", className)}>
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer group",
            isDragActive && !isDragReject && "border-primary bg-primary/5 shadow-lg animate-pulse",
            isDragAccept && "border-green-500 bg-green-50 dark:bg-green-900/20",
            isDragReject && "border-destructive bg-destructive/10",
            !isDragActive && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
            disabled && "pointer-events-none opacity-60",
            className
          )}
        >
          <input {...getInputProps()} />
          
          <div className={cn(
            "flex flex-col items-center justify-center gap-2 text-center p-4 transition-transform duration-200",
            isDragActive && "scale-105"
          )}>
            <Upload className={cn(
              "h-8 w-8 transition-all duration-300",
              isDragActive ? "text-primary animate-bounce" : "text-muted-foreground",
              isDragReject && "text-destructive"
            )} />
            
            <p className={cn(
              "text-sm font-medium transition-colors",
              isDragActive && !isDragReject ? "text-primary" : "text-muted-foreground",
              isDragReject && "text-destructive"
            )}>
              {isDragReject 
                ? "File type not accepted or too many files" 
                : isDragActive 
                  ? "Drop files here..." 
                  : label}
            </p>
            <p className={cn(
              "text-xs transition-colors",
              isDragActive && !isDragReject ? "text-primary/70" : "text-muted-foreground/70",
              isDragReject && "text-destructive/70"
            )}>
              {maxSize && (
                <span>Max size: {Math.round(maxSize / 1024 / 1024)}MB. </span>
              )}
              {maxFiles > 1 && (
                <span>Max files: {maxFiles}</span>
              )}
            </p>
          </div>
        </div>
        
        {(files.length > 0 || (uploadProgress && Object.keys(uploadProgress).length > 0)) && (
          <div className={cn(
            "mt-2 space-y-2 animate-fade-in",
          )}>
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-2 rounded-md border p-2 group"
              >
                {getFileIcon(file)}
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm truncate font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {showPreviews && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Preview file</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="right" align="center" className="w-80 p-2">
                        <FilePreview file={file} maxHeight={300} />
                      </PopoverContent>
                    </Popover>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file)}
                    className="h-7 w-7 rounded-full"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Show progress for uploading files */}
            {uploadProgress && Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div
                key={fileName}
                className="flex items-center gap-2 rounded-md border p-2 animate-pulse"
              >
                <File className="h-6 w-6 text-blue-500 animate-pulse" />
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between">
                    <p className="text-sm truncate font-medium">{fileName}</p>
                    <p className="text-xs text-muted-foreground">{progress}%</p>
                  </div>
                  <Progress value={progress} className="h-1 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";
