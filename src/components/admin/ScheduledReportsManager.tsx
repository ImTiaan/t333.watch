'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ScheduledReport {
  id?: string;
  name: string;
  report_type: 'subscription' | 'revenue' | 'retention' | 'conversion' | 'comprehensive';
  format: 'csv' | 'json';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  include_details: boolean;
  is_active: boolean;
  next_run_date?: string;
  created_at?: string;
  updated_at?: string;
}

interface NewReportForm {
  name: string;
  report_type: 'subscription' | 'revenue' | 'retention' | 'conversion' | 'comprehensive';
  format: 'csv' | 'json';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string;
  include_details: boolean;
}

export default function ScheduledReportsManager() {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newReport, setNewReport] = useState<NewReportForm>({
    name: '',
    report_type: 'subscription',
    format: 'csv',
    frequency: 'weekly',
    recipients: '',
    include_details: false
  });

  useEffect(() => {
    fetchScheduledReports();
  }, []);

  const fetchScheduledReports = async () => {
    try {
      const response = await fetch('/api/admin/reports/schedule');
      const data = await response.json();
      
      if (data.success) {
        setScheduledReports(data.scheduled_reports);
      }
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const createScheduledReport = async () => {
    try {
      const recipients = newReport.recipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      const response = await fetch('/api/admin/reports/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newReport,
          recipients
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setScheduledReports([...scheduledReports, data.scheduled_report]);
        setShowCreateForm(false);
        setNewReport({
          name: '',
          report_type: 'subscription',
          format: 'csv',
          frequency: 'weekly',
          recipients: '',
          include_details: false
        });
      } else {
        alert(data.error || 'Failed to create scheduled report');
      }
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      alert('Failed to create scheduled report');
    }
  };

  const toggleReportStatus = async (reportId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/reports/schedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: reportId,
          is_active: !currentStatus
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setScheduledReports(scheduledReports.map(report => 
          report.id === reportId 
            ? { ...report, is_active: !currentStatus }
            : report
        ));
      }
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/reports/schedule?id=${reportId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setScheduledReports(scheduledReports.filter(report => report.id !== reportId));
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Scheduled Reports</h3>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {showCreateForm ? 'Cancel' : 'Create New Report'}
        </Button>
      </div>

      {showCreateForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-md font-medium text-gray-900 mb-4">Create New Scheduled Report</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Name
              </label>
              <input
                type="text"
                value={newReport.name}
                onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Weekly Revenue Report"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
                value={newReport.report_type}
                onChange={(e) => setNewReport({ ...newReport, report_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="subscription">Subscription Metrics</option>
                <option value="revenue">Revenue Report</option>
                <option value="retention">Retention Analysis</option>
                <option value="conversion">Conversion Funnel</option>
                <option value="comprehensive">Comprehensive Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <select
                value={newReport.format}
                onChange={(e) => setNewReport({ ...newReport, format: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                value={newReport.frequency}
                onChange={(e) => setNewReport({ ...newReport, frequency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipients (comma-separated emails)
              </label>
              <input
                type="text"
                value={newReport.recipients}
                onChange={(e) => setNewReport({ ...newReport, recipients: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@example.com, manager@example.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newReport.include_details}
                  onChange={(e) => setNewReport({ ...newReport, include_details: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Include detailed event data</span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <Button
              onClick={() => setShowCreateForm(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={createScheduledReport}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!newReport.name || !newReport.recipients}
            >
              Create Report
            </Button>
          </div>
        </div>
      )}

      {scheduledReports.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No scheduled reports configured.</p>
          <p className="text-sm mt-1">Create your first scheduled report to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scheduledReports.map((report) => (
            <div key={report.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">{report.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      report.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {report.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <p><strong>Type:</strong> {report.report_type} | <strong>Format:</strong> {report.format.toUpperCase()} | <strong>Frequency:</strong> {report.frequency}</p>
                    <p><strong>Recipients:</strong> {report.recipients.join(', ')}</p>
                    {report.next_run_date && (
                      <p><strong>Next Run:</strong> {formatDate(report.next_run_date)}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => toggleReportStatus(report.id!, report.is_active)}
                    variant="outline"
                    size="sm"
                  >
                    {report.is_active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    onClick={() => deleteReport(report.id!)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}