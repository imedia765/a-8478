import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TestResult {
  metric_name?: string;
  check_type?: string;
  current_value?: number;
  threshold?: number;
  status: string;
  details: any;
}

interface TestResultsTableProps {
  results: TestResult[];
  type: 'system' | 'performance' | 'security' | 'configuration';
}

const TestResultsTable = ({ results, type }: TestResultsTableProps) => {
  if (!results?.length) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'good':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <Table className="mt-4">
      <TableHeader className="bg-dashboard-card/50">
        <TableRow className="border-b border-white/10">
          <TableHead className="text-dashboard-text">Name</TableHead>
          {type === 'performance' && (
            <>
              <TableHead className="text-dashboard-text">Current Value</TableHead>
              <TableHead className="text-dashboard-text">Threshold</TableHead>
            </>
          )}
          <TableHead className="text-dashboard-text">Status</TableHead>
          <TableHead className="text-dashboard-text">Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result, index) => (
          <TableRow key={index} className="border-b border-white/5">
            <TableCell className="font-medium text-dashboard-text">
              {result.metric_name || result.check_type}
            </TableCell>
            {type === 'performance' && (
              <>
                <TableCell className="text-dashboard-muted">
                  {result.current_value?.toFixed(2)}
                </TableCell>
                <TableCell className="text-dashboard-muted">
                  {result.threshold}
                </TableCell>
              </>
            )}
            <TableCell>
              <Badge 
                variant="outline" 
                className={`${getStatusColor(result.status)}`}
              >
                {result.status}
              </Badge>
            </TableCell>
            <TableCell className="text-dashboard-muted max-w-[300px] truncate">
              {typeof result.details === 'object' 
                ? JSON.stringify(result.details, null, 2)
                : result.details}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TestResultsTable;