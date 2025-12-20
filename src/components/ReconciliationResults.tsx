import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReconciliationMatch {
  tenantName: string;
  paysAs: string;
  email?: string;
  phone?: string;
  expectedRent: number;
  actualAmount: number;
  difference: number;
  status: 'match' | 'mismatch' | 'missing';
}

interface ReconciliationResultsProps {
  matches: ReconciliationMatch[];
  summary: {
    totalExpected: number;
    totalActual: number;
    totalDifference: number;
    matchCount: number;
    mismatchCount: number;
  };
}

export const ReconciliationResults = ({ matches, summary }: ReconciliationResultsProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'match':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'mismatch':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'missing':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'match':
        return <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">Match</Badge>;
      case 'mismatch':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">Mismatch</Badge>;
      case 'missing':
        return <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">Missing</Badge>;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const matchedItems = matches.filter(match => match.status === 'match');
  const mismatchedItems = matches.filter(match => match.status === 'mismatch' || match.status === 'missing');
  const matchRate = matches.length > 0 ? Math.round((summary.matchCount / matches.length) * 100) : 0;

  const renderTable = (items: ReconciliationMatch[], emptyMessage: string) => (
    <div className="rounded-xl border border-border/50 overflow-hidden bg-card/50">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Tenant</TableHead>
            <TableHead className="font-semibold">Pays As</TableHead>
            <TableHead className="font-semibold">Email</TableHead>
            <TableHead className="font-semibold">Phone</TableHead>
            <TableHead className="text-right font-semibold">Expected</TableHead>
            <TableHead className="text-right font-semibold">Actual</TableHead>
            <TableHead className="text-right font-semibold">Difference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
                  {emptyMessage}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            items.map((match, index) => (
              <TableRow key={index} className="hover:bg-muted/20 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(match.status)}
                    {getStatusBadge(match.status)}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{match.tenantName}</TableCell>
                <TableCell className="text-muted-foreground">{match.paysAs}</TableCell>
                <TableCell className="text-sm text-muted-foreground font-mono">{match.email || '-'}</TableCell>
                <TableCell className="text-sm text-muted-foreground font-mono">{match.phone || '-'}</TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatCurrency(match.expectedRent)}
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatCurrency(match.actualAmount)}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono font-semibold",
                  match.difference === 0 ? 'text-success' : 'text-destructive'
                )}>
                  {formatCurrency(match.difference)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-border/50 shadow-card hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expected Total</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{formatCurrency(summary.totalExpected)}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 shadow-card hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-20 h-20 bg-success/5 rounded-bl-full" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Actual Total</CardTitle>
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{formatCurrency(summary.totalActual)}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 shadow-card hover:shadow-md transition-shadow">
          <div className={cn(
            "absolute top-0 right-0 w-20 h-20 rounded-bl-full",
            summary.totalDifference === 0 ? "bg-success/5" : "bg-destructive/5"
          )} />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Difference</CardTitle>
              <div className={cn(
                "p-2 rounded-lg",
                summary.totalDifference === 0 ? "bg-success/10" : "bg-destructive/10"
              )}>
                <TrendingDown className={cn(
                  "h-4 w-4",
                  summary.totalDifference === 0 ? "text-success" : "text-destructive"
                )} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-2xl font-bold tracking-tight",
              summary.totalDifference === 0 ? 'text-success' : 'text-destructive'
            )}>
              {formatCurrency(summary.totalDifference)}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 shadow-card hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Match Rate</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight text-primary">{matchRate}%</p>
              <p className="text-sm text-muted-foreground">({summary.matchCount}/{matches.length})</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Card className="border-border/50 shadow-card overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20">
          <CardTitle className="text-xl">Reconciliation Details</CardTitle>
          <CardDescription>
            Detailed comparison of expected vs actual rent payments
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="mismatched" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger 
                value="mismatched" 
                className="data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive rounded-md transition-all"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Mismatched ({mismatchedItems.length})
              </TabsTrigger>
              <TabsTrigger 
                value="matched"
                className="data-[state=active]:bg-success/10 data-[state=active]:text-success rounded-md transition-all"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Matched ({matchedItems.length})
              </TabsTrigger>
              <TabsTrigger 
                value="all"
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md transition-all"
              >
                All ({matches.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="mismatched" className="mt-6 animate-fade-in">
              {renderTable(mismatchedItems, "No mismatched payments found")}
            </TabsContent>
            
            <TabsContent value="matched" className="mt-6 animate-fade-in">
              {renderTable(matchedItems, "No matched payments found")}
            </TabsContent>
            
            <TabsContent value="all" className="mt-6 animate-fade-in">
              {renderTable(matches, "No reconciliation data available")}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
