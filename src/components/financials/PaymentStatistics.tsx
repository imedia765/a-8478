import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import TotalCount from "@/components/TotalCount";
import { Users, Wallet, Receipt } from "lucide-react";

const PaymentStatistics = () => {
  const { data: stats } = useQuery({
    queryKey: ['payment-statistics'],
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from('members')
        .select('yearly_payment_status, emergency_collection_status, emergency_collection_amount');

      if (error) throw error;

      const totalMembers = members?.length || 0;
      const yearlyPaid = members?.filter(m => m.yearly_payment_status === 'completed').length || 0;
      const yearlyUnpaid = totalMembers - yearlyPaid;
      const emergencyPaid = members?.filter(m => m.emergency_collection_status === 'completed').length || 0;
      const emergencyUnpaid = totalMembers - emergencyPaid;
      
      const totalYearlyAmount = totalMembers * 40; // £40 per member
      const remainingYearlyAmount = yearlyUnpaid * 40;
      
      const totalEmergencyAmount = members?.reduce((sum, m) => sum + (m.emergency_collection_amount || 0), 0) || 0;
      const collectedEmergencyAmount = members
        ?.filter(m => m.emergency_collection_status === 'completed')
        .reduce((sum, m) => sum + (m.emergency_collection_amount || 0), 0) || 0;
      const remainingEmergencyAmount = totalEmergencyAmount - collectedEmergencyAmount;

      return {
        yearlyStats: {
          totalAmount: totalYearlyAmount,
          remainingAmount: remainingYearlyAmount,
          paidMembers: yearlyPaid,
          unpaidMembers: yearlyUnpaid
        },
        emergencyStats: {
          totalAmount: totalEmergencyAmount,
          remainingAmount: remainingEmergencyAmount,
          paidMembers: emergencyPaid,
          unpaidMembers: emergencyUnpaid
        }
      };
    }
  });

  if (!stats) return null;

  return (
    <Card className="bg-dashboard-card p-6 mt-8 border border-white/10">
      <h3 className="text-xl font-medium text-white mb-6">Collection Statistics</h3>
      
      <div className="grid gap-6 md:grid-cols-2">
        <TotalCount 
          items={[
            {
              count: stats.yearlyStats.remainingAmount,
              label: `Yearly Collections Remaining (£) - ${stats.yearlyStats.unpaidMembers} members unpaid`,
              icon: <Wallet className="w-5 h-5 text-dashboard-accent1" />
            },
            {
              count: stats.yearlyStats.paidMembers,
              label: "Members Paid (Yearly)",
              icon: <Users className="w-5 h-5 text-dashboard-accent3" />
            }
          ]}
        />

        <TotalCount 
          items={[
            {
              count: stats.emergencyStats.remainingAmount,
              label: `Emergency Collections Remaining (£) - ${stats.emergencyStats.unpaidMembers} members unpaid`,
              icon: <Receipt className="w-5 h-5 text-dashboard-accent2" />
            },
            {
              count: stats.emergencyStats.paidMembers,
              label: "Members Paid (Emergency)",
              icon: <Users className="w-5 h-5 text-dashboard-accent3" />
            }
          ]}
        />
      </div>
    </Card>
  );
};

export default PaymentStatistics;