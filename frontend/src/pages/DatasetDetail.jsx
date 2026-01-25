import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  IconChevronLeft,
  IconDatabase,
  IconShield,
  IconTag,
  IconClock,
  IconLoader,
  IconAlertCircle,
  IconLock,
  IconTrendingUp,
  IconTrash,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function DatasetDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [collectionInfo, setCollectionInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dataSource, setDataSource] = useState('database'); // 'database' or 'output'
  const limit = 20;

  // Parse ID to extract source_system and entity_type
  // First try URL search params, then fallback to parsing ID
  const parseCollectionId = (collectionId, searchParams) => {
    // Prefer URL search params if available
    const sourceSystemParam = searchParams.get('source_system');
    const entityTypeParam = searchParams.get('entity_type');
    
    if (sourceSystemParam && entityTypeParam) {
      return {
        sourceSystem: decodeURIComponent(sourceSystemParam),
        entityType: decodeURIComponent(entityTypeParam)
      };
    }
    
    // Fallback: try to parse from ID (for backward compatibility)
    if (!collectionId) return null;
    
    // Try base64 decode first
    try {
      const decoded = atob(collectionId);
      const parts = decoded.split('|');
      if (parts.length === 2) {
        return { sourceSystem: parts[0], entityType: parts[1] };
      }
    } catch (e) {
      // Not base64, continue with string parsing
    }
    
    // Try splitting by underscore (old format - may not work correctly)
    const parts = collectionId.split('_');
    if (parts.length < 2) return null;
    
    // This is a best-effort parse - may not work if source_system has underscores
    const sourceSystem = parts[0];
    const entityType = parts.slice(1).join('_');
    
    return { sourceSystem, entityType };
  };

  // Fetch collection records from database, with fallback to output directory
  useEffect(() => {
    const fetchCollectionData = async () => {
      setLoading(true);
      setError(null);

      const parsed = parseCollectionId(id, searchParams);
      if (!parsed) {
        setError('Invalid collection ID format. Missing source_system or entity_type.');
        setLoading(false);
        return;
      }

      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
        const offset = (currentPage - 1) * limit;
        const url = `${apiBase}/enriched?source_system=${encodeURIComponent(parsed.sourceSystem)}&entity_type=${encodeURIComponent(parsed.entityType)}&limit=${limit}&offset=${offset}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch collection data: ${response.status}`);
        }

        const data = await response.json();
        const dbRecords = data.records || [];
        const dbTotal = data.total || 0;

        // If database has records, use them
        if (dbRecords.length > 0) {
          setDataSource('database');
          setRecords(dbRecords);
          setTotalRecords(dbTotal);

          // Build collection info from first record
          const firstRecord = dbRecords[0];
          const metadata = firstRecord.enriched_metadata || {};
          const tags = metadata.tags || [];
          
          setCollectionInfo({
            name: `${parsed.sourceSystem} - ${parsed.entityType}`,
            sourceSystem: parsed.sourceSystem,
            entityType: parsed.entityType,
            description: metadata.description || 'No description available',
            tags: tags,
            sensitivity: deriveSensitivity(tags),
            compliance: extractCompliance(tags),
            lastUpdated: firstRecord.enrichment_timestamp,
            avgConfidence: calculateAvgConfidence(dbRecords),
          });
          setLoading(false);
        } else {
          // Fallback: try to read from output directory
          console.log('No database records found, trying output directory...');
          await fetchFromOutputDirectory(parsed.sourceSystem, parsed.entityType);
        }
      } catch (err) {
        console.error('Error fetching collection data from database:', err);
        // Try fallback to output directory
        console.log('Database query failed, trying output directory...');
        await fetchFromOutputDirectory(parsed.sourceSystem, parsed.entityType);
      }
    };

    fetchCollectionData();
  }, [id, currentPage, searchParams]);

  // Fetch data from output directory as fallback
  const fetchFromOutputDirectory = async (sourceSystem, entityType) => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const url = `${apiBase}/output/collections?source_system=${encodeURIComponent(sourceSystem)}&entity_type=${encodeURIComponent(entityType)}&limit=${limit}&offset=${(currentPage - 1) * limit}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from output directory: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.records && data.records.length > 0) {
        setDataSource('output');
        setRecords(data.records);
        setTotalRecords(data.total || data.records.length);

        // Build collection info from first record
        const firstRecord = data.records[0];
        const metadata = firstRecord.enriched_metadata || {};
        const tags = metadata.tags || [];
        
        setCollectionInfo({
          name: `${sourceSystem} - ${entityType}`,
          sourceSystem: sourceSystem,
          entityType: entityType,
          description: metadata.description || 'No description available',
          tags: tags,
          sensitivity: deriveSensitivity(tags),
          compliance: extractCompliance(tags),
          lastUpdated: firstRecord.enrichment_timestamp || new Date().toISOString(),
          avgConfidence: calculateAvgConfidence(data.records),
        });
      } else {
        setError('No collection data found in database or output directory');
        setCollectionInfo(null);
      }
    } catch (err) {
      console.error('Error fetching from output directory:', err);
      setError('No collection data found. Data may not have been processed yet.');
      setCollectionInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const deriveSensitivity = (tags) => {
    const tagStr = tags.join(' ').toLowerCase();
    if (tagStr.includes('pii') || tagStr.includes('critical') || tagStr.includes('sensitive')) {
      return 'Critical';
    }
    if (tagStr.includes('personal') || tagStr.includes('private')) {
      return 'High';
    }
    if (tagStr.includes('internal') || tagStr.includes('confidential')) {
      return 'Medium';
    }
    return 'Low';
  };

  const extractCompliance = (tags) => {
    const complianceFrameworks = ['GDPR', 'HIPAA', 'CCPA', 'PCI-DSS', 'SOC2'];
    return tags.filter(tag => complianceFrameworks.includes(tag));
  };

  const calculateAvgConfidence = (records) => {
    if (!records || records.length === 0) return 0;
    const sum = records.reduce((acc, r) => {
      const conf = r.enriched_metadata?.confidence || 0;
      return acc + conf;
    }, 0);
    return (sum / records.length * 100).toFixed(1);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getSensitivityColor = (sensitivity) => {
    const colors = {
      Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Medium: 'bg-amber-50 text-amber-700 border-amber-200',
      High: 'bg-red-50 text-red-700 border-red-200',
      Critical: 'bg-red-600 text-white border-red-700',
    };
    return colors[sensitivity] || colors.Low;
  };

  const totalPages = Math.ceil(totalRecords / limit);

  // Handle delete collection
  const handleDelete = async () => {
    const parsed = parseCollectionId(id, searchParams);
    if (!parsed || !collectionInfo) return;

    setDeleting(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const url = `${apiBase}/enriched?source_system=${encodeURIComponent(parsed.sourceSystem)}&entity_type=${encodeURIComponent(parsed.entityType)}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete collection: ${response.status}`);
      }

      // Navigate back to datasets list
      navigate('/datasets');
    } catch (err) {
      console.error('Error deleting collection:', err);
      setError(err.message || 'Failed to delete collection');
      setShowDeleteDialog(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <IconLoader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading collection data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <IconAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Collection</h3>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/datasets')} variant="outline">
            <IconChevronLeft className="w-4 h-4 mr-2" />
            Back to Datasets
          </Button>
        </div>
      </div>
    );
  }

  if (!collectionInfo) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 mb-4">No collection data found</p>
          <Button onClick={() => navigate('/datasets')} variant="outline">
            <IconChevronLeft className="w-4 h-4 mr-2" />
            Back to Datasets
          </Button>
        </div>
      </div>
    );
  }

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
            <span className="text-slate-900 font-medium">{collectionInfo.name}</span>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{collectionInfo.name}</h2>
            <p className="text-slate-600 mb-4 max-w-3xl">{collectionInfo.description}</p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <IconDatabase className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">
                  {totalRecords.toLocaleString()} records
                </span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-2">
                <IconClock className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">
                  Updated: {formatTimestamp(collectionInfo.lastUpdated)}
                </span>
              </div>
              <span className="text-slate-300">•</span>
              <Badge
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border',
                  getSensitivityColor(collectionInfo.sensitivity)
                )}
              >
                <IconLock size={12} />
                {collectionInfo.sensitivity}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <IconTrash className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <IconDatabase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Source System</p>
                  <p className="text-sm font-semibold text-slate-900">{collectionInfo.sourceSystem}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <IconTag className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Entity Type</p>
                  <p className="text-sm font-semibold text-slate-900">{collectionInfo.entityType}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <IconTrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Avg Confidence</p>
                  <p className="text-sm font-semibold text-slate-900">{collectionInfo.avgConfidence}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <IconShield className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Compliance</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {collectionInfo.compliance.length > 0 ? collectionInfo.compliance.length : 'None'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Tags Section */}
          {collectionInfo.tags && collectionInfo.tags.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <IconTag className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {collectionInfo.tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className={cn(
                      'px-3 py-1',
                      collectionInfo.compliance.includes(tag)
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    )}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Records Table */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <IconDatabase className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Records</h3>
                {dataSource === 'output' && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    From Output Directory
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-600">
                Showing {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, totalRecords)} of {totalRecords}
              </p>
            </div>

            {records.length === 0 ? (
              <div className="text-center py-12">
                <IconDatabase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No records found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Confidence
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Enriched
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-sm font-mono text-slate-600">#{record.id}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="max-w-md">
                              <pre className="text-xs bg-slate-50 p-3 rounded-md overflow-x-auto">
                                {JSON.stringify(record.raw_data, null, 2)}
                              </pre>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 transition-all"
                                  style={{
                                    width: `${(record.enriched_metadata?.confidence || 0) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm text-slate-600">
                                {((record.enriched_metadata?.confidence || 0) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-slate-600">
                              {formatTimestamp(record.enrichment_timestamp)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <IconChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <IconChevronLeft className="w-4 h-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this collection? This will permanently delete all {totalRecords.toLocaleString()} records in "{collectionInfo?.name}". This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <IconTrash className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
