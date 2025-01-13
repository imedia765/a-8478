import React from 'react';
import { CheckCircle2, XCircle, Phone, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PaymentConfirmationSplashProps {
  success: boolean;
  paymentRef?: string;
  amount: number;
  paymentType: string;
  memberNumber: string;
}

const PaymentConfirmationSplash = ({
  success,
  paymentRef,
  amount,
  paymentType,
  memberNumber
}: PaymentConfirmationSplashProps) => {
  // Fetch collector information based on member number
  const { data: collectorInfo } = useQuery({
    queryKey: ['collector-info', memberNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members_collectors')
        .select('name, phone')
        .eq('member_number', memberNumber)
        .single();

      if (error) {
        console.error('Error fetching collector info:', error);
        return null;
      }
      return data;
    },
    enabled: success // Only fetch if payment was successful
  });

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
      success ? 'bg-blue-500/90' : 'bg-red-500/90'
    } animate-fade-in`}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 animate-scale-in">
        <div className="flex justify-center">
          {success ? (
            <CheckCircle2 className="w-16 h-16 text-blue-500" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-center">
          {success ? 'Payment Confirmed' : 'Payment Failed'}
        </h2>
        {success && paymentRef && (
          <div className="space-y-2">
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <p className="text-sm text-gray-600">Payment Reference</p>
              <p className="font-mono font-medium">{paymentRef}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-medium">£{amount.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Payment Type</p>
              <p className="font-medium capitalize">{paymentType}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Member Number</p>
              <p className="font-medium">{memberNumber}</p>
            </div>
            
            {collectorInfo && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Contact Your Collector</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{collectorInfo.name}</span>
                  </div>
                  {collectorInfo.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{collectorInfo.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {!success && (
          <p className="text-center text-gray-600">
            Please try again or contact support if the problem persists.
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentConfirmationSplash;