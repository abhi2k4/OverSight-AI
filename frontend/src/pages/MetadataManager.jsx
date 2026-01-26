import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconDatabase,
  IconRefresh,
  IconUpload,
  IconSearch,
  IconFilter,
  IconX,
  IconSettings,
  IconCheck,
  IconLoader,
  IconAlertCircle,
  IconCloudUpload,
  IconBrandGithub,
  IconFileDatabase,
  IconChevronDown,
  IconPlayerPlay,
  IconTrash,
} from '@tabler/icons-react'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
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

const STORAGE_KEY = 'metadata_sources'

// Default source configurations
const defaultSources = [
  {
    id: 1,
    name: 'Products Database',
    type: 'sqlite',
    config: { file_path: 'data/products.db' },
    status: 'configured',
    lastSync: null,
    recordsIngested: 0,
    recordsEnriched: 0,
  },
  {
    id: 2,
    name: 'Sales Transactions',
    type: 'json',
    config: { file_path: 'data/sales.json', entity_type: 'sales_transaction' },
    status: 'configured',
    lastSync: null,
    recordsIngested: 0,
    recordsEnriched: 0,
  },
  {
    id: 3,
    name: 'User Records',
    type: 'csv',
    config: { file_path: 'data/users.csv', entity_type: 'system_user' },
    status: 'configured',
    lastSync: null,
    recordsIngested: 0,
    recordsEnriched: 0,
  },
]

