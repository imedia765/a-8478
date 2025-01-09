import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlayCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DebugConsole } from '../logs/DebugConsole';
import SystemCheckProgress from './SystemCheckProgress';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TestRunner = () => {
  const [testLogs, setTestLogs] = useState<string[]>(['Test runner initialized and ready']);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const [hasRun, setHasRun] = useState(false);
  const [activeTab, setActiveTab] = useState('system');

  const runTestsMutation = useMutation({
    mutationFn: async (testType: string) => {
      setIsRunning(true);
      setTestLogs(prev => [...prev, `🚀 Starting ${testType} tests...`]);
      setProgress(0);
      setCurrentTest(`Initializing ${testType} tests...`);

      try {
        let testResults;

        switch (testType) {
          case 'performance':
            const { data: performanceData } = await supabase
              .rpc('check_system_performance')
              .select();
            testResults = performanceData;
            break;
          case 'security':
            const { data: securityData } = await supabase
              .rpc('audit_security_settings')
              .select();
            testResults = securityData;
            break;
          case 'configuration':
            const { data: configData } = await supabase
              .rpc('validate_user_roles')
              .select();
            testResults = configData;
            break;
          default:
            const { data: memberData } = await supabase
              .rpc('check_member_numbers')
              .select();
            testResults = memberData;
        }

        console.log(`${testType} test run completed:`, testResults);
        setTestLogs(prev => [...prev, `✅ ${testType} tests completed`, ...formatTestResults(testResults)]);
        setProgress(100);
        setCurrentTest('All tests complete');
        setHasRun(true);
        toast.success(`${testType} test run completed`);
        
        return testResults;
      } catch (error: any) {
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

  const formatTestResults = (results: any) => {
    if (!results) return [];
    
    return Object.entries(results).map(([key, value]) => {
      if (typeof value === 'object') {
        return `📊 ${key}: ${JSON.stringify(value, null, 2)}`;
      }
      return `📊 ${key}: ${value}`;
    });
  };

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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 gap-4">
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <Button
            onClick={() => runTestsMutation.mutate('system')}
            disabled={isRunning}
            className="bg-dashboard-accent1 hover:bg-dashboard-accent2 text-white"
          >
            {isRunning ? 'Running Tests...' : 'Run System Tests'}
          </Button>
        </TabsContent>

        <TabsContent value="performance">
          <Button
            onClick={() => runTestsMutation.mutate('performance')}
            disabled={isRunning}
            className="bg-dashboard-accent1 hover:bg-dashboard-accent2 text-white"
          >
            {isRunning ? 'Running Tests...' : 'Run Performance Tests'}
          </Button>
        </TabsContent>

        <TabsContent value="security">
          <Button
            onClick={() => runTestsMutation.mutate('security')}
            disabled={isRunning}
            className="bg-dashboard-accent1 hover:bg-dashboard-accent2 text-white"
          >
            {isRunning ? 'Running Tests...' : 'Run Security Tests'}
          </Button>
        </TabsContent>

        <TabsContent value="configuration">
          <Button
            onClick={() => runTestsMutation.mutate('configuration')}
            disabled={isRunning}
            className="bg-dashboard-accent1 hover:bg-dashboard-accent2 text-white"
          >
            {isRunning ? 'Running Tests...' : 'Run Configuration Tests'}
          </Button>
        </TabsContent>
      </Tabs>

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
