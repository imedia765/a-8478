import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Loader2, Check, X, ChevronDown, ChevronUp, Users, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import TotalCount from "@/components/TotalCount";

const FinancialsView = () => {
  const { toast } = useToast();

  const { data: collectorStats, isLoading: statsLoading } = useQuery({
    queryKey: ['collector-payment-stats'],
    queryFn: async () => {
      const { data: collectors } = await supabase
        .from('members_collectors')
        .select('*')
        .eq('active', true);

      if (!collectors) return [];

      const stats = await Promise.all(collectors.map(async (collector) => {
        const { data: payments } = await supabase
          .from('payment_requests')
          .select('*, members!payment_requests_member_id_fkey(full_name)')
          .eq('collector_id', collector.id);

        const pendingPayments = payments?.filter(p => p.status === 'pending') || [];
        const approvedPayments = payments?.filter(p => p.status === 'approved') || [];
        
        return {
          ...collector,
          totalPending: pendingPayments.length,
          totalApproved: approvedPayments.length,
          pendingAmount: pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0),
          approvedAmount: approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0),
          payments: payments || []
        };
      }));

      return stats;
    }
  });

  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ['payment-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          members!payment_requests_member_id_fkey(full_name),
          collectors:members_collectors(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment requests:', error);
        throw error;
      }

      return data;
    },
  });

  const handleApproval = async (paymentId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_requests')
        .update({
          status: approved ? 'approved' : 'rejected',
          approved_at: approved ? new Date().toISOString() : null,
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: approved ? "Payment Approved" : "Payment Rejected",
        description: "The payment request has been processed successfully.",
      });

      refetch();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "Failed to process the payment request.",
        variant: "destructive",
      });
    }
  };

  const totalPendingAmount = collectorStats?.reduce((sum, collector) => sum + collector.pendingAmount, 0) || 0;
  const totalApprovedAmount = collectorStats?.reduce((sum, collector) => sum + collector.approvedAmount, 0) || 0;

  if (isLoading || statsLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent1" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-medium mb-2 text-white">Financial Management</h1>
        <p className="text-dashboard-text">View and manage payment requests</p>
      </header>

      <TotalCount 
        items={[
          {
            count: totalPendingAmount,
            label: "Total Pending (£)",
            icon: <Wallet className="w-6 h-6 text-dashboard-warning" />
          },
          {
            count: totalApprovedAmount,
            label: "Total Approved (£)",
            icon: <Wallet className="w-6 h-6 text-dashboard-accent3" />
          }
        ]}
      />

      <Card className="bg-dashboard-card border-dashboard-accent1/20">
        <div className="p-6">
          <h2 className="text-xl font-medium text-white mb-4">Collectors Payment Summary</h2>
          <Accordion type="single" collapsible className="space-y-4">
            {collectorStats?.map((collector) => (
              <AccordionItem
                key={collector.id}
                value={collector.id}
                className="border border-white/10 rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dashboard-accent1 flex items-center justify-center text-white font-medium">
                        {collector.prefix}
                      </div>
                      <div>
                        <p className="font-medium text-white">{collector.name}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-dashboard-warning">Pending: £{collector.pendingAmount}</span>
                          <span className="text-dashboard-accent3">Approved: £{collector.approvedAmount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    {collector.payments.length > 0 ? (
                      <div className="rounded-md border border-white/10">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                              <TableHead className="text-dashboard-text">Member</TableHead>
                              <TableHead className="text-dashboard-text">Amount</TableHead>
                              <TableHead className="text-dashboard-text">Type</TableHead>
                              <TableHead className="text-dashboard-text">Status</TableHead>
                              <TableHead className="text-dashboard-text">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {collector.payments.map((payment) => (
                              <TableRow 
                                key={payment.id}
                                className="border-white/10 hover:bg-white/5"
                              >
                                <TableCell className="text-white font-medium">
                                  {payment.members?.full_name}
                                </TableCell>
                                <TableCell className="text-dashboard-accent3">
                                  £{payment.amount}
                                </TableCell>
                                <TableCell className="capitalize text-dashboard-text">
                                  {payment.payment_type}
                                </TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    ${payment.status === 'approved' ? 'bg-dashboard-accent3/20 text-dashboard-accent3' : 
                                      payment.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 
                                      'bg-dashboard-warning/20 text-dashboard-warning'}`}>
                                    {payment.status}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {payment.status === 'pending' && (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-dashboard-accent3 hover:text-dashboard-accent3 hover:bg-dashboard-accent3/20"
                                        onClick={() => handleApproval(payment.id, true)}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-red-400 hover:text-red-400 hover:bg-red-500/20"
                                        onClick={() => handleApproval(payment.id, false)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-dashboard-text">No payment requests found for this collector.</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Card>

      <Card className="bg-dashboard-card border-dashboard-accent1/20">
        <div className="p-6">
          <h2 className="text-xl font-medium text-white mb-4">All Payment Requests</h2>
          <div className="rounded-md border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-dashboard-text">Date</TableHead>
                  <TableHead className="text-dashboard-text">Member</TableHead>
                  <TableHead className="text-dashboard-text">Collector</TableHead>
                  <TableHead className="text-dashboard-text">Type</TableHead>
                  <TableHead className="text-dashboard-text">Amount</TableHead>
                  <TableHead className="text-dashboard-text">Status</TableHead>
                  <TableHead className="text-dashboard-text">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map((payment) => (
                  <TableRow 
                    key={payment.id}
                    className="border-white/10 hover:bg-white/5"
                  >
                    <TableCell className="text-dashboard-text">
                      {format(new Date(payment.created_at), 'PPP')}
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {payment.members?.full_name}
                    </TableCell>
                    <TableCell className="text-dashboard-accent1">
                      {payment.collectors?.name}
                    </TableCell>
                    <TableCell className="capitalize text-dashboard-text">
                      {payment.payment_type}
                    </TableCell>
                    <TableCell className="text-dashboard-accent3">
                      £{payment.amount}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${payment.status === 'approved' ? 'bg-dashboard-accent3/20 text-dashboard-accent3' : 
                          payment.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 
                          'bg-dashboard-warning/20 text-dashboard-warning'}`}>
                        {payment.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {payment.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-dashboard-accent3 hover:text-dashboard-accent3 hover:bg-dashboard-accent3/20"
                            onClick={() => handleApproval(payment.id, true)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-400 hover:bg-red-500/20"
                            onClick={() => handleApproval(payment.id, false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FinancialsView;