export default function MetadataManager() {
  const [sources, setSources] = useState(defaultSources)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedSource, setSelectedSource] = useState(null)
  const [processingStats, setProcessingStats] = useState(null)
  const [ingestionJobs, setIngestionJobs] = useState([])
  const [enrichedDatasets, setEnrichedDatasets] = useState([])
  const [activeTab, setActiveTab] = useState('queue') // 'queue', 'enriched', or 'sources'
  const { toast } = useToast()
  const navigate = useNavigate()

  // New source form state
  const [newSource, setNewSource] = useState({
    name: '',
    type: 'csv',
    filePath: '',
    entityType: '',
  })

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setSources(parsed)
      } catch (error) {
        console.error('Error loading sources from localStorage:', error)
      }
    }
  }, [])

  // Save to localStorage whenever sources change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources))
  }, [sources])

  // Filter sources
  const filteredSources = useMemo(() => {
    return sources.filter((source) => {
      const matchesSearch =
        searchQuery === '' ||
        source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.type.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = typeFilter === 'all' || source.type === typeFilter

      const matchesStatus = statusFilter === 'all' || source.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [sources, searchQuery, typeFilter, statusFilter])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSources = sources.length
    const activeSources = sources.filter((s) => s.status === 'synced').length
    const totalIngested = sources.reduce((sum, s) => sum + (s.recordsIngested || 0), 0)
    const totalEnriched = sources.reduce((sum, s) => sum + (s.recordsEnriched || 0), 0)

    return {
      totalSources,
      activeSources,
      totalIngested,
      totalEnriched,
    }
  }, [sources])

  // Fetch ingestion jobs ready for enrichment
  const fetchIngestionQueue = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
      const response = await fetch(`${apiBase}/enrichment/queue`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ingestion queue: ${response.status}`)
      }

      const data = await response.json()
      setIngestionJobs(data.jobs || [])
    } catch (error) {
      console.error('Error fetching ingestion queue:', error)
      toast({
        variant: 'destructive',
        title: 'Failed to Load Queue',
        description: 'Could not fetch ingestion jobs. Please try again later.',
      })
    }
  }

  // Fetch enriched datasets from database
  const fetchEnrichedDatasets = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
      const response = await fetch(`${apiBase}/enriched?limit=1000`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch enriched datasets: ${response.status}`)
      }

      const data = await response.json()
      
      // Group by source_system and entity_type
      const grouped = {}
      data.records.forEach(record => {
        const key = `${record.source_system}_${record.entity_type}`
        if (!grouped[key]) {
          grouped[key] = {
            name: `${record.source_system} - ${record.entity_type}`,
            source_system: record.source_system,
            entity_type: record.entity_type,
            records: 0,
            description: record.enriched_metadata?.description || 'No description',
            tags: record.enriched_metadata?.tags || [],
            confidence: record.enriched_metadata?.confidence || 0,
            lastEnriched: record.enrichment_timestamp
          }
        }
        grouped[key].records++
      })
      
      setEnrichedDatasets(Object.values(grouped))
    } catch (error) {
      console.error('Error fetching enriched datasets:', error)
    }
  }

  // Handle enrichment for ingestion job
  const handleEnrichJob = async (ingestionJobId) => {
    setIsProcessing(true)
    setProcessingStats(null)

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

      toast({
        title: 'Starting Enrichment',
        description: `Enriching ingested data with AI...`,
      })

      const formData = new FormData()
      formData.append('ingestion_job_id', ingestionJobId)

      const enrichResponse = await fetch(`${apiBase}/enrichment/process`, {
        method: 'POST',
        body: formData,
      })

      if (!enrichResponse.ok) {
        const errorData = await enrichResponse.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || `Enrichment failed: ${enrichResponse.status}`)
      }

      const enrichData = await enrichResponse.json()

      // Poll for enrichment status
      let attempts = 0
      const maxAttempts = 300 // 10 minutes
      
      const pollEnrichmentStatus = async () => {
        if (attempts >= maxAttempts) {
          toast({
            variant: 'destructive',
            title: 'Enrichment Timeout',
            description: 'Enrichment is taking longer than expected. Please check back later.',
          })
          setIsProcessing(false)
          return
        }

        try {
          const statusResponse = await fetch(`${apiBase}/enrichment/status/${ingestionJobId}`)
          if (statusResponse.ok) {
            const status = await statusResponse.json()
            
            if (status.enrichment_status === 'completed') {
              setIsProcessing(false)
              setProcessingStats({
                ingested: status.records_ingested,
                enriched: status.records_enriched,
                failed: 0,
              })
              
              toast({
                variant: 'default',
                title: 'Enrichment Complete!',
                description: `Successfully enriched ${status.records_enriched} records.`,
              })
              
              // Refresh data
              fetchIngestionQueue()
              fetchEnrichedDatasets()
              return
            } else if (status.enrichment_status === 'failed') {
              setIsProcessing(false)
              toast({
                variant: 'destructive',
                title: 'Enrichment Failed',
                description: 'An error occurred during enrichment.',
              })
              return
            }
          }
        } catch (error) {
          console.error('Error polling enrichment status:', error)
        }

        attempts++
        setTimeout(pollEnrichmentStatus, 2000)
      }

      pollEnrichmentStatus()

    } catch (error) {
      console.error('Error enriching job:', error)
      toast({
        variant: 'destructive',
        title: 'Enrichment Failed',
        description: error.message || 'Failed to start enrichment. Please try again.',
      })
      setIsProcessing(false)
    }
  }

  // Handle ingestion and enrichment workflow (legacy - for configured sources)
  const handleProcessSource = async (source) => {
    setIsProcessing(true)
    setSelectedSource(source)
    setProcessingStats(null)

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

      // Step 1: Ingest data
      toast({
        title: 'Starting Ingestion',
        description: `Ingesting data from ${source.name}...`,
      })

      const ingestResponse = await fetch(`${apiBase}/ingestion/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources: [
            {
              type: source.type,
              config: source.config,
            },
          ],
        }),
      })

      if (!ingestResponse.ok) {
        throw new Error(`Ingestion failed: ${ingestResponse.status}`)
      }

      const ingestData = await ingestResponse.json()
      const recordsIngested = ingestData.total_records || 0

      // Step 2: Enrich data
      toast({
        title: 'Starting Enrichment',
        description: `Enriching ${recordsIngested} records with AI...`,
      })

      const enrichResponse = await fetch(`${apiBase}/enrichment/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output_dir: 'output',
          batch_size: 10,
        }),
      })

      if (!enrichResponse.ok) {
        throw new Error(`Enrichment failed: ${enrichResponse.status}`)
      }

      const enrichData = await enrichResponse.json()

      // Step 3: Push to DataHub (placeholder for now)
      toast({
        title: 'Pushing to DataHub',
        description: 'Syncing enriched metadata to DataHub...',
      })

      // TODO: Implement DataHub push API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update source status
      setSources((prev) =>
        prev.map((s) =>
          s.id === source.id
            ? {
                ...s,
                status: 'synced',
                lastSync: new Date().toISOString(),
                recordsIngested: recordsIngested,
                recordsEnriched: enrichData.enriched || 0,
              }
            : s
        )
      )

      setProcessingStats({
        ingested: recordsIngested,
        enriched: enrichData.enriched || 0,
        failed: enrichData.failed || 0,
      })

      toast({
        variant: 'default',
        title: 'Processing Complete',
        description: `Successfully processed ${recordsIngested} records from ${source.name}`,
      })
    } catch (error) {
      console.error('Error processing source:', error)
      toast({
        variant: 'destructive',
        title: 'Processing Failed',
        description: error.message || 'Failed to process source. Please try again.',
      })

      // Update source status to error
      setSources((prev) =>
        prev.map((s) => (s.id === source.id ? { ...s, status: 'error' } : s))
      )
    } finally {
      setIsProcessing(false)
    }
  }

  // Fetch data on mount
  useEffect(() => {
    fetchIngestionQueue()
    fetchEnrichedDatasets()
    
    // Refresh every 5 seconds when on enriched tab
    const interval = setInterval(() => {
      if (activeTab === 'enriched') {
        fetchEnrichedDatasets()
      } else {
        fetchIngestionQueue()
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [activeTab])

  // Handle process all sources
  const handleProcessAll = async () => {
    for (const source of sources) {
      if (source.status !== 'synced') {
        await handleProcessSource(source)
      }
    }
  }

  // Handle add new source
  const handleAddSource = () => {
    if (!newSource.name || !newSource.filePath) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
      })
      return
    }

    const source = {
      id: Date.now(),
      name: newSource.name,
      type: newSource.type,
      config: {
        file_path: newSource.filePath,
        ...(newSource.entityType && { entity_type: newSource.entityType }),
      },
      status: 'configured',
      lastSync: null,
      recordsIngested: 0,
      recordsEnriched: 0,
    }

    setSources([...sources, source])
    setIsConfigDialogOpen(false)
    setNewSource({ name: '', type: 'csv', filePath: '', entityType: '' })

    toast({
      title: 'Source Added',
      description: `Successfully added ${source.name}`,
    })
  }

  // Handle delete source
  const handleDeleteSource = (sourceId) => {
    setSources((prev) => prev.filter((s) => s.id !== sourceId))
    toast({
      title: 'Source Removed',
      description: 'Source configuration removed successfully',
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setStatusFilter('all')
  }

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || statusFilter !== 'all'

  const getStatusColor = (status) => {
    const colors = {
      configured: 'bg-blue-50 text-blue-700 border-blue-200',
      synced: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      processing: 'bg-amber-50 text-amber-700 border-amber-200',
      error: 'bg-red-50 text-red-700 border-red-200',
    }
    return colors[status] || colors.configured
  }

  const columns = [
    {
      header: 'Source Name',
      accessor: 'name',
      width: '220px',
      render: (row) => (
        <div className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center group-hover:from-purple-100 group-hover:to-purple-200 transition-all duration-200 shadow-sm">
            <IconFileDatabase size={22} className="text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
              {row.name}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{row.type.toUpperCase()}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Configuration',
      accessor: 'config',
      width: '280px',
      render: (row) => (
        <div className="text-sm">
          <p className="text-slate-700 font-mono text-xs truncate">
            {row.config.file_path}
          </p>
          {row.config.entity_type && (
            <p className="text-slate-500 text-xs mt-1">Entity: {row.config.entity_type}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '140px',
      render: (row) => (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border',
            getStatusColor(row.status)
          )}
        >
          {row.status === 'synced' && <IconCheck size={12} />}
          {row.status === 'processing' && <IconLoader size={12} className="animate-spin" />}
          {row.status === 'error' && <IconAlertCircle size={12} />}
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      ),
    },
    {
      header: 'Records Ingested',
      accessor: 'recordsIngested',
      width: '140px',
      render: (row) => (
        <span className="text-sm font-semibold text-slate-900">
          {row.recordsIngested?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      header: 'Records Enriched',
      accessor: 'recordsEnriched',
      width: '140px',
      render: (row) => (
        <span className="text-sm font-semibold text-emerald-600">
          {row.recordsEnriched?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      header: 'Last Sync',
      accessor: 'lastSync',
      width: '150px',
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.lastSync ? new Date(row.lastSync).toLocaleString() : 'Never'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      width: '180px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleProcessSource(row)}
            disabled={isProcessing}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <IconPlayerPlay size={14} />
            Process
          </Button>
          <button
            onClick={() => handleDeleteSource(row.id)}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            title="Delete source"
          >
            <IconTrash size={16} />
          </button>
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
          <span className="text-slate-900 font-medium">Metadata Manager</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Metadata Manager</h1>
            <p className="text-slate-600">
              Configure data sources, enrich metadata with AI, and sync to DataHub
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleProcessAll}
              disabled={isProcessing}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg"
            >
              <IconRefresh size={20} />
              Process All
            </Button>
            <Button
              onClick={() => setIsConfigDialogOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
            >
              <IconSettings size={20} />
              Add Source
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                <IconDatabase size={24} className="text-purple-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Total Sources</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalSources}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                <IconCheck size={24} className="text-emerald-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Active Sources</p>
            <p className="text-3xl font-bold text-slate-900">{stats.activeSources}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <IconUpload size={24} className="text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Records Ingested</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalIngested.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                <IconCloudUpload size={24} className="text-amber-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Records Enriched</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalEnriched.toLocaleString()}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl">
          <button
            onClick={() => setActiveTab('queue')}
            className={cn(
              'px-6 py-3 font-medium text-sm border-b-2 transition-colors',
              activeTab === 'queue'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            )}
          >
            Ingestion Queue
          </button>
          <button
            onClick={() => setActiveTab('enriched')}
            className={cn(
              'px-6 py-3 font-medium text-sm border-b-2 transition-colors',
              activeTab === 'enriched'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            )}
          >
            Enriched Datasets
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={cn(
              'px-6 py-3 font-medium text-sm border-b-2 transition-colors',
              activeTab === 'sources'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            )}
          >
            Configured Sources
          </button>
        </div>

        {/* Ingestion Queue Tab */}
        {activeTab === 'queue' && (
          <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 border-t-0 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Ingestion Jobs Ready for Enrichment</h2>
              <Button
                onClick={fetchIngestionQueue}
                variant="outline"
                size="sm"
              >
                <IconRefresh size={16} />
                Refresh
              </Button>
            </div>
            
            {ingestionJobs.length > 0 ? (
              <div className="space-y-4">
                {ingestionJobs.map((job) => (
                  <div
                    key={job.job_id}
                    className="p-4 border border-slate-200 rounded-lg hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <IconDatabase size={20} className="text-purple-600" />
                          <h3 className="font-semibold text-slate-900">Job {job.job_id.substring(0, 8)}...</h3>
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                            Ready for Enrichment
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                          <div>
                            <p className="text-slate-500">Files Processed</p>
                            <p className="font-semibold text-slate-900">{job.files_processed}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Records Ingested</p>
                            <p className="font-semibold text-slate-900">{job.records_ingested.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Created</p>
                            <p className="font-semibold text-slate-900">
                              {job.created_at ? new Date(job.created_at).toLocaleString() : 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleEnrichJob(job.job_id)}
                        disabled={isProcessing}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <IconPlayerPlay size={16} className="mr-2" />
                        Enrich
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <IconDatabase size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-900 mb-2">No Jobs Ready for Enrichment</p>
                <p className="text-slate-600">
                  Upload data in the Datasets page to create ingestion jobs
                </p>
              </div>
            )}
          </div>
        )}

        {/* Enriched Datasets Tab */}
        {activeTab === 'enriched' && (
          <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 border-t-0 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Enriched Datasets</h2>
              <Button
                onClick={fetchEnrichedDatasets}
                variant="outline"
                size="sm"
              >
                <IconRefresh size={16} />
                Refresh
              </Button>
            </div>
            
            {enrichedDatasets.length > 0 ? (
              <div className="space-y-4">
                {enrichedDatasets.map((dataset) => {
                  // Create dataset ID for navigation
                  const datasetId = `${dataset.source_system}_${dataset.entity_type}`
                  
                  return (
                    <div
                      key={dataset.name}
                      onClick={() => {
                        if (dataset.source_system && dataset.entity_type) {
                          const params = new URLSearchParams({
                            source_system: dataset.source_system,
                            entity_type: dataset.entity_type
                          })
                          navigate(`/datasets/${datasetId}?${params.toString()}`)
                        }
                      }}
                      className="p-4 border border-slate-200 rounded-lg hover:border-emerald-300 transition-colors cursor-pointer hover:shadow-md"
                    >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <IconDatabase size={20} className="text-emerald-600" />
                          <h3 className="font-semibold text-slate-900">{dataset.name}</h3>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Enriched
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{dataset.description}</p>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Records</p>
                            <p className="font-semibold text-slate-900">{dataset.records.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Confidence</p>
                            <p className="font-semibold text-slate-900">
                              {(dataset.confidence * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Tags</p>
                            <p className="font-semibold text-slate-900">{dataset.tags.length}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Last Enriched</p>
                            <p className="font-semibold text-slate-900">
                              {dataset.lastEnriched ? new Date(dataset.lastEnriched).toLocaleDateString() : 'Unknown'}
                            </p>
                          </div>
                        </div>
                        {dataset.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {dataset.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <IconDatabase size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-900 mb-2">No Enriched Datasets</p>
                <p className="text-slate-600">
                  Enrich ingested data to see results here
                </p>
              </div>
            )}
          </div>
        )}

        {/* Configured Sources Tab */}
        {activeTab === 'sources' && (
          <>
        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <IconSearch
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Search sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 border-slate-300"
              />
            </div>

            <div className="flex gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px] h-11 border-slate-300">
                  <div className="flex items-center gap-2">
                    <IconFilter size={16} className="text-slate-400" />
                    <SelectValue placeholder="Type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="sqlite">SQLite</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-11 border-slate-300">
                  <div className="flex items-center gap-2">
                    <IconFilter size={16} className="text-slate-400" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="configured">Configured</SelectItem>
                  <SelectItem value="synced">Synced</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="h-11">
                  <IconX size={16} />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

            {/* Sources Table */}
            {filteredSources.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <DataTable columns={columns} data={filteredSources} />
              </div>
            ) : (
              <div className="bg-white rounded-xl p-16 text-center border border-slate-200">
                <IconDatabase size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-900 mb-2">No sources configured</p>
                <p className="text-slate-600 mb-6">
                  Add your first data source to start ingesting and enriching metadata
                </p>
                <Button
                  onClick={() => setIsConfigDialogOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <IconSettings size={18} />
                  Add Source
                </Button>
              </div>
            )}
          </>
        )}

        {/* Processing Stats */}
        {processingStats && (
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
            <h3 className="text-lg font-semibold text-emerald-900 mb-4">
              Last Processing Results
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-emerald-700">Ingested</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {processingStats.ingested}
                </p>
              </div>
              <div>
                <p className="text-sm text-emerald-700">Enriched</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {processingStats.enriched}
                </p>
              </div>
              <div>
                <p className="text-sm text-emerald-700">Failed</p>
                <p className="text-2xl font-bold text-emerald-900">{processingStats.failed}</p>
              </div>
            </div>
          </div>
        )}

        {/* Add Source Dialog */}
        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Data Source</DialogTitle>
              <DialogDescription>
                Configure a new data source for metadata ingestion and enrichment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Source Name
                </label>
                <Input
                  placeholder="e.g., Customer Database"
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Source Type
                </label>
                <Select
                  value={newSource.type}
                  onValueChange={(value) => setNewSource({ ...newSource, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="sqlite">SQLite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  File Path
                </label>
                <Input
                  placeholder="e.g., data/customers.csv"
                  value={newSource.filePath}
                  onChange={(e) => setNewSource({ ...newSource, filePath: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Entity Type (Optional)
                </label>
                <Input
                  placeholder="e.g., customer, product, transaction"
                  value={newSource.entityType}
                  onChange={(e) => setNewSource({ ...newSource, entityType: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsConfigDialogOpen(false)
                  setNewSource({ name: '', type: 'csv', filePath: '', entityType: '' })
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSource}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <IconCheck size={18} />
                Add Source
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
