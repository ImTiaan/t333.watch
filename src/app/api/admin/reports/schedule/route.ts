import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/auth';
import { supabase } from '@/lib/supabase';

interface ScheduledReport {
  id?: string;
  name: string;
  report_type: 'subscription' | 'revenue' | 'retention' | 'conversion' | 'comprehensive';
  format: 'csv' | 'json';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[]; // Email addresses
  include_details: boolean;
  is_active: boolean;
  next_run_date?: string;
  created_at?: string;
  updated_at?: string;
}

// GET /api/admin/reports/schedule - List all scheduled reports
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await requireAdmin(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    // For now, return a mock response since we don't have the scheduled_reports table
    // In a real implementation, you would query the database
    const scheduledReports: ScheduledReport[] = [
      {
        id: '1',
        name: 'Weekly Revenue Report',
        report_type: 'revenue',
        format: 'csv',
        frequency: 'weekly',
        recipients: ['admin@t333.watch'],
        include_details: false,
        is_active: true,
        next_run_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      scheduled_reports: scheduledReports
    });

  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled reports' },
      { status: 500 }
    );
  }
}

// POST /api/admin/reports/schedule - Create a new scheduled report
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await requireAdmin(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const body = await request.json();
    const {
      name,
      report_type,
      format,
      frequency,
      recipients,
      include_details
    } = body as Omit<ScheduledReport, 'id' | 'is_active' | 'created_at' | 'updated_at'>;

    // Validate required fields
    if (!name || !report_type || !format || !frequency || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Calculate next run date based on frequency
    const now = new Date();
    let nextRunDate: Date;
    
    switch (frequency) {
      case 'daily':
        nextRunDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        nextRunDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        nextRunDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid frequency' },
          { status: 400 }
        );
    }

    // In a real implementation, you would insert into a scheduled_reports table
    // For now, return a mock response
    const newScheduledReport: ScheduledReport = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      report_type,
      format,
      frequency,
      recipients,
      include_details: include_details || false,
      is_active: true,
      next_run_date: nextRunDate.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    return NextResponse.json({
      success: true,
      scheduled_report: newScheduledReport,
      message: 'Scheduled report created successfully'
    });

  } catch (error) {
    console.error('Error creating scheduled report:', error);
    return NextResponse.json(
      { error: 'Failed to create scheduled report' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/reports/schedule - Update a scheduled report
export async function PUT(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await requireAdmin(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would update the database record
    // For now, return a mock response
    const updatedReport: ScheduledReport = {
      id,
      ...updates,
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      scheduled_report: updatedReport,
      message: 'Scheduled report updated successfully'
    });

  } catch (error) {
    console.error('Error updating scheduled report:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduled report' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reports/schedule - Delete a scheduled report
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await requireAdmin(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would delete from the database
    // For now, return a mock response
    return NextResponse.json({
      success: true,
      message: 'Scheduled report deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    return NextResponse.json(
      { error: 'Failed to delete scheduled report' },
      { status: 500 }
    );
  }
}