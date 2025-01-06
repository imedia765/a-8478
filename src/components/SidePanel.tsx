import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  Users, 
  UserCog,
  History,
  Settings,
  Wallet
} from "lucide-react";
import { UserRole } from "@/hooks/useRoleAccess";

interface SidePanelProps {
  onTabChange: (tab: string) => void;
  userRole: UserRole;
}

const SidePanel = ({ onTabChange, userRole }: SidePanelProps) => {
  const isAdmin = userRole === 'admin';
  const isCollector = userRole === 'collector';

  return (
    <div className="flex flex-col h-full bg-dashboard-card border-r border-white/10">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-white mb-1">
          Dashboard
        </h2>
        <p className="text-sm text-dashboard-muted">
          Manage your account
        </p>
      </div>
      
      <ScrollArea className="flex-1 px-6">
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => onTabChange('dashboard')}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Button>

          {(isAdmin || isCollector) && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => onTabChange('users')}
            >
              <Users className="h-4 w-4" />
              Members
            </Button>
          )}

          {isAdmin && (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => onTabChange('collectors')}
              >
                <UserCog className="h-4 w-4" />
                Collectors
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => onTabChange('financials')}
              >
                <Wallet className="h-4 w-4" />
                Financials
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => onTabChange('audit')}
              >
                <History className="h-4 w-4" />
                Audit Logs
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => onTabChange('system')}
              >
                <Settings className="h-4 w-4" />
                System
              </Button>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SidePanel;