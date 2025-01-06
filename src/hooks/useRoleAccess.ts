import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';

export type UserRole = 'member' | 'collector' | 'admin' | null;

const ROLE_STALE_TIME = 1000 * 60 * 5; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const useRoleAccess = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // First check if we have a valid session
  const { data: sessionData, error: sessionError } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        console.log('Checking session status...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          console.log('Found session for user:', session.user.id);
          // Verify session is still valid
          const { error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
        }
        
        return session;
      } catch (error: any) {
        console.error('Session error:', error);
        await supabase.auth.signOut();
        localStorage.clear();
        throw error;
      }
    },
    retry: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
  });

  // If session check fails, redirect to login
  useEffect(() => {
    if (sessionError) {
      console.error('Session error:', sessionError);
      toast({
        title: "Session expired",
        description: "Please sign in again",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [sessionError, navigate, toast]);

  const { data: userRole, isLoading: roleLoading, error: roleError } = useQuery({
    queryKey: ['userRole', sessionData?.user?.id],
    queryFn: async () => {
      if (!sessionData?.user) {
        console.log('No session found in role check');
        return null;
      }

      console.log('Fetching roles for user:', sessionData.user.id);
      
      try {
        // First try to get roles from user_roles table with retries
        let attempt = 0;
        let roleData = null;
        let lastError = null;

        while (attempt < MAX_RETRIES && !roleData) {
          try {
            const { data, error } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', sessionData.user.id);

            if (error) throw error;
            
            if (data && data.length > 0) {
              console.log('Found roles:', data);
              roleData = data;
              break;
            }
          } catch (error) {
            console.error(`Attempt ${attempt + 1} failed:`, error);
            lastError = error;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          }
          attempt++;
        }

        if (roleData) {
          const roles = roleData.map(r => r.role);
          console.log('Found roles in user_roles table:', roles);
          
          // Return highest priority role
          if (roles.includes('admin')) return 'admin' as UserRole;
          if (roles.includes('collector')) return 'collector' as UserRole;
          if (roles.includes('member')) return 'member' as UserRole;
        }

        // Fallback to checking collector status
        console.log('Checking collector status...');
        const { data: collectorData, error: collectorError } = await supabase
          .from('members_collectors')
          .select('name')
          .eq('member_number', sessionData.user.user_metadata.member_number)
          .maybeSingle();

        if (collectorError) throw collectorError;

        if (collectorData) {
          console.log('User is a collector');
          return 'collector' as UserRole;
        }

        // Final fallback - check members table
        console.log('Checking member status...');
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('id')
          .eq('auth_user_id', sessionData.user.id)
          .maybeSingle();

        if (memberError) throw memberError;

        if (memberData?.id) {
          console.log('User is a regular member');
          return 'member' as UserRole;
        }

        console.log('No role found, defaulting to member');
        return 'member' as UserRole;
      } catch (error) {
        console.error('Error in role check:', error);
        throw error;
      }
    },
    enabled: !!sessionData?.user?.id,
    staleTime: ROLE_STALE_TIME,
    retry: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
  });

  const canAccessTab = (tab: string): boolean => {
    console.log('Checking access for tab:', tab, 'User role:', userRole);
    
    if (!userRole) return false;

    switch (userRole) {
      case 'admin':
        return ['dashboard', 'users', 'collectors', 'audit', 'system', 'financials'].includes(tab);
      case 'collector':
        return ['dashboard', 'users'].includes(tab);
      case 'member':
        return tab === 'dashboard';
      default:
        return false;
    }
  };

  return {
    userRole,
    roleLoading: roleLoading || !sessionData,
    error: roleError,
    canAccessTab,
  };
};
