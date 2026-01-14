'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Upload, 
  FileText, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Database,
  Search,
  Users,
  Building2,
  Zap
} from 'lucide-react';

interface BatchProgress {
  totalTenements: number;
  processedTenements: number;
  successfulTenements: number;
  failedTenements: number;
  currentTenement: string;
  estimatedTimeRemaining: number;
  averageProcessingTime: number;
  startTime: Date;
  currentTime: Date;
}

interface BatchResults {
  totalProcessed: number;
  successful: number;
  failed: number;
  processingTime: number;
  averageTimePerTenement: number;
  dataQualityReport: {
    tenementsWithSites: number;
    tenementsWithProjects: number;
    tenementsWithProduction: number;
    tenementsWithEnvironmentalData: number;
    averageSitesPerTenement: number;
    averageProjectsPerTenement: number;
    uniqueCommodities: string[];
    uniqueHolders: string[];
    dataCompletenessScore: number;
  };
}

export default function EnhancedDataAdminPage() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [results, setResults] = useState<BatchResults | null>(null);
  const [report, setReport] = useState<string>('');
  const [tenementNumbers, setTenementNumbers] = useState<string>('');
  const [holderName, setHolderName] = useState<string>('');
  const [processingMode, setProcessingMode] = useState<'tenements' | 'holder'>('tenements');
  const [batchSize, setBatchSize] = useState(10);
  const [delayBetweenRequests, setDelayBetweenRequests] = useState(2000);
  const [maxRetries, setMaxRetries] = useState(3);
  const [validateData, setValidateData] = useState(true);
  const [saveToDatabase, setSaveToDatabase] = useState(true);

  const startBatchProcessing = async () => {
    setProcessing(true);
    setProgress(null);
    setResults(null);
    setReport('');

    try {
      const requestBody: any = {
        options: {
          batchSize,
          delayBetweenRequests,
          maxRetries,
          validateData,
          saveToDatabase
        }
      };

      if (processingMode === 'holder') {
        requestBody.holderName = holderName.trim();
      } else {
        const numbers = tenementNumbers
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        requestBody.tenementNumbers = numbers;
      }

      const response = await fetch('/api/tenements/batch-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResults(data.results);
      setReport(data.report);

    } catch (error) {
      console.error('Batch processing error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const findHolderTenements = async () => {
    if (!holderName.trim()) return;

    try {
      const response = await fetch(`/api/tenements/batch-enhanced?holder=${encodeURIComponent(holderName.trim())}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      alert(`Found ${data.tenementCount} tenements for ${data.holderName}`);
      
      // Optionally populate the tenement numbers field
      setTenementNumbers(data.tenementNumbers.join('\n'));
      
    } catch (error) {
      console.error('Error finding holder tenements:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const downloadReport = () => {
    if (!report) return;

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enhanced-data-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Data Processing</h1>
        <p className="text-gray-600">
          Comprehensive MINEDX data extraction with sites, projects, environmental data, and production records
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Processing Configuration</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Configuration */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Input Data</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Processing Mode</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="tenements"
                    checked={processingMode === 'tenements'}
                    onChange={(e) => setProcessingMode(e.target.value as 'tenements')}
                    className="mr-2"
                  />
                  Specific Tenements
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="holder"
                    checked={processingMode === 'holder'}
                    onChange={(e) => setProcessingMode(e.target.value as 'holder')}
                    className="mr-2"
                  />
                  By Holder Name
                </label>
              </div>
            </div>

            {processingMode === 'tenements' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenement Numbers (one per line)
                </label>
                <textarea
                  value={tenementNumbers}
                  onChange={(e) => setTenementNumbers(e.target.value)}
                  placeholder="E 28/3429&#10;E 28/3430&#10;E 28/3431"
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {tenementNumbers.split('\n').filter(line => line.trim()).length} tenements
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Holder Name
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder="RADIANT EXPLORATION PTY LTD"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <button
                    onClick={findHolderTenements}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>Find</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Processing Options */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Options</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Size</label>
                <input
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value))}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delay (ms)</label>
                <input
                  type="number"
                  value={delayBetweenRequests}
                  onChange={(e) => setDelayBetweenRequests(parseInt(e.target.value))}
                  min="500"
                  max="10000"
                  step="500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Retries</label>
              <input
                type="number"
                value={maxRetries}
                onChange={(e) => setMaxRetries(parseInt(e.target.value))}
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={validateData}
                  onChange={(e) => setValidateData(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Validate Data Quality</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={saveToDatabase}
                  onChange={(e) => setSaveToDatabase(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Save to Database</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={startBatchProcessing}
            disabled={processing || (!tenementNumbers.trim() && !holderName.trim())}
            className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span>{processing ? 'Processing...' : 'Start Processing'}</span>
          </button>

          {report && (
            <button
              onClick={downloadReport}
              className="flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Download Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Display */}
      {processing && progress && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Processing Progress</h2>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{progress.processedTenements}/{progress.totalTenements}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.processedTenements / progress.totalTenements) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{progress.successfulTenements}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{progress.failedTenements}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatTime(progress.averageProcessingTime)}</div>
              <div className="text-sm text-gray-600">Avg Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatTime(progress.estimatedTimeRemaining)}</div>
              <div className="text-sm text-gray-600">ETA</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Currently processing:</strong> {progress.currentTenement}
            </p>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-emerald-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {((results.successful / results.totalProcessed) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Processing Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(results.processingTime / 1000 / 60).toFixed(1)}m
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Data Quality</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {results.dataQualityReport.dataCompletenessScore.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Database className="w-8 h-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Processed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(results.totalProcessed)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Quality Report */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Data Quality Report</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {results.dataQualityReport.tenementsWithSites}
                </div>
                <div className="text-sm text-gray-600">Tenements with Sites</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {results.dataQualityReport.tenementsWithProjects}
                </div>
                <div className="text-sm text-gray-600">Tenements with Projects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {results.dataQualityReport.tenementsWithProduction}
                </div>
                <div className="text-sm text-gray-600">With Production Data</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {results.dataQualityReport.tenementsWithEnvironmentalData}
                </div>
                <div className="text-sm text-gray-600">With Environmental Data</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Commodities Found</h3>
                <div className="max-h-40 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {results.dataQualityReport.uniqueCommodities.map((commodity, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {commodity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Top Holders ({results.dataQualityReport.uniqueHolders.length} total)
                </h3>
                <div className="max-h-40 overflow-y-auto">
                  <div className="space-y-1">
                    {results.dataQualityReport.uniqueHolders.slice(0, 10).map((holder, index) => (
                      <div key={index} className="text-sm text-gray-700 truncate">
                        {holder}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Report Preview */}
          {report && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Processing Report</h2>
                <button
                  onClick={downloadReport}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{report}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
