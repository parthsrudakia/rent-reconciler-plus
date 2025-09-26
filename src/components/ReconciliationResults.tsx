import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface ReconciliationMatch {
  tenantName: string;
  paysAs: string;
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
        return <CheckCircle className="h-4 w-4 text-success" />;
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
        return <Badge className="bg-success text-success-foreground">Match</Badge>;
      case 'mismatch':
        return <Badge className="bg-destructive text-destructive-foreground">Mismatch</Badge>;
      case 'missing':
        return <Badge className="bg-warning text-warning-foreground">Missing</Badge>;
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expected Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalExpected)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actual Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalActual)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Difference</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${summary.totalDifference === 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(summary.totalDifference)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Match Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {matches.length > 0 ? Math.round((summary.matchCount / matches.length) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Details</CardTitle>
          <CardDescription>
            Detailed comparison of expected vs actual rent payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Pays As</TableHead>
                  <TableHead className="text-right">Expected Rent</TableHead>
                  <TableHead className="text-right">Actual Amount</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No reconciliation data available
                    </TableCell>
                  </TableRow>
                ) : (
                  matches.map((match, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(match.status)}
                          {getStatusBadge(match.status)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{match.tenantName}</TableCell>
                      <TableCell>{match.paysAs}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(match.expectedRent)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(match.actualAmount)}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-semibold ${
                        match.difference === 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {formatCurrency(match.difference)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};