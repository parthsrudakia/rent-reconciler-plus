import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DataTableProps {
  title: string;
  description?: string;
  data: Record<string, any>[];
  columns: string[];
  maxRows?: number;
}

export const DataTable = ({ title, description, data, columns, maxRows = 10 }: DataTableProps) => {
  const displayData = data.slice(0, maxRows);
  
  return (
    <Card className="border-border/50 shadow-card overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            {data.length} rows
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                {columns.map((column) => (
                  <TableHead key={column} className="font-semibold text-foreground">
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-12">
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((row, index) => (
                  <TableRow key={index} className="hover:bg-muted/20 transition-colors">
                    {columns.map((column) => (
                      <TableCell key={column} className="font-mono text-sm">
                        {row[column] ?? '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {data.length > maxRows && (
          <div className="px-6 py-3 border-t border-border/50 bg-muted/10">
            <p className="text-sm text-muted-foreground">
              Showing {maxRows} of {data.length} rows
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
