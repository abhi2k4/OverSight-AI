import { useState, useEffect } from 'react';
import {
  IconShieldCheck,
  IconPlus,
  IconFileText,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconLoader,
} from '@tabler/icons-react';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { cn } from '@/lib/utils';

// Default compliances
const defaultCompliances = [
  {
    id: 'gdpr',
    name: 'GDPR',
    fullName: 'General Data Protection Regulation',
    description: 'Applies to AI agents processing EU personal data, requiring explicit consent, data minimization, and rights like access and deletion.',
    details: `Agents need Data Protection Impact Assessments (DPIAs) for high-risk processing and must enable the "right to explanation" for automated decisions.

Key Requirements:
• Explicit consent for data processing
• Data minimization principles
• Right to access personal data
• Right to deletion (right to be forgotten)
• Data Protection Impact Assessments (DPIAs) for high-risk processing
• Right to explanation for automated decisions
• Breach notification within 72 hours
• Privacy by design and by default`,
    category: 'Privacy',
    region: 'EU',
    lastUpdated: '2026-01-20',
  },
  {
    id: 'ccpa',
    name: 'CCPA/CPRA',
    fullName: 'California Consumer Privacy Act / California Privacy Rights Act',
    description: 'Mandates clear notices for California residents on data collection by AI agents, including rights to opt-out of sales and request data deletion.',
    details: `Enterprises must implement consumer rights dashboards and conduct privacy assessments for AI systems.

Key Requirements:
• Clear notices about data collection
• Right to opt-out of sale of personal information
• Right to request data deletion
• Right to know what personal information is collected
• Right to non-discrimination for exercising privacy rights
• Consumer rights dashboards
• Privacy assessments for AI systems
• Disclosure of data sharing practices`,
    category: 'Privacy',
    region: 'California, USA',
    lastUpdated: '2026-01-18',
  },
  {
    id: 'hipaa',
    name: 'HIPAA',
    fullName: 'Health Insurance Portability and Accountability Act',
    description: 'Essential for AI agents in healthcare, enforcing encryption, access controls, and audit logs for protected health information (PHI).',
    details: `Requires business associate agreements with vendors and breach notifications within 60 days.

Key Requirements:
• Encryption of protected health information (PHI)
• Access controls and authentication
• Comprehensive audit logs
• Business Associate Agreements (BAAs) with vendors
• Breach notification within 60 days
• Minimum necessary standard
• Administrative, physical, and technical safeguards
• Risk analysis and risk management`,
    category: 'Healthcare',
    region: 'USA',
    lastUpdated: '2026-01-15',
  },
  {
    id: 'eu-ai-act',
    name: 'EU AI Act',
    fullName: 'European Union Artificial Intelligence Act',
    description: 'Categorizes AI agents by risk levels (e.g., high-risk requires transparency and human oversight), with bans on unacceptably risky uses.',
    details: `Demands conformity assessments, model documentation, and post-market monitoring for compliance.

Key Requirements:
• Risk-based categorization (unacceptable, high, limited, minimal)
• Transparency requirements for AI systems
• Human oversight for high-risk AI
• Conformity assessments
• Model documentation and record-keeping
• Post-market monitoring
• Bans on unacceptable risk AI uses
• Quality management systems
• Technical documentation requirements`,
    category: 'AI Governance',
    region: 'EU',
    lastUpdated: '2026-01-22',
  },
  {
    id: 'soc2',
    name: 'SOC 2',
    fullName: 'System and Organization Controls 2',
    description: 'A framework for AI agents verifying security controls like data encryption, least-privilege access, and continuous monitoring in enterprise settings.',
    details: `Involves Type 2 audits proving sustained controls over time, ideal for cloud-based AI deployments.

Key Requirements:
• Security controls (encryption, access controls)
• Availability controls (system uptime, performance)
• Processing integrity controls
• Confidentiality controls
• Privacy controls
• Least-privilege access principles
• Continuous monitoring and logging
• Type 2 audits (sustained controls over time)
• Vendor management and oversight`,
    category: 'Security',
    region: 'Global',
    lastUpdated: '2026-01-19',
  },
];

