
import * as React from "react";
import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import Papa from "papaparse";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Set up the PDF.js worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface FilePreviewProps {
  file: File | string;
  className?: string;
  maxHeight?: number;
}

export function FilePreview({ file, className, maxHeight = 200 }: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileTypeDetected, setFileTypeDetected] = useState<string | null>(null);
  
  useEffect(() => {
    if (!file) return;
    
    // Clean up any previous object URL
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setIsLoading(true);
    setError(null);
    setCsvData(null);
    
    const setupPreview = async () => {
      try {
        // Handle string URLs (for already uploaded files)
        if (typeof file === 'string') {
          const fileExtension = file.split('.').pop()?.toLowerCase();
          const isImage = /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(file);
          const isPdf = /\.pdf$/i.test(file);
          const isCsv = /\.(csv|xls|xlsx)$/i.test(file);
          
          setPreviewUrl(file);
          setFileTypeDetected(isImage ? 'image' : isPdf ? 'pdf' : isCsv ? 'csv' : 'other');
          setIsLoading(false);
          return;
        }
        
        // Handle File objects
        const type = file.type.toLowerCase();
        setFileTypeDetected(
          type.startsWith('image/') ? 'image' : 
          type === 'application/pdf' ? 'pdf' :
          type === 'text/csv' || type.includes('spreadsheet') || file.name.endsWith('.csv') ? 'csv' : 
          'other'
        );
        
        // For images, create a preview URL
        if (type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
          setIsLoading(false);
        } 
        // For PDFs, create a blob URL
        else if (type === 'application/pdf') {
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
          setIsLoading(false);
        }
        // For CSV/Excel files, use PapaParse
        else if (
          type === 'text/csv' || 
          type === 'application/vnd.ms-excel' || 
          type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.name.endsWith('.csv')
        ) {
          Papa.parse(file, {
            header: true,
            preview: 5, // Preview first 5 rows
            complete: (results) => {
              setCsvData(results.data);
              setIsLoading(false);
            },
            error: (error) => {
              setError(`Error parsing CSV: ${error.message}`);
              setIsLoading(false);
            }
          });
        } else {
          // For other files, we don't have a preview
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error generating preview:", err);
        setError(`Error generating preview: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoading(false);
      }
    };
    
    setupPreview();
    
    // Cleanup function
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file]);
  
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)} style={{ maxHeight }}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={cn("text-sm text-destructive p-2", className)} style={{ maxHeight }}>
        {error}
      </div>
    );
  }
  
  // Image preview
  if (fileTypeDetected === 'image') {
    return (
      <div className={cn("overflow-hidden rounded-md", className)} style={{ maxHeight }}>
        <img 
          src={previewUrl || ''} 
          alt="File preview" 
          className="object-contain w-full h-full"
          style={{ maxHeight }}
          onError={() => setError("Failed to load image")}
        />
      </div>
    );
  }
  
  // PDF preview
  if (fileTypeDetected === 'pdf') {
    return (
      <div className={cn("overflow-hidden rounded-md border", className)} style={{ maxHeight }}>
        <Document
          file={previewUrl || ''}
          error={<p className="p-4 text-sm text-destructive">Failed to load PDF</p>}
          loading={<Loader2 className="h-8 w-8 animate-spin m-4" />}
        >
          <Page 
            pageNumber={1} 
            width={300}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    );
  }
  
  // CSV preview
  if (csvData) {
    return (
      <div className={cn("overflow-auto border rounded-md", className)} style={{ maxHeight }}>
        <table className="min-w-full text-xs">
          <thead className="bg-muted">
            {csvData.length > 0 && (
              <tr>
                {Object.keys(csvData[0]).slice(0, 5).map((header, i) => (
                  <th key={i} className="px-2 py-1 text-left font-medium truncate">
                    {header}
                  </th>
                ))}
                {Object.keys(csvData[0]).length > 5 && (
                  <th className="px-2 py-1 text-left font-medium">...</th>
                )}
              </tr>
            )}
          </thead>
          <tbody>
            {csvData.slice(0, 5).map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                {Object.values(row).slice(0, 5).map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-2 py-1 truncate">
                    {String(cell)}
                  </td>
                ))}
                {Object.values(row).length > 5 && (
                  <td className="px-2 py-1">...</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {csvData.length > 5 && (
          <div className="px-2 py-1 text-xs text-muted-foreground border-t">
            Showing first 5 of {csvData.length} rows
          </div>
        )}
      </div>
    );
  }
  
  // No preview available
  return (
    <div className={cn("flex items-center justify-center p-4 text-muted-foreground text-sm border rounded-md", className)} style={{ maxHeight }}>
      No preview available
    </div>
  );
}
