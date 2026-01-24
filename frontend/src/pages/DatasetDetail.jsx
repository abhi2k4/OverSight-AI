import { useParams, useNavigate } from 'react-router-dom';
import {
  IconChevronLeft,
  IconShare,
  IconDownload,
  IconDatabase,
  IconGitBranch,
  IconShield,
  IconUsers,
  IconToggleRight,
  IconPlus,
  IconCircleCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const datasetData = {
  'Customer_CRM_Database': {
    name: 'Customer CRM Database',
    lastSynced: '2 hours ago',
    connection: 'Stable Connection',
    owner: { name: 'Sarah Jenkins', role: 'Data Operations Lead', department: 'Customer Experience', tier: 'Level 3' },
    lineage: [
      { type: 'source', name: 'CRM Database', platform: 'AWS RDS / PostgreSQL' },
      { type: 'transform', name: 'Anonymization v2.1', tech: 'Python / Lambda' },
      { type: 'agent', name: 'CS Support Bot', tech: 'GPT-4 Turbo' },
    ],
    sensitivity: {
      pii: 'HIGH RISK',
      piiFields: 'Email, Phone, SSN',
      financial: 'NONE',
      retention: '24 Months',
    },
    policies: [
      { name: 'GDPR Compliance', description: 'Ensure all user data remains within EU regional boundaries.', status: 'Compliant', violations: 0 },
      { name: 'Automated PII Redaction', description: 'Redact sensitive identifiers before training or inference.', status: 'Compliant', violations: 0 },
      { name: 'Data Retention Policy', description: 'Auto-delete records older than 24 months from warehouse.', status: 'Disabled', violations: 0 },
      { name: 'Model Training Consent', description: 'Only use data from users who opted-in for training.', status: 'Compliant', violations: 12 },
    ],
    metadata: {
      created: 'Oct 24, 2023',
      rows: '1.2M',
      format: 'Parquet',
      lastScan: 'Jan 23, 2026',
    },
  },
};

export default function DatasetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dataset = datasetData[id] || datasetData['Customer_CRM_Database'];

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/datasets')}
            className="h-8 w-8"
          >
            <IconChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Governance</span>
            <span>›</span>
            <span>Datasets</span>
            <span>›</span>
            <span className="text-slate-900 font-medium">{id}</span>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{dataset.name}</h2>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <IconCircleCheck className="w-4 h-4 text-emerald-500" />
                <span>Last synced: {dataset.lastSynced}</span>
              </div>
              <span>•</span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {dataset.connection}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <IconShare className="w-4 h-4" />
              Share
            </Button>
            <Button className="bg-[#1E40AF] hover:bg-[#1e3a8a] gap-2">
              <IconDownload className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-3 gap-6 max-w-7xl">
          {/* Left Column */}
          <div className="col-span-2 space-y-6">
            {/* Data Lineage */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <IconGitBranch className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">Data Lineage</h3>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <span>↗</span> Expand View
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                {dataset.lineage.map((node, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className={cn(
                      'p-4 rounded-md border-2 flex-1',
                      node.type === 'source' && 'bg-blue-50 border-blue-200',
                      node.type === 'transform' && 'bg-orange-50 border-orange-200',
                      node.type === 'agent' && 'bg-purple-50 border-purple-200'
                    )}>
                      <div className="flex items-center gap-3 mb-2">
                        {node.type === 'source' && <IconDatabase className="w-5 h-5 text-blue-600" />}
                        {node.type === 'transform' && <span className="text-lg">🔄</span>}
                        {node.type === 'agent' && <span className="text-lg">🤖</span>}
                        <Badge variant="outline" className={cn(
                          'text-xs uppercase',
                          node.type === 'source' && 'bg-blue-100 text-blue-700 border-blue-300',
                          node.type === 'transform' && 'bg-orange-100 text-orange-700 border-orange-300',
                          node.type === 'agent' && 'bg-purple-100 text-purple-700 border-purple-300'
                        )}>
                          {node.type}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-slate-900 text-sm mb-1">{node.name}</h4>
                      <p className="text-xs text-slate-600">{node.platform || node.tech}</p>
                    </div>
                    {idx < dataset.lineage.length - 1 && (
                      <IconChevronLeft className="w-5 h-5 text-slate-400 rotate-180" />
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Sensitivity & Risk */}
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <IconShield className="w-5 h-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-900">Sensitivity & Risk</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">PII Content</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {dataset.sensitivity.pii}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Identified Fields</span>
                    <span className="text-sm text-slate-900">{dataset.sensitivity.piiFields}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Financial Data</span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {dataset.sensitivity.financial}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Data Retention</span>
                    <span className="text-sm text-slate-900">{dataset.sensitivity.retention}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <IconUsers className="w-5 h-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-900">Ownership & Access</h3>
                </div>

                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold flex-shrink-0">
                    SJ
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{dataset.owner.name}</h4>
                    <p className="text-sm text-slate-600">{dataset.owner.role}</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    📁
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Department</span>
                    <span className="text-slate-900">{dataset.owner.department}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Privacy Tier</span>
                    <span className="text-slate-900 font-medium">{dataset.owner.tier}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Metadata */}
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Metadata</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-md">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Created Date</span>
                  <p className="text-sm text-slate-900 font-medium mt-1">{dataset.metadata.created}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-md">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Rows</span>
                  <p className="text-sm text-slate-900 font-medium mt-1">{dataset.metadata.rows}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-md">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Format</span>
                  <p className="text-sm text-slate-900 font-medium mt-1">{dataset.metadata.format}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-md">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Last Scan</span>
                  <p className="text-sm text-slate-900 font-medium mt-1">{dataset.metadata.lastScan}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Applied Policies */}
          <div>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">Applied Policies</h3>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {dataset.policies.filter(p => p.status === 'Compliant').length} ACTIVE
                </Badge>
              </div>

              <div className="space-y-4">
                {dataset.policies.map((policy, idx) => (
                  <div key={idx} className="pb-4 border-b border-slate-200 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-slate-900 text-sm">{policy.name}</h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={policy.status !== 'Disabled'}
                          className="sr-only peer"
                          readOnly
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">{policy.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          policy.status === 'Compliant' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          policy.status === 'Disabled' && 'bg-slate-50 text-slate-600 border-slate-200'
                        )}
                      >
                        {policy.status === 'Compliant' && <IconCircleCheck className="w-3 h-3 mr-1" />}
                        {policy.status}
                      </Badge>
                      {policy.violations > 0 && (
                        <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                          <IconAlertTriangle className="w-3 h-3" />
                          {policy.violations} Violations Detected
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-4 gap-2">
                <IconPlus className="w-4 h-4" />
                Add Custom Policy
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