export default function ComplianceManager() {
  const [compliances, setCompliances] = useState([]);
  const [selectedCompliance, setSelectedCompliance] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newCompliance, setNewCompliance] = useState({
    name: '',
    fullName: '',
    description: '',
    details: '',
    category: '',
    region: '',
  });

  // Load compliances from localStorage or default data on mount
  useEffect(() => {
    loadCompliances();
  }, []);

  // Safety check: if compliances array is empty after loading, force load defaults
  useEffect(() => {
    if (!isLoading && compliances.length === 0) {
      console.warn('Compliances array is empty, loading defaults...');
      setCompliances(defaultCompliances);
      if (defaultCompliances.length > 0) {
        setSelectedCompliance(defaultCompliances[0]);
      }
      try {
        localStorage.setItem('compliances', JSON.stringify(defaultCompliances));
      } catch (error) {
        console.warn('Error saving defaults to localStorage:', error);
      }
    }
  }, [isLoading, compliances.length]);

  const loadCompliances = () => {
    setIsLoading(true);
    
    // First, try to load from localStorage
    try {
      const storedCompliances = localStorage.getItem('compliances');
      if (storedCompliances) {
        const parsed = JSON.parse(storedCompliances);
        // Only use localStorage if it has valid data (not empty array)
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`Loaded ${parsed.length} compliances from localStorage`);
          setCompliances(parsed);
          if (parsed.length > 0) {
            setSelectedCompliance(parsed[0]);
          }
          setIsLoading(false);
          
          // Optionally try to fetch from server in the background (silently)
          fetchCompliancesFromServer(true);
          return;
        } else {
          // Clear empty array from localStorage
          console.log('Found empty array in localStorage, clearing it');
          localStorage.removeItem('compliances');
        }
      }
    } catch (error) {
      console.warn('Error loading compliances from localStorage:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem('compliances');
      } catch (e) {
        // Ignore
      }
    }

    // If no localStorage data or empty array, use default compliances and save them
    console.log(`Loading ${defaultCompliances.length} default compliances`);
    setCompliances(defaultCompliances);
    if (defaultCompliances.length > 0) {
      setSelectedCompliance(defaultCompliances[0]);
    }
    
    // Save default compliances to localStorage
    try {
      localStorage.setItem('compliances', JSON.stringify(defaultCompliances));
      console.log(`Saved ${defaultCompliances.length} default compliances to localStorage`);
    } catch (error) {
      console.warn('Error saving compliances to localStorage:', error);
    }
    
    setIsLoading(false);
    
    // Sync default compliances to database so they're available for governance prompts
    syncDefaultCompliancesToDatabase(defaultCompliances);
    
    // Optionally try to fetch from server in the background (silently)
    // Only if we have defaults, don't overwrite with empty server response
    fetchCompliancesFromServer(true);
  };

  // Sync default compliances to database (for governance prompts)
  const syncDefaultCompliancesToDatabase = async (compliancesToSync) => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      
      // Try to sync each default compliance to database
      for (const compliance of compliancesToSync) {
        try {
          // Check if compliance already exists
          const checkRes = await fetch(`${apiBase}/compliances/${compliance.id}`).catch(() => null);
          
          if (!checkRes?.ok) {
            // Compliance doesn't exist, create it
            const createRes = await fetch(`${apiBase}/compliances`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: compliance.id,
                name: compliance.name,
                full_name: compliance.fullName,
                description: compliance.description,
                details: compliance.details,
                category: compliance.category,
                region: compliance.region
              })
            });
            
            if (createRes?.ok) {
              console.log(`✅ Synced compliance "${compliance.name}" to database`);
            }
          }
        } catch (error) {
          console.warn(`Failed to sync compliance ${compliance.id}:`, error.message);
        }
      }
    } catch (error) {
      console.warn('Error syncing compliances to database:', error);
    }
  };

  const fetchCompliancesFromServer = async (silent = false) => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${apiBase}/compliances`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch compliances: ${response.status}`);
      }

      const data = await response.json();
      
      // Only update if server returns valid data (not empty array)
      if (!Array.isArray(data) || data.length === 0) {
        if (!silent) {
          console.warn('Server returned empty compliances array, keeping local data');
        }
        return;
      }
      
      // Transform backend format to frontend format
      const transformedCompliances = data.map(compliance => ({
        id: compliance.id,
        name: compliance.name,
        fullName: compliance.full_name,
        description: compliance.description,
        details: compliance.details || compliance.description,
        category: compliance.category || 'Custom',
        region: compliance.region || 'Global',
        lastUpdated: compliance.updated_at || compliance.created_at
      }));
      
      // Update state and save to localStorage only if we have valid data
      if (transformedCompliances.length > 0) {
        setCompliances(transformedCompliances);
        setSelectedCompliance(transformedCompliances[0]);
        
        // Save to localStorage
        try {
          localStorage.setItem('compliances', JSON.stringify(transformedCompliances));
        } catch (error) {
          console.warn('Error saving compliances to localStorage:', error);
        }
      }
    } catch (error) {
      // Only log error if not in silent mode
      if (!silent) {
        console.error('Error fetching compliances:', error);
      }
      // Don't change compliances if server fetch fails - keep using local/default data
    }
  };

  const fetchCompliances = () => {
    // Public method that tries server first (non-silent)
    fetchCompliancesFromServer(false);
  };

  const handleCreateCompliance = async () => {
    if (!newCompliance.name || !newCompliance.fullName || !newCompliance.description) {
      return;
    }

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${apiBase}/compliances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCompliance.name,
          full_name: newCompliance.fullName,
          description: newCompliance.description,
          details: newCompliance.details || newCompliance.description,
          category: newCompliance.category || 'Custom',
          region: newCompliance.region || 'Global',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const compliance = await response.json();
      
      // Transform to frontend format
      const transformedCompliance = {
        id: compliance.id,
        name: compliance.name,
        fullName: compliance.full_name,
        description: compliance.description,
        details: compliance.details || compliance.description,
        category: compliance.category || 'Custom',
        region: compliance.region || 'Global',
        lastUpdated: compliance.updated_at || compliance.created_at
      };

      // Refresh compliances list from server
      await fetchCompliancesFromServer(false);
      
      // Also update localStorage
      try {
        const currentCompliances = JSON.parse(localStorage.getItem('compliances') || '[]');
        const updatedCompliances = [...currentCompliances, transformedCompliance];
        localStorage.setItem('compliances', JSON.stringify(updatedCompliances));
      } catch (error) {
        console.warn('Error updating localStorage:', error);
      }
      
      setSelectedCompliance(transformedCompliance);
      
      setNewCompliance({
        name: '',
        fullName: '',
        description: '',
        details: '',
        category: '',
        region: '',
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating compliance:', error);
      alert(`Failed to create compliance: ${error.message}`);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Privacy: 'bg-blue-100 text-blue-700 border-blue-200',
      Healthcare: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'AI Governance': 'bg-purple-100 text-purple-700 border-purple-200',
      Security: 'bg-amber-100 text-amber-700 border-amber-200',
      Custom: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return colors[category] || colors.Custom;
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Compliance Manager</h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage and track regulatory compliance requirements for AI agents
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-[#1E40AF] hover:bg-[#1e3a8a] text-white"
          >
            <IconPlus size={18} />
            Create New Compliance
          </Button>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Compliance List */}
        <div className="w-80 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
              Compliances ({compliances.length})
            </h2>
            <div className="space-y-2">
              {compliances.map((compliance) => {
                const isSelected = selectedCompliance?.id === compliance.id;
                return (
                  <button
                    key={compliance.id}
                    onClick={() => setSelectedCompliance(compliance)}
                    className={cn(
                      'w-full text-left p-4 rounded-lg border-2 transition-all duration-200',
                      isSelected
                        ? 'bg-blue-50 border-blue-300 shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                          isSelected ? 'bg-blue-100' : 'bg-slate-100'
                        )}
                      >
                        <IconShieldCheck
                          size={20}
                          className={isSelected ? 'text-blue-600' : 'text-slate-600'}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={cn(
                            'font-semibold text-sm mb-1',
                            isSelected ? 'text-blue-900' : 'text-slate-900'
                          )}
                        >
                          {compliance.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                          {compliance.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs font-medium border',
                              getCategoryColor(compliance.category)
                            )}
                          >
                            {compliance.category}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">{compliance.region}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel - Compliance Details */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <IconLoader size={48} className="text-slate-300 mx-auto mb-4 animate-spin" />
                <p className="text-slate-500">Loading compliances...</p>
              </div>
            </div>
          ) : selectedCompliance ? (
            <div className="p-8 max-w-4xl">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                      <IconShieldCheck size={28} className="text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 mb-2">
                        {selectedCompliance.fullName}
                      </h2>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className={cn(
                            'px-3 py-1 rounded-lg text-sm font-medium border',
                            getCategoryColor(selectedCompliance.category)
                          )}
                        >
                          {selectedCompliance.category}
                        </span>
                        <span className="text-sm text-slate-500">
                          {selectedCompliance.region}
                        </span>
                        <span className="text-sm text-slate-400">•</span>
                        <span className="text-sm text-slate-500">
                          Updated {new Date(selectedCompliance.lastUpdated).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                    Overview
                  </h3>
                  <p className="text-slate-700 leading-relaxed">{selectedCompliance.description}</p>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
                    Key Requirements & Details
                  </h3>
                  <div className="prose prose-slate max-w-none">
                    <div className="whitespace-pre-line text-slate-700 leading-relaxed">
                      {selectedCompliance.details}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 flex items-center gap-3">
                  <Button variant="outline" className="border-slate-300">
                    <IconFileText size={18} />
                    View Full Documentation
                  </Button>
                  <Button variant="outline" className="border-slate-300">
                    <IconAlertCircle size={18} />
                    Compliance Checklist
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <IconShieldCheck size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No compliances available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Compliance Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Compliance</DialogTitle>
            <DialogDescription>
              Add a new compliance framework to track and manage regulatory requirements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Short Name *</label>
              <Input
                placeholder="e.g., GDPR, HIPAA"
                value={newCompliance.name}
                onChange={(e) =>
                  setNewCompliance({ ...newCompliance, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Full Name *</label>
              <Input
                placeholder="e.g., General Data Protection Regulation"
                value={newCompliance.fullName}
                onChange={(e) =>
                  setNewCompliance({ ...newCompliance, fullName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description *</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Brief description of the compliance framework..."
                value={newCompliance.description}
                onChange={(e) =>
                  setNewCompliance({ ...newCompliance, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Detailed Information</label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Key requirements, details, and important information..."
                value={newCompliance.details}
                onChange={(e) =>
                  setNewCompliance({ ...newCompliance, details: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Category</label>
                <Input
                  placeholder="e.g., Privacy, Security"
                  value={newCompliance.category}
                  onChange={(e) =>
                    setNewCompliance({ ...newCompliance, category: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Region</label>
                <Input
                  placeholder="e.g., EU, USA, Global"
                  value={newCompliance.region}
                  onChange={(e) =>
                    setNewCompliance({ ...newCompliance, region: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCompliance}
              disabled={
                !newCompliance.name || !newCompliance.fullName || !newCompliance.description
              }
              className="bg-[#1E40AF] hover:bg-[#1e3a8a] text-white"
            >
              <IconCheck size={18} />
              Create Compliance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
