import { useState, useEffect, useRef, useMemo } from 'react'
import {
  IconDatabase,
  IconLock,
  IconUsers,
  IconClock,
  IconPlus,
  IconCheck,
  IconLoader,
  IconUpload,
  IconSearch,
  IconFilter,
  IconX,
  IconFileText,
  IconTrendingUp,
  IconShieldCheck,
  IconChevronDown,
} from '@tabler/icons-react'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { useToast } from '../hooks/use-toast'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'datasets_data'

// Default mock datasets with one-liner descriptions
const defaultDatasets = [
  {
    id: 1,
    name: 'Customer Records',
    description: 'Comprehensive customer database containing personal information, purchase history, and preferences.',
    type: 'Structured',
    sensitivity: 'High',
    records: 1250000,
    size: '24.5 GB',
    lastAccessed: '2 mins ago',
    status: 'active',
    compliance: ['GDPR', 'CCPA'],
  },
  {
    id: 2,
    name: 'Transaction Logs',
    description: 'Real-time transaction logs capturing all payment and financial operations across the platform.',
    type: 'Time Series',
    sensitivity: 'Medium',
    records: 8900000,
    size: '156 GB',
    lastAccessed: '15 mins ago',
    status: 'active',
    compliance: ['PCI-DSS'],
  },
  {
    id: 3,
    name: 'Training Data - NLP',
    description: 'Natural language processing training corpus with annotated text samples for machine learning models.',
    type: 'Unstructured',
    sensitivity: 'Low',
    records: 500000,
    size: '8.2 GB',
    lastAccessed: '1 hour ago',
    status: 'active',
    compliance: [],
  },
  {
    id: 4,
    name: 'Healthcare Records',
    description: 'Protected health information including patient records, diagnoses, and medical treatment history.',
    type: 'Structured',
    sensitivity: 'Critical',
    records: 450000,
    size: '32 GB',
    lastAccessed: '5 mins ago',
    status: 'active',
    compliance: ['HIPAA', 'GDPR'],
  },
]

