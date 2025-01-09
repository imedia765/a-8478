import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlayCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DebugConsole } from '../logs/DebugConsole';
import SystemCheckProgress from './SystemCheckProgress';
import { toast } from "sonner";

const TestRunner = () => {
  const [testLogs, setTestLogs] = useState<string[]>(['Test runner initialized and ready']);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const [hasRun, setHasRun] = useState(false);

  const runTestsMutation = useMutation({
    mutationFn: async () => {
      setIsRunning(true);
      setTestLogs(prev => [...prev, '🚀 Starting test run...']);
      setProgress(0);
      setCurrentTest('Initializing tests...');

      try {
        console.log('Invoking run-tests function...');
        const { data, error } = await supabase.functions.invoke('run-tests', {
          body: { command: 'test' }
        });

        if (error) {
          console.error('Function invocation error:', error);
          setTestLogs(prev => [...prev, `❌ Error: ${error.message}`]);
          throw error;
        }
        
        console.log('Test run completed:', data);
        setTestLogs(prev => [...prev, '✅ Tests completed successfully', `📊 Coverage: ${data.coverage}`]);
        setProgress(100);
        setCurrentTest('All tests complete');
        setHasRun(true);
        toast.success("Test run completed successfully");
        
        return data;
      } catch (error) {
        console.error('Test run error:', error);
        setTestLogs(prev => [...prev, `❌ Error running tests: ${error.message}`]);
        toast.error("Test run failed");
        throw error;
      }
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      setTestLogs(prev => [...prev, `❌ Error: ${error.message}`]);
      setProgress(0);
      setCurrentTest('Test run failed');
      setHasRun(true);
    },
    onSettled: () => {
      setIsRunning(false);
    }
  });

  // Subscribe to real-time test logs
  useQuery({
    queryKey: ['test-logs'],
    queryFn: async () => {
      console.log('Setting up realtime subscription...');
      const channel = supabase
        .channel('test-logs')
        .on('broadcast', { event: 'test-log' }, ({ payload }) => {
          console.log('Received test log:', payload);
          if (payload?.message) {
            setTestLogs(prev => [...prev, `📝 ${payload.message}`]);
          }
          if (payload?.progress) {
            setProgress(payload.progress);
          }
          if (payload?.currentTest) {
            setCurrentTest(payload.currentTest);
          }
        })
        .subscribe((status) => {
          console.log('Channel status:', status);
          setTestLogs(prev => [...prev, `📡 Channel status: ${status}`]);
        });

      return () => {
        console.log('Cleaning up channel subscription');
        channel.unsubscribe();
      };
    },
    enabled: isRunning
  });

  return (
    <section className="space-y-4 dashboard-card">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-dashboard-text flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-dashboard-accent1" />
          Test Runner
        </h2>
        <Button
          onClick={() => runTestsMutation.mutate()}
          disabled={isRunning}
          className="bg-dashboard-accent1 hover:bg-dashboard-accent2 text-white"
        >
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </Button>
      </div>

      {isRunning && (
        <SystemCheckProgress
          currentCheck={currentTest}
          progress={progress}
          totalChecks={100}
          completedChecks={Math.floor(progress)}
        />
      )}

      {runTestsMutation.isError && (
        <Alert variant="destructive" className="bg-dashboard-card border-dashboard-error">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to run tests: {runTestsMutation.error.message}
          </AlertDescription>
        </Alert>
      )}

      <DebugConsole logs={testLogs} />
    </section>
  );
};

export default TestRunner;