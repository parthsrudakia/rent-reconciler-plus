import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

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
    <Card className={cn(
      "relative overflow-hidden border-2 border-dashed transition-all duration-300 group",
      isUploaded 
        ? "border-success/50 bg-success/5" 
        : "border-muted-foreground/20 hover:border-primary/40 hover:shadow-glow"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className={cn(
            "p-2 rounded-xl transition-colors",
            isUploaded ? "bg-success/10" : "bg-primary/10 group-hover:bg-primary/20"
          )}>
            {isUploaded ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            )}
          </div>
          {title}
        </CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "min-h-[140px] flex flex-col items-center justify-center gap-4 rounded-xl p-6 transition-all duration-300",
            isUploaded 
              ? "bg-success/5" 
              : "bg-muted/50 hover:bg-muted/80"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {isUploaded ? (
            <div className="text-center animate-scale-in">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/10 mb-3">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <p className="text-sm font-semibold text-success">Uploaded successfully</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono truncate max-w-[200px]">{fileName}</p>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-full bg-primary/5 border border-primary/10 group-hover:border-primary/20 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Drop your file here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              </div>
            </>
          )}
          <Button 
            variant={isUploaded ? "outline" : "default"} 
            size="sm" 
            className={cn(
              "cursor-pointer transition-all",
              !isUploaded && "gradient-primary text-primary-foreground shadow-md hover:shadow-lg"
            )}
            onClick={handleButtonClick}
          >
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
