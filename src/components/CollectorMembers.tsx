import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Member } from "@/types/member";
import { Loader2 } from "lucide-react";

const CollectorMembers = ({ collectorName }: { collectorName: string }) => {
  // Log authentication and role information on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current auth user:', user);
      
      if (user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        console.log('User roles:', roles);
      }
    };
    
    checkAuth();
  }, []);

  // Fetch members data
  const { data: members, isLoading, error } = useQuery({
    queryKey: ['collectorMembers', collectorName],
    queryFn: async () => {
      console.log('Fetching members for collector:', collectorName);
      
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('collector', collectorName);

      if (error) {
        console.error('Error fetching members:', error);
        throw error;
      }

      console.log('Members data:', data);
      return data as Member[];
    },
    enabled: !!collectorName,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error instanceof Error ? error.message : 'Failed to load members'}
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="p-4 text-gray-500">
        No members found for collector: {collectorName}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {members.map((member) => (
          <li 
            key={member.id}
            className="bg-card p-4 rounded-lg border border-border"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{member.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  Member #: {member.member_number}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                member.status === 'active' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {member.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CollectorMembers;