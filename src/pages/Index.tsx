import { useState, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { DataTable } from "@/components/DataTable";
import { ReconciliationResults } from "@/components/ReconciliationResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calculator, FileText, TrendingUp, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

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
  Address?: string;
  Apt?: string;
  'Room No'?: string;
}

interface ReconciliationMatch {
  tenantName: string;
  paysAs: string;
  email?: string;
  phone?: string;
  address?: string;
  apt?: string;
  roomNo?: string;
  expectedRent: number;
  actualAmount: number;
  difference: number;
  status: 'match' | 'mismatch' | 'missing';
}

const Index = () => {
  const [bankData, setBankData] = useState<BankRecord[]>([]);
  const [otherStatementData, setOtherStatementData] = useState<BankRecord[]>([]);
  const [tenantData, setTenantData] = useState<TenantRecord[]>([]);
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [otherStatementFile, setOtherStatementFile] = useState<File | null>(null);
  const [tenantFile, setTenantFile] = useState<File | null>(null);
  const [reconciliationResults, setReconciliationResults] = useState<ReconciliationMatch[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load existing data on mount
  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      setIsLoading(true);
      
      // Load bank transactions
      const { data: bankTransactions } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('source', 'bank');
      
      const { data: otherTransactions } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('source', 'other');
      
      // Load tenants
      const { data: tenants } = await supabase
        .from('tenants')
        .select('*');
      
      // Load latest reconciliation results
      const { data: results } = await supabase
        .from('reconciliation_results')
        .select('*')
        .order('reconciliation_date', { ascending: false })
        .limit(100);

      if (bankTransactions) {
        setBankData(bankTransactions.map(t => ({
          Description: t.description,
          Amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount,
          Date: t.date || '',
        })));
      }

      if (otherTransactions) {
        setOtherStatementData(otherTransactions.map(t => ({
          Description: t.description,
          Amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount,
          Date: t.date || '',
        })));
      }

      if (tenants) {
        setTenantData(tenants.map(t => ({
          Name: t.name,
          'Pays as': t.pays_as,
          ExpectedRent: typeof t.expected_rent === 'string' ? parseFloat(t.expected_rent) : t.expected_rent,
          Email: t.email || '',
          Phone: t.phone || '',
          Address: t.address || '',
          Apt: t.apt || '',
          'Room No': t.room_no || '',
        })));
      }

      if (results && results.length > 0) {
        setReconciliationResults(results.map(r => ({
          tenantName: r.tenant_name,
          paysAs: r.pays_as,
          email: r.email || '',
          phone: r.phone || '',
          address: r.address || '',
          apt: r.apt || '',
          roomNo: r.room_no || '',
          expectedRent: typeof r.expected_rent === 'string' ? parseFloat(r.expected_rent) : r.expected_rent,
          actualAmount: typeof r.actual_amount === 'string' ? parseFloat(r.actual_amount) : r.actual_amount,
          difference: typeof r.difference === 'string' ? parseFloat(r.difference) : r.difference,
          status: r.status as 'match' | 'mismatch' | 'missing',
        })));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseCSV = (content: string, skipRows: number = 0): Record<string, any>[] => {
    const lines = content.trim().split('\n');
    if (lines.length < skipRows + 2) return [];
    
    // Skip the specified number of rows
    const relevantLines = lines.slice(skipRows);
    const headers = relevantLines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return relevantLines.slice(1).map(line => {
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

  const preprocessBankData = (data: any[]): BankRecord[] => {
    return data
      .map((record: any) => {
        // Clean Amount field (remove commas and dollar signs, convert to number)
        const rawAmount = record.Amount;
        let amount: number;
        
        if (typeof rawAmount === 'string') {
          const cleanAmount = rawAmount.replace(/,/g, '').replace(/\$/g, '');
          amount = parseFloat(cleanAmount) || 0;
        } else if (typeof rawAmount === 'number') {
          amount = rawAmount;
        } else {
          amount = 0;
        }
        
        return { ...record, Amount: amount };
      })
      // Filter for Zelle payments only
      .filter((record: any) => {
        const description = record.Description || '';
        return description.startsWith('Zelle payment from') || 
               description.startsWith('Zelle Scheduled payment from');
      })
      // Clean Description field
      .map((record: any) => {
        let description = record.Description || '';
        
        // Remove Zelle prefixes
        description = description.replace(/^Zelle Scheduled payment from /, '');
        description = description.replace(/^Zelle payment from /, '');
        
        // Trim whitespace
        description = description.trim();
        
        // Remove " for ..." suffix
        description = description.replace(/ for .*$/, '');
        
        // Remove " Conf# ..." suffix
        description = description.replace(/ Conf# .*$/, '');
        
        // Convert to lowercase
        description = description.toLowerCase();
        
        return {
          ...record,
          Date: record.Date,
          Description: description,
          Amount: record.Amount
        };
      });
  };

  const preprocessTenantData = (data: TenantRecord[]): TenantRecord[] => {
    console.log('Raw tenant CSV data sample:', data[0]);
    console.log('All column names:', data[0] ? Object.keys(data[0]) : []);
    
    return data.map(record => {
      // Log first record for debugging
      if (data.indexOf(record) === 0) {
        console.log('First record mapping:', {
          'Pays as': record['Pays as'],
          ExpectedRent: record.ExpectedRent || record['Expected Rent'],
          Email: record.Email || record.email,
          Phone: record.Phone || record.phone || record['Phone Number'],
        });
      }
      
      return {
        Name: record.Name || record.TenantName || '',
        'Pays as': (record['Pays as'] || '').toLowerCase(),
        ExpectedRent: record.ExpectedRent || record['Expected Rent'] || 0,
        Email: record.Email || record.email || '',
        Phone: record.Phone || record.phone || record['Phone Number'] || '',
        Address: record.Address || record.address || '',
        Apt: record.Apt || record.apt || '',
        'Room No': record['Room No'] || record.RoomNo || record.Room || record.room_no || record['Room#'] || '',
      };
    });
  };

  const handleFileUpload = async (file: File, type: 'bank' | 'other' | 'tenant') => {
    try {
      const content = await file.text();
      
      if (type === 'bank') {
        // Skip 6 rows for bank statements
        const rawData = parseCSV(content, 6);
        const processedData = preprocessBankData(rawData as BankRecord[]);
        setBankData(processedData);
        setBankFile(file);
        
        // Save to database (upsert to prevent duplicates)
        await saveBankTransactions(processedData, 'bank');
        
        toast({
          title: "Bank data uploaded",
          description: `Successfully loaded ${processedData.length} Zelle payment records`,
        });
      } else if (type === 'other') {
        // Don't skip rows for other statements
        const rawData = parseCSV(content, 0);
        const processedData = preprocessBankData(rawData as BankRecord[]);
        setOtherStatementData(processedData);
        setOtherStatementFile(file);
        
        // Save to database (upsert to prevent duplicates)
        await saveBankTransactions(processedData, 'other');
        
        toast({
          title: "Other statement data uploaded",
          description: `Successfully loaded ${processedData.length} payment records`,
        });
      } else {
        const rawData = parseCSV(content);
        const processedData = preprocessTenantData(rawData as TenantRecord[]);
        setTenantData(processedData);
        setTenantFile(file);
        
        // Save to database (upsert to prevent duplicates)
        const { updatedCount, newCount } = await saveTenants(processedData);
        
        const updateMsg = updatedCount > 0 ? `${updatedCount} updated` : '';
        const newMsg = newCount > 0 ? `${newCount} new` : '';
        const parts = [updateMsg, newMsg].filter(Boolean);
        
        toast({
          title: "Tenant data uploaded",
          description: `Successfully processed ${processedData.length} tenant records (${parts.join(', ')})`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to parse the file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  const saveBankTransactions = async (data: BankRecord[], source: 'bank' | 'other') => {
    try {
      const transactions = data.map(record => ({
        description: record.Description,
        amount: record.Amount,
        date: record.Date || null,
        source,
        raw_data: record,
      }));

      // Use upsert to handle duplicates gracefully
      const { error } = await supabase
        .from('bank_transactions')
        .upsert(transactions, { 
          onConflict: 'description,amount,date,source',
          ignoreDuplicates: true 
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving transactions:', error);
      throw error;
    }
  };

  const saveTenants = async (data: TenantRecord[]) => {
    try {
      // Deduplicate data by pays_as (keep the last occurrence)
      const uniqueData = Array.from(
        data.reduce((map, record) => {
          map.set(record['Pays as'], record);
          return map;
        }, new Map<string, TenantRecord>()).values()
      );

      // Check which tenants already exist
      const paysAsList = uniqueData.map(record => record['Pays as']);
      const { data: existingTenants } = await supabase
        .from('tenants')
        .select('pays_as, name')
        .in('pays_as', paysAsList);

      const existingPaysAs = new Set(existingTenants?.map(t => t.pays_as) || []);
      
      const tenants = uniqueData.map(record => ({
        name: record.Name || record.TenantName || record['Pays as'],
        pays_as: record['Pays as'],
        expected_rent: record.ExpectedRent,
        email: record.Email || record.email || null,
        phone: record.Phone || record.phone || record['Phone Number'] || null,
        address: record.Address || record.address || null,
        apt: record.Apt || record.apt || null,
        room_no: record['Room No'] || record['RoomNo'] || record.Room || record.room_no || record['Room#'] || null,
        raw_data: record,
      }));

      // Use upsert to update existing tenants or create new ones
      const { error } = await supabase
        .from('tenants')
        .upsert(tenants, { 
          onConflict: 'pays_as',
          ignoreDuplicates: false // Always update if tenant info changes
        });

      if (error) throw error;

      // Count updates vs new additions
      const updatedCount = tenants.filter(t => existingPaysAs.has(t.pays_as)).length;
      const newCount = tenants.length - updatedCount;

      return { updatedCount, newCount };
    } catch (error) {
      console.error('Error saving tenants:', error);
      throw error;
    }
  };

  const performReconciliation = async () => {
    if (!tenantData.length) {
      toast({
        title: "Missing data",
        description: "Please upload tenant data first",
        variant: "destructive",
      });
      return;
    }

    if (!bankData.length && !otherStatementData.length) {
      toast({
        title: "Missing data",
        description: "Please upload at least one statement file first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Combine all statement data
      const allStatementData = [...bankData, ...otherStatementData];

      // Group all transactions by Description and sum amounts
      const statementSummary = allStatementData.reduce((acc, record) => {
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
        const email = tenant.Email || tenant.email || '';
        const phone = tenant.Phone || tenant.phone || tenant['Phone Number'] || '';
        const address = tenant.Address || tenant.address || '';
        const apt = tenant.Apt || tenant.apt || '';
        const roomNo = tenant['Room No'] || tenant['RoomNo'] || tenant.Room || tenant.room_no || tenant['Room#'] || '';
        
        const actualAmount = statementSummary[paysAs] || 0;
        const difference = actualAmount - expectedRent;
        
        let status: 'match' | 'mismatch' | 'missing' = 'missing';
        if (actualAmount > 0) {
          status = Math.abs(difference) < 0.01 ? 'match' : 'mismatch';
        }
        
        matches.push({
          tenantName,
          paysAs,
          email,
          phone,
          address,
          apt,
          roomNo,
          expectedRent,
          actualAmount,
          difference,
          status,
        });
      });

      setReconciliationResults(matches);

      // Save reconciliation results to database
      await saveReconciliationResults(matches);

      toast({
        title: "Reconciliation complete",
        description: `Processed ${matches.length} tenant records`,
      });
    } catch (error) {
      console.error('Reconciliation error:', error);
      toast({
        title: "Reconciliation failed",
        description: "An error occurred during reconciliation",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const saveReconciliationResults = async (matches: ReconciliationMatch[]) => {
    try {
      const results = matches.map(match => ({
        tenant_name: match.tenantName,
        pays_as: match.paysAs,
        email: match.email || null,
        phone: match.phone || null,
        address: match.address || null,
        apt: match.apt || null,
        room_no: match.roomNo || null,
        expected_rent: match.expectedRent,
        actual_amount: match.actualAmount,
        difference: match.difference,
        status: match.status,
        reconciliation_date: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('reconciliation_results')
        .insert(results);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving reconciliation results:', error);
      throw error;
    }
  };

  const exportToExcel = () => {
    const exportData = reconciliationResults.map(match => ({
      'Apt': match.apt || '',
      'Room No': match.roomNo || '',
      'Tenant Name': match.tenantName,
      'Email Address': match.email || '',
      'Phone': match.phone || '',
      'Expected Rent': match.expectedRent,
      'Actual Paid Amount': match.actualAmount,
      'Paid Matches (Y/N)': match.status === 'match' ? 'Y' : 'N',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 10 }, // Apt
      { wch: 12 }, // Room No
      { wch: 20 }, // Tenant Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 15 }, // Expected Rent
      { wch: 18 }, // Actual Paid Amount
      { wch: 18 }, // Paid Matches
    ];

    // Style the header row
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }

    // Add borders and formatting to data rows
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[cellAddress]) continue;

        // Apply borders to all cells
        worksheet[cellAddress].s = {
          border: {
            top: { style: "thin", color: { rgb: "D0D0D0" } },
            bottom: { style: "thin", color: { rgb: "D0D0D0" } },
            left: { style: "thin", color: { rgb: "D0D0D0" } },
            right: { style: "thin", color: { rgb: "D0D0D0" } }
          },
          alignment: { vertical: "center" }
        };

        // Format currency columns (Expected Rent and Actual Paid Amount)
        if (col === 5 || col === 6) {
          worksheet[cellAddress].z = '$#,##0.00';
        }

        // Conditional formatting for Paid Matches column (Y/N)
        if (col === 7) {
          const value = worksheet[cellAddress].v;
          worksheet[cellAddress].s = {
            ...worksheet[cellAddress].s,
            fill: { 
              fgColor: { rgb: value === 'Y' ? "C6EFCE" : "FFC7CE" } 
            },
            font: { 
              color: { rgb: value === 'Y' ? "006100" : "9C0006" },
              bold: true
            },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reconciliation');
    
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Reconciliation_${date}.xlsx`, { cellStyles: true });

    toast({
      title: "Export successful",
      description: "Styled reconciliation data exported to Excel file",
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
            <Tabs defaultValue="statements" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="statements">Statements</TabsTrigger>
                <TabsTrigger value="other-statements">Other Statements</TabsTrigger>
                <TabsTrigger value="tenants">Tenant Information</TabsTrigger>
              </TabsList>
              
              <TabsContent value="statements" className="mt-6">
                <FileUpload
                  title="Bank Statements"
                  description="CSV file with bank transactions (will skip 6 header rows)"
                  onFileSelect={(file) => handleFileUpload(file, 'bank')}
                  isUploaded={!!bankFile}
                  fileName={bankFile?.name}
                />
              </TabsContent>
              
              <TabsContent value="other-statements" className="mt-6">
                <FileUpload
                  title="Other Payment Statements"
                  description="CSV file with other payment sources (same format as bank statements)"
                  onFileSelect={(file) => handleFileUpload(file, 'other')}
                  isUploaded={!!otherStatementFile}
                  fileName={otherStatementFile?.name}
                />
              </TabsContent>
              
              <TabsContent value="tenants" className="mt-6">
                <FileUpload
                  title="Tenant Information"
                  description="CSV file with tenant data (must have 'Pays as' and ExpectedRent columns)"
                  onFileSelect={(file) => handleFileUpload(file, 'tenant')}
                  isUploaded={!!tenantFile}
                  fileName={tenantFile?.name}
                />
              </TabsContent>
            </Tabs>
            
            {(bankData.length > 0 || otherStatementData.length > 0) && tenantData.length > 0 && (
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

        {/* Reconciliation Results */}
        {reconciliationResults.length > 0 && (
          <>
            <div className="flex justify-end">
              <Button 
                onClick={exportToExcel}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export to Excel
              </Button>
            </div>
            <ReconciliationResults 
              matches={reconciliationResults} 
              summary={summary}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Index;