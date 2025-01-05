import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Member } from "@/types/member";
import { Loader2 } from "lucide-react";

const CollectorMembers = ({ collectorName }: { collectorName: string }) => {
  useEffect(() => {
    // Log component mount and props
    console.log('CollectorMembers mounted with collector:', collectorName);
    
    // Log current auth state
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current auth user:', user);
      
      // Log user's roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);
      console.log('User roles:', roles);
    };
    
    checkAuth();
  }, [collectorName]);

  const { data: membersData, isLoading, error } = useQuery({
    queryKey: ['collectorMembers', collectorName],
    queryFn: async () => {
      console.log('Fetching members for collector:', collectorName);
      
      try {
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('*')
          .eq('collector', collectorName)
          .order('member_number');

        if (membersError) {
          console.error('Error fetching members:', membersError);
          throw membersError;
        }

        console.log('Members query result:', members);
        return members as Member[];
      } catch (error) {
        console.error('Error in query function:', error);
        throw error;
      }
    },
    enabled: !!collectorName,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading members: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (!membersData || membersData.length === 0) {
    return (
      <div className="p-4 text-gray-500">
        No members found for collector: {collectorName}
      </div>
    );
  }

  // Simplified rendering with basic list
  return (
    <div className="space-y-4">
      <div className="bg-dashboard-card p-4 rounded-lg">
        <h3 className="text-white mb-2">Debug Information:</h3>
        <pre className="text-xs text-gray-400 overflow-auto">
          {JSON.stringify({ collectorName, memberCount: membersData.length }, null, 2)}
        </pre>
      </div>

      <ul className="space-y-2">
        {membersData.map((member) => (
          <li 
            key={member.id} 
            className="bg-dashboard-card p-4 rounded-lg border border-white/10"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-medium">{member.full_name}</p>
                <p className="text-sm text-gray-400">Member #: {member.member_number}</p>
                <p className="text-sm text-gray-400">Collector: {member.collector}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                member.status === 'active' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {member.status || 'unknown'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CollectorMembers;