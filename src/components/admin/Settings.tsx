/**
 * Settings Page
 * Global settings and activity logs
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, Settings as SettingsIcon } from 'lucide-react';

export const Settings: React.FC = () => {
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivityLog();
  }, []);

  const loadActivityLog = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*, user:user_profiles(full_name, email), website:websites(site_title)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivityLog(data || []);
    } catch (error) {
      console.error('Error loading activity log:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">System settings and activity logs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon size={24} className="text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">System Info</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Platform</p>
              <p className="text-lg font-semibold text-gray-900">LikhaSiteWorks v1.0</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Database</p>
              <p className="text-lg font-semibold text-gray-900">Supabase</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Theme Presets</p>
              <p className="text-lg font-semibold text-gray-900">5 Professional Themes</p>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Activity size={24} className="text-gray-700" />
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            </div>
          </div>

          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {activityLog.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Activity size={48} className="mx-auto mb-4 opacity-20" />
                <p>No activity recorded yet</p>
              </div>
            ) : (
              activityLog.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition">
                  <p className="text-sm text-gray-900 mb-1">
                    <span className="font-medium">
                      {log.user?.full_name || log.user?.email || 'Unknown user'}
                    </span>
                    {' '}
                    <span className="text-gray-600">{log.action}</span>
                    {' '}
                    <span className="font-medium">{log.resource}</span>
                    {log.website && (
                      <>
                        {' on '}
                        <span className="font-medium">{log.website.site_title}</span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

