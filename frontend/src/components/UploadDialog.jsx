import { useState, useRef, useEffect } from 'react'
import {
  IconUpload,
  IconX,
  IconFileText,
  IconLoader,
  IconDatabase,
  IconServer,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { useToast } from '../hooks/use-toast'
import { cn } from '@/lib/utils'

const VALID_FILE_TYPES = ['.csv', '.json', '.db', '.sqlite', '.sqlite3']
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export default function UploadDialog({ open, onOpenChange, onUploadComplete }) {
  const [activeTab, setActiveTab] = useState('files') // 'files' or 'connectors'
  const [selectedFiles, setSelectedFiles] = useState([])
  const [entityTypes, setEntityTypes] = useState({}) // file name -> entity type
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [jobId, setJobId] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const fileInputRef = useRef(null)
  const { toast } = useToast()

  // Connector form states (placeholders)
  const [sqlConfig, setSqlConfig] = useState({
    host: '',
    port: '5432',
    database: '',
    username: '',
    password: '',
  })
  const [mongoConfig, setMongoConfig] = useState({
    connectionString: '',
    database: '',
    collection: '',
  })

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || [])
    console.log('Files selected:', files.length)
    if (files.length > 0) {
      addFiles(files)
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
    const files = Array.from(e.dataTransfer.files || [])
    addFiles(files)
  }

  const addFiles = (files) => {
    const validFiles = []
    const errors = []

    files.forEach((file) => {
      const fileExt = '.' + file.name.split('.').pop().toLowerCase()
      
      if (!VALID_FILE_TYPES.includes(fileExt)) {
        errors.push(`${file.name}: Invalid file type. Supported: CSV, JSON, SQLite`)
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 100MB)`)
        return
      }

      // Check if file already selected
      if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
        errors.push(`${file.name}: Already selected`)
        return
      }

      validFiles.push(file)
      // Set default entity type from filename
      if (!entityTypes[file.name]) {
        setEntityTypes(prev => ({
          ...prev,
          [file.name]: file.name.replace(/\.[^/.]+$/, '') // Remove extension
        }))
      }
    })

    if (errors.length > 0) {
      toast({
        variant: 'destructive',
        title: 'File Selection Errors',
        description: errors.join(', '),
      })
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles])
    }
  }

  const removeFile = (fileName) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName))
    setEntityTypes(prev => {
      const newTypes = { ...prev }
      delete newTypes[fileName]
      return newTypes
    })
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Files Selected',
        description: 'Please select at least one file to upload.',
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
      const formData = new FormData()

      // Add files
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })

      // Add entity types as comma-separated string
      const entityTypeList = selectedFiles.map(f => entityTypes[f.name] || f.name.replace(/\.[^/.]+$/, ''))
      formData.append('entity_types', entityTypeList.join(','))

      const response = await fetch(`${apiBase}/ingest/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setJobId(data.job_id)
      setUploadProgress(10)

      // Start polling for status
      pollJobStatus(data.job_id)

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Failed to upload files. Please try again.',
      })
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const pollJobStatus = async (jobId) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
    const maxAttempts = 300 // 10 minutes max (2s * 300)
    let attempts = 0

    const poll = async () => {
      if (attempts >= maxAttempts) {
        toast({
          variant: 'destructive',
          title: 'Processing Timeout',
          description: 'Processing is taking longer than expected. Please check back later.',
        })
        setIsUploading(false)
        return
      }

      try {
        const response = await fetch(`${apiBase}/ingest/status/${jobId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch status: ${response.status}`)
        }

        const status = await response.json()
        setJobStatus(status)
        setUploadProgress(status.progress || 0)

        if (status.status === 'completed') {
          setIsUploading(false)
          toast({
            variant: 'default',
            title: 'Upload Complete!',
            description: `${status.files_processed} files processed, ${status.records_enriched} records enriched.`,
          })
          
          // Reset form
          setSelectedFiles([])
          setEntityTypes({})
          setJobId(null)
          setJobStatus(null)
          setUploadProgress(0)
          
          // Notify parent to refresh data
          if (onUploadComplete) {
            onUploadComplete()
          }
          
          // Close dialog after short delay
          setTimeout(() => {
            onOpenChange(false)
          }, 2000)
          
        } else if (status.status === 'failed') {
          setIsUploading(false)
          toast({
            variant: 'destructive',
            title: 'Processing Failed',
            description: status.error || 'An error occurred during processing.',
          })
        } else {
          // Continue polling
          attempts++
          setTimeout(poll, 2000)
        }
      } catch (error) {
        console.error('Status polling error:', error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000)
        } else {
          setIsUploading(false)
          toast({
            variant: 'destructive',
            title: 'Status Check Failed',
            description: 'Unable to check processing status. Please try again later.',
          })
        }
      }
    }

    poll()
  }

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFiles([])
      setEntityTypes({})
      setJobId(null)
      setJobStatus(null)
      setUploadProgress(0)
      setIsDragging(false)
      onOpenChange(false)
    }
  }

  // Debug: Log when dialog opens
  useEffect(() => {
    if (open) {
      console.log('UploadDialog opened, fileInputRef:', fileInputRef.current)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Upload Data</DialogTitle>
          <DialogDescription className="text-base">
            Upload files or connect to data sources to ingest and enrich your data
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('files')}
            className={cn(
              'px-6 py-3 font-medium text-sm border-b-2 transition-colors',
              activeTab === 'files'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            )}
          >
            <div className="flex items-center gap-2">
              <IconUpload size={18} />
              File Upload
            </div>
          </button>
          <button
            onClick={() => setActiveTab('connectors')}
            className={cn(
              'px-6 py-3 font-medium text-sm border-b-2 transition-colors',
              activeTab === 'connectors'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            )}
          >
            <div className="flex items-center gap-2">
              <IconDatabase size={18} />
              Connectors
              <Badge variant="outline" className="ml-1 text-xs">Coming Soon</Badge>
            </div>
          </button>
        </div>

        {/* File Upload Tab */}
        {activeTab === 'files' && (
          <div className="space-y-6">
            {/* Drag and Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.db,.sqlite,.sqlite3"
                onChange={handleFileSelect}
                multiple
                disabled={isUploading}
                className="hidden"
                id="upload-file-input"
              />
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <IconUpload size={32} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 mb-2">
                    Drag and drop files here
                  </p>
                  <p className="text-sm text-slate-600 mb-4">or</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    disabled={isUploading}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('Browse button clicked, fileInputRef:', fileInputRef.current)
                      if (fileInputRef.current) {
                        fileInputRef.current.click()
                      } else {
                        console.error('fileInputRef is null')
                      }
                    }}
                  >
                    <IconUpload size={18} />
                    Browse Files
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Supported: CSV, JSON, SQLite (Max 100MB per file)
                </p>
              </div>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Selected Files ({selectedFiles.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedFiles.map((file) => (
                    <div
                      key={`${file.name}-${file.size}`}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <IconFileText size={20} className="text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Input
                        placeholder="Entity type"
                        value={entityTypes[file.name] || ''}
                        onChange={(e) =>
                          setEntityTypes(prev => ({
                            ...prev,
                            [file.name]: e.target.value
                          }))
                        }
                        className="w-32 h-8 text-xs"
                        disabled={isUploading}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.name)}
                        disabled={isUploading}
                        className="h-8 w-8 p-0"
                      >
                        <IconX size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Indicator */}
            {isUploading && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-900">Processing...</span>
                  <span className="text-blue-700">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                {jobStatus && (
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>Files processed: {jobStatus.files_processed} / {jobStatus.total_files}</p>
                    <p>Records ingested: {jobStatus.records_ingested}</p>
                    <p>Records enriched: {jobStatus.records_enriched}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Connectors Tab */}
        {activeTab === 'connectors' && (
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <IconAlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Coming Soon</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Database connectors are currently under development. Please use file upload for now.
                  </p>
                </div>
              </div>
            </div>

            {/* SQL Connector Form */}
            <div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50/50">
              <div className="flex items-center gap-2">
                <IconServer size={20} className="text-slate-600" />
                <h3 className="font-semibold text-slate-900">SQL Database</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Host"
                  value={sqlConfig.host}
                  onChange={(e) => setSqlConfig(prev => ({ ...prev, host: e.target.value }))}
                  disabled
                  className="bg-white"
                />
                <Input
                  placeholder="Port"
                  value={sqlConfig.port}
                  onChange={(e) => setSqlConfig(prev => ({ ...prev, port: e.target.value }))}
                  disabled
                  className="bg-white"
                />
                <Input
                  placeholder="Database"
                  value={sqlConfig.database}
                  onChange={(e) => setSqlConfig(prev => ({ ...prev, database: e.target.value }))}
                  disabled
                  className="bg-white"
                />
                <Input
                  placeholder="Username"
                  value={sqlConfig.username}
                  onChange={(e) => setSqlConfig(prev => ({ ...prev, username: e.target.value }))}
                  disabled
                  className="bg-white"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={sqlConfig.password}
                  onChange={(e) => setSqlConfig(prev => ({ ...prev, password: e.target.value }))}
                  disabled
                  className="bg-white col-span-2"
                />
              </div>
            </div>

            {/* MongoDB Connector Form */}
            <div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50/50">
              <div className="flex items-center gap-2">
                <IconDatabase size={20} className="text-slate-600" />
                <h3 className="font-semibold text-slate-900">MongoDB</h3>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="Connection String"
                  value={mongoConfig.connectionString}
                  onChange={(e) => setMongoConfig(prev => ({ ...prev, connectionString: e.target.value }))}
                  disabled
                  className="bg-white"
                />
                <Input
                  placeholder="Database"
                  value={mongoConfig.database}
                  onChange={(e) => setMongoConfig(prev => ({ ...prev, database: e.target.value }))}
                  disabled
                  className="bg-white"
                />
                <Input
                  placeholder="Collection"
                  value={mongoConfig.collection}
                  onChange={(e) => setMongoConfig(prev => ({ ...prev, collection: e.target.value }))}
                  disabled
                  className="bg-white"
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
            className="border-slate-300"
          >
            {isUploading ? 'Processing...' : 'Cancel'}
          </Button>
          {activeTab === 'files' && (
            <Button
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.length === 0}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
            >
              {isUploading ? (
                <>
                  <IconLoader size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <IconUpload size={18} />
                  Upload & Process
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
