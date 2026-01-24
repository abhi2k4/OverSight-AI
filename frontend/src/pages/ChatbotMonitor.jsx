import { useState, useEffect } from 'react';
import { 
  IconMessage, 
  IconCoin, 
  IconClock, 
  IconAlertCircle,
  IconTrendingUp,
  IconRobot,
  IconRefresh,
  IconSend,
  IconUsers,
  IconActivity,
  IconChartBar,
  IconDatabase,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { Card } from '@/components/ui/card';

const CHATBOT_API = 'http://localhost:3003';

export default function ChatbotMonitor() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, langfuse, traces

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${CHATBOT_API}/api/metrics`);
      const data = await response.json();
      setMetrics(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setChatLoading(true);

    try {
      const response = await fetch(`${CHATBOT_API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          conversationId,
          userId: 'demo-user'
        }),
      });

      const data = await response.json();
      
      if (!conversationId) {
        setConversationId(data.conversationId);
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        metadata: data.metadata,
        timestamp: new Date()
      }]);

      // Refresh metrics after chat
      fetchMetrics();
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'error',
        content: 'Failed to get response. Please check if the chatbot server is running.',
        timestamp: new Date()
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E40AF] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading chatbot metrics...</p>
        </div>
      </div>
    );
  }

  const { overview, hourlyActivity, activeConversations, langfuse } = metrics || {};

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">
              AI Chatbot Monitor & LangFuse Metrics
            </h1>
            <p className="text-slate-600">
              Real-time observability and tracing for AI governance chatbot
            </p>
          </div>
          <button
            onClick={fetchMetrics}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E40AF] text-white rounded-lg hover:bg-[#1e3a8a] transition-colors"
          >
            <IconRefresh size={20} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-8 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'overview'
                  ? 'border-[#1E40AF] text-[#1E40AF]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview & Chat
            </button>
            <button
              onClick={() => setActiveTab('langfuse')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'langfuse'
                  ? 'border-[#1E40AF] text-[#1E40AF]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              LangFuse Analytics
            </button>
            <button
              onClick={() => setActiveTab('traces')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'traces'
                  ? 'border-[#1E40AF] text-[#1E40AF]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Recent Traces
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <IconMessage size={24} className="text-[#1E40AF]" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Requests</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {overview?.totalRequests || 0}
              </p>
              <p className="text-xs text-emerald-600 mt-2">
                {overview?.successRate || 100}% success rate
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <IconCoin size={24} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Cost</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                ${overview?.totalCost?.toFixed(4) || '0.0000'}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {overview?.totalTokens?.toLocaleString() || 0} tokens used
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <IconClock size={24} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm font-medium">Avg Latency</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {overview?.averageLatency || 0}ms
              </p>
              <p className="text-xs text-slate-500 mt-2">Response time</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <IconAlertCircle size={24} className="text-red-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm font-medium">Errors</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {overview?.errorCount || 0}
              </p>
              <p className="text-xs text-slate-500 mt-2">Failed requests</p>
            </Card>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Chat Interface */}
            <Card className="flex flex-col h-[600px]">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <IconRobot size={24} className="text-[#1E40AF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      AI Governance Assistant
                    </h3>
                    <p className="text-sm text-slate-600">Powered by GROQ</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-500 mt-12">
                    <IconRobot size={48} className="mx-auto mb-4 text-slate-400" />
                    <p className="text-sm">
                      Ask me about AI governance, compliance, or data privacy!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <IconRobot size={18} className="text-[#1E40AF]" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] p-4 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-[#1E40AF] text-white'
                            : msg.role === 'error'
                            ? 'bg-red-50 border border-red-200 text-red-900'
                            : 'bg-white border border-slate-200'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                        {msg.metadata && (
                          <div className="text-xs text-slate-500 mt-2 flex gap-3">
                            <span>🪙 {msg.metadata.tokens} tokens</span>
                            <span>⚡ {msg.metadata.latency}ms</span>
                            <span>💰 ${msg.metadata.cost}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <IconRobot size={18} className="text-[#1E40AF]" />
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-lg">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-slate-200 p-4">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !chatLoading && sendMessage()}
                    placeholder="Ask about AI governance policies..."
                    disabled={chatLoading}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={chatLoading || !input.trim()}
                    className="px-4 py-2 bg-[#1E40AF] text-white rounded-lg hover:bg-[#1e3a8a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <IconSend size={20} />
                  </button>
                </div>
              </div>
            </Card>

            {/* Hourly Activity & Info */}
            <div className="space-y-6">
              {/* Hourly Activity */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Hourly Activity
                </h3>
                <div className="space-y-3">
                  {hourlyActivity && hourlyActivity.length > 0 ? (
                    hourlyActivity.map((item) => {
                      const maxRequests = Math.max(...hourlyActivity.map(h => h.requests));
                      const percentage = (item.requests / maxRequests) * 100;
                      
                      return (
                        <div key={item.hour} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-600 w-16">
                            {item.hour}:00
                          </span>
                          <div className="flex-1 bg-slate-200 rounded-full h-8 relative overflow-hidden">
                            <div
                              className="bg-[#1E40AF] h-full rounded-full flex items-center justify-end pr-3 transition-all"
                              style={{ width: `${percentage}%` }}
                            >
                              <span className="text-xs font-semibold text-white">
                                {item.requests}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-8">
                      No activity data yet. Start chatting to see hourly trends!
                    </p>
                  )}
                </div>
              </Card>

              {/* LangFuse Integration Info */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <IconTrendingUp size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      LangFuse Integration
                    </h3>
                    <p className="text-sm text-slate-700 mb-3">
                      All chat interactions are traced and logged to LangFuse for comprehensive observability.
                    </p>
                    <div className="space-y-2 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Request/Response tracing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Token usage & cost tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Latency monitoring</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Session management</span>
                      </div>
                    </div>
                    <a
                      href="https://cloud.langfuse.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View in LangFuse Dashboard →
                    </a>
                  </div>
                </div>
              </Card>

              {/* Active Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Active Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-1">Conversations</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {activeConversations || 0}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-1">Model</p>
                    <p className="text-lg font-semibold text-slate-900">GPT-4o-mini</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Setup Instructions */}
          {overview?.totalRequests === 0 && (
            <Card className="p-6 bg-amber-50 border-amber-200">
              <h3 className="text-lg font-semibold text-amber-900 mb-3">
                🚀 Quick Setup Required
              </h3>
              <div className="space-y-2 text-sm text-amber-800">
                <p>To start using the chatbot, follow these steps:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Navigate to the <code className="bg-amber-100 px-2 py-0.5 rounded">chatbot/</code> directory</li>
                  <li>Run <code className="bg-amber-100 px-2 py-0.5 rounded">npm install</code></li>
                  <li>Create <code className="bg-amber-100 px-2 py-0.5 rounded">.env</code> file with your OpenAI and LangFuse keys</li>
                  <li>Start the server with <code className="bg-amber-100 px-2 py-0.5 rounded">npm start</code></li>
                  <li>Come back here and start chatting!</li>
                </ol>
                <p className="mt-3">
                  See <code className="bg-amber-100 px-2 py-0.5 rounded">chatbot/README.md</code> for detailed instructions.
                </p>
              </div>
            </Card>
          )}
            </>
          )}

          {/* LangFuse Analytics Tab */}
          {activeTab === 'langfuse' && (
            <>
              {/* LangFuse Metrics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <IconDatabase size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Total Traces</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {langfuse?.totalTraces || 0}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">From LangFuse Cloud</p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <IconCheck size={24} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Success Rate</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {langfuse?.successRate?.toFixed(1) || 100}%
                  </p>
                  <p className="text-xs text-emerald-600 mt-2">
                    {langfuse?.totalTraces ? `${Math.round(langfuse.totalTraces * langfuse.successRate / 100)} successful` : 'No errors'}
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <IconClock size={24} className="text-[#1E40AF]" />
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Avg Latency</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {langfuse?.avgLatency || 0}ms
                  </p>
                  <p className="text-xs text-slate-500 mt-2">From actual traces</p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                      <IconCoin size={24} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Total Cost</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    ${langfuse?.totalCost?.toFixed(4) || '0.0000'}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Aggregated from traces</p>
                </Card>
              </div>

              {/* Model Usage & User Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Model Usage Distribution */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Model Usage Distribution</h3>
                    <IconChartBar className="text-slate-400" size={20} />
                  </div>
                  <div className="space-y-3">
                    {langfuse?.modelUsage && Object.keys(langfuse.modelUsage).length > 0 ? (
                      Object.entries(langfuse.modelUsage).map(([model, count]) => {
                        const totalCalls = Object.values(langfuse.modelUsage).reduce((a, b) => a + b, 0);
                        const percentage = (count / totalCalls) * 100;
                        
                        return (
                          <div key={model} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700">{model}</span>
                              <span className="text-sm text-slate-600">{count} calls ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                              <div
                                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-8">
                        No model usage data available yet
                      </p>
                    )}
                  </div>
                </Card>

                {/* User Activity */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">User Activity</h3>
                    <IconUsers className="text-slate-400" size={20} />
                  </div>
                  <div className="space-y-3">
                    {langfuse?.userActivity && Object.keys(langfuse.userActivity).length > 0 ? (
                      Object.entries(langfuse.userActivity)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([userId, count]) => {
                          const totalActivity = Object.values(langfuse.userActivity).reduce((a, b) => a + b, 0);
                          const percentage = (count / totalActivity) * 100;
                          
                          return (
                            <div key={userId} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-xs font-semibold text-[#1E40AF]">
                                    {userId.substring(0, 2).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-slate-700">{userId}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-semibold text-slate-900">{count}</span>
                                <span className="text-xs text-slate-500 ml-2">({percentage.toFixed(1)}%)</span>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-8">
                        No user activity data available yet
                      </p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Session Activity & Hourly Traces */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Session Activity */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Session Activity</h3>
                    <IconActivity className="text-slate-400" size={20} />
                  </div>
                  <div className="space-y-3">
                    {langfuse?.sessionActivity && Object.keys(langfuse.sessionActivity).length > 0 ? (
                      Object.entries(langfuse.sessionActivity)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 8)
                        .map(([sessionId, count]) => {
                          const totalSessions = Object.values(langfuse.sessionActivity).reduce((a, b) => a + b, 0);
                          const percentage = (count / totalSessions) * 100;
                          
                          return (
                            <div key={sessionId} className="flex items-center justify-between">
                              <span className="text-sm text-slate-700 font-mono">{sessionId.substring(0, 16)}...</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-slate-200 rounded-full h-2">
                                  <div
                                    className="bg-emerald-500 h-2 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-semibold text-slate-900 w-8 text-right">{count}</span>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-8">
                        No session activity data available yet
                      </p>
                    )}
                  </div>
                </Card>

                {/* Traces by Hour */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Traces by Hour</h3>
                    <IconTrendingUp className="text-slate-400" size={20} />
                  </div>
                  <div className="space-y-3">
                    {langfuse?.tracesByHour && langfuse.tracesByHour.length > 0 ? (
                      langfuse.tracesByHour.map((item) => {
                        const maxTraces = Math.max(...langfuse.tracesByHour.map(h => h.traces));
                        const percentage = maxTraces > 0 ? (item.traces / maxTraces) * 100 : 0;
                        
                        return (
                          <div key={item.hour} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-600 w-16">
                              {item.hour}:00
                            </span>
                            <div className="flex-1 bg-slate-200 rounded-full h-8 relative overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-purple-600 to-blue-600 h-full rounded-full flex items-center justify-end pr-3 transition-all"
                                style={{ width: `${percentage}%` }}
                              >
                                <span className="text-xs font-semibold text-white">
                                  {item.traces}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-8">
                        No hourly trace data available yet
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}

          {/* Recent Traces Tab */}
          {activeTab === 'traces' && (
            <>
              <Card className="overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Recent Traces</h3>
                  <p className="text-sm text-slate-600 mt-1">Latest 10 traces from LangFuse Cloud</p>
                </div>
                <div className="overflow-x-auto">
                  {langfuse?.recentTraces && langfuse.recentTraces.length > 0 ? (
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Trace ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Timestamp
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Latency
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Cost
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Tokens
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {langfuse.recentTraces.map((trace) => (
                          <tr key={trace.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900">
                              {trace.id.substring(0, 12)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                              {trace.userId || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {new Date(trace.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {trace.latency}ms
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              ${trace.cost.toFixed(6)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                              {trace.tokensUsed || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                trace.level === 'ERROR' 
                                  ? 'bg-red-100 text-red-800'
                                  : trace.level === 'WARNING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {trace.level === 'ERROR' ? <IconX size={14} className="mr-1" /> : <IconCheck size={14} className="mr-1" />}
                                {trace.statusMessage || trace.level || 'SUCCESS'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-12 text-center">
                      <IconDatabase size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">No recent traces available</p>
                      <p className="text-sm text-slate-400 mt-2">Start chatting to generate traces</p>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
