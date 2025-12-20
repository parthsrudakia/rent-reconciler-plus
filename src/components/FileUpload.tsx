import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle2, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";
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
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleButtonClick = useCallback(() => {
    const input = document.getElementById(`file-${title.replace(/\s+/g, '-').toLowerCase()}`);
    input?.click();
  }, [title]);

  return (
    <div className={cn(
      "relative group rounded-2xl p-[1px] transition-all duration-500",
      isUploaded 
        ? "bg-gradient-to-r from-primary/50 to-primary/30" 
        : isDragging
          ? "bg-gradient-to-r from-primary via-accent to-primary animate-shimmer"
          : "bg-gradient-to-r from-border/50 via-border to-border/50 hover:from-primary/30 hover:via-accent/30 hover:to-primary/30"
    )}>
      <div className={cn(
        "relative rounded-2xl bg-card p-6 transition-all duration-300 overflow-hidden",
        isDragging && "bg-primary/5"
      )}>
        {/* Background glow effect */}
        <div className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-500",
          "bg-gradient-to-br from-primary/10 via-transparent to-accent/10",
          (isDragging || isUploaded) && "opacity-100"
        )} />

        {/* Floating orbs */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className={cn(
              "relative p-3 rounded-xl transition-all duration-300",
              isUploaded 
                ? "bg-primary/20 glow-sm" 
                : "bg-secondary group-hover:bg-primary/10"
            )}>
              {isUploaded ? (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              ) : (
                <FileSpreadsheet className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
              {isUploaded && (
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-primary animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            className={cn(
              "relative min-h-[160px] flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 transition-all duration-300",
              isUploaded 
                ? "border-primary/30 bg-primary/5" 
                : isDragging
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-border/50 bg-secondary/30 hover:border-muted-foreground/30 hover:bg-secondary/50"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isUploaded ? (
              <div className="text-center animate-scale-in">
                <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="relative rounded-full bg-primary/20 p-4 glow-md">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <p className="text-base font-semibold text-primary">Upload Complete</p>
                <p className="text-sm text-muted-foreground mt-1 font-mono truncate max-w-[250px]">{fileName}</p>
              </div>
            ) : (
              <>
                <div className={cn(
                  "p-5 rounded-2xl transition-all duration-300",
                  isDragging 
                    ? "bg-primary/20 scale-110" 
                    : "bg-secondary/50 group-hover:bg-primary/10"
                )}>
                  <Upload className={cn(
                    "h-8 w-8 transition-all duration-300",
                    isDragging ? "text-primary scale-110" : "text-muted-foreground group-hover:text-primary"
                  )} />
                </div>
                <div className="text-center">
                  <p className={cn(
                    "text-base font-medium transition-colors",
                    isDragging && "text-primary"
                  )}>
                    {isDragging ? "Drop it here!" : "Drag & drop your file"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">CSV or Excel files supported</p>
                </div>
              </>
            )}
            
            <Button 
              variant={isUploaded ? "outline" : "default"}
              size="sm"
              className={cn(
                "mt-2 transition-all duration-300",
                !isUploaded && "gradient-primary text-primary-foreground font-semibold shadow-lg glow-sm hover:glow-md"
              )}
              onClick={handleButtonClick}
            >
              {isUploaded ? 'Change File' : 'Browse Files'}
            </Button>
            
            <input
              id={`file-${title.replace(/\s+/g, '-').toLowerCase()}`}
              type="file"
              accept={acceptedTypes}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
