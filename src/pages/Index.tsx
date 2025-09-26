import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { DataTable } from "@/components/DataTable";
import { ReconciliationResults } from "@/components/ReconciliationResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calculator, FileText, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BankRecord {
  Description: string;
  Amount: number;
  Date?: string;
  [key: string]: any;
}

interface TenantRecord {
  [key: string]: any;
  'Pays as': string;
  ExpectedRent: number;
}

interface ReconciliationMatch {
  tenantName: string;
  paysAs: string;
  expectedRent: number;
  actualAmount: number;
  difference: number;
  status: 'match' | 'mismatch' | 'missing';
}

const Index = () => {
  const [bankData, setBankData] = useState<BankRecord[]>([]);
  const [tenantData, setTenantData] = useState<TenantRecord[]>([]);
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [tenantFile, setTenantFile] = useState<File | null>(null);
  const [reconciliationResults, setReconciliationResults] = useState<ReconciliationMatch[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const parseCSV = (content: string): Record<string, any>[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const record: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        // Try to parse as number if it looks like a currency or number
        if (/^\$?[\d,]+\.?\d*$/.test(value.replace(/^\$/, ''))) {
          record[header] = parseFloat(value.replace(/[$,]/g, ''));
        } else {
          record[header] = value;
        }
      });
      
      return record;
    });
  };

  const handleFileUpload = async (file: File, type: 'bank' | 'tenant') => {
    try {
      const content = await file.text();
      const data = parseCSV(content);
      
      if (type === 'bank') {
        setBankData(data as BankRecord[]);
        setBankFile(file);
        toast({
          title: "Bank data uploaded",
          description: `Successfully loaded ${data.length} bank records`,
        });
      } else {
        setTenantData(data as TenantRecord[]);
        setTenantFile(file);
        toast({
          title: "Tenant data uploaded",
          description: `Successfully loaded ${data.length} tenant records`,
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to parse the file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  const performReconciliation = () => {
    if (!bankData.length || !tenantData.length) {
      toast({
        title: "Missing data",
        description: "Please upload both bank and tenant files first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Group bank transactions by Description and sum amounts
    const bankSummary = bankData.reduce((acc, record) => {
      const description = record.Description || '';
      acc[description] = (acc[description] || 0) + (record.Amount || 0);
      return acc;
    }, {} as Record<string, number>);

    // Create reconciliation matches
    const matches: ReconciliationMatch[] = [];
    
    tenantData.forEach(tenant => {
      const paysAs = tenant['Pays as'] || '';
      const expectedRent = tenant.ExpectedRent || 0;
      const tenantName = tenant.Name || tenant.TenantName || paysAs;
      
      const actualAmount = bankSummary[paysAs] || 0;
      const difference = actualAmount - expectedRent;
      
      let status: 'match' | 'mismatch' | 'missing' = 'missing';
      if (actualAmount > 0) {
        status = Math.abs(difference) < 0.01 ? 'match' : 'mismatch';
      }
      
      matches.push({
        tenantName,
        paysAs,
        expectedRent,
        actualAmount,
        difference,
        status,
      });
    });

    setReconciliationResults(matches);
    setIsProcessing(false);

    toast({
      title: "Reconciliation complete",
      description: `Processed ${matches.length} tenant records`,
    });
  };

  const summary = {
    totalExpected: reconciliationResults.reduce((sum, match) => sum + match.expectedRent, 0),
    totalActual: reconciliationResults.reduce((sum, match) => sum + match.actualAmount, 0),
    totalDifference: reconciliationResults.reduce((sum, match) => sum + match.difference, 0),
    matchCount: reconciliationResults.filter(match => match.status === 'match').length,
    mismatchCount: reconciliationResults.filter(match => match.status !== 'match').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Calculator className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Rent Reconciliation</h1>
              <p className="text-muted-foreground">Match bank transactions with tenant payments and identify discrepancies</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Data Upload
            </CardTitle>
            <CardDescription>
              Upload your monthly bank transactions and tenant information files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FileUpload
                title="Monthly Bank Data"
                description="CSV file with bank transactions (must have Description and Amount columns)"
                onFileSelect={(file) => handleFileUpload(file, 'bank')}
                isUploaded={!!bankFile}
                fileName={bankFile?.name}
              />
              <FileUpload
                title="Tenant Information"
                description="CSV file with tenant data (must have 'Pays as' and ExpectedRent columns)"
                onFileSelect={(file) => handleFileUpload(file, 'tenant')}
                isUploaded={!!tenantFile}
                fileName={tenantFile?.name}
              />
            </div>
            
            {bankData.length > 0 && tenantData.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="flex justify-center">
                  <Button 
                    onClick={performReconciliation}
                    disabled={isProcessing}
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    {isProcessing ? 'Processing...' : 'Run Reconciliation'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Data Preview */}
        {(bankData.length > 0 || tenantData.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bankData.length > 0 && (
              <DataTable
                title="Bank Transactions"
                description="Preview of uploaded bank data"
                data={bankData}
                columns={Object.keys(bankData[0] || {})}
                maxRows={5}
              />
            )}
            {tenantData.length > 0 && (
              <DataTable
                title="Tenant Information"
                description="Preview of uploaded tenant data"
                data={tenantData}
                columns={Object.keys(tenantData[0] || {})}
                maxRows={5}
              />
            )}
          </div>
        )}

        {/* Reconciliation Results */}
        {reconciliationResults.length > 0 && (
          <ReconciliationResults 
            matches={reconciliationResults} 
            summary={summary}
          />
        )}
      </div>
    </div>
  );
};

export default Index;