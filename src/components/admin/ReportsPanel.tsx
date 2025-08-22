'use client';

import React, { useState } from 'react';
import ScheduledReportsManager from './ScheduledReportsManager';

interface ReportsPanelProps {
  className?: string;
}

type ReportType = 'subscription' | 'revenue' | 'retention' | 'conversion' | 'comprehensive';
type ReportFormat = 'csv' | 'json';

interface ReportRequest {
  type: ReportType;
  format: ReportFormat;
  start_date: string;
  end_date: string;
  include_details: boolean;
}

const ReportsPanel: React.FC<ReportsPanelProps> = ({ className = '' }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportConfig, setReportConfig] = useState<ReportRequest>({
    type: 'comprehensive',
    format: 'csv',
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    include_details: false
  });
  const [lastReport, setLastReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const reportTypes = [
    { value: 'comprehensive', label: 'Comprehensive Report', description: 'All metrics combined' },
    { value: 'subscription', label: 'Subscription Report', description: 'Subscription metrics and trends' },
    { value: 'revenue', label: 'Revenue Report', description: 'Payment and revenue analytics' },
    { value: 'retention', label: 'Retention Report', description: 'Customer retention and churn analysis' },
    { value: 'conversion', label: 'Conversion Report', description: 'Funnel conversion metrics' }
  ];

  const generateReport = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type: reportConfig.type,
        format: reportConfig.format,
        start_date: reportConfig.start_date,
        end_date: reportConfig.end_date,
        include_details: reportConfig.include_details.toString()
      });

      const response = await fetch(`/api/admin/reports?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      if (reportConfig.format === 'csv') {
        // Handle CSV download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportConfig.type}_report_${reportConfig.start_date}_to_${reportConfig.end_date}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Handle JSON response
        const data = await response.json();
        setLastReport(data);
        
        // Also offer JSON download
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportConfig.type}_report_${reportConfig.start_date}_to_${reportConfig.end_date}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateConfig = (updates: Partial<ReportRequest>) => {
    setReportConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className={`bg-[#1a1a1d] rounded-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Generate Reports</h3>
        <p className="text-gray-400">Export subscription and analytics data for analysis</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Report Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Report Type</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reportTypes.map((type) => (
              <div
                key={type.value}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  reportConfig.type === type.value
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                }`}
                onClick={() => updateConfig({ type: type.value as ReportType })}
              >
                <div className="font-medium text-white text-sm">{type.label}</div>
                <div className="text-gray-400 text-xs mt-1">{type.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              value={reportConfig.start_date}
              onChange={(e) => updateConfig({ start_date: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
            <input
              type="date"
              value={reportConfig.end_date}
              onChange={(e) => updateConfig({ end_date: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Format and Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
            <select
              value={reportConfig.format}
              onChange={(e) => updateConfig({ format: e.target.value as ReportFormat })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="csv">CSV (Spreadsheet)</option>
              <option value="json">JSON (Data)</option>
            </select>
          </div>
          <div className="flex items-center pt-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reportConfig.include_details}
                onChange={(e) => updateConfig({ include_details: e.target.checked })}
                className="mr-2 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-300">Include detailed event data</span>
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-4">
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="w-full md:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Report...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate & Download Report
              </>
            )}
          </button>
        </div>

        {/* Last Report Preview (JSON only) */}
        {lastReport && reportConfig.format === 'json' && (
          <div className="mt-6">
            <h4 className="text-lg font-medium text-white mb-3">Last Generated Report Preview</h4>
            <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(lastReport, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Scheduled Reports Manager */}
      <div className="mt-6">
        <ScheduledReportsManager />
      </div>
    </div>
  );
};

export default ReportsPanel;