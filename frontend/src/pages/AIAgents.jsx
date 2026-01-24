import { useNavigate } from 'react-router-dom';
import {
  IconSearch,
  IconPlus,
  IconFilter,
  IconRefresh,
  IconCircleCheck,
  IconAlertTriangle,
  IconClock,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

const agents = [
  { id: 'AGT-8821', name: 'ClaimsProcessor_v4', owner: 'Ops Team', status: 'Active', riskLevel: 'Low', datasets: ['Claims_2023', 'PII_Data'], trustScore: 98 },
  { id: 'AGT-9004', name: 'CustomerService_L1', owner: 'Support', status: 'Active', riskLevel: 'Medium', datasets: ['Chat_Logs_Enc'], trustScore: 85 },
  { id: 'AGT-3102', name: 'FraudDetection_Beta', owner: 'SecOps', status: 'Idle', riskLevel: 'Critical', datasets: ['Tx_Ledger'], trustScore: 42 },
  { id: 'AGT-3329', name: 'MarketAnalyst_Pro', owner: 'Marketing', status: 'Active', riskLevel: 'Low', datasets: ['Public_Web'], trustScore: 92 },
  { id: 'AGT-5511', name: 'HR_Onboarding_Bot', owner: 'People Ops', status: 'Active', riskLevel: 'Medium', datasets: ['Emp_Records'], trustScore: 78 },
];

export default function AIAgents() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">AI Agents Inventory</h2>
            <p className="text-slate-600 text-sm mt-1">Track compliance status, trust scores, and activity logs.</p>
          </div>
          <Button className="bg-[#1E40AF] hover:bg-[#1e3a8a] gap-2">
            <IconPlus className="w-4 h-4" />
            Onboard New Agent
          </Button>
        </div>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search by agent name, ID, or owner..." className="pl-10 h-10" />
          </div>
          <Button variant="outline" size="sm"><IconFilter className="w-4 h-4" /></Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-8">
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-semibold uppercase">Agent Name</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Owner</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Risk Level</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Trust Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/agents/${agent.id}`)}>
                  <TableCell>
                    <div>{agent.name}</div>
                    <div className="text-xs text-slate-500">ID: {agent.id}</div>
                  </TableCell>
                  <TableCell>{agent.owner}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">{agent.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={agent.riskLevel === 'Critical' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}>
                      {agent.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress value={agent.trustScore} className="h-1.5 flex-1" />
                      <span className="text-sm font-bold">{agent.trustScore}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
