import { useParams, useNavigate } from 'react-router-dom';
import {
  IconChevronLeft,
  IconDownload,
  IconRefresh,
  IconAlertTriangle,
  IconCircleCheck,
  IconDatabase,
  IconShieldCheck,
  IconActivity,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const agentData = {
  'AGT-8821': {
    id: 'AGT-8821',
    name: 'Customer Support Agent v2.4',
    deploymentId: 'agent_774x_delta',
    lastAudit: 'Oct 24, 2023',
    runtime: 'AWS-US-East-1',
    status: 'Flagged',
    owner: 'Support Team',
    trustScore: 72,
    datasets: [
      { name: 'Customer_Support_Logs', status: 'TRAINING', lastSynced: '5h ago', records: '12,450 records' },
      { name: 'Internal_KB_Main', status: 'RAG/VECTOR', lastSynced: '1m ago', chunks: '8,102 chunks' },
      { name: 'Refined_Intent_v2', status: 'FINE-TUNING', lastSynced: '1d ago', drift: 'Verifying Drift' },
    ],
    violations: [
      { type: 'PII Leakage Detected', severity: 'CRITICAL', time: '2 mins ago', description: 'Agent included a customer\'s partial SSN in a generated response during a troubleshooting session.' },
      { type: 'Hallucinated Quote', severity: 'WARNING', time: '1 hour ago', description: 'Agent offered a "15% Loyalty Discount" which is not present in the current Knowledge Base or Policy sets.' },
    ],
    metrics: {
      fairness: 88,
      privacy: 42,
      accuracy: 91,
      robustness: 65,
    },
    logs: [
      { timestamp: '[14:22:01.03]', type: 'INBOUND', message: 'I\'m unhappy with my refund status of order #9482' },
      { timestamp: '[14:22:01.05]', type: 'CONTEXT', message: 'Retrieving order details... Status: \'Pending Bank Clearance\'' },
      { timestamp: '[14:22:02.12]', type: 'POLICY', message: 'Verifying response against [FINANCIAL_COMPLIANCE_V3]' },
      { timestamp: '[14:22:02.15]', type: 'PASSED', message: 'Score: 0.98. No PII detected.' },
      { timestamp: '[14:23:44.00]', type: 'VIOLATION', message: 'Agent attempt to use "refund_auth_code_secret" in plaintext response. BLOCKED.' },
    ],
  },
};

export default function AgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const agent = agentData[id] || agentData['AGT-8821'];

  const getMetricColor = (value) => {
    if (value >= 80) return 'text-emerald-600';
    if (value >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/agents')}
            className="h-8 w-8"
          >
            <IconChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>AI Agents</span>
            <span>›</span>
            <span className="text-slate-900 font-medium">{agent.name}</span>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-slate-900">{agent.name}</h2>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                {agent.status}
              </Badge>
            </div>
            <p className="text-slate-600 text-sm mt-2">
              Deployment ID: {agent.deploymentId} | Last Audit: {agent.lastAudit} | Runtime: {agent.runtime}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <IconDownload className="w-4 h-4" />
              Export Report
            </Button>
            <Button variant="outline" className="gap-2">
              <IconRefresh className="w-4 h-4" />
              Re-evaluate
            </Button>
            <Button className="bg-[#1E40AF] hover:bg-[#1e3a8a]">Take Action</Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-3 gap-6 max-w-7xl">
          {/* Left Column - Trust Score & Datasets */}
          <div className="space-y-6">
            {/* Trust Score */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <IconShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Trust Score Breakdown</h3>
              </div>
              
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-40 h-40">
                  <svg className="transform -rotate-90 w-40 h-40">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#e2e8f0"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#3b82f6"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 70}`}
                      strokeDashoffset={`${2 * Math.PI * 70 * (1 - agent.trustScore / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-slate-900">{agent.trustScore}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Medium Risk</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(agent.metrics).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700 capitalize">{key} & Bias</span>
                      <span className={cn('text-sm font-bold', getMetricColor(value))}>{value}/100</span>
                    </div>
                    <Progress value={value} className="h-1.5" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Active Datasets */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <IconDatabase className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">Active Datasets</h3>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700">View All Source Logs</button>
              </div>

              <div className="space-y-3">
                {agent.datasets.map((dataset, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs mb-2">
                          {dataset.status}
                        </Badge>
                        <h4 className="font-medium text-slate-900 text-sm">{dataset.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Last synced: {dataset.lastSynced}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">
                      {dataset.records || dataset.chunks || dataset.drift}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column - Violations & Logs */}
          <div className="col-span-2 space-y-6">
            {/* Policy Violations */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <IconAlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-slate-900">Policy Violations</h3>
                </div>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {agent.violations.length} Active Flags
                </Badge>
              </div>

              <div className="space-y-3">
                {agent.violations.map((violation, idx) => (
                  <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          {violation.severity === 'CRITICAL' ? '🔴' : '⚠️'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900">{violation.type}</h4>
                            <Badge variant="outline" className={cn(
                              violation.severity === 'CRITICAL'
                                ? 'bg-red-100 text-red-700 border-red-300'
                                : 'bg-amber-100 text-amber-700 border-amber-300'
                            )}>
                              {violation.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700">{violation.description}</p>
                          <p className="text-xs text-slate-500 mt-2">{violation.time}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="text-xs">Review Logs</Button>
                      <Button size="sm" variant="outline" className="text-xs text-red-600 border-red-300 hover:bg-red-50">
                        Mute Thread
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Real-time Decision Log */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <IconActivity className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">Real-time Decision Summary Log</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs text-slate-600">Live Stream</span>
                </div>
              </div>

              <div className="bg-slate-900 rounded-md p-4 font-mono text-sm overflow-auto max-h-80">
                {agent.logs.map((log, idx) => (
                  <div key={idx} className={cn(
                    'mb-1',
                    log.type === 'VIOLATION' && 'text-red-400',
                    log.type === 'PASSED' && 'text-emerald-400',
                    log.type === 'POLICY' && 'text-amber-400',
                    log.type === 'CONTEXT' && 'text-cyan-400',
                    log.type === 'INBOUND' && 'text-blue-400'
                  )}>
                    <span className="text-slate-500">{log.timestamp}</span>{' '}
                    <span className="font-semibold">{log.type}:</span>{' '}
                    <span className="text-slate-300">{log.message}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