export default function Datasets() {
  const [datasets, setDatasets] = useState(defaultDatasets)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sensitivityFilter, setSensitivityFilter] = useState('all')
  const [complianceFilter, setComplianceFilter] = useState('all')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const { toast } = useToast()

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setDatasets(parsed)
      } catch (error) {
        console.error('Error loading datasets from localStorage:', error)
      }
    }
  }, [])

  // Save to localStorage whenever datasets change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datasets))
  }, [datasets])

  // Filter datasets based on search and filters
  const filteredDatasets = useMemo(() => {
    return datasets.filter((dataset) => {
      const matchesSearch =
        searchQuery === '' ||
        dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesSensitivity =
        sensitivityFilter === 'all' || dataset.sensitivity === sensitivityFilter

      const matchesCompliance =
        complianceFilter === 'all' ||
        (complianceFilter === 'none' && dataset.compliance.length === 0) ||
        dataset.compliance.includes(complianceFilter)

      return matchesSearch && matchesSensitivity && matchesCompliance
    })
  }, [datasets, searchQuery, sensitivityFilter, complianceFilter])

  // Calculate statistics
  const stats = useMemo(() => {
    const highSensitivity = datasets.filter(
      (d) => d.sensitivity === 'High' || d.sensitivity === 'Critical'
    ).length
    const totalRecords = datasets.reduce((sum, d) => sum + d.records, 0)
    const totalSize = datasets.reduce((sum, d) => {
      const sizeNum = parseFloat(d.size)
      return sum + (d.size.includes('GB') ? sizeNum * 1024 : sizeNum)
    }, 0)

    return {
      total: datasets.length,
      highSensitivity,
      totalRecords,
      totalSize: totalSize > 1024 ? `${(totalSize / 1024).toFixed(1)} GB` : `${totalSize.toFixed(1)} MB`,
    }
  }, [datasets])

  const getSensitivityColor = (sensitivity) => {
    const colors = {
      Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Medium: 'bg-amber-50 text-amber-700 border-amber-200',
      High: 'bg-red-50 text-red-700 border-red-200',
      Critical: 'bg-red-600 text-white border-red-700',
    }
    return colors[sensitivity] || colors.Low
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      setFileName(file.name)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      setFileName(file.name)
    }
  }

  const handleRegisterDataset = async () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'File Required',
        description: 'Please upload a dataset file.',
      })
      return
    }

    setIsLoading(true)
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`${apiBase}/datasets/register`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || `HTTP ${response.status}`)
      }

      const data = await response.json()

      const newDataset = {
        id: Date.now(),
        name: data.dataset_name,
        description: data.description,
        type: 'Structured',
        sensitivity: data.sensitivity,
        records: data.records,
        size: data.size,
        lastAccessed: data.last_accessed,
        status: data.status,
        compliance: data.compliance || [],
      }

      setDatasets([...datasets, newDataset])

      setSelectedFile(null)
      setFileName('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setIsDialogOpen(false)

      toast({
        variant: 'default',
        title: 'Dataset Registered',
        description: `Successfully registered "${data.dataset_name}"`,
      })
    } catch (error) {
      console.error('Error registering dataset:', error)
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message || 'Failed to register dataset. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSensitivityFilter('all')
    setComplianceFilter('all')
  }

  const hasActiveFilters = searchQuery || sensitivityFilter !== 'all' || complianceFilter !== 'all'

  const columns = [
    {
      header: 'Dataset Name',
      accessor: 'name',
      width: '220px',
      nowrap: false,
      render: (row) => (
        <div className="flex items-center gap-3 group min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-200 shadow-sm flex-shrink-0">
            <IconDatabase size={22} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
              {row.name}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{row.type}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
      width: '320px',
      nowrap: false,
      render: (row) => (
        <div className="pr-4 max-w-full">
          <p className="text-sm text-slate-700 leading-relaxed line-clamp-2 break-words overflow-hidden">
            {row.description}
          </p>
        </div>
      ),
    },
    {
      header: 'Sensitivity',
      accessor: 'sensitivity',
      width: '140px',
      nowrap: true,
      render: (row) => (
        <div className="flex-shrink-0">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap',
              getSensitivityColor(row.sensitivity)
            )}
          >
            <IconLock size={12} />
            {row.sensitivity}
          </span>
        </div>
      ),
    },
    {
      header: 'Records',
      accessor: 'records',
      width: '140px',
      nowrap: false,
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-900">
            {row.records.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500">records</span>
        </div>
      ),
    },
    {
      header: 'Size',
      accessor: 'size',
      width: '120px',
      nowrap: true,
      render: (row) => (
        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{row.size}</span>
      ),
    },
    {
      header: 'Compliance',
      accessor: 'compliance',
      width: '180px',
      nowrap: false,
      render: (row) => (
        <div className="flex gap-1.5 flex-wrap">
          {row.compliance.length > 0 ? (
            row.compliance.map((comp) => (
              <span
                key={comp}
                className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-200 hover:bg-blue-100 transition-colors cursor-default whitespace-nowrap"
              >
                {comp}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">None</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '100px',
      nowrap: true,
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      header: 'Last Accessed',
      accessor: 'lastAccessed',
      width: '150px',
      nowrap: true,
      render: (row) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <IconClock size={14} className="text-slate-400 flex-shrink-0" />
          <span className="text-sm text-slate-600">{row.lastAccessed}</span>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-slate-600">
          <span className="hover:text-slate-900 cursor-pointer">Governance</span>
          <span>/</span>
          <span className="text-slate-900 font-medium">Datasets</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Dataset Management</h1>
            <p className="text-slate-600">
              Manage data sources, monitor access, and ensure compliance across your organization
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 h-11 px-6"
            size="lg"
          >
            <IconPlus size={20} />
            Register New Dataset
          </Button>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <IconDatabase size={24} className="text-blue-600" />
              </div>
              <IconTrendingUp size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Total Datasets</p>
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-2">Active datasets</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                <IconLock size={24} className="text-red-600" />
              </div>
              <IconShieldCheck size={18} className="text-amber-500" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">High Sensitivity</p>
            <p className="text-3xl font-bold text-slate-900">{stats.highSensitivity}</p>
            <p className="text-xs text-slate-500 mt-2">Requires protection</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                <IconUsers size={24} className="text-emerald-600" />
              </div>
              <IconTrendingUp size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Total Records</p>
            <p className="text-3xl font-bold text-slate-900">
              {(stats.totalRecords / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-slate-500 mt-2">Across all datasets</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                <IconClock size={24} className="text-purple-600" />
              </div>
              <IconTrendingUp size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Total Storage</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalSize}</p>
            <p className="text-xs text-slate-500 mt-2">Combined size</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <IconSearch
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Search datasets by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <Select value={sensitivityFilter} onValueChange={setSensitivityFilter}>
                <SelectTrigger className="w-[180px] h-11 border-slate-300">
                  <div className="flex items-center gap-2">
                    <IconFilter size={16} className="text-slate-400" />
                    <SelectValue placeholder="Sensitivity" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sensitivity</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                <SelectTrigger className="w-[180px] h-11 border-slate-300">
                  <div className="flex items-center gap-2">
                    <IconShieldCheck size={16} className="text-slate-400" />
                    <SelectValue placeholder="Compliance" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Compliance</SelectItem>
                  <SelectItem value="GDPR">GDPR</SelectItem>
                  <SelectItem value="HIPAA">HIPAA</SelectItem>
                  <SelectItem value="CCPA">CCPA</SelectItem>
                  <SelectItem value="PCI-DSS">PCI-DSS</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="h-11 border-slate-300"
                >
                  <IconX size={16} />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-slate-600">Active filters:</span>
              {searchQuery && (
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-200">
                  Search: "{searchQuery}"
                </span>
              )}
              {sensitivityFilter !== 'all' && (
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-md border border-amber-200">
                  Sensitivity: {sensitivityFilter}
                </span>
              )}
              {complianceFilter !== 'all' && (
                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-md border border-purple-200">
                  Compliance: {complianceFilter === 'none' ? 'None' : complianceFilter}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{filteredDatasets.length}</span>{' '}
            of <span className="font-semibold text-slate-900">{datasets.length}</span> datasets
          </p>
        </div>

        {/* Datasets Table */}
        {filteredDatasets.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <DataTable columns={columns} data={filteredDatasets} />
          </div>
        ) : (
          <div className="bg-white rounded-xl p-16 text-center border border-slate-200">
            <IconDatabase size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-900 mb-2">No datasets found</p>
            <p className="text-slate-600 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by registering your first dataset.'}
            </p>
            {!hasActiveFilters && (
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <IconPlus size={18} />
                Register Dataset
              </Button>
            )}
          </div>
        )}

        {/* Data Lineage Overview */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Data Lineage Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">Source Systems</p>
              <p className="text-3xl font-bold text-blue-900">12</p>
              <p className="text-xs text-blue-700 mt-2">Connected systems</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
              <p className="text-sm font-medium text-emerald-900 mb-2">Data Pipelines</p>
              <p className="text-3xl font-bold text-emerald-900">28</p>
              <p className="text-xs text-emerald-700 mt-2">Active transformations</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <p className="text-sm font-medium text-purple-900 mb-2">Downstream Consumers</p>
              <p className="text-3xl font-bold text-purple-900">64</p>
              <p className="text-xs text-purple-700 mt-2">AI agents & services</p>
            </div>
          </div>
        </div>

        {/* Enhanced Register Dataset Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Register New Dataset</DialogTitle>
              <DialogDescription className="text-base">
                Upload your dataset file and our AI will automatically analyze it to generate
                comprehensive metadata including sensitivity, compliance requirements, and data
                characteristics.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
              {/* Drag and Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  'relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200',
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : selectedFile
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.xlsx,.xls,.txt,.parquet"
                  onChange={handleFileSelect}
                  disabled={isLoading}
                  className="hidden"
                  id="dataset-file-input"
                />
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                      <IconFileText size={32} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 mb-1">{fileName}</p>
                      <p className="text-sm text-slate-600">
                        File selected and ready to upload
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null)
                        setFileName('')
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      className="mt-2"
                    >
                      <IconX size={16} />
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <IconUpload size={32} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 mb-2">
                        Drag and drop your file here
                      </p>
                      <p className="text-sm text-slate-600 mb-4">or</p>
                      <label htmlFor="dataset-file-input">
                        <Button
                          type="button"
                          variant="outline"
                          className="cursor-pointer"
                          disabled={isLoading}
                        >
                          <IconUpload size={18} />
                          Browse Files
                        </Button>
                      </label>
                    </div>
                    <p className="text-xs text-slate-500">
                      Supported: CSV, JSON, Excel, TXT, Parquet (Max 50MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  setSelectedFile(null)
                  setFileName('')
                  setIsDragging(false)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                disabled={isLoading}
                className="border-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRegisterDataset}
                disabled={isLoading || !selectedFile}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
              >
                {isLoading ? (
                  <>
                    <IconLoader size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <IconCheck size={18} />
                    Register Dataset
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
