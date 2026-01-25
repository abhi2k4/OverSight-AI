/**
 * DataHub Context Panel Component
 * Shows relevant dataset information for enhanced agent responses
 */
import React, { useState, useEffect } from 'react'
import {
  IconDatabase,
  IconSearch,
  IconChevronDown,
  IconChevronUp,
  IconLoader,
  IconExternalLink,
  IconTag,
  IconBuilding,
  IconShield
} from '@tabler/icons-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DataHubContextPanel = ({ query, onContextReady, isVisible = true }) => {
  const [context, setContext] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (query && query.length > 3) {
      fetchContext(query)
    } else {
      setContext(null)
      if (onContextReady) onContextReady(null)
    }
  }, [query])

  const fetchContext = async (searchQuery) => {
    setLoading(true)
    setError(null)
    
    try {
      const { default: DataHubContextService } = await import('@/services/DataHubContextService')
      const result = await DataHubContextService.getQueryContext(searchQuery, { limit: 5 })
      
      setContext(result)
      if (onContextReady) onContextReady(result)
    } catch (err) {
      console.error('DataHub context error:', err)
      setError(err.message)
      setContext(null)
      if (onContextReady) onContextReady(null)
    } finally {
      setLoading(false)
    }
  }

  if (!isVisible) return null

  const totalDatasets = context?.hasContext ? 
    (context.datasets?.length || 0) + (context.domainDatasets?.length || 0) + (context.taggedDatasets?.length || 0) : 0

  return (
    <Card className="mb-4 border-purple-200 bg-purple-50/30">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconDatabase size={18} className="text-purple-600" />
            <h3 className="font-semibold text-purple-900">DataHub Context</h3>
            {loading && <IconLoader size={16} className="animate-spin text-purple-600" />}
          </div>
          
          {totalDatasets > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-purple-700 hover:text-purple-900 hover:bg-purple-100"
            >
              {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
              {expanded ? 'Collapse' : 'Expand'}
            </Button>
          )}
        </div>

        {/* Status */}
        <div className="mb-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-purple-600">
              <IconSearch size={14} />
              Searching DataHub for relevant datasets...
            </div>
          )}
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
          
          {context && !loading && (
            <div className="flex items-center gap-2 text-sm">
              {context.hasContext ? (
                <>
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    {totalDatasets} datasets found
                  </Badge>
                  <span className="text-purple-700">
                    Context will enhance agent responses
                  </span>
                </>
              ) : (
                <span className="text-slate-600">No relevant datasets found</span>
              )}
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {expanded && context?.hasContext && (
          <div className="space-y-4 border-t border-purple-200 pt-4">
            {/* Keywords */}
            {context.keywords?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-purple-900 mb-2">Detected Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {context.keywords.map((keyword, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-purple-300 text-purple-700">
                      <IconTag size={12} className="mr-1" />
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Datasets */}
            {context.datasets?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-purple-900 mb-2">Matching Datasets</h4>
                <div className="space-y-2">
                  {context.datasets.slice(0, 3).map((dataset, i) => (
                    <div key={i} className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-slate-900 text-sm">{dataset.name}</h5>
                          {dataset.description && (
                            <p className="text-xs text-slate-600 mt-1">{dataset.description}</p>
                          )}
                          {dataset.platform && (
                            <Badge variant="outline" className="text-xs mt-2 border-blue-300 text-blue-700">
                              <IconBuilding size={10} className="mr-1" />
                              {dataset.platform}
                            </Badge>
                          )}
                        </div>
                        <IconExternalLink size={14} className="text-purple-600 cursor-pointer hover:text-purple-800" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Domain Datasets */}
            {context.domainDatasets?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-purple-900 mb-2">Domain-Specific Datasets</h4>
                <div className="grid grid-cols-1 gap-2">
                  {context.domainDatasets.slice(0, 2).map((dataset, i) => (
                    <div key={i} className="bg-white rounded-lg p-2 border border-purple-200 text-sm">
                      <span className="font-medium text-slate-900">{dataset.name}</span>
                      {dataset.domain && (
                        <Badge variant="outline" className="text-xs ml-2 border-orange-300 text-orange-700">
                          {dataset.domain}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tagged Datasets */}
            {context.taggedDatasets?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-purple-900 mb-2">Tagged Datasets</h4>
                <div className="grid grid-cols-1 gap-2">
                  {context.taggedDatasets.slice(0, 2).map((dataset, i) => (
                    <div key={i} className="bg-white rounded-lg p-2 border border-purple-200 text-sm">
                      <span className="font-medium text-slate-900">{dataset.name}</span>
                      {dataset.tags && dataset.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {dataset.tags.slice(0, 3).map((tag, j) => (
                            <Badge key={j} variant="outline" className="text-xs border-red-300 text-red-700">
                              <IconShield size={10} className="mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export default DataHubContextPanel