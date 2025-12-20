import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Target, Sparkles } from "lucide-react";
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
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
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
        return <Badge className="bg-primary/10 text-primary border-primary/30 font-medium">Match</Badge>;
      case 'mismatch':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/30 font-medium">Mismatch</Badge>;
      case 'missing':
        return <Badge className="bg-warning/10 text-warning border-warning/30 font-medium">Missing</Badge>;
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
    <div className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/30 hover:bg-secondary/30 border-b border-border/50">
            <TableHead className="font-semibold text-foreground">Status</TableHead>
            <TableHead className="font-semibold text-foreground">Tenant</TableHead>
            <TableHead className="font-semibold text-foreground">Pays As</TableHead>
            <TableHead className="font-semibold text-foreground">Email</TableHead>
            <TableHead className="font-semibold text-foreground">Phone</TableHead>
            <TableHead className="text-right font-semibold text-foreground">Expected</TableHead>
            <TableHead className="text-right font-semibold text-foreground">Actual</TableHead>
            <TableHead className="text-right font-semibold text-foreground">Difference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 rounded-full bg-primary/10">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <span className="text-lg font-medium">{emptyMessage}</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            items.map((match, index) => (
              <TableRow 
                key={index} 
                className="hover:bg-secondary/20 transition-colors border-b border-border/30"
                style={{ animationDelay: `${index * 50}ms` }}
              >
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
                  "text-right font-mono font-bold",
                  match.difference === 0 ? 'text-primary' : 'text-destructive'
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

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    gradient, 
    subtitle 
  }: { 
    title: string; 
    value: string; 
    icon: any; 
    gradient: string;
    subtitle?: string;
  }) => (
    <div className="relative group">
      <div className={cn(
        "absolute -inset-[1px] rounded-2xl opacity-50 blur-sm transition-opacity duration-300 group-hover:opacity-100",
        gradient
      )} />
      <div className="relative glass rounded-2xl p-6 h-full">
        <div className="flex items-start justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className={cn("p-2 rounded-xl", gradient)}>
            <Icon className="h-4 w-4 text-background" />
          </div>
        </div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Expected Total"
          value={formatCurrency(summary.totalExpected)}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
        />
        <StatCard
          title="Actual Total"
          value={formatCurrency(summary.totalActual)}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-primary to-emerald-500"
        />
        <StatCard
          title="Difference"
          value={formatCurrency(summary.totalDifference)}
          icon={TrendingDown}
          gradient={summary.totalDifference === 0 
            ? "bg-gradient-to-br from-primary to-emerald-500" 
            : "bg-gradient-to-br from-destructive to-orange-500"
          }
        />
        <StatCard
          title="Match Rate"
          value={`${matchRate}%`}
          icon={Target}
          gradient="bg-gradient-to-br from-accent to-pink-500"
          subtitle={`${summary.matchCount} of ${matches.length} matched`}
        />
      </div>

      {/* Detailed Results */}
      <div className="relative">
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-50 blur-sm" />
        <div className="relative glass rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl gradient-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Reconciliation Details</h2>
                <p className="text-sm text-muted-foreground">
                  Detailed comparison of expected vs actual rent payments
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <Tabs defaultValue="mismatched" className="w-full">
              <TabsList className="w-full grid grid-cols-3 bg-secondary/50 p-1.5 rounded-xl mb-6">
                <TabsTrigger 
                  value="mismatched" 
                  className="data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive rounded-lg font-medium transition-all"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mismatched ({mismatchedItems.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="matched"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg font-medium transition-all"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Matched ({matchedItems.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="all"
                  className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent rounded-lg font-medium transition-all"
                >
                  All ({matches.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="mismatched" className="mt-0 animate-fade-in">
                {renderTable(mismatchedItems, "All payments matched perfectly!")}
              </TabsContent>
              
              <TabsContent value="matched" className="mt-0 animate-fade-in">
                {renderTable(matchedItems, "No matched payments yet")}
              </TabsContent>
              
              <TabsContent value="all" className="mt-0 animate-fade-in">
                {renderTable(matches, "No reconciliation data available")}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};
