import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet } from "lucide-react";
import { useCallback } from "react";

interface FileUploadProps {
  title: string;
  description: string;
  onFileSelect: (file: File) => void;
  acceptedTypes?: string;
  isUploaded?: boolean;
  fileName?: string;
}

export const FileUpload = ({ 
  title, 
  description, 
  onFileSelect, 
  acceptedTypes = ".csv,.xlsx,.xls",
  isUploaded = false,
  fileName 
}: FileUploadProps) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleButtonClick = useCallback(() => {
    const input = document.getElementById(`file-${title.replace(/\s+/g, '-').toLowerCase()}`);
    input?.click();
  }, [title]);

  return (
    <Card className="border-2 border-dashed border-muted hover:border-primary/50 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="min-h-[120px] flex flex-col items-center justify-center gap-3 rounded-lg bg-muted/30 p-6"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {isUploaded ? (
            <div className="text-center">
              <FileSpreadsheet className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-sm font-medium text-success">File uploaded successfully</p>
              <p className="text-xs text-muted-foreground">{fileName}</p>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Drop your file here or click to browse</p>
                <p className="text-xs text-muted-foreground">Supports CSV and Excel files</p>
              </div>
            </>
          )}
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={handleButtonClick}>
            {isUploaded ? 'Change File' : 'Select File'}
          </Button>
          <input
            id={`file-${title.replace(/\s+/g, '-').toLowerCase()}`}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
};