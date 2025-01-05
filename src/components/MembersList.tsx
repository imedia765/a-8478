import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion } from "@/components/ui/accordion";
import { useState } from "react";
import CollectorPaymentSummary from './CollectorPaymentSummary';
import MemberCard from './members/MemberCard';
import PaymentDialog from './members/PaymentDialog';
import { Member } from '@/types/member';
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { generateMembersPDF } from '@/utils/pdfGenerator';

interface MembersListProps {
  searchTerm: string;
  userRole: string | null;
}

const MembersList = ({ searchTerm, userRole }: MembersListProps) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: collectorInfo } = useQuery({
    queryKey: ['collector-info'],
    queryFn: async () => {
      if (userRole !== 'collector') return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: collectorData } = await supabase
        .from('members_collectors')
        .select('name')
        .eq('member_number', user.user_metadata.member_number)
        .single();

      return collectorData;
    },
    enabled: userRole === 'collector',
  });

  const { data: members, isLoading } = useQuery({
    queryKey: ['members', searchTerm, userRole],
    queryFn: async () => {
      console.log('Fetching members with search term:', searchTerm);
      let query = supabase
        .from('members')
        .select('*');
      
      if (searchTerm) {
        // Fix: Use the correct or syntax with a single string
        query = query.or(`full_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%,collector.ilike.%${searchTerm}%`);
      }

      if (userRole === 'collector') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: collectorData } = await supabase
            .from('members_collectors')
            .select('name')
            .eq('member_number', user.user_metadata.member_number)
            .single();

          if (collectorData?.name) {
            console.log('Filtering members for collector:', collectorData.name);
            query = query.eq('collector', collectorData.name);
          }
        }
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching members:', error);
        throw error;
      }
      
      console.log('Members query result:', data);
      return data as Member[];
    },
  });

  const selectedMember = members?.find(m => m.id === selectedMemberId);

  const handlePrintMembers = () => {
    if (!members?.length || !collectorInfo?.name) {
      toast({
        title: "Error",
        description: "No members available to print",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = generateMembersPDF(members, `Members List - Collector: ${collectorInfo.name}`);
      doc.save();
      toast({
        title: "Success",
        description: "PDF report generated successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {userRole === 'collector' && members && members.length > 0 && (
        <div className="flex justify-end mb-4">
          <Button
            onClick={handlePrintMembers}
            className="flex items-center gap-2 bg-dashboard-accent1 hover:bg-dashboard-accent1/80"
          >
            <Printer className="w-4 h-4" />
            Print Members List
          </Button>
        </div>
      )}

      <ScrollArea className="h-[600px] w-full rounded-md">
        <Accordion type="single" collapsible className="space-y-4">
          {members?.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              userRole={userRole}
              onPaymentClick={() => setSelectedMemberId(member.id)}
            />
          ))}
        </Accordion>
      </ScrollArea>

      {selectedMember && (
        <PaymentDialog
          isOpen={!!selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
          memberId={selectedMember.id}
          memberNumber={selectedMember.member_number}
          memberName={selectedMember.full_name}
          collectorInfo={collectorInfo}
        />
      )}

      {userRole === 'collector' && collectorInfo && (
        <CollectorPaymentSummary collectorName={collectorInfo.name} />
      )}
    </div>
  );
};

export default MembersList;