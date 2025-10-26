import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ReconciliationResults } from "@/components/ReconciliationResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calculator, FileText, TrendingUp, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ExcelJS from 'exceljs';

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
  const { toast } = useToast();

  const parseExcel = async (file: File): Promise<any[]> => {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);
    
    const worksheet = workbook.worksheets[0];
    const rows: any[] = [];
    const headers: string[] = [];
    
    // Helper function to extract text from Excel cell values
    const getCellText = (cellValue: any): string => {
      if (!cellValue) return '';
      
      // Handle hyperlink objects
      if (typeof cellValue === 'object' && cellValue.text !== undefined) {
        return cellValue.text.toString();
      }
      
      // Handle rich text objects
      if (typeof cellValue === 'object' && cellValue.richText) {
        return cellValue.richText.map((rt: any) => rt.text).join('');
      }
      
      // Handle plain values
      return cellValue.toString();
    };
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        // First row is headers
        row.eachCell((cell) => {
          headers.push(getCellText(cell.value));
        });
      } else {
        // Data rows
        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          rowData[header] = getCellText(cell.value);
        });
        rows.push(rowData);
      }
    });
    
    return rows;
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

  const preprocessOtherPaymentData = (data: any[]): BankRecord[] => {
    return data
      .filter(record => record.Description && record.Amount)
      .map((record: any) => {
        let description = record.Description || '';
        
        // Trim whitespace and convert to lowercase for matching
        description = description.trim().toLowerCase();
        
        // Clean and convert amount to number
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
        
        return {
          Date: '', // Other payments don't have dates
          Description: description,
          Amount: amount
        };
      });
  };

  const preprocessTenantData = (data: TenantRecord[]): TenantRecord[] => {
    return data.map(record => {
      // Clean and convert ExpectedRent to number
      const rawRent = record.ExpectedRent || record['Expected Rent'] || 0;
      let expectedRent: number;
      
      if (typeof rawRent === 'string') {
        const cleanRent = rawRent.replace(/,/g, '').replace(/\$/g, '');
        expectedRent = parseFloat(cleanRent) || 0;
      } else if (typeof rawRent === 'number') {
        expectedRent = rawRent;
      } else {
        expectedRent = 0;
      }
      
      return {
        Name: record.Name || record.TenantName || '',
        'Pays as': (record['Pays As'] || record['Pays as'] || '').toLowerCase(),
        ExpectedRent: expectedRent,
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
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      
      if (type === 'bank') {
        // Bank statements are always CSV
        const content = await file.text();
        const rawData = parseCSV(content, 6);
        const processedData = preprocessBankData(rawData as BankRecord[]);
        setBankData(processedData);
        setBankFile(file);
        
        toast({
          title: "Bank data uploaded",
          description: `Successfully loaded ${processedData.length} Zelle payment records`,
        });
      } else if (type === 'other') {
        // Other payments can be CSV or Excel
        let rawData;
        if (isExcel) {
          rawData = await parseExcel(file);
        } else {
          const content = await file.text();
          rawData = parseCSV(content, 0);
        }
        console.log('Raw Other Payment Data:', rawData);
        const processedData = preprocessOtherPaymentData(rawData);
        console.log('Processed Other Payment Data:', processedData);
        setOtherStatementData(processedData);
        setOtherStatementFile(file);
        
        toast({
          title: "Other statement data uploaded",
          description: `Successfully loaded ${processedData.length} payment records`,
        });
      } else {
        // Tenant data can be CSV or Excel
        let rawData;
        if (isExcel) {
          rawData = await parseExcel(file);
        } else {
          const content = await file.text();
          rawData = parseCSV(content);
        }
        const processedData = preprocessTenantData(rawData as TenantRecord[]);
        setTenantData(processedData);
        setTenantFile(file);
        
        toast({
          title: "Tenant data uploaded",
          description: `Successfully processed ${processedData.length} tenant records`,
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
      console.log('All Statement Data:', allStatementData);

      // Group all transactions by Description and sum amounts
      const statementSummary = allStatementData.reduce((acc, record) => {
        const description = record.Description || '';
        acc[description] = (acc[description] || 0) + (record.Amount || 0);
        return acc;
      }, {} as Record<string, number>);
      console.log('Statement Summary:', statementSummary);

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

  const exportToExcel = async () => {
    // Sort by apartment
    const sortedResults = [...reconciliationResults].sort((a, b) => {
      const aptA = a.apt || '';
      const aptB = b.apt || '';
      return aptA.localeCompare(aptB);
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reconciliation');

    // Add headers
    worksheet.columns = [
      { header: 'Apt', key: 'apt', width: 20 },
      { header: 'Room No', key: 'roomNo', width: 12 },
      { header: 'Tenant Name', key: 'tenantName', width: 25 },
      { header: 'Email Address', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Expected Rent', key: 'expectedRent', width: 18 },
      { header: 'Actual Paid Amount', key: 'actualPaid', width: 22 },
      { header: 'Paid Matches (Y/N)', key: 'paidMatches', width: 20 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Group by apartment and add rows
    let currentApt = '';
    let groupExpectedTotal = 0;
    let groupActualTotal = 0;

    sortedResults.forEach((match, index) => {
      const apt = match.apt || '';
      
      // If apartment changes, add subtotal for previous group
      if (currentApt !== '' && currentApt !== apt) {
        const subtotalRow = worksheet.addRow({
          apt: `${currentApt} Subtotal`,
          roomNo: '',
          tenantName: '',
          email: '',
          phone: '',
          expectedRent: groupExpectedTotal,
          actualPaid: groupActualTotal,
          paidMatches: '',
        });
        subtotalRow.font = { bold: true };
        subtotalRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE7E6E6' }
        };
        
        // Add empty row
        worksheet.addRow({});
        
        groupExpectedTotal = 0;
        groupActualTotal = 0;
      }

      currentApt = apt;
      groupExpectedTotal += match.expectedRent;
      groupActualTotal += match.actualAmount;

      // Add regular row
      const row = worksheet.addRow({
        apt: match.apt || '',
        roomNo: match.roomNo || '',
        tenantName: match.tenantName,
        email: match.email || '',
        phone: match.phone || '',
        expectedRent: match.expectedRent,
        actualPaid: match.actualAmount,
        paidMatches: match.status === 'match' ? 'Y' : 'N',
      });

      // Format currency cells
      row.getCell(6).numFmt = '$#,##0.00';
      row.getCell(7).numFmt = '$#,##0.00';

      // Apply Y/N conditional formatting
      const matchCell = row.getCell(8);
      if (match.status === 'match') {
        matchCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC6EFCE' }
        };
        matchCell.font = { bold: true, color: { argb: 'FF006100' } };
      } else {
        matchCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC7CE' }
        };
        matchCell.font = { bold: true, color: { argb: 'FF9C0006' } };
      }
      matchCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Add subtotal for last group
      if (index === sortedResults.length - 1) {
        const subtotalRow = worksheet.addRow({
          apt: `${currentApt} Subtotal`,
          roomNo: '',
          tenantName: '',
          email: '',
          phone: '',
          expectedRent: groupExpectedTotal,
          actualPaid: groupActualTotal,
          paidMatches: '',
        });
        subtotalRow.font = { bold: true };
        subtotalRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE7E6E6' }
        };
        
        // Add empty row
        worksheet.addRow({});
      }
    });

    // Apply borders to all cells
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
        };
      });
    });

    // Export file
    const date = new Date().toISOString().split('T')[0];
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reconciliation_${date}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

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
                  description="Excel or CSV file with Description (tenant names) and Amount columns"
                  onFileSelect={(file) => handleFileUpload(file, 'other')}
                  acceptedTypes=".csv,.xlsx,.xls"
                  isUploaded={!!otherStatementFile}
                  fileName={otherStatementFile?.name}
                />
              </TabsContent>
              
              <TabsContent value="tenants" className="mt-6">
                <FileUpload
                  title="Tenant Information"
                  description="Excel or CSV file with tenant data (must have 'Pays as' and ExpectedRent columns)"
                  onFileSelect={(file) => handleFileUpload(file, 'tenant')}
                  acceptedTypes=".csv,.xlsx,.xls"
